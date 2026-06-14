/* ============================================================
   api.ts — klient fetch dla backendu FastAPI
   Kontrakt (niezmienny):
     GET  /api/status             → { demo, model_available, questions_per_24h }
     GET  /api/quota              → { remaining, limit }  (ustawia cookie ngo_demo_session)
     POST /api/chat               → { answer, sources, remaining } | 400 honeypot | 429 quota
                                     503 model offline / semaphore
   Źródła: backend/app/main.py, settings.py
   ============================================================ */

export type Source = {
  filename: string;
  section: string;
  label: string;
  score: number;
};

export type StatusPayload = {
  demo: string;
  model_available: boolean;
  questions_per_24h: number;
};

export type QuotaPayload = {
  remaining: number;
  limit: number;
};

export type ChatPayload = {
  answer: string;
  sources: Source[];
  remaining: number;
};

export type ChatError =
  | { kind: 'empty';        message: string }
  | { kind: 'too-short';    message: string }
  | { kind: 'too-long';     message: string }
  | { kind: 'honeypot';     message: string }
  | { kind: 'quota';        message: string }
  | { kind: 'out-of-scope'; message: string; ref?: ChatPayload }
  | { kind: 'no-sources';   message: string; ref?: ChatPayload }
  | { kind: 'unavailable';  message: string; status?: number }
  | { kind: 'timeout';      message: string }
  | { kind: 'network-error';      message: string };

const MIN_LEN = 3;
const MAX_LEN = 400;
const TIMEOUT_MS = 75_000; // request_timeout_seconds w settings.py

export function validateClient(question: string): string | null {
  const v = question.trim();
  if (v.length === 0) return 'Wpisz pytanie, zanim wyślesz.';
  if (v.length < MIN_LEN) return `Pytanie jest za krótkie — minimum ${MIN_LEN} znaki.`;
  if (v.length > MAX_LEN) return `Pytanie jest za długie — maksimum ${MAX_LEN} znaków.`;
  return null;
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    // FastAPI rzuca { detail: "..." } przy HTTPException
    let detail = '';
    try { detail = (JSON.parse(text) as { detail?: string }).detail ?? ''; } catch { /* not JSON */ }
    throw new ChatHttpError(res.status, detail || res.statusText);
  }
  return JSON.parse(text) as T;
}

class ChatHttpError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail);
    this.name = 'ChatHttpError';
  }
}

export async function fetchStatus(): Promise<StatusPayload> {
  const r = await fetch('/api/status', { credentials: 'include' });
  return jsonOrThrow<StatusPayload>(r);
}

export async function fetchQuota(): Promise<QuotaPayload> {
  const r = await fetch('/api/quota', { credentials: 'include' });
  return jsonOrThrow<QuotaPayload>(r);
}

export async function fetchExampleQuestions(): Promise<string[]> {
  try {
    const r = await fetch('/api/example-questions', { credentials: 'include' });
    if (!r.ok) return [];
    const d = await jsonOrThrow<{ questions: string[] }>(r);
    return d.questions ?? [];
  } catch { return []; }
}

/**
 * Rozróżnia stany błędów backendu:
 * - 400 → honeypot (pole website wypełnione)
 * - 429 → quota exhausted
 * - 503 → model unavailable / semaphore
 * - 200 z answer = REFUSAL → out-of-scope (prefilter lub retrieval min score)
 * - 200 z answer bez źródeł i nie-REFUSAL → no-sources (rzadki, awaryjny)
 * - timeout AbortError → timeout
 */
export async function sendChat(
  question: string,
  website: string = '',
  signal?: AbortSignal,
): Promise<ChatPayload | ChatError> {
  const local = validateClient(question);
  if (local) return { kind: 'empty', message: local };

  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (signal) signal.addEventListener('abort', onAbort);
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ question: question.trim(), website }),
      signal: ctrl.signal,
    });

    if (r.status === 400) {
      return { kind: 'honeypot', message: 'Twoje zgłoszenie zostało odrzucone jako podejrzane. Jeśli to pomyłka, odśwież stronę i spróbuj ponownie.' };
    }
    if (r.status === 429) {
      return { kind: 'quota', message: 'Wykorzystałeś dzienny limit pytań dla tego demonstratora.' };
    }
    if (r.status === 503) {
      const d = await r.json().catch(() => ({ detail: 'Model chwilowo niedostępny.' }));
      return { kind: 'unavailable', message: d.detail ?? 'Model chwilowo niedostępny.', status: 503 };
    }

    const data = await jsonOrThrow<ChatPayload>(r);

    // Backend zwraca REFUSAL gdy prefilter lub retrieval_min_score nie spełnione
    if (data.answer.startsWith('Nie znajduję odpowiedzi')) {
      return { kind: 'out-of-scope', message: 'Nie mogę odpowiedzieć wiarygodnie', ref: data };
    }
    if (data.sources.length === 0) {
      return { kind: 'no-sources', message: 'Nie znalazłem wystarczających informacji w dokumentach fundacji, aby odpowiedzieć rzetelnie.', ref: data };
    }
    return data;
  } catch (e: unknown) {
    if (e instanceof ChatHttpError) {
      if (e.status === 503) return { kind: 'unavailable', message: e.detail || 'Model chwilowo niedostępny.', status: 503 };
      if (e.status === 404) return { kind: 'network-error', message: 'Nie udało się połączyć z asystentem. Spróbuj ponownie za chwilę.' };
      if (e.status >= 400) return { kind: 'network-error', message: 'Nie udało się połączyć z asystentem. Spróbuj ponownie za chwilę.' };
      return { kind: 'network-error', message: e.detail || 'Błąd komunikacji z serwerem.' };
    }
    if (e instanceof DOMException && e.name === 'AbortError') {
      // Abort pochodzący od naszego timeoutu, nie od użytkownika
      if (!signal?.aborted) return { kind: 'timeout', message: 'Odpowiedź trwała zbyt długo. Spróbuj ponownie.' };
      return { kind: 'network-error', message: 'Przerwano.' };
    }
    return { kind: 'network-error', message: 'Błąd połączenia. Sprawdź sieć i spróbuj ponownie.' };
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

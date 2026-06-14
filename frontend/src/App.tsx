import { useState, useEffect, useCallback, useRef, type ReactElement } from 'react';
import { TopBar } from './components/TopBar';
import { Greeting } from './components/Greeting';
import { Composer } from './components/Composer';
import { Examples } from './components/Examples';
import { UserMessage, LoadingBubble, AnswerMessage } from './components/Messages';
import { Notice, SuggestionList } from './components/Notice';
import { ErrorState } from './components/ErrorState';
import { QuotaMeter, DisabledComposerNote } from './components/Quota';
import { StatusDetail } from './components/StatusDetail';
import { Footer } from './components/Footer';
import {
  fetchStatus,
  fetchQuota,
  fetchExampleQuestions,
  sendChat,
  validateClient,
  type ChatPayload,
  type Source,
} from './api';

type ViewState =
  | { kind: 'idle' }
  | { kind: 'filled' }
  | { kind: 'loading'; question: string }
  | { kind: 'success'; question: string; answer: string; sources: Source[]; feedback: 'up' | 'down' | null }
  | { kind: 'out-of-scope'; question: string; message: string }
  | { kind: 'no-sources'; question: string; message: string }
  | { kind: 'unavailable'; question: string; message: string }
  | { kind: 'timeout'; question: string; message: string }
  | { kind: 'quota' }
  | { kind: 'honeypot'; message: string }
  | { kind: 'network-error'; question: string; message: string };

const FALLBACK_EXAMPLES = [
  'Jak rozpocząć wolontariat w fundacji?',
  'Jak rozliczyć zakup materiałów?',
  'Jak wypożyczyć projektor na wydarzenie?',
  'Kto zatwierdza koszt wydarzenia?',
];

const SCOPE_SUGGESTIONS = [
  { id: 'p1', text: 'Jak wygląda procedura wyjazdu służbowego?' },
  { id: 'p2', text: 'Jakie są zasady delegowania w fundacji?' },
  { id: 'p3', text: 'Jak rozliczyć wyjazd zagraniczny?' },
];

export function App(): ReactElement {
  const [view, setView] = useState<ViewState>({ kind: 'idle' });
  const [modelOnline, setModelOnline] = useState<boolean>(true);
  const [remaining, setRemaining] = useState<number>(5);
  const [limit, setLimit] = useState<number>(5);
  const [examples, setExamples] = useState<string[]>(FALLBACK_EXAMPLES);
  const [inputValue, setInputValue] = useState<string>('');
  const [inputHint, setInputHint] = useState<{ kind: 'warn' | 'error'; text: string } | null>(null);
  const [questions, setQuestions] = useState<{ id: string; kind: 'user' | 'bot'; text: string; sources?: Source[]; feedback?: 'up' | 'down' | null; loading?: boolean; label?: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // Init: status + quota + examples
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [s, q, ex] = await Promise.allSettled([fetchStatus(), fetchQuota(), fetchExampleQuestions()]);
        if (!mounted) return;
        if (s.status === 'fulfilled') {
          setModelOnline(s.value.model_available);
          setLimit(s.value.questions_per_24h || 5);
        }
        if (q.status === 'fulfilled') {
          setRemaining(q.value.remaining);
          setLimit(q.value.limit || limit);
          if (q.value.remaining <= 0) setView({ kind: 'quota' });
        }
        if (ex.status === 'fulfilled' && ex.value.length > 0) {
          setExamples(ex.value);
        }
      } catch {
        // sieć padła — zostawiamy domyślne
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Jeśli quota spadnie do 0 po udanym chcie — wróć do quota view
  useEffect(() => {
    if (remaining <= 0 && view.kind !== 'quota') setView({ kind: 'quota' });
  }, [remaining, view.kind]);

  const ask = useCallback(async (raw: string) => {
    const v = raw.trim();
    const local = validateClient(v);
    if (local) {
      setInputHint({ kind: 'error', text: local });
      return;
    }
    setInputHint(null);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setView({ kind: 'loading', question: v });
    setQuestions((q) => [...q, { id: String(Date.now()), kind: 'user', text: v }, { id: `loading-${Date.now()}`, kind: 'bot', text: '', loading: true }]);

    const result = await sendChat(v, '', ctrl.signal);

    if ('kind' in result) {
      // Error path
      setQuestions((q) => q.filter((m) => !m.loading));
      if (result.kind === 'quota') {
        setRemaining(0);
        setView({ kind: 'quota' });
        return;
      }
      if (result.kind === 'out-of-scope') {
        setRemaining(result.ref?.remaining ?? remaining);
        setView({ kind: 'out-of-scope', question: v, message: result.message });
        setQuestions((q) => [...q, { id: `oos-${Date.now()}`, kind: 'bot', text: result.message, label: 'Poza zakresem' }]);
        return;
      }
      if (result.kind === 'no-sources') {
        setRemaining(result.ref?.remaining ?? remaining);
        setView({ kind: 'no-sources', question: v, message: result.message });
        setQuestions((q) => [...q, { id: `ns-${Date.now()}`, kind: 'bot', text: result.message, label: 'Brak źródeł' }]);
        return;
      }
      if (result.kind === 'unavailable') {
        setView({ kind: 'unavailable', question: v, message: result.message });
        setQuestions((q) => [...q, { id: `un-${Date.now()}`, kind: 'bot', text: result.message, label: 'Niedostępny' }]);
        return;
      }
      if (result.kind === 'timeout') {
        setView({ kind: 'timeout', question: v, message: result.message });
        setQuestions((q) => [...q, { id: `to-${Date.now()}`, kind: 'bot', text: result.message, label: 'Timeout' }]);
        return;
      }
      if (result.kind === 'honeypot') {
        setView({ kind: 'idle' });
        setInputHint({ kind: 'error', text: result.message });
        return;
      }
      if (result.kind === 'empty' || result.kind === 'too-short' || result.kind === 'too-long') {
        setView({ kind: 'idle' });
        setInputHint({ kind: 'error', text: result.message });
        return;
      }
      // network / backend unreachable
      setView({ kind: 'network-error', question: v, message: result.message });
      setQuestions((q) => [...q, { id: `net-${Date.now()}`, kind: 'bot', text: result.message, label: 'Błąd połączenia' }]);
      return;
    }

    // Success path
    setRemaining(result.remaining);
    setView({ kind: 'success', question: v, answer: result.answer, sources: result.sources, feedback: null });
    setQuestions((q) => q
      .filter((m) => !m.loading)
      .concat([{ id: `ans-${Date.now()}`, kind: 'bot', text: result.answer, sources: result.sources, feedback: null }])
    );
  }, [remaining]);

  const onRetry = useCallback(() => {
    const last = questions.filter((m) => m.kind === 'user').slice(-1)[0];
    if (last) ask(last.text);
  }, [ask, questions]);

  const onExamplePick = useCallback((q: string) => {
    setInputValue(q);
    setInputHint(null);
    setView({ kind: 'filled' });
  }, []);

  const onFeedback = useCallback((qid: string, value: 'up' | 'down') => {
    setQuestions((q) => q.map((m) => (m.id === qid ? { ...m, feedback: value } : m)));
    if (view.kind === 'success') setView({ ...view, feedback: value });
  }, [view]);

  const isComposerDisabled =
    view.kind === 'loading' ||
    view.kind === 'quota' ||
    remaining <= 0;

  // ========== RENDER ==========
  const isInitialEmpty = view.kind === 'idle';
  const isFilled = view.kind === 'filled';
  const showGreeting = isInitialEmpty || isFilled || (questions.length === 0 && view.kind !== 'quota');

  // Topbar meta
  let meta = '';
  let metaKind: 'normal' | 'warn' | 'off' = 'normal';
  if (view.kind === 'quota' || remaining <= 0) { meta = 'Limit wykorzystany'; metaKind = 'warn'; }
  else if (!modelOnline) { meta = 'Model offline'; metaKind = 'off'; }
  else meta = `Demo · ${remaining} ${remaining === 1 ? 'pytanie' : remaining < 5 && remaining > 1 ? 'pytania' : 'pytań'}`;

  return (
    <>
      <TopBar meta={meta} metaKind={metaKind} />

      <main className="shell">
        {showGreeting && <Greeting />}

        {/* Thread (chat) */}
        {questions.length > 0 && (
          <section className="thread" aria-label="Historia rozmowy">
            {questions.map((m) => {
              if (m.kind === 'user') return <UserMessage key={m.id} text={m.text} />;
              if (m.loading) return <LoadingBubble key={m.id} />;
              // Bot message — success lub error reply
              if (m.sources) {
                return (
                  <AnswerMessage
                    key={m.id}
                    answer={m.text}
                    sources={m.sources}
                    feedback={m.feedback ?? null}
                    onFeedback={(v) => onFeedback(m.id, v)}
                  />
                );
              }
              // Error reply (out-of-scope / no-sources / unavailable / timeout)
              return (
                <div className="msg msg-bot" key={m.id}>
                  <span className="who" aria-hidden="true">A</span>
                  <div className="msg-bubble">
                    <p className="msg-label">{m.label ?? 'Odpowiedź asystenta'}</p>
                    <p className="msg-text">{m.text}</p>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Quota exhausted state */}
        {view.kind === 'quota' && (
          <>
            <ErrorState
              icon="warn"
              eyebrow={`Limit · ${limit} / ${limit} pytań`}
              title="Wykorzystałeś dzienny limit pytań"
              text="W ramach demo możesz zadać 5 pytań na dobę. Limit odnowi się o północy czasu lokalnego. Skontaktuj się z koordynatorem, jeśli potrzebujesz wyższego limitu."
              actions={
                <>
                  <button type="button" className="btn-primary">Powiadom koordynatora</button>
                  <button type="button" className="btn-secondary">Przeglądaj dokumenty</button>
                </>
              }
              extra={
                <>
                  <QuotaMeter used={limit} limit={limit} />
                  <DisabledComposerNote />
                </>
              }
            />
            <Composer
              placeholder="Limit wykorzystany — spróbuj jutro."
              disabled
              hint={{ kind: 'error', text: 'Wysyłanie pytań jest wstrzymane do północy czasu lokalnego.' }}
              onSubmit={() => {}}
            />
          </>
        )}

        {/* Initial empty / filled with greeting + composer + examples */}
        {(isInitialEmpty || isFilled) && (
          <>
            <Composer
              placeholder={isInitialEmpty ? 'Np. Jak zgłosić pomysł warsztatu?' : 'Zacznij pisać…'}
              initialValue={inputValue}
              hint={inputHint}
              onChange={(v) => { setInputValue(v); if (inputHint) setInputHint(null); }}
              onSubmit={(v) => { setInputValue(''); ask(v); }}
              autoFocus={isFilled}
            />
            <Examples questions={examples} onPick={onExamplePick} />
          </>
        )}

        {/* Post-answer composer: success / scope / no-sources / unavailable / timeout */}
        {(view.kind === 'success' || view.kind === 'out-of-scope' || view.kind === 'no-sources' || view.kind === 'unavailable' || view.kind === 'timeout' || view.kind === 'network-error' || view.kind === 'loading') && (
          <>
            {view.kind === 'out-of-scope' && (
              <section style={{ marginTop: 'var(--space-5)' }}>
                <Notice
                  kind="warn"
                  eyebrow="Poza zakresem"
                  title="Nie mogę odpowiedzieć wiarygodnie"
                  text="Przeformułuj pytanie w kontekście procedur fundacji albo wybierz jedną z sugerowanych ścieżek poniżej."
                />
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <SuggestionList items={SCOPE_SUGGESTIONS} onPick={onExamplePick} />
                </div>
              </section>
            )}

            {view.kind === 'no-sources' && (
              <section style={{ marginTop: 'var(--space-5)' }}>
                <Notice
                  kind="warn"
                  eyebrow="Brak źródeł"
                  title="Nie znalazłem źródeł"
                  text={view.message}
                />
              </section>
            )}

            {(view.kind === 'unavailable' || view.kind === 'timeout') && (
              <ErrorState
                icon="danger"
                eyebrow={view.kind === 'timeout' ? 'Timeout · brak odpowiedzi' : '503 · Chwilowa niedostępność'}
                title={view.kind === 'timeout' ? 'Odpowiedź trwała zbyt długo' : 'Model chwilowo nie odpowiada'}
                text={view.message}
                actions={
                  <>
                    <button type="button" className="btn-primary" onClick={onRetry}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                      <span>Spróbuj ponownie</span>
                    </button>
                    <button type="button" className="btn-secondary">Pokaż status usługi</button>
                  </>
                }
                extra={
                  <StatusDetail
                    rows={[
                      { label: 'Ostatnia odpowiedź', value: '2 min temu' },
                      { label: 'Incydent', value: 'ng-2026-06-13-01', danger: true },
                    ]}
                    foot={
                      <>Awarie trwają zwykle krócej niż 15 minut. Możesz też przeszukać dokumenty ręcznie w <a href="#">bazie wiedzy fundacji</a>.</>
                    }
                  />
                }
              />
            )}

            {view.kind === 'network-error' && (
              <ErrorState
                icon="danger"
                eyebrow="Błąd połączenia"
                title="Nie udało się połączyć z asystentem"
                text={view.message}
                actions={
                  <>
                    <button type="button" className="btn-primary" onClick={onRetry}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                      <span>Spróbuj ponownie</span>
                    </button>
                  </>
                }
              />
            )}

            <Composer
              placeholder={view.kind === 'out-of-scope' ? 'Zadaj pytanie z zakresu procedur fundacji…' : 'Zadaj kolejne pytanie…'}
              initialValue={inputValue}
              disabled={isComposerDisabled}
              hint={inputHint}
              onChange={(v) => { setInputValue(v); if (inputHint) setInputHint(null); }}
              onSubmit={(v) => { setInputValue(''); ask(v); }}
            />
          </>
        )}
      </main>

      <Footer />
    </>
  );
}

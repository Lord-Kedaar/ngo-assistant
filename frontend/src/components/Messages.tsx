import { type ReactElement } from 'react';
import { Source } from '../api';

export function UserMessage({ text }: { text: string }): ReactElement {
  return (
    <div className="msg msg-user">
      <span className="who" aria-hidden="true">Ty</span>
      <div className="msg-bubble">
        <p className="msg-label">Twoje pytanie</p>
        <p className="msg-text">{text}</p>
      </div>
    </div>
  );
}

export function LoadingBubble({ label = 'Przeszukuję dokumenty' }: { label?: string }): ReactElement {
  return (
    <div
      className="msg msg-bot loading"
      role="status"
      aria-live="polite"
      aria-label="Asystent przygotowuje odpowiedź"
    >
      <span className="who" aria-hidden="true">A</span>
      <div className="msg-bubble">
        <div className="loading-head">
          <span className="loading-pulse" aria-hidden="true"></span>
          <span className="loading-label">{label}</span>
        </div>
        <div className="skeleton-line w-90" aria-hidden="true"></div>
        <div className="skeleton-line w-75" aria-hidden="true"></div>
        <div className="skeleton-line w-60" aria-hidden="true"></div>
      </div>
    </div>
  );
}

type Feedback = 'up' | 'down' | null;

export function AnswerMessage({
  answer,
  sources,
  feedback,
  onFeedback,
}: {
  answer: string;
  sources: Source[];
  feedback: Feedback;
  onFeedback: (v: 'up' | 'down') => void;
}): ReactElement {
  // Backend sanitizes przez bleach.clean(t, tags=[], strip=True) → plain text
  // Dzielimy po nowej linii na akapity, renderujemy z zachowaniem [Źródło: ...] jako muted
  const lines = answer.split('\n').map((l) => l.trim()).filter(Boolean);
  const body = lines.map((line, i) => (
    <p key={i}>{line.startsWith('[Źródło:') ? <em style={{ color: 'var(--muted)' }}>{line}</em> : line}</p>
  ));

  return (
    <div className="msg msg-bot">
      <span className="who" aria-hidden="true">A</span>
      <div className="msg-bubble">
        <p className="msg-label">Odpowiedź asystenta</p>
        <div className="answer-body">
          {body}

          {sources.length > 0 && (
            <>
              <div className="answer-divider" aria-hidden="true"></div>
              <Sources sources={sources} />
            </>
          )}

          <FeedbackRow value={feedback} onChange={onFeedback} />
        </div>
      </div>
    </div>
  );
}

function Sources({ sources }: { sources: Source[] }): ReactElement {
  // Badge z numerem dokumentu: parsuj "02_podrecznik_wolontariusza.md — Sekcja" → "02"
  const numOf = (filename: string) => {
    const m = filename.match(/^(\d{1,3})[_-]/);
    return m ? m[1] : filename.slice(0, 2).toUpperCase();
  };
  return (
    <div className="sources">
      <div className="sources-head">
        <p className="sources-eyebrow">Źródła · {sources.length} {sources.length === 1 ? 'dokument' : 'dokumenty'}</p>
        <p className="sources-hint">Na podstawie dokumentów fundacji</p>
      </div>
      <div className="sources-list">
        {sources.map((s, i) => (
          <a className="source" key={i} href={`#source-${i}`}>
            <span className="source-badge">{numOf(s.filename)}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="source-name">{s.label}</div>
              <div className="source-excerpt">{s.section}</div>
            </div>
            <span className="source-arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function FeedbackRow({
  value,
  onChange,
}: {
  value: Feedback;
  onChange: (v: 'up' | 'down') => void;
}): ReactElement {
  return (
    <div className="feedback">
      <span className="feedback-label">Czy to pomogło?</span>
      <div className="feedback-btns" role="group" aria-label="Ocena odpowiedzi">
        <button
          type="button"
          className={`fb-btn ${value === 'up' ? 'is-active' : ''}`}
          aria-label="Tak, odpowiedź pomogła"
          aria-pressed={value === 'up'}
          onClick={() => onChange('up')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 10v11" /><path d="M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7" />
          </svg>
        </button>
        <button
          type="button"
          className={`fb-btn ${value === 'down' ? 'is-active' : ''}`}
          aria-label="Nie, odpowiedź nie pomogła"
          aria-pressed={value === 'down'}
          onClick={() => onChange('down')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 14V3" /><path d="M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H17" />
          </svg>
        </button>
      </div>
    </div>
  );
}

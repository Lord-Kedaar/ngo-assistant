import { type ReactElement } from 'react';

type Props = {
  kind: 'warn' | 'error';
  eyebrow: string;
  title: string;
  text: string;
};

export function Notice({ kind, eyebrow, title, text }: Props): ReactElement {
  return (
    <div className="notice" role="status">
      <div className="notice-icon" aria-hidden="true">
        {kind === 'warn' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
      </div>
      <div className="notice-body">
        <p className="notice-eyebrow">{eyebrow}</p>
        <p className="notice-title">{title}</p>
        <p className="notice-text">{text}</p>
      </div>
    </div>
  );
}

type Suggestion = { id: string; text: string };

export function SuggestionList({
  eyebrow = 'Spróbuj zamiast tego',
  items,
  onPick,
}: {
  eyebrow?: string;
  items: Suggestion[];
  onPick: (text: string) => void;
}): ReactElement {
  if (items.length === 0) return <></>;
  return (
    <div className="suggestions">
      <p className="suggestions-eyebrow">{eyebrow}</p>
      {items.map((it, i) => (
        <button
          type="button"
          key={it.id}
          className="suggestion"
          onClick={() => onPick(it.text)}
        >
          <span className="num">→</span>
          <span>{it.text}</span>
        </button>
      ))}
    </div>
  );
}

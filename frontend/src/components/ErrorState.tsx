import { type ReactElement, ReactNode } from 'react';

type IconKind = 'warn' | 'danger';

const ICON: Record<IconKind, ReactNode> = {
  warn: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  danger: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

type Props = {
  icon: IconKind;
  eyebrow: string;
  title: string;
  text: string;
  actions?: ReactNode;
  extra?: ReactNode;
};

export function ErrorState({ icon, eyebrow, title, text, actions, extra }: Props): ReactElement {
  const cls = ['state-icon'];
  if (icon === 'warn') cls.push('is-warn');
  if (icon === 'danger') cls.push('is-danger');
  const ec = ['state-eyebrow'];
  if (icon === 'warn') ec.push('is-warn');
  if (icon === 'danger') ec.push('is-danger');
  return (
    <section className="state" aria-label={title}>
      <div className={cls.join(' ')} aria-hidden="true">
        {ICON[icon]}
      </div>
      <p className={ec.join(' ')}>{eyebrow}</p>
      <h1>{title}</h1>
      <p className="state-text">{text}</p>
      {actions && <div className="state-actions">{actions}</div>}
      {extra}
    </section>
  );
}

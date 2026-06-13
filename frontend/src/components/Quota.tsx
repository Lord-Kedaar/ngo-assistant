import { type ReactElement } from 'react';

export function QuotaMeter({ used, limit }: { used: number; limit: number }): ReactElement {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;
  const labelPct = `${pct}%`;
  return (
    <div className="quota">
      <div className="quota-head">
        <span className="quota-label">Dzienny limit pytań</span>
        <span className="quota-count">
          <span className="used">{used}</span> z {limit}
        </span>
      </div>
      <div
        className="quota-bar"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Limit wykorzystany w ${labelPct}`}
      >
        <div className="quota-fill" style={{ width: `${pct}%` }}></div>
      </div>
      <div className="quota-foot">
        <span className="quota-reset">Reset: <strong>dziś o 00:00</strong></span>
        <a className="quota-link" href="mailto:koordynator@fundacja-mosty.pl?subject=Limit%20pyta%C5%84%20w%20demo">
          Poproś o wyższy limit
        </a>
      </div>
    </div>
  );
}

export function DisabledComposerNote({ atHour = '00:00' }: { atHour?: string }): ReactElement {
  return (
    <div className="composer-disabled" aria-hidden="true">
      <span className="icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </span>
      <span className="text">
        Wysyłanie pytań jest wstrzymane do <strong>{atHour}</strong>.
      </span>
    </div>
  );
}

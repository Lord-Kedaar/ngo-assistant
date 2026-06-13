import { type ReactElement } from 'react';

type Row = { label: string; value: string; danger?: boolean };
type Foot = string | ReactElement;

export function StatusDetail({ rows, foot }: { rows: Row[]; foot?: Foot }): ReactElement {
  return (
    <div className="status-detail">
      {rows.map((r, i) => (
        <span key={r.label}>
          <div className="status-row">
            <span className="status-label">{r.label}</span>
            <span className={`status-value ${r.danger ? 'is-off' : ''}`}>{r.value}</span>
          </div>
          {i < rows.length - 1 && <div className="status-divider" aria-hidden="true"></div>}
        </span>
      ))}
      {foot && <p className="status-foot">{foot}</p>}
    </div>
  );
}

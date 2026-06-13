import { type ReactElement } from 'react';

export type TopBarMetaKind = 'normal' | 'warn' | 'off';

type Props = {
  meta?: string;
  metaKind?: TopBarMetaKind;
};

export function TopBar({ meta = 'Asystent wiedzy fundacji', metaKind = 'normal' }: Props): ReactElement {
  const cls = ['topbar-meta'];
  if (metaKind === 'warn') cls.push('is-warn');
  if (metaKind === 'off') cls.push('is-off');
  return (
    <header className="topbar" role="banner">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">N</span>
        <span>Asystent wiedzy</span>
      </div>
      <div className={cls.join(' ')} aria-label="Status sesji">
        <span className="dot" aria-hidden="true"></span>
        <span>{meta}</span>
      </div>
    </header>
  );
}

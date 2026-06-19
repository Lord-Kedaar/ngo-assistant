import { type ReactElement, type ReactNode } from 'react';
export type TopBarMetaKind = 'normal' | 'warn' | 'off';
type Props = {
  meta?: string;
  metaKind?: TopBarMetaKind;
  brand?: string;
  appTitle?: string;
  children?: ReactNode;
};
export function TopBar({ meta, metaKind = 'normal', brand = 'Asystent wiedzy', appTitle = 'Asystent wiedzy fundacji', children }: Props): ReactElement {
  const cls = ['topbar-meta'];
  if (metaKind === 'warn') cls.push('is-warn');
  if (metaKind === 'off') cls.push('is-off');
  return (
    <header className="topbar" role="banner">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">N</span>
        <span>{brand}</span>
      </div>
      {children}
      <div className={cls.join(' ')} aria-label="Status sesji">
        <span className="dot" aria-hidden="true"></span>
        <span>{meta ?? appTitle}</span>
      </div>
    </header>
  );
}

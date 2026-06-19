import { type ReactElement } from 'react';
import { LOCALES, type LangCode } from '../locales/useLocales';

type Props = {
  lang: LangCode;
  onChange: (code: LangCode) => void;
};

export function LanguageSwitcher({ lang, onChange }: Props): ReactElement {
  const codes = Object.keys(LOCALES) as LangCode[];
  return (
    <div className="lang-switcher">
      {codes.map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-btn ${code === lang ? 'is-active' : ''}`}
          onClick={() => onChange(code)}
          aria-label={code.toUpperCase()}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

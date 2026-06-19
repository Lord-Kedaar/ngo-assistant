import { type ReactElement } from 'react';
export function Greeting({ heading, subtitle, greetingTitle }: { heading?: string; subtitle?: string; greetingTitle?: string }): ReactElement {
  const parts = (heading ?? 'Cześć, w czym mogę pomóc?').split(/(pomóc)/);
  return (
    <>
      <div className="greet">
        <span className="avatar" aria-hidden="true">A</span>
        <span className="greet-text">{greetingTitle ?? 'Asystent wiedzy fundacji'}</span>
      </div>
      <h1>
        {parts.map((p, i) => p === 'pomóc' ? <span className="accent" key={i}>pomóc</span> : p)}
      </h1>
      <p className="subtitle">
        {subtitle ?? 'Pytaj o procedury, dokumenty i instrukcje fundacji. Odpowiem tylko na podstawie naszych dokumentów — bez domysłów.'}
      </p>
    </>
  );
}

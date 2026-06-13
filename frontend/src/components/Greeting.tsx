import { type ReactElement } from 'react';

export function Greeting(): ReactElement {
  return (
    <>
      <div className="greet">
        <span className="avatar" aria-hidden="true">A</span>
        <span className="greet-text">Asystent wiedzy fundacji</span>
      </div>
      <h1>
        Cześć, w czym mogę <span className="accent">pomóc</span>?
      </h1>
      <p className="subtitle">
        Pytaj o procedury, dokumenty i instrukcje fundacji. Odpowiem tylko na podstawie
        naszych dokumentów — bez domysłów.
      </p>
    </>
  );
}

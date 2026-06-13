import { type ReactElement } from 'react';

type Props = {
  questions: string[];
  onPick: (q: string) => void;
};

export function Examples({ questions, onPick }: Props): ReactElement {
  if (questions.length === 0) return <></>;
  return (
    <section className="examples" aria-label="Przykładowe pytania">
      <div className="examples-head">
        <p className="examples-eyebrow">Popularne pytania</p>
        <p className="examples-hint">Kliknij, aby wstawić</p>
      </div>
      <div className="examples-list">
        {questions.slice(0, 4).map((q, i) => (
          <button
            type="button"
            key={q}
            className="example"
            onClick={() => onPick(q)}
          >
            <span className="num">{String(i + 1).padStart(2, '0')}</span>
            <span>{q}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

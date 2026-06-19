import { type ReactElement } from "react";
import { getLocale } from "../locales/useLocales";

type Props = {
  questions: string[];
  onPick: (q: string) => void;
};

export function Examples({ questions, onPick }: Props): ReactElement {
  if (questions.length === 0) return <></>;
  const loc = getLocale();

  return (
    <section className="examples" aria-label={loc.examples.aria_label}>
      <div className="examples-head">
        <p className="examples-eyebrow">{loc.examples.eyebrow}</p>
        <p className="examples-hint">{loc.examples.hint}</p>
      </div>
      <div className="examples-list">
        {questions.slice(0, 4).map((q, i) => (
          <button
            type="button"
            key={q}
            className="example"
            onClick={() => onPick(q)}
          >
            <span className="num">{String(i + 1).padStart(2, "0")}</span>
            <span>{q}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

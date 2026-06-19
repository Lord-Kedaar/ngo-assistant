import { type ReactElement } from "react";

export function Greeting({
  heading,
  subtitle,
  greetingTitle,
}: {
  heading?: string;
  subtitle?: string;
  greetingTitle?: string;
}): ReactElement {
  return (
    <>
      <div className="greet">
        <span className="avatar" aria-hidden="true">A</span>
        <span className="greet-text">{greetingTitle ?? "Asystent"}</span>
      </div>
      <h1>{heading ?? "Cześć, w czym mogę pomóc?"}</h1>
      <p className="subtitle">
        {subtitle ??
          "Pytaj o procedury, dokumenty i instrukcje fundacji."}
      </p>
    </>
  );
}

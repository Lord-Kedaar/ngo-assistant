import { type ReactElement, type KeyboardEvent, useState, FormEvent, ChangeEvent, useRef, useEffect } from "react";
import { getLocale } from "../locales/useLocales";

type Props = {
  placeholder?: string;
  initialValue?: string;
  disabled?: boolean;
  hint?: { kind: "warn" | "error"; text: string } | null;
  onSubmit: (value: string) => void;
  onChange?: (value: string) => void;
  autoFocus?: boolean;
};

const MIN_LEN = 3;
const MAX_LEN = 400;

export function Composer({
  placeholder = "Np. Jak zgłosić pomysł warsztatu?",
  initialValue = "",
  disabled = false,
  hint = null,
  onSubmit,
  onChange,
  autoFocus = false,
}: Props): ReactElement {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const loc = getLocale();

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setValue(v);
    onChange?.(v);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (disabled) return;
      if (value.trim().length < MIN_LEN) return;
      onSubmit(value);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (value.trim().length < MIN_LEN) return;
    onSubmit(value);
  };

  const canSubmit = !disabled && value.trim().length >= MIN_LEN;

  return (
    <section className="card" aria-label={loc.composer.aria_label}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="composer-q" className="vh">
            {loc.composer.label}
          </label>
          <div className="textarea-wrap">
            <textarea
              id="composer-q"
              ref={ref}
              maxLength={MAX_LEN}
              placeholder={placeholder}
              aria-describedby="composer-counter"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
            />
          </div>
          {hint && (
            <p
              className={`input-hint ${hint.kind === "error" ? "is-error" : ""}`}
              role="status"
            >
              {hint.text}
            </p>
          )}
          <div className="field-foot">
            <span id="composer-counter" className="counter" aria-live="polite">
              {value.length} / {MAX_LEN}
            </span>
            <button
              type="submit"
              className="btn-primary"
              disabled={!canSubmit}
            >
              <span>{loc.composer.submit_label}</span>
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </div>
      </form>
      <p className="privacy">
        {loc.composer.privacy_notice}
        {" "}
        <a href="https://radoslaw-pleskot.com/pl/privacy/" target="_blank" rel="noopener noreferrer">
          {loc.composer.privacy_link}
        </a>
      </p>
    </section>
  );
}

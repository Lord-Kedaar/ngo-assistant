import { type ReactElement, useState, FormEvent, ChangeEvent, useRef, useEffect } from 'react';

type Props = {
  placeholder?: string;
  initialValue?: string;
  disabled?: boolean;
  hint?: { kind: 'warn' | 'error'; text: string } | null;
  onSubmit: (value: string) => void;
  onChange?: (value: string) => void;
  autoFocus?: boolean;
};

const MIN_LEN = 3;
const MAX_LEN = 400;

export function Composer({
  placeholder = 'Np. Jak zgłosić pomysł warsztatu?',
  initialValue = '',
  disabled = false,
  hint = null,
  onSubmit,
  onChange,
  autoFocus = false,
}: Props): ReactElement {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setValue(v);
    onChange?.(v);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (value.trim().length < MIN_LEN) return;
    onSubmit(value);
  };

  const canSubmit = !disabled && value.trim().length >= MIN_LEN;

  return (
    <section className="card" aria-label="Zadaj pytanie">
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="composer-q" className="vh">Twoje pytanie</label>
          <div className="textarea-wrap">
            <textarea
              id="composer-q"
              ref={ref}
              maxLength={MAX_LEN}
              placeholder={placeholder}
              aria-describedby="composer-counter"
              value={value}
              onChange={handleChange}
              disabled={disabled}
            />
          </div>
          {hint && (
            <p className={`input-hint ${hint.kind === 'error' ? 'is-error' : ''}`} role="status">
              {hint.text}
            </p>
          )}
          <div className="field-foot">
            <span id="composer-counter" className="counter" aria-live="polite">
              {value.length} / {MAX_LEN}
            </span>
            <button type="submit" className="btn-primary" disabled={!canSubmit}>
              <span>Wyślij pytanie</span>
              <span className="arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </form>
      <p className="privacy">
        Nie wpisuj danych osobowych ani poufnych. Pytania nie są domyślnie zapisywane.{' '}
        <a href="https://radoslaw-pleskot.com/privacy#ngo-assistant">Polityka prywatności</a>
      </p>
    </section>
  );
}

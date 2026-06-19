import { type ReactElement } from 'react';
export function Footer({ copyright, privacy, description }: { copyright?: string; privacy?: string; description?: string }): ReactElement {
  return (
    <footer>
      <span className="copy">{copyright ?? '© 2026 Radosław Pleskot'}</span>
      <a href="https://radoslaw-pleskot.com/privacy#ngo-assistant">{privacy ?? 'Prywatność'}</a>
      <a href="https://radoslaw-pleskot.com/projects/ngo-assistant">{description ?? 'Opis projektu'}</a>
    </footer>
  );
}

import { type ReactElement } from 'react';
export function Footer({ copyright, privacy, description, privacyUrl, projectUrl }: { copyright?: string; privacy?: string; description?: string; privacyUrl?: string; projectUrl?: string }): ReactElement {
  return (
    <footer>
      <span className="copy">{copyright ?? '© 2026 Radosław Pleskot'}</span>
      <a href={privacyUrl ?? 'https://radoslaw-pleskot.com/pl/privacy/'} target="_blank" rel="noopener noreferrer">{privacy ?? 'Prywatność'}</a>
      <a href={projectUrl ?? 'https://radoslaw-pleskot.com/projekty/ngo-assistant/'} target="_blank" rel="noopener noreferrer">{description ?? 'Opis projektu'}</a>
    </footer>
  );
}

import { type ReactElement } from 'react';

export function Footer(): ReactElement {
  return (
    <footer>
      <span className="copy">© 2026 Radosław Pleskot</span>
      <a href="https://radoslaw-pleskot.com/privacy#ngo-assistant">Prywatność</a>
      <a href="https://radoslaw-pleskot.com/projects/ngo-assistant">Opis projektu</a>
    </footer>
  );
}

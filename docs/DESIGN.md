# Design System — NGO Assistant
> Category: Editorial Utility
> Calm, privacy-first internal-tool interface for a nonprofit knowledge assistant. Minimal, trustworthy and human-scale.

## 1. Visual Theme & Atmosphere

A quiet, editorial utility for nontechnical users.

- Visual style: calm, minimal, editorial, precise, trustworthy
- Product feel: internal tool, not landing page
- Color stance: warm neutral surfaces, deep navy text, restrained semantic accents
- Design intent: Make one action effortless — ask a question and inspect the cited answer.

The interface should feel:
- human-scale;
- clear;
- technically credible;
- privacy-aware;
- understated;
- usable without training.

Avoid:
- generic AI startup visuals;
- dashboards;
- marketing sections;
- cyberpunk;
- terminal cosplay;
- decorative clutter.

## 2. Color

- Background: `#F7F5EF`
- Surface: `#FFFDF9`
- Text: `#071525`
- Muted text: `#425466`
- Border: `#D8DEE5`
- Primary: `#0D2035`
- Success: `#2D6A4F`
- Success soft: `#E2F1E8`
- Warning: `#8A5A00`
- Warning soft: `#FFF1C2`
- Danger: `#B94A48`
- Danger soft: `#F8E4E1`
- Secondary accent: `#694FD8`

Rules:
- Use Primary for the main CTA.
- Use Success only for semantic status.
- Use Warning only for privacy and caution.
- Keep violet subtle and secondary.
- Do not use intense multi-accent compositions.
- Do not use lime unless a very small controlled accent is justified.

## 3. Typography

- Families: primary=`Inter`, fallback=`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Mono: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
- Scale: compact editorial utility
- Weights: `400`, `500`, `600`, `700`

Rules:
- Use one font family for almost all UI.
- Use monospace only for technical metadata if needed.
- Body text minimum: `16px`.
- Helper text minimum: `14px`.
- Keep H1 compact; this is a tool, not a hero section.
- Optimize scanability and calm hierarchy.

## 4. Spacing & Grid

- Spacing scale: `4, 8, 12, 16, 24, 32, 48`
- Layout mode: centered single-column utility
- Main content max-width: `680px`
- Mobile horizontal padding: `20px`
- Desktop horizontal padding: `24–32px`

Rules:
- Use whitespace before adding borders or cards.
- Avoid ad-hoc spacing values.
- Keep the interface compact but not cramped.
- No nested-card layouts.

## 5. Layout & Composition

Prefer this structure:
1. title and short subtitle;
2. compact status row;
3. textarea and submit CTA;
4. short privacy note;
5. example-question buttons;
6. result area after interaction;
7. minimal footer.

Rules:
- The form is the visual priority.
- Use one dominant CTA.
- Keep the initial screen calm and sparse.
- Do not add marketing sections.
- Do not add sidebars, dashboards or onboarding.
- On mobile, use one column only.

## 6. Components

### Header
- Title: `Asystent wiedzy`
- Subtitle: `Procedury, dokumenty i instrukcje fundacji`

### Status badges
- `Demo · dokumenty syntetyczne`
- `Model dostępny`
- `5 pozostałych pytań`

### Textarea
- Clear visible label.
- Placeholder: `Np. jak zgłosić pomysł warsztatu?`
- Strong focus-visible state.
- Character counter.
- Moderate height.
- Do not use placeholder as the only label.

### Primary button
- Label: `Wyślij`
- Strong navy fill.
- Clear disabled, loading, focus and pressed states.
- Minimum practical target: `44×44px`.

### Privacy note
`Nie wpisuj danych osobowych ani poufnych. Pytania nie są domyślnie zapisywane.`

Add a `Prywatność` link.

### Example questions
- Show only 3–5 initially.
- Use secondary visual weight.
- Wrap or stack cleanly.
- Do not overpower the input.

### Answer surface
- Generated answer first.
- Sources clearly separated below.
- Use restrained surface, thin border and readable spacing.

### Source citations
- Show readable document title.
- Show section.
- Allow expandable excerpt where useful.
- Keep controls keyboard accessible.

### Footer
`© 2026 Radosław Pleskot · Prywatność · Opis projektu`

## 7. Motion & Interaction

- Use short purposeful transitions: `160–220ms`.
- Support hover, focus-visible, active, disabled and loading states.
- Respect `prefers-reduced-motion`.
- Use subtle opacity or transform transitions only.

Avoid:
- animated blobs;
- parallax;
- scroll hijacking;
- heavy animation libraries;
- decorative motion.

## 8. Voice & Microcopy

Tone:
- clear;
- concise;
- calm;
- literal;
- human;
- nontechnical.

Examples:
- Loading: `Szukam odpowiedzi w dokumentach fundacji…`
- Out of scope: `Ten demonstrator odpowiada wyłącznie na pytania dotyczące dokumentów fundacji.`
- Model unavailable: `Model jest chwilowo niedostępny. Spróbuj ponownie za moment.`
- Quota exhausted: `Wykorzystałeś dzienny limit pytań dla tego demonstratora.`
- No sources: `Nie znalazłem wystarczających informacji w dokumentach fundacji, aby odpowiedzieć rzetelnie.`

## 9. Accessibility

- Target: WCAG 2.2 AA-aware implementation.
- Use semantic HTML.
- Keep one clear H1.
- Provide a visible textarea label.
- Preserve keyboard navigation.
- Show visible focus states.
- Do not communicate status by color alone.
- Keep touch targets at least `44×44px` where practical.
- Support text resizing and responsive reflow.
- Prevent overlap with mobile browser chrome.
- Verify contrast.

## 10. Privacy & Trust

The demonstrator must state:
- it is a demo;
- documents are synthetic;
- users must not submit personal or confidential data;
- questions are not stored by default;
- a daily quota exists.

Do not claim:
- `100% secure`;
- `RODO compliant`;
- `zero risk`;
- `full confidentiality`;
- `local means automatically safe`.

## 11. Anti-patterns

Do not introduce:
- marketing hero sections;
- feature grids;
- dashboard widgets;
- sidebars;
- bottom navigation;
- bento grids;
- heavy shadows;
- glassmorphism;
- gradients as decoration;
- neon;
- stock photos;
- AI robots;
- fake testimonials;
- fake metrics;
- excessive pills;
- cards inside cards;
- desktop-only layouts;
- hidden labels;
- low-contrast helper text;
- large empty decorative areas.

## 12. OpenDesign Output

Generate exactly three lightweight visual directions:

### A. Editorial Calm
Warm, restrained, editorial and closest to the portfolio brand.

### B. Human-Centered Utility
Softer and especially clear for nontechnical NGO users.

### C. Quiet Premium Tech
Slightly more technical, navy-led, with restrained violet detail and subtle depth.

For each direction show:
- desktop empty state;
- mobile empty state;
- filled textarea state;
- loading state;
- answer-with-sources state;
- out-of-scope state;
- model-unavailable state;
- quota-exhausted state.

Do not add new features.
Do not generate marketing sections.
Do not generate production code yet.

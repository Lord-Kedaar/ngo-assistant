## [2026-06-19] — Sources duplicate + quota link fix

### Fixed
- **Duplicate section title in Sources card:** each source card was rendering
  both `s.label` (`Document title — Section`) and `s.section` (Section alone)
  in two separate lines, so the section title appeared twice. Removed the
  second line; `s.label` already carries the full context.
- **Generic boilerplate sections leaking into top-N sources:** the existing
  `_is_generic_section` predicate was only triggering the swap on the #1
  result. Generic chunks like `Cel dokumentu` / `Purpose of the document`
  were still appearing in slots #2-#4. Reworked the swap loop to apply on
  every slot and track already-claimed chunks so a concrete chunk cannot be
  used twice.
- **`Cel dokumentu` / `Purpose of the document` / `Zweck des Dokuments`
  not flagged as generic:** these one-line boilerplate sections existed in
  every document and were sneaking past the keyword predicate. Added them
  (and a handful of close synonyms) to `GENERIC_SECTION_KEYWORDS` for all
  three languages.

### Changed
- **`Quota.tsx` "Poproś o wyższy limit" link:** mailto target changed from
  the fictional `koordynator@fundacja-mosty.pl` to the real
  `kontakt@radoslaw-pleskot.com`. Subject line now includes the project
  name so the request is identifiable in the inbox.

### Verified
- Full retrieval smoke (PL/EN/DE): all generic sections swapped out.
- TypeScript: `tsc -b` passes.
- Vite build: 223.78 kB JS / 18.31 kB CSS.
- API: `/api/chat` for "Ile dni mam na rozliczenie wydatku?" now returns
  `05_...Jak rozliczyć zakup materiałów` (was: `05_...Cel dokumentu`),
  with three additional concrete sections from related documents.



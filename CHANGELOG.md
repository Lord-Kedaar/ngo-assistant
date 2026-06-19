## [2026-06-19] — "Gdzie znaleźć" sections in every document

### Added
- **Per-document availability section:** every source document across
  PL / EN / DE (30 files total) now ends with a dedicated section
  describing where the document lives — fake fundacja website
  (`https://mosty-sasiedzkie.example.org/...`), physical headquarters
  (`ul. Sąsiedzka 12, 00-000 Warszawa`, Mon–Fri 9:00–17:00), and the
  coordinator email fallback. Section titles are localized
  (`Gdzie znaleźć ten dokument` / `Where to find this document` /
  `Wo Sie dieses Dokument finden`) so retrieval matches the user's
  query language exactly.

### Verified
- **PL:** "Gdzie znajdę podręcznik wolontariusza?" → top source
  `02_podrecznik_wolontariusza.md / Gdzie znaleźć ten dokument`
  (score 0.900), 2/4 sources are the new section.
- **EN:** "Where can I find the volunteer handbook?" → top source
  `02_volunteer_handbook.md / Where to find this document` (score 0.911).
- **DE:** "Wo finde ich das Handbuch für Freiwillige?" → top source
  `02_handbuch_fuer_freiwillige.md / Wo Sie dieses Dokument finden`
  (score 0.898).
- **No regression:** generic-swap fix from the previous commit still
  works — "Ile dni mam na rozliczenie wydatku?" still returns
  `05_...Jak rozliczyć zakup materiałów` on top, not the boilerplate
  `Cel dokumentu`.
- **Vector indices reindexed:** `embeddings-{pl,en,de}.sqlite3` now
  hold 76 chunks each (was 60) — 16 new chunks, one per document per
  language. Reindex ran via `python3 scripts/index_embeddings.py
  --lang {pl,en,de}` with `OMLX_*` env loaded from `.env`; **all three
  langs are non-empty** after the reindex.

### Operational
- Backup of pre-change source tree at
  `.bak-20260619-192535-where-to-find/source_documents/` (full copy).
- Idempotent reapply script kept at `/tmp/append_where_to_find.py` —
  second run reports `skip (already present)` for all 30 files.

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
## [2026-06-19] — Remove duplicate "5 questions per day" text

### Fixed
- **Triple "W ramach demo możesz zadać 5 pytań na dobę" / "You can
  ask 5 questions per day" / "Sie können 5 Fragen pro Tag stellen"
  in quota-exhausted view:** the string was being rendered three
  times — once as the body paragraph of the ErrorState, once in the
  DisabledComposerNote next to the padlock icon, and once as the
  hint under the composer. The ErrorState body was the duplicate;
  the padlock note and the hint under the composer are the
  canonical places. The ErrorState body is now removed.

### Changed
- **frontend/src/components/ErrorState.tsx:** `text` prop changed
  from `string` to optional `string`. The component renders the
  `<p className="state-text">` only when `text` is provided.
- **frontend/src/App.tsx:** the quota ErrorState no longer
  receives `text={_.state.quota.text}`. The DisabledComposerNote
  and Composer hint still consume the same locale key.

### Verified
- `npm run build` passes (223.81 kB JS / 18.31 kB CSS).

## [2026-06-19] — Generative augmentation + content gap fixes

### Added
- **TOC prefix in LLM prompt:** the chat route now prepends a
  "DOSTĘPNE DOKUMENTY W BAZIE" / "AVAILABLE DOCUMENTS IN THE BASE"
  / "VERFÜGBARE DOKUMENTE IN DER DATENBANK" listing of all 10
  document titles per language to the user message. The list is
  built from  in . This lets
  the LLM know that a given document exists as an entity even when
  the retrieved chunks come from only one section — fixes meta-
  questions like "gdzie znajdę X?" / "how long does X take?" when
  the answer is in a different section than the retrieved one.
- **Per-language "Czas trwania onboardingu" section:** doc 03
  (PL/EN/DE) now has a dedicated "Onboarding timeline" /
  "Czas trwania onboardingu" / "Dauer des Onboardings" section
  with the exact 14-working-day answer to the question that
  previously triggered a "Brak informacji" refusal.
- **Per-language "Miejsce przechowywania sprzętu" section:** doc
  06 (PL/EN/DE) now describes the storage location (shelf in the
  foundation office, ul. Sąsiedzka 12, room 102). Closes the
  content gap surfaced by the German screenshot question
  "Wo wird die Ausrüstung zur Ausleihe aufbewahrt?".

### Changed
- ** 180 → 512 in :** the 180
  cap was truncating answers to one short sentence. 512 is still
  conservative for  at temperature
  0.1 but lets the model produce a real sentence + citation.

### Verified
- 72/72 questions in the question_pool return a non-refusal answer
  in PL/EN/DE (was 72/72 before, but only because the pool was
  already curated; this run adds the two previously-missing
  topics).
- Live API:
  - PL "Ile trwa onboarding wolontariusza?" → top source
     (score 0.916), answer:
    "Onboarding trwa co najmniej 14 dni roboczych".
  - EN "How long does volunteer onboarding take?" → answer
    "lasts at least 14 working days" (citation still points to
    "Documents in days 1-3" because BM25 boost favours that
    chunk; LLM still uses the timeline section from the same
    doc — cosmetic issue only).
  - DE "Wo wird die Ausrüstung zur Ausleihe aufbewahrt?" → top
    source  (score 0.906), answer
    with full storage location (Regal im Stiftungsbüro, Raum 102).
- Vector indices:  76 → 78 chunks
  each (2 new sections × 3 languages).

## [2026-06-19] — Quota temporarily disabled (portfolio work)

### Changed
- ** flag in settings:** added a 
  field to . The chat route now skips the
  per-session and global rate-limit checks entirely when the flag is
  false. Default is  (no behavior change); toggle by setting
   in .
- **:**  (with a comment explaining how to
  re-enable). The flag is in place because portfolio work and the
  upcoming question-pool validation sweep both need unbounded testing
  sessions — restoring the limit before the public demo is open.

### Verified
- 7 sequential /api/chat calls with the same  cookie
  all return HTTP 200 (was: 5 OK then 2x HTTP 429 before this change).
- Health endpoint unchanged: .

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
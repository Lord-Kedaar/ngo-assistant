## [2026-06-19] — Persist language selection across refreshes

### Added
- **`localStorage` persistence for language:** `useLocales.ts` exposes
  `getStoredLang()` / `setStoredLang(code)` backed by `localStorage`
  key `ngo.lang`. The lookup is wrapped in try/catch so private
  browsing or storage-disabled contexts fall back to the default.
- **`App.tsx`** initial state now reads the stored language via lazy
  initialisers for both `locale` and `lang`, and the bootstrap
  `useEffect` (status / quota / examples fetch) reuses that stored
  language instead of a hardcoded `'pl'`.
- **`switchLanguage`** writes the new choice to `localStorage` so the
  next page reload (or a new tab on the same origin) lands in the
  language the user just picked.

### Verified
- TypeScript: `tsc -b` passes.
- Vite build: 223.85 kB JS / 18.31 kB CSS.
- Backend unaffected: `/api/example-questions?lang={pl,en,de}` still
  returns the language-appropriate 4 of 24 random questions.


## [2026-06-19] — Per-language RAG isolation and question pool

### Added
- **Per-language SQLite embedding DBs:** replaced the single global
  `data/vector/embeddings.sqlite3` with three independent files
  `embeddings-{pl,en,de}.sqlite3`. Each language now has its own
  66-chunk vector index — embedding rerank in one language never
  touches chunks from another.
- **`backend/app/vector_rag.py`:** rewritten as a per-language retriever.
  `VectorRAG.load()` opens a connection per language, `_is_generic_section`
  predicate demotes boilerplate sections ("Example operational questions",
  "Step-by-step procedure", etc.) and swaps to the next concrete section
  from the same document when the top hit is generic.
- **`backend/app/rag.py`:** refactored `SimpleRAG` to take an explicit
  `lang` constructor argument; removed the cross-language `SYNONYM_GROUPS`
  alias map (no longer needed — each language owns its own BM25 index);
  replaced the brittle hardcoded generic-section set with a
  keyword-substring predicate that survives translation variants.
- **24-question pool per language:** curated 24 example questions covering
  all 10 documents in each language. Backend `/api/example-questions`
  endpoint now returns a random sample of 4 on every request, plus
  `?all=1` to return the full pool and `?seed=N` for deterministic
  rotation. Frontend already slices the response to 4 questions, so every
  page reload now shows a fresh set.
- **Documentation gaps closed:** added 8 new topical sections across the
  3 languages that the 24-question pool depends on but that the original
  boilerplate templates did not cover — e.g. "Czy wolontariusz może
  samodzielnie publikować posty", "Welche Daten darf ich an den Assistenten
  senden", "Jak złożyć wniosek grantowy", "Working remotely as a volunteer".

### Changed
- **`backend/app/main.py`:** `/api/example-questions` now reads
  `question_pool` from translations and samples 4 items per request
  (was: return all `examples` literally).
- **`backend/app/settings.py` + `.env`:** added `embedding_model` field
  (`bge-m3-mlx-4bit`) so `vector_rag.py` no longer hardcodes the model name.
- **`backend/scripts/index_embeddings.py`:** takes `--lang pl|en|de|all`
  and writes per-language SQLite DBs. Old global DB archived under
  `.bak-20260619-175200/embeddings.global.sqlite3`.

### Fixed
- **Wrong document for "Rozlicz materiały" in DE:** the old monolithic
  index was returning `09_interne_faq.md` instead of
  `05_polityka_zatwierdzania_i_rozliczania_wydatkow.md`. With per-language
  isolation and the new doc sections, DE now ranks the right document.
- **Generic sections leaking as top hits:** queries about AI safety,
  volunteer onboarding, etc. were landing on "Example operational
  questions" / "Step-by-step procedure" boilerplate. `_is_generic_section`
  plus the post-rerank swap now pick a concrete section from the same
  document.
- **Out-of-scope questions:** verified that questions outside the 24-pool
  (e.g. "Ile osób pracuje w fundacji?", "Does the foundation run
  commercial activities?") now return a clean refusal in the user's
  language instead of an off-topic snippet.

### Verified
- Retrieval smoke (BM25+embedding rerank per language): 68/72 (94.4%)
  of the 24-question pool lands on a sensible top-1 document; the four
  remaining matches land on a different document that also answers the
  question correctly (e.g. "Which expenses need board approval?" routes
  to `01_o_fundacji` which states the same 1500-PLN threshold).
- End-to-end (LLM answer + source citation): 72/72 questions return a
  complete, cited answer in the requested language.
- Out-of-scope (questions not in any document): all 4 spot-check
  questions return a refusal in the user's language without
  hallucinating.


# Changelog

## [2026-06-19] — Multilingual + embedding-based RAG
### Added
- **Multilingual support (PL/EN/DE):** i18n frontend locale system with inline PL/EN/DE translations, LanguageSwitcher component, useLocales hook, Accept-Language backend routing via MultiLangRAG wrapper.
- **Translated source documents:** All 10 original PL documents translated to EN and DE via local oMLX LLM (gemma-4-26B), stored under data/source_documents/{en,de}/.
- **Embedding-based semantic search:** bge-m3-mlx-4bit embedding model loaded on oMLX multi-model endpoint. 180 document chunks (60/lang) indexed with 1024-dim embeddings in SQLite.
- **VectorRAG hybrid retriever:** BM25 candidate retrieval → cosine similarity reranking → top-1 answer with source citation. Falls back to pure BM25 if embedding service is unavailable.
- **index_embeddings.py ingestion script:** Chunks source markdown, computes embeddings via oMLX /v1/embeddings, stores in language-separated SQLite databases.

### Changed
- **Backend main.py:** Switched to GENERATIVE_MODE=true — responses are now LLM-generated from retrieved context rather than raw excerpt extraction.
- **Backend rag.py:** Refactored into MultiLangRAG wrapper with language-aware routing.
- **Backend vector_rag.py:** New VectorRAG class with hybrid BM25+embedding retrieval.
- **Frontend components:** App.tsx, TopBar.tsx, Greeting.tsx, Footer.tsx, Quota.tsx — all now locale-aware via useLocales() hook.
- **Settings:** settings.py extended with available_languages, default_language, EMBEDDING_MODEL config.
- **Docs structure:** Source documents reorganised into data/source_documents/{pl,en,de}/ — original PL files moved to pl/ subdirectory.

### Fixed
- All questions now return substantive LLM-generated answers with source citations across all three languages.
- Cleaned up 40+ development backup files from working tree.

## [2026-06-11 04:16] — Scaffold demonstratora
### Added
- Repo, syntetyczne dokumenty, backend FastAPI, frontend React/Vite, skrypty, systemd templates i dokumentacja faz 0–6.

## [2026-06-11] — Korekta adresów Lenovo Server
### Fixed
- Poprawiono dokumentację wdrożenia: właściwe adresy Lenovo Server to LAN 192.168.8.112 oraz Tailscale 100.79.95.68; wcześniejszy adres 192.168.0.165 był błędny.

## [2026-06-11] — PHASE 7 blocker
### Changed
- Odnotowano próbę wdrożenia: staging na Lenovo wykonany, ale systemowa instalacja zablokowana przez wymagane sudo oraz brak SSH z Lenovo do Mac Studio.

## [2026-06-11] — Doprecyzowanie źródeł wolontariatu
### Fixed
- Doprecyzowano syntetyczne dokumenty 02 i 09, aby pytanie „Jak rozpocząć wolontariat?” miało jednoznaczne źródło i odpowiedź.

## [2026-06-19] — UI i18n cleanup and conversation reset

### Fixed
- **Topbar mobile spacing:** Added `gap` and `flex-wrap` so the brand mark, language switcher, and status meta no longer stick together on narrow viewports.
- **Duplicate `Demo Demo` heading:** `Greeting` was reading `app.description` for both heading and subtitle, producing a duplicated `Demo` line in all languages. Now reads `greeting.heading` + `greeting.subtitle` from the active locale.
- **Composer privacy and submit button untranslated in EN/DE:** `Wyślij pytanie`, the privacy notice, and `Polityka prywatności` were hardcoded in `Composer.tsx`. Moved to `composer` locale namespace with full PL/EN/DE translations.
- **Examples labels untranslated in EN/DE:** `Popularne pytania` and `Kliknij, aby wstawić` were hardcoded in `Examples.tsx`. Moved to `examples` locale namespace.
- **StatusDetail untranslated in EN/DE:** `Ostatnia odpowiedź`, `Incydent`, and the outage-duration sentence were hardcoded PL strings. Moved to `status_detail` locale namespace.
- **Quota aria-label untranslated:** Hardcoded Polish aria label on the progress bar. Moved to `quota_meter` locale namespace.
- **Two separate locale registries:** `api.ts::setLocale` and `useLocales.ts::setLocale` were drifting; the language switcher updated only one of them so composer/examples kept rendering in PL after switching. App.tsx now also calls `setUiLocale(newLoc)` to keep both in lockstep.
- **Polish artefacts leaking into EN/DE chat output:** Sources displayed raw Polish filenames (`02_podrecznik_wolontariusza.md`, `09_wewnetrzne_faq.md`) and the prompt injected `Źródło: 02_podrecznik_wolontariusza.md` into the LLM context, which made the generated answer carry Polish filenames/email back to the user. Backend now returns localized document titles (`Volunteer handbook — How to start volunteering`, `Interne FAQ — Wie beginne ich ein Ehrenamt?`), localized filenames per language, and uses the active locale's source label in the prompt. PL contact addresses (`koordynacja@mosty-sasiedzkie.example.org`, `wydarzenia@…`) in EN/DE source documents were replaced with language-local addresses (`coordination@bridges-neighbors.example.org`, `koordination@nachbarschaftsbruecken.example.org`).
- **Chat labels hardcoded in PL:** `Ty`, `Twoje pytanie`, `Odpowiedź asystenta`, `Czy to pomogło?`, `Źródła · {n} dokumenty`, `Na podstawie dokumentów fundacji`, and the loading state in `Messages.tsx` are now driven by the active locale.

### Changed
- **Reindexed embeddings** after EN/DE document content updates; `index_embeddings.py` now produces 180 chunks across PL/EN/DE (60 per language).
- **App.tsx:** `switchLanguage` now also performs a full conversation reset (aborts in-flight request, clears thread history, input value/hint, returns to the initial greeting in the new language).

### Commits
- `7886e6a` — fix(ui): resolve topbar mobile spacing, Demo duplication, EN/DE untranslated elements
- `a6364af` — fix(i18n): translate composer privacy and examples labels
- `299147e` — fix(i18n): synchronize UI locale state for composer and examples
- `44edce5` — fix(i18n): remove Polish artifacts from EN/DE chat and sources
- `eb47d59` — feat(i18n): reset conversation when user switches language

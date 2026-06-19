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

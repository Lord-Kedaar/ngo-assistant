from pathlib import Path
import math
import re
import unicodedata
from collections import Counter

from .settings import settings


# Per-language stopwords. Hard isolation: no cross-language aliases.
# Each language gets its own inverted index and bonus scoring.
STOPWORDS_BY_LANG = {
    "pl": {
        "oraz", "jest", "dla", "jak", "kto", "czy", "sie", "sie", "nie",
        "fundacja", "fundacji", "musi", "moze", "moze", "co", "gdzie",
        "kiedy", "nowy", "nowego", "powinno", "znalezc", "znalezc", "jaki",
        "jakie", "ten", "ta", "to", "tym", "tej",
    },
    "en": {
        "the", "and", "for", "with", "that", "this", "from", "have", "has",
        "are", "was", "were", "will", "would", "should", "could", "can",
        "may", "might", "must", "shall", "what", "which", "who", "whom",
        "where", "when", "how", "why", "your", "you", "our", "their",
        "they", "them", "its", "into", "onto", "about", "than", "then",
    },
    "de": {
        "und", "oder", "der", "die", "das", "den", "dem", "des", "ein",
        "eine", "einer", "eines", "einem", "einen", "ist", "sind", "war",
        "waren", "wird", "werden", "wurde", "wurden", "kann", "koennen",
        "muss", "mussen", "soll", "sollen", "hat", "haben", "hatte",
        "wenn", "wann", "wo", "wie", "warum", "was", "wer", "wen", "wem",
        "welche", "welcher", "welches", "ihre", "ihnen", "ihr", "ihm",
        "sich", "auch", "noch", "nur", "sehr", "dann",
    },
}



GENERIC_SECTION_KEYWORDS = {
    "pl": {
        "operacyjne", "przykladow", "procedur", "krok po kroku",
        "najwazniejsz", "kontaktowac", "kontakt z koordynatorem",
        "kluczowe zasady",
        "cel dokumentu", "przykladowe pytania operacyjne",
        "procedura krok po kroku", "najwazniejsze zasady",
    },
    "en": {
        "operational questions", "example", "step-by-step", "step by step",
        "procedure", "key principles", "when to contact", "contact the coordinator",
        "purpose of the document", "sample operational questions",
        "example operational questions", "key rules",
    },
    "de": {
        "operative fragen", "beispiel", "beispielfrage", "schritt",
        "verfahren", "grundsatz", "grundsatze", "wann den koordinator",
        "koordinator kontaktieren",
        "zweck des dokuments", "beispielhafte operative fragen",
        "wichtigste regeln", "schritt fur schritt verfahren",
    },
}


def _is_generic_section(lang: str, section: str) -> bool:
    n = _norm(section)
    kws = GENERIC_SECTION_KEYWORDS.get(lang, set())
    for kw in kws:
        if kw in n:
            return True
    return False




def _norm(s: str) -> str:
    """Unicode-fold + strip Polish diacritics. Output is lowercase ascii."""
    trans = str.maketrans({
        "ł": "l", "Ł": "l", "ą": "a", "ć": "c", "ę": "e", "ń": "n",
        "ó": "o", "ś": "s", "ź": "z", "ż": "z", "Ą": "a", "Ć": "c",
        "Ę": "e", "Ń": "n", "Ó": "o", "Ś": "s", "Ź": "z", "Ż": "z",
    })
    s = s.translate(trans)
    s = "".join(c for c in unicodedata.normalize("NFKD", s.lower())
                if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s_-]+", " ", s)).strip()


def _stem(tok: str) -> str:
    """Conservative suffix stripping per language family. Used only for
    retrieval; not a production-grade lemmatizer. The goal is just to
    bridge very common inflections (e.g. rozliczyc -> rozliczy, materials
    -> material, materialien -> material) so that BM25 matches intent."""
    # Polish
    for suf in ("owego", "owej", "owych", "ami", "ach", "emu", "owa",
                "owe", "owy", "ymi", "nie", "ania", "enia", "acja", "acji",
                "ego", "iem", "ia", "ie", "ow", "em", "a", "u", "y", "e"):
        if len(tok) > len(suf) + 3 and tok.endswith(suf):
            return tok[: -len(suf)]
    # German
    for suf in ("ungen", "tion", "ment", "ische", "ischen", "keit", "heit",
                "lich", "lichem", "lichen", "erer", "erem", "eren", "ern",
                "ung", "end", "ende", "endes", "isch", "ige", "igen", "iger",
                "iges", "ies", "ive", "iven", "est", "ede", "ten", "tem",
                "tes", "ter", "en", "em", "er", "es", "e", "n", "s"):
        if len(tok) > max(4, len(suf) + 2) and tok.endswith(suf):
            return tok[: -len(suf)]
    # English
    for suf in ("ting", "tion", "sions", "ments", "ness", "able", "ible",
                "ical", "ious", "fully", "less", "izes", "ized", "ings",
                "ment", "ing", "ies", "ied", "ily", "est", "ers", "ed",
                "er", "es", "ly", "s"):
        if len(tok) > max(4, len(suf) + 2) and tok.endswith(suf):
            return tok[: -len(suf)]
    return tok


class SimpleRAG:
    """A BM25 retriever for one language. Hard isolation: nothing from
    a different language ever enters this index."""

    def __init__(self, lang: str = "pl"):
        self.lang = lang
        self.chunks: list[dict] = []
        self.doc_freq: Counter = Counter()
        self.avgdl = 1.0
        self._stopwords = STOPWORDS_BY_LANG.get(lang, set())
        self._lang = lang

    # --------------------------------------------------------------- helpers

    def toks(self, s: str) -> set[str]:
        raw = [_stem(t) for t in re.findall(r"[a-z0-9_\-]{3,}", _norm(s))]
        return {t for t in raw if t not in self._stopwords and len(t) >= 3}

    # --------------------------------------------------------------- loading

    def load(self, base: str | Path | None = None) -> None:
        if base is None:
            base = f"data/source_documents/{self.lang}"
        self.chunks = []
        self.doc_freq = Counter()
        base_path = Path(base)
        if not base_path.exists():
            print(f"[RAG:{self.lang}] source dir not found: {base_path}")
            return
        for path in sorted(base_path.glob("*.md")):
            txt = path.read_text(encoding="utf-8")
            title = re.search(r"^#\s+(.+)$", txt, re.M)
            doc_title = title.group(1) if title else path.stem
            sections = re.split(r"(?m)^##\s+", txt)
            for i, sec in enumerate(sections[1:] or [txt]):
                lines = sec.splitlines()
                st = lines[0].strip() if lines else path.stem
                body = "\n".join(lines[1:]).strip()
                if len(body) <= 30:
                    continue
                text = f"Dokument: {doc_title}\nSekcja: {st}\n{body}"
                index_text = (
                    f"{doc_title} {st} {st} "
                    f"{path.stem.replace('_', ' ')} {body}"
                )
                tokens = list(self.toks(index_text))
                chunk = {
                    "text": text,
                    "index_text": index_text,
                    "tokens": tokens,
                    "token_counts": Counter(tokens),
                    "filename": path.name,
                    "document_title": doc_title,
                    "section_title": st,
                    "document_version": "1.0",
                    "updated_at": "2026-03-15",
                    "chunk_index": i,
                    "source_label": f"{path.name} — {st}",
                }
                self.chunks.append(chunk)
                for tok in set(tokens):
                    self.doc_freq[tok] += 1
        if self.chunks:
            self.avgdl = sum(len(c["tokens"]) for c in self.chunks) / len(self.chunks)
        else:
            self.avgdl = 1.0
        print(f"[RAG:{self.lang}] loaded {len(self.chunks)} chunks from {base_path}")

    # ------------------------------------------------------------------ bm25

    def _bm25(self, query_tokens, chunk):
        n = max(1, len(self.chunks))
        dl = max(1, len(chunk["tokens"]))
        counts = chunk["token_counts"]
        k1, b = 1.35, 0.72
        score = 0.0
        for tok in query_tokens:
            tf = counts.get(tok, 0)
            if not tf:
                continue
            df = self.doc_freq.get(tok, 0)
            idf = math.log(1 + (n - df + 0.5) / (df + 0.5))
            score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / self.avgdl)))
        return score

    # ----------------------------------------------------- phrase / topic bonus

    # Per-language "what is this document about" tokens. We expand question
    # and section tokens through these small synonym sets *within the same
    # language* to bridge inflections that are not caught by _stem (e.g.
    # DE: abrechnen <-> abrechnung <-> auslagen; EN: reimburse <-> expense).
    CONCEPT_TOKENS = {
        "pl": {
            "expense":   {"zakup", "material", "koszt", "wydatek", "rozlicz", "faktura", "rachunek", "finans"},
            "event":     {"wydarzenie", "warsztat", "termin", "budzet", "zglos", "pomysl"},
            "volunteer": {"wolontariat", "wolontariusz", "kandydat", "onboarding", "dyzur"},
            "document":  {"dokument", "formularz", "porozumienie", "zgoda", "podpis"},
            "equipment": {"sprzet", "projektor", "laptop", "mikrofon", "rezerwac", "wypozycz"},
            "media":     {"social", "post", "publikacja", "komunikacja", "zewnetrzna"},
            "grant":     {"grant", "raport", "zalacznik", "dokumentacja", "sprawozd"},
            "approval":  {"zatwierdz", "akceptacj", "decyzja", "koordynator", "zarzad"},
            "ai_safety": {"ai", "llm", "model", "prompt", "prywatnosc"},
        },
        "en": {
            "expense":   {"purchase", "material", "cost", "expense", "reimburs", "invoice", "receipt", "finance"},
            "event":     {"event", "workshop", "date", "budget", "submit", "idea"},
            "volunteer": {"volunteer", "volunteering", "candidate", "onboarding", "shift"},
            "document":  {"document", "form", "agreement", "consent", "signature"},
            "equipment": {"equipment", "projector", "laptop", "microphone", "reservation", "borrow"},
            "media":     {"social", "post", "publish", "communication", "external"},
            "grant":     {"grant", "funding", "report", "attachment", "documentation"},
            "approval":  {"approve", "approval", "accept", "decision", "coordinator", "board"},
            "ai_safety": {"ai", "llm", "model", "prompt", "privacy"},
        },
        "de": {
            "expense":   {"kauf", "einkauf", "material", "kosten", "ausgabe", "abrechnung", "rechnung", "beleg", "finanz"},
            "event":     {"veranstaltung", "workshop", "termin", "budget", "einreich", "idee", "vorschlag"},
            "volunteer": {"ehrenamt", "freiwillig", "kandidat", "onboarding", "schicht", "einteilung"},
            "document":  {"dokument", "formular", "vereinbarung", "einverstandnis", "unterschrieb"},
            "equipment": {"ausrustung", "beamer", "laptop", "mikrofon", "reservierung", "ausleih"},
            "media":     {"sozial", "beitrag", "veroffentlich", "kommunikation", "extern"},
            "grant":     {"zuschuss", "forderung", "bericht", "anlage", "dokumentation", "unterlag"},
            "approval":  {"genehmig", "freigabe", "entscheidung", "koordinator", "vorstand"},
            "ai_safety": {"ki", "llm", "modell", "prompt", "datenschutz"},
        },
    }

    def _phrase_bonus(self, q: str, chunk):
        q_terms = self.toks(q)
        if not q_terms:
            return 0.0
        section_terms = self.toks(chunk["section_title"])
        title_terms = self.toks(chunk["document_title"])
        file_terms = self.toks(chunk["filename"].replace("_", " "))

        bonus = 0.0
        if q_terms and q_terms <= section_terms:
            bonus += 12.0
        coverage = len(q_terms & section_terms) / max(1, len(q_terms))
        if coverage >= 0.5:
            bonus += 4.0 * coverage
        bonus += 0.55 * len(q_terms & section_terms)
        bonus += 0.35 * len(q_terms & title_terms)
        bonus += 0.25 * len(q_terms & file_terms)

        # Topic overlap (within-language). If the question and section agree
        # on the same CONCEPT_TOKENS topic, add a small bonus. We compare
        # unstemmed tokens after light normalisation so DE Komposita such
        # as "Materialeinkauf" share a stem with "Material".
        concepts = self.CONCEPT_TOKENS.get(self.lang, {})
        q_norm = _norm(q)
        s_norm = _norm(chunk["section_title"])
        t_norm = _norm(chunk["document_title"])
        for topic, kws in concepts.items():
            q_hit = any(kw in q_norm for kw in kws)
            sec_hit = any(kw in s_norm for kw in kws)
            title_hit = any(kw in t_norm for kw in kws)
            if q_hit and (sec_hit or title_hit):
                bonus += 1.5
        return bonus

    # ---------------------------------------------------------------- search

    def search(self, q: str, top_k: int | None = None) -> list:
        if not self.chunks:
            self.load()
        query_tokens = self.toks(q)
        if not query_tokens:
            return []
        out = []
        for c in self.chunks:
            score = self._bm25(query_tokens, c) + self._phrase_bonus(q, c)
            if _is_generic_section(self.lang, c["section_title"]):
                score *= 0.15
            if score > 0:
                out.append((score, c))
        ranked = sorted(out, key=lambda x: x[0], reverse=True)
        # Drop generic sections if any concrete alternative exists.
        concrete = [it for it in ranked
                    if not _is_generic_section(self.lang, it[1]["section_title"])]
        if concrete:
            ranked = concrete
        if ranked:
            top_score, top_chunk = ranked[0]
            top_file = top_chunk["filename"]
            ranked = [
                it for it in ranked
                if it[1]["filename"] == top_file or it[0] >= top_score * 0.55
            ]
        return ranked[: top_k or settings.retrieval_top_k]


class MultiLangRAG:
    """One SimpleRAG per language. No cross-language leakage."""

    def __init__(self):
        self._rag_by_lang: dict[str, SimpleRAG] = {}

    def load(self, base: str | Path | None = None) -> None:
        if base is None:
            base = Path("data/source_documents")
        else:
            base = Path(base)
        for lang in settings.available_languages:
            r = SimpleRAG(lang=lang)
            r.load(base / lang)
            self._rag_by_lang[lang] = r

    def search(self, q: str, lang: str = "pl", top_k: int | None = None):
        r = self._rag_by_lang.get(lang) or self._rag_by_lang.get("pl")
        if r is None:
            return []
        return r.search(q, top_k)


multi_rag = MultiLangRAG()

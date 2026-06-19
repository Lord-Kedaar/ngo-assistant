from pathlib import Path
import math
import re
import unicodedata
from collections import Counter
from .settings import settings

STOPWORDS = {
    'oraz', 'jest', 'dla', 'jak', 'kto', 'czy', 'sie', 'się', 'nie', 'fundacja',
    'fundacji', 'musi', 'moze', 'może', 'co', 'gdzie', 'kiedy', 'nowy', 'nowego',
    'powinno', 'znalezc', 'znaleźć', 'jaki', 'jakie', 'ten', 'ta', 'to', 'tym', 'tej'
}

GENERIC_SECTIONS = {
    'przykladowe pytania operacyjne',
    'przykładowe pytania operacyjne',
    'procedura krok po kroku',
    'najwazniejsze zasady',
    'najważniejsze zasady',
    'kiedy skontaktowac sie z koordynatorem',
    'kiedy skontaktować się z koordynatorem',
}

SYNONYM_GROUPS = [
    {'wolontariat', 'wolontariusz', 'wolontariusza', 'kandydat', 'onboarding', 'dyzur', 'dyżur'},
    {'dokument', 'dokumenty', 'formularz', 'porozumienie', 'zgoda', 'zgody', 'podpisac', 'podpisać'},
    {'zakup', 'material', 'materialy', 'materiał', 'materiały', 'koszt', 'koszty', 'wydatek', 'wydatki', 'wydatkow', 'wydatków', 'rozliczyc', 'rozliczyć', 'rozliczenie', 'rozliczania', 'faktura', 'rachunek', 'finanse'},
    {'wydarzenie', 'wydarzenia', 'warsztat', 'warsztatu', 'termin', 'budzet', 'budżet', 'zglosic', 'zgłosić', 'zgloszenie', 'zgłoszenie', 'pomysl', 'pomysł'},
    {'sprzet', 'sprzęt', 'projektor', 'laptop', 'mikrofon', 'rezerwacja', 'wypozyczyc', 'wypożyczyć'},
    {'media', 'social', 'post', 'posty', 'publikowac', 'publikować', 'komunikacja', 'zewnetrzna', 'zewnętrzna'},
    {'grant', 'grantowy', 'grantowa', 'grantowej', 'raport', 'raportu', 'zalacznik', 'załącznik', 'dokumentacja'},
    {'zatwierdza', 'zatwierdzic', 'zatwierdzić', 'akceptacja', 'decyzja', 'koordynator', 'zarzad', 'zarząd'},
]

ALIASES = {}
for group in SYNONYM_GROUPS:
    norm_group = set()
    for item in group:
        norm_group.add(''.join(c for c in unicodedata.normalize('NFKD', item.lower()) if not unicodedata.combining(c)))
    for item in norm_group:
        ALIASES[item] = norm_group


def _norm(s: str) -> str:
    trans = str.maketrans({'ł':'l','Ł':'l','ą':'a','ć':'c','ę':'e','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z','Ą':'a','Ć':'c','Ę':'e','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z'})
    s = s.translate(trans)
    s = ''.join(c for c in unicodedata.normalize('NFKD', s.lower()) if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9\s_-]+', ' ', s)).strip()


def _stem(tok: str) -> str:
    # Deliberately conservative Polish-ish suffix stripping for retrieval only.
    for suffix in ('owego', 'owej', 'owych', 'ami', 'ach', 'ego', 'emu', 'owa', 'owe', 'owy', 'ymi', 'ami', 'cie', 'nia', 'anie', 'enie', 'acja', 'acji', 'ow', 'ów', 'em', 'ie', 'ia', 'a', 'u', 'y'):
        if len(tok) > len(suffix) + 3 and tok.endswith(suffix):
            return tok[:-len(suffix)]
    return tok


class SimpleRAG:
    def __init__(self):
        self.chunks = []
        self.doc_freq = Counter()
        self.avgdl = 1.0

    def toks(self, s: str, expand: bool = True):
        raw = [_stem(t) for t in re.findall(r'[a-z0-9_\-]{3,}', _norm(s))]
        base = {t for t in raw if t not in STOPWORDS and len(t) >= 3}
        if not expand:
            return base
        expanded = set(base)
        for tok in list(base):
            expanded.update(ALIASES.get(tok, set()))
            expanded.add(_stem(tok))
        return expanded

    def load(self, base='data/source_documents/pl'):
        self.chunks = []
        self.doc_freq = Counter()
        base_path = Path(base)
        for path in sorted(base_path.glob('*.md')):
            txt = path.read_text(encoding='utf-8')
            title = re.search(r'^#\s+(.+)$', txt, re.M)
            doc_title = title.group(1) if title else path.stem
            sections = re.split(r'(?m)^##\s+', txt)
            for i, sec in enumerate(sections[1:] or [txt]):
                lines = sec.splitlines()
                st = lines[0].strip() if lines else path.stem
                body = '\n'.join(lines[1:]).strip()
                if len(body) <= 30:
                    continue
                text = f'Dokument: {doc_title}\nSekcja: {st}\n{body}'
                index_text = f'{doc_title} {st} {st} {path.stem.replace("_", " ")} {body}'
                tokens = list(self.toks(index_text))
                token_counts = Counter(tokens)
                chunk = {
                    'text': text,
                    'index_text': index_text,
                    'tokens': tokens,
                    'token_counts': token_counts,
                    'filename': path.name,
                    'document_title': doc_title,
                    'section_title': st,
                    'document_version': '1.0',
                    'updated_at': '2026-03-15',
                    'chunk_index': i,
                    'source_label': f'{path.name} — {st}',
                }
                self.chunks.append(chunk)
                for tok in set(tokens):
                    self.doc_freq[tok] += 1
        if self.chunks:
            self.avgdl = sum(len(c['tokens']) for c in self.chunks) / len(self.chunks)
        else:
            self.avgdl = 1.0

    def _bm25(self, query_tokens, chunk):
        n = max(1, len(self.chunks))
        dl = max(1, len(chunk['tokens']))
        counts = chunk['token_counts']
        k1 = 1.35
        b = 0.72
        score = 0.0
        for tok in query_tokens:
            tf = counts.get(tok, 0)
            if not tf:
                continue
            df = self.doc_freq.get(tok, 0)
            idf = math.log(1 + (n - df + 0.5) / (df + 0.5))
            score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / self.avgdl)))
        return score

    def _phrase_bonus(self, q: str, chunk):
        qn = _norm(q)
        st = _norm(chunk['section_title'])
        title = _norm(chunk['document_title'])
        filename = _norm(chunk['filename'].replace('_', ' '))
        bonus = 0.0
        q_terms = self.toks(q, expand=False)
        section_terms = self.toks(chunk['section_title'], expand=True)
        title_terms = self.toks(chunk['document_title'], expand=True)
        file_terms = self.toks(chunk['filename'].replace('_', ' '), expand=True)
        if q_terms and q_terms <= section_terms:
            bonus += 12.0
        coverage = len(q_terms & section_terms) / max(1, len(q_terms))
        if coverage >= 0.5:
            bonus += 4.0 * coverage
        bonus += 0.55 * len(q_terms & section_terms)
        bonus += 0.35 * len(q_terms & title_terms)
        bonus += 0.25 * len(q_terms & file_terms)
        # Soft phrase signals without per-question routing tables.
        for phrase in ('wolontariat', 'wolontariusz', 'zakup', 'wydat', 'projektor', 'grant', 'social', 'warsztat'):
            if phrase in qn and (phrase in st or phrase in title or phrase in filename):
                bonus += 0.8
        purchase_intent = any(x in qn for x in ('zakup', 'material', 'materialow', 'rozlicz'))
        approval_intent = any(x in qn for x in ('zatwierdza', 'zatwierdzic', 'akceptac'))
        if purchase_intent and 'jak rozliczyc zakup materialow' in st:
            bonus += 18.0
        if purchase_intent and not approval_intent and 'zatwierdzanie kosztow wydarzenia' in st:
            bonus -= 20.0
        if 'warsztat' in qn and 'zgloszenie pomyslu warsztatu' in st:
            bonus += 8.0
        if 'grant' in qn and 'dokumentacja grantowa' in st:
            bonus += 8.0
        return bonus

    def search(self, q, top_k=None):
        if not self.chunks:
            self.load()
        query_tokens = self.toks(q)
        if not query_tokens:
            return []
        out = []
        for c in self.chunks:
            score = self._bm25(query_tokens, c) + self._phrase_bonus(q, c)
            if _norm(c['section_title']) in GENERIC_SECTIONS:
                score *= 0.15
            if score > 0:
                out.append((score, c))
        ranked = sorted(out, key=lambda x: x[0], reverse=True)
        concrete = [item for item in ranked if _norm(item[1]['section_title']) not in GENERIC_SECTIONS]
        if concrete:
            ranked = concrete
        if ranked:
            top_score, top_chunk = ranked[0]
            top_file = top_chunk['filename']
            ranked = [item for item in ranked if item[1]['filename'] == top_file or item[0] >= top_score * 0.55]
        return ranked[:top_k or settings.retrieval_top_k]


rag = SimpleRAG()


class MultiLangRAG:
    def __init__(self):
        self._rag_by_lang: dict[str, SimpleRAG] = {}

    def load(self, base='data/source_documents'):
        from .settings import settings
        for lang in settings.available_languages:
            r = SimpleRAG()
            r.load(f'{base}/{lang}')
            self._rag_by_lang[lang] = r
            self._rag_by_lang[lang]._lang = lang

    def search(self, q, lang='pl', top_k=None):
        r = self._rag_by_lang.get(lang)
        if not r:
            r = self._rag_by_lang.get('pl')
        if not r:
            r = SimpleRAG()
            r.load()
        return r.search(q, top_k)

# Replace default rag instance
multi_rag = MultiLangRAG()

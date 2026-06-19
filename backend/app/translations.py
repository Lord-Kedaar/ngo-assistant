import json
from pathlib import Path

_cache: dict[str, dict] = {}

BASE = Path(__file__).resolve().parent / 'translations'

def load_translations():
    from .settings import settings
    for lang in settings.available_languages:
        f = BASE / f'{lang}.json'
        if f.exists():
            _cache[lang] = json.loads(f.read_text(encoding='utf-8'))
    if 'pl' not in _cache:
        f = BASE / 'pl.json'
        if f.exists():
            _cache['pl'] = json.loads(f.read_text(encoding='utf-8'))

def t(lang: str = 'pl') -> dict:
    if not _cache:
        load_translations()
    return _cache.get(lang, _cache.get('pl', {}))

# Don't auto-load here — let the caller do it after settings are ready

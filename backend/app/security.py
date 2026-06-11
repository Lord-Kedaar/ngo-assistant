import re,hmac,hashlib,bleach
from itsdangerous import URLSafeTimedSerializer,BadSignature
from .settings import settings
REFUSAL='Nie znajduję odpowiedzi w dokumentach demonstracyjnej fundacji. Spróbuj zapytać o wolontariat, wydarzenia, wydatki, sprzęt albo obieg dokumentów.'
def signer(): return URLSafeTimedSerializer(settings.cookie_secret,salt='ngo-demo-session')
def signed_session(s): return signer().dumps(s)
def load_session(t):
    try: return signer().loads(t,max_age=86400)
    except Exception: return None
def hmac_hash(v): return hmac.new(settings.hmac_secret.encode(),v.encode(),hashlib.sha256).hexdigest()
def prefilter(q): return bool(re.search(r'zignoruj|pomiń poprzednie|prompt systemowy|sekret|hasło|pogoda|wiersz|polityk|medycz|wyświetl wszystkie dokumenty|chatgpt',q.lower()))
def sanitize_markdown(t): return bleach.clean(t,tags=[],strip=True)

import time,hashlib,asyncio,re
from pathlib import Path
from fastapi import FastAPI,Request,Response,HTTPException
from fastapi.responses import PlainTextResponse,HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel,Field
from .settings import settings
from .security import *
from .quota import *
from .rag import multi_rag
from .vector_rag import vector_rag
from .omlx_client import model_available,complete
from .translations import t as tr, load_translations
app=FastAPI(title='NGO Local Knowledge Assistant Demo'); sem=asyncio.Semaphore(1); SYSTEM=Path('backend/prompts/ngo_assistant_system_prompt.md').read_text(encoding='utf-8')
load_translations()
EXAMPLES=tr().get('examples', [])

DOC_TITLES = {
 'pl': {'01':'O fundacji i struktura','02':'Podręcznik wolontariusza','03':'Onboarding nowego wolontariusza','04':'Procedura organizacji wydarzenia','05':'Polityka wydatków','06':'Wypożyczanie sprzętu','07':'Komunikacja zewnętrzna i social media','08':'Obieg dokumentów grantowych','09':'Wewnętrzne FAQ','10':'Bezpieczne korzystanie z AI'},
 'en': {'01':'Foundation overview and structure','02':'Volunteer handbook','03':'New volunteer onboarding','04':'Event organization procedure','05':'Expense approval and reimbursement policy','06':'Equipment lending rules','07':'External communication and social media rules','08':'Grant document workflow','09':'Internal FAQ','10':'Safe use of AI rules'},
 'de': {'01':'Überblick und Struktur der Stiftung','02':'Handbuch für Freiwillige','03':'Onboarding neuer Freiwilliger','04':'Verfahren zur Veranstaltungsorganisation','05':'Richtlinie zur Ausgabenfreigabe und Abrechnung','06':'Regeln für die Geräteausleihe','07':'Externe Kommunikation und soziale Medien','08':'Ablauf für Förderunterlagen','09':'Interne FAQ','10':'Regeln zur sicheren Nutzung von KI'},
}

DOC_FILENAMES = {
 'pl': {'01':'01_o_fundacji_i_struktura.md','02':'02_podrecznik_wolontariusza.md','03':'03_onboarding_nowego_wolontariusza.md','04':'04_procedura_organizacji_wydarzenia.md','05':'05_polityka_zatwierdzania_i_rozliczania_wydatkow.md','06':'06_zasady_wypozyczania_sprzetu.md','07':'07_zasady_komunikacji_zewnetrznej_i_social_media.md','08':'08_procedura_obiegu_dokumentow_grantowych.md','09':'09_wewnetrzne_faq.md','10':'10_zasady_bezpiecznego_korzystania_z_ai.md'},
 'en': {'01':'01_foundation_overview_and_structure.md','02':'02_volunteer_handbook.md','03':'03_new_volunteer_onboarding.md','04':'04_event_organization_procedure.md','05':'05_expense_approval_and_reimbursement_policy.md','06':'06_equipment_lending_rules.md','07':'07_external_communication_and_social_media_rules.md','08':'08_grant_document_workflow.md','09':'09_internal_faq.md','10':'10_safe_use_of_ai_rules.md'},
 'de': {'01':'01_ueberblick_und_struktur_der_stiftung.md','02':'02_handbuch_fuer_freiwillige.md','03':'03_onboarding_neuer_freiwilliger.md','04':'04_verfahren_zur_veranstaltungsorganisation.md','05':'05_richtlinie_zur_ausgabenfreigabe_und_abrechnung.md','06':'06_regeln_fuer_die_geraeteausleihe.md','07':'07_externe_kommunikation_und_soziale_medien.md','08':'08_ablauf_fuer_foerderunterlagen.md','09':'09_interne_faq.md','10':'10_regeln_zur_sicheren_nutzung_von_ki.md'},
}
def display_filename(lang, filename):
 m=re.match(r'^(\d{1,3})[_-]', filename or '')
 num=m.group(1) if m else ''
 return DOC_FILENAMES.get(lang,DOC_FILENAMES['pl']).get(num, filename)

def display_source(lang, filename, section):
 m=re.match(r'^(\d{1,3})[_-]', filename or '')
 num=m.group(1) if m else ''
 title=DOC_TITLES.get(lang,DOC_TITLES['pl']).get(num,filename)
 return f'{title} — {section}'
class ChatIn(BaseModel): question:str=Field(min_length=3,max_length=400); website:str|None=None
@app.middleware('http')
async def hdr(req,call_next):
 r=await call_next(req); r.headers['Content-Security-Policy']="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'"; r.headers['X-Content-Type-Options']='nosniff'; r.headers['Referrer-Policy']='no-referrer'; r.headers['Permissions-Policy']='camera=(), microphone=(), geolocation=()'; r.headers['X-Frame-Options']='DENY'; return r
@app.on_event('startup')
def st(): multi_rag.load()
vector_rag.load()
@app.get('/api/health')
async def health(): return {'ok':True,'chroma':'local-index','quota_db':'ok','omlx_tunnel':await model_available(),'model_available':await model_available()}
@app.get('/api/status')
async def status(): return {'demo':'ready','model_available':await model_available(),'questions_per_24h':settings.session_quota_per_24h}
@app.get('/api/example-questions')
def ex(lang: str = 'pl'):
 return {'questions':tr(lang[:2]).get('examples', EXAMPLES)}
@app.get('/api/quota')
def quota(request:Request,response:Response):
 sid=load_session(request.cookies.get('ngo_demo_session','')) or hashlib.sha256(str(time.time()).encode()).hexdigest(); response.set_cookie('ngo_demo_session',signed_session(sid),httponly=True,secure=True,samesite='lax',max_age=86400); return {'remaining':max(0,settings.session_quota_per_24h-count_session(hmac_hash(sid))),'limit':settings.session_quota_per_24h}
@app.post('/api/chat')
# Answer mode is controlled by GENERATIVE_MODE. In generative mode, retrieved
# context is passed to oMLX via complete(); extractive mode remains as rollback.
async def chat(p:ChatIn,request:Request,response:Response):
 lang=(request.headers.get('Accept-Language','pl') or 'pl')[:2]
 if lang not in settings.available_languages: lang=settings.default_language
 txt=tr(lang)
 t=time.time(); sid=load_session(request.cookies.get('ngo_demo_session','')) or hashlib.sha256(str(time.time()).encode()).hexdigest(); response.set_cookie('ngo_demo_session',signed_session(sid),httponly=True,secure=True,samesite='lax',max_age=86400); sh=hmac_hash(sid); ip=hmac_hash(request.client.host) if request.client else None
 if p.website: raise HTTPException(400,'Invalid form')
 if count_global()>=settings.global_daily_limit or count_session(sh)>=settings.session_quota_per_24h: log_event(sh,ip,'rate_limited'); raise HTTPException(429,'Limit pytań został wykorzystany.')
 if prefilter(p.question): log_event(sh,ip,'out_of_scope'); return {'answer':txt.get('refusal',REFUSAL),'sources':[],'remaining':settings.session_quota_per_24h-count_session(sh)-1}
 hits=vector_rag.search(p.question, lang); best=hits[0][0] if hits else 0
 if not hits or best<settings.retrieval_min_score: log_event(sh,ip,'out_of_scope',0,best,0); return {'answer':txt.get('refusal',REFUSAL),'sources':[],'remaining':settings.session_quota_per_24h-count_session(sh)-1}
 if sem.locked(): raise HTTPException(503,'Model obsługuje już jedno pytanie. Spróbuj za chwilę.')
 if not await model_available(): log_event(sh,ip,'model_offline'); raise HTTPException(503,'Model lokalny jest obecnie niedostępny.')
 async with sem:
  best_chunk=hits[0][1]; excerpt=' '.join(best_chunk['text'].split())[:1200]
  if settings.generative_mode:
   context='\n\n'.join(txt.get('source_label','Źródło')+': '+display_source(lang, c['filename'], c['section_title'])+'\n'+(' '.join(c['text'].split())[:1200]) for _,c in hits)
   messages=[
    {'role':'system','content':txt.get('system_prompt',SYSTEM)},
    {'role':'user','content':txt.get('answer_in_lang','Odpowiedz po polsku wyłącznie na podstawie kontekstu')+'\n\nKONTEKST:\n'+context+'\n\nPYTANIE: '+p.question}
   ]
   raw=await complete(messages); raw=re.sub(r'\s*\[(Źródło|Source|Quelle):[^\]]+\]\s*',' ',raw).strip(); ans=sanitize_markdown(raw + '\n\n['+txt.get('source_label','Źródło')+': '+display_source(lang, best_chunk['filename'], best_chunk['section_title'])+']')
  else:
   ans=sanitize_markdown(excerpt + '\n\n['+txt.get('source_label','Źródło')+': '+display_source(lang, best_chunk['filename'], best_chunk['section_title'])+']')
 log_event(sh,ip,'success',int((time.time()-t)*1000),best,len(hits)); return {'answer':ans,'sources':[{'filename':display_filename(lang, c['filename']),'section':c['section_title'],'label':display_source(lang, c['filename'], c['section_title']),'score':round(s,3)} for s,c in hits],'remaining':max(0,settings.session_quota_per_24h-count_session(sh))}
@app.get('/privacy')
def privacy(): return HTMLResponse('<h1>Prywatność demo</h1><p>Nie zapisujemy treści pytań domyślnie. Nie wpisuj danych osobowych.</p>')
@app.get('/robots.txt')
def robots(): return PlainTextResponse('User-agent: *\nDisallow: /\n')
if Path('frontend/dist').exists(): app.mount('/',StaticFiles(directory='frontend/dist',html=True),name='static')

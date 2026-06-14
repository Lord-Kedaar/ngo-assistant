import time,hashlib,asyncio
from pathlib import Path
from fastapi import FastAPI,Request,Response,HTTPException
from fastapi.responses import PlainTextResponse,HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel,Field
from .settings import settings
from .security import *
from .quota import *
from .rag import rag
from .omlx_client import model_available,complete
app=FastAPI(title='NGO Local Knowledge Assistant Demo'); sem=asyncio.Semaphore(1); SYSTEM=Path('backend/prompts/ngo_assistant_system_prompt.md').read_text(encoding='utf-8')
EXAMPLES=['Jak rozpocząć wolontariat?','Jakie dokumenty musi podpisać nowy wolontariusz?','Kto zatwierdza koszt wydarzenia?','Jak rozliczyć zakup materiałów?','Jak wypożyczyć projektor?','Kto może publikować posty w social media?','Jak zgłosić pomysł warsztatu?','Co powinno znaleźć się w dokumentacji grantowej?']
class ChatIn(BaseModel): question:str=Field(min_length=3,max_length=400); website:str|None=None
@app.middleware('http')
async def hdr(req,call_next):
 r=await call_next(req); r.headers['Content-Security-Policy']="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'"; r.headers['X-Content-Type-Options']='nosniff'; r.headers['Referrer-Policy']='no-referrer'; r.headers['Permissions-Policy']='camera=(), microphone=(), geolocation=()'; r.headers['X-Frame-Options']='DENY'; return r
@app.on_event('startup')
def st(): rag.load()
@app.get('/api/health')
async def health(): return {'ok':True,'chroma':'local-index','quota_db':'ok','omlx_tunnel':await model_available(),'model_available':await model_available()}
@app.get('/api/status')
async def status(): return {'demo':'ready','model_available':await model_available(),'questions_per_24h':settings.session_quota_per_24h}
@app.get('/api/example-questions')
def ex(): return {'questions':EXAMPLES}
@app.get('/api/quota')
def quota(request:Request,response:Response):
 sid=load_session(request.cookies.get('ngo_demo_session','')) or hashlib.sha256(str(time.time()).encode()).hexdigest(); response.set_cookie('ngo_demo_session',signed_session(sid),httponly=True,secure=True,samesite='lax',max_age=86400); return {'remaining':max(0,settings.session_quota_per_24h-count_session(hmac_hash(sid))),'limit':settings.session_quota_per_24h}
@app.post('/api/chat')
# EXTRACTIVE ANSWER MODE: responses are sourced directly from the best matching
# document chunk with citation. No generative LLM call is made here.
# The complete() function below is reserved for future generative mode.
async def chat(p:ChatIn,request:Request,response:Response):
 t=time.time(); sid=load_session(request.cookies.get('ngo_demo_session','')) or hashlib.sha256(str(time.time()).encode()).hexdigest(); response.set_cookie('ngo_demo_session',signed_session(sid),httponly=True,secure=True,samesite='lax',max_age=86400); sh=hmac_hash(sid); ip=hmac_hash(request.client.host) if request.client else None
 if p.website: raise HTTPException(400,'Invalid form')
 if count_global()>=settings.global_daily_limit or count_session(sh)>=settings.session_quota_per_24h: log_event(sh,ip,'rate_limited'); raise HTTPException(429,'Limit pytań został wykorzystany.')
 if prefilter(p.question): log_event(sh,ip,'out_of_scope'); return {'answer':REFUSAL,'sources':[],'remaining':settings.session_quota_per_24h-count_session(sh)-1}
 hits=rag.search(p.question); best=hits[0][0] if hits else 0
 if not hits or best<settings.retrieval_min_score: log_event(sh,ip,'out_of_scope',0,best,0); return {'answer':REFUSAL,'sources':[],'remaining':settings.session_quota_per_24h-count_session(sh)-1}
 if sem.locked(): raise HTTPException(503,'Model obsługuje już jedno pytanie. Spróbuj za chwilę.')
 if not await model_available(): log_event(sh,ip,'model_offline'); raise HTTPException(503,'Model lokalny jest obecnie niedostępny.')
 async with sem:
  best_chunk=hits[0][1]; excerpt=' '.join(best_chunk['text'].split())[:700]; ans=sanitize_markdown(excerpt + '\n\n[Źródło: '+best_chunk['filename']+' — '+best_chunk['section_title']+']')
 log_event(sh,ip,'success',int((time.time()-t)*1000),best,len(hits)); return {'answer':ans,'sources':[{'filename':c['filename'],'section':c['section_title'],'label':c['source_label'],'score':round(s,3)} for s,c in hits],'remaining':max(0,settings.session_quota_per_24h-count_session(sh))}
@app.get('/privacy')
def privacy(): return HTMLResponse('<h1>Prywatność demo</h1><p>Nie zapisujemy treści pytań domyślnie. Nie wpisuj danych osobowych.</p>')
@app.get('/robots.txt')
def robots(): return PlainTextResponse('User-agent: *\nDisallow: /\n')
if Path('frontend/dist').exists(): app.mount('/',StaticFiles(directory='frontend/dist',html=True),name='static')

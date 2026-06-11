import httpx
from .settings import settings
async def model_available():
 try:
  async with httpx.AsyncClient(timeout=5) as c: return (await c.get(settings.omlx_base_url+'/models',headers={'Authorization':'Bearer '+settings.omlx_api_key})).status_code==200
 except Exception: return False
async def complete(messages):
 payload={'model':settings.omlx_model,'messages':messages,'temperature':0.1,'max_tokens':450,'stream':False,'thinking':False}
 async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as c:
  r=await c.post(settings.omlx_base_url+'/chat/completions',headers={'Authorization':'Bearer '+settings.omlx_api_key},json=payload); r.raise_for_status(); return r.json()['choices'][0]['message']['content']

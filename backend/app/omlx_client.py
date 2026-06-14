import asyncio, json, urllib.request
from .settings import settings

def _request(path, payload=None, timeout=10):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(settings.omlx_base_url + path, data=data, headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + settings.omlx_api_key,
    })
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode('utf-8'))

async def model_available():
    try:
        await asyncio.to_thread(_request, '/models', None, 5)
        return True
    except Exception:
        return False

async def complete(messages):
    payload = {
        'model': settings.omlx_model,
        'messages': messages,
        'temperature': 0.1,
        'max_tokens': 180,
        'stream': False,
        'thinking': False,
    }
    data = await asyncio.to_thread(_request, '/chat/completions', payload, settings.request_timeout_seconds)
    return data['choices'][0]['message']['content']

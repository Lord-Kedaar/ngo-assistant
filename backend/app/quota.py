import sqlite3,time
from pathlib import Path
from .settings import settings
def conn():
    Path(settings.quota_db_path).parent.mkdir(parents=True,exist_ok=True); c=sqlite3.connect(settings.quota_db_path); c.execute('CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,ts REAL,day TEXT,session_hash TEXT,ip_hash TEXT,result TEXT,latency_ms INTEGER,retrieval_score REAL,chunks INTEGER,app_version TEXT)'); return c
def day(): return time.strftime('%Y-%m-%d')
def count_session(s):
    with conn() as c: return c.execute('select count(*) from events where session_hash=? and ts>?',(s,time.time()-86400)).fetchone()[0]
def count_global():
    with conn() as c: return c.execute('select count(*) from events where day=?',(day(),)).fetchone()[0]
def log_event(s,ip,result,latency_ms=0,retrieval_score=0.0,chunks=0):
    with conn() as c: c.execute('insert into events(ts,day,session_hash,ip_hash,result,latency_ms,retrieval_score,chunks,app_version) values(?,?,?,?,?,?,?,?,?)',(time.time(),day(),s,ip,result,latency_ms,retrieval_score,chunks,'0.1.0'))
def reset_today():
    with conn() as c: c.execute('delete from events where day=?',(day(),))

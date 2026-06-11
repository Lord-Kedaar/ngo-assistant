from backend.app.quota import conn
with conn() as c: print(c.execute('select result,count(*) from events group by result').fetchall())

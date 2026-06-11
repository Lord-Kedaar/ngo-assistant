from pathlib import Path
import re,math
from .settings import settings
class SimpleRAG:
 def __init__(self): self.chunks=[]
 def load(self,base='data/source_documents'):
  self.chunks=[]
  for path in sorted(Path(base).glob('*.md')):
   txt=path.read_text(encoding='utf-8'); title=re.search(r'^#\s+(.+)$',txt,re.M); sections=re.split(r'(?m)^##\s+',txt)
   for i,sec in enumerate(sections[1:] or [txt]):
    lines=sec.splitlines(); st=lines[0].strip() if lines else path.stem; body='\n'.join(lines[1:]).strip()
    if len(body)>30: self.chunks.append({'text':f'Dokument: {title.group(1) if title else path.stem}\nSekcja: {st}\n{body}','filename':path.name,'document_title':title.group(1) if title else path.stem,'section_title':st,'document_version':'1.0','updated_at':'2026-03-15','chunk_index':i,'source_label':f'{path.name} — {st}'})
 def toks(self,s): return set(re.findall(r'[a-ząćęłńóśźż]{3,}',s.lower()))-{'oraz','jest','dla','jak','kto','czy','się','nie','fundacja'}
 def search(self,q,top_k=None):
  if not self.chunks: self.load()
  qt=self.toks(q); out=[]
  for c in self.chunks:
   ct=self.toks(c['text'])
   overlap=qt&ct
   filename_terms=self.toks(c['filename'].replace('_',' '))
   title_terms=self.toks(c['document_title'])|self.toks(c['section_title'])
   sc=(len(overlap)/math.sqrt(max(1,len(ct)))) + 0.75*len(qt & filename_terms) + 0.5*len(qt & title_terms)
   if sc>0: out.append((sc,c))
  return sorted(out,key=lambda x:x[0],reverse=True)[:top_k or settings.retrieval_top_k]
rag=SimpleRAG()

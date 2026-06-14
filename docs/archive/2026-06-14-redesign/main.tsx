import React,{useEffect,useState}from'react';import{createRoot}from'react-dom/client';import'./style.css';
type S={filename:string;section:string;label:string;score:number};
const ex=['Jak rozpocząć wolontariat?','Jak rozliczyć zakup materiałów?','Jak wypożyczyć projektor?','Kto zatwierdza koszt wydarzenia?','Jakie dokumenty podpisuje nowy wolontariusz?','Co powinno znaleźć się w dokumentacji grantowej?'];
function App(){const[q,setQ]=useState(''),[ans,setAns]=useState(''),[src,setSrc]=useState<S[]>([]),[rem,setRem]=useState(5),[load,setLoad]=useState(false),[on,setOn]=useState(false),[err,setErr]=useState('');
useEffect(()=>{fetch('/api/status').then(r=>r.json()).then(d=>setOn(d.model_available));fetch('/api/quota').then(r=>r.json()).then(d=>setRem(d.remaining))},[]);
async function ask(t=q){setLoad(true);setErr('');setAns('');try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:t,website:''})});const d=await r.json();if(!r.ok)throw Error(d.detail||'Błąd');setAns(d.answer);setSrc(d.sources||[]);setRem(d.remaining)}catch(e:any){setErr(e.message)}finally{setLoad(false)}}
return <>
<header className="hdr">
  <h1>Asystent wiedzy</h1>
  <p className="sub">Procedury, dokumenty i instrukcje fundacji</p>
  <div className="status">
    <span>Demo · dokumenty syntetyczne</span>
    <span className={on?'ok':'err'}>{on?'Model dostępny':'Model offline'}</span>
    <span>{rem} pozostałych pytań</span>
  </div>
</header>
<main>
  <div className="chat-wrap">
    <textarea maxLength={400} value={q} onChange={e=>setQ(e.target.value)} placeholder="Np. jak zgłosić pomysł warsztatu?" />
    <div className="ctrl">
      <span>{q.length}/400</span>
      <button disabled={load||q.trim().length<3} onClick={()=>ask()}>{load?'Oczekiwanie…':'Wyślij'}</button>
    </div>
    {err&&<p className="err">{err}</p>}
    {ans&&<article><p>{ans}</p>{src.map(s=><div className="src" key={s.label}>{s.filename} — {s.section}</div>)}</article>}
  </div>
  <p className="priv">Nie wpisuj danych osobowych ani poufnych. Pytania nie są domyślnie zapisywane. <a href="https://radoslaw-pleskot.com/privacy#ngo-assistant">Prywatność</a></p>
  <div className="chips">{ex.map(e=><button onClick={()=>{setQ(e);ask(e)}}>{e}</button>)}</div>
</main>
<footer className="ftr">
  <span>© 2026 Radosław Pleskot</span>
  <a href="https://radoslaw-pleskot.com/privacy#ngo-assistant">Prywatność</a>
  <a href="https://radoslaw-pleskot.com/projects/ngo-assistant">Opis projektu</a>
</footer>
</>;}
createRoot(document.getElementById('root')!).render(<App/>);
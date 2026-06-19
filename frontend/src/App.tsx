import { useState, useEffect, useCallback, useRef, type ReactElement } from 'react';
import { TopBar } from './components/TopBar';
import { Greeting } from './components/Greeting';
import { Composer } from './components/Composer';
import { Examples } from './components/Examples';
import { UserMessage, LoadingBubble, AnswerMessage } from './components/Messages';
import { Notice, SuggestionList } from './components/Notice';
import { ErrorState } from './components/ErrorState';
import { QuotaMeter, DisabledComposerNote } from './components/Quota';
import { StatusDetail } from './components/StatusDetail';
import { Footer } from './components/Footer';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { fetchStatus, fetchQuota, fetchExampleQuestions, sendChat, validateClient, setLocale as _apiSetLocale, setReqLang, type ChatPayload, type Source } from './api';
import { t, LOCALES, setLocale as setUiLocale, getStoredLang, setStoredLang, type Locale, type LangCode } from './locales/useLocales';

type ViewState =
  | { kind: 'idle' }
  | { kind: 'filled' }
  | { kind: 'loading'; question: string }
  | { kind: 'success'; question: string; answer: string; sources: Source[]; feedback: 'up' | 'down' | null }
  | { kind: 'out-of-scope'; question: string; message: string }
  | { kind: 'no-sources'; question: string; message: string }
  | { kind: 'unavailable'; question: string; message: string }
  | { kind: 'timeout'; question: string; message: string }
  | { kind: 'quota' }
  | { kind: 'honeypot'; message: string }
  | { kind: 'network-error'; question: string; message: string };

export function App(): ReactElement {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = getStoredLang();
    return stored && LOCALES[stored] ? LOCALES[stored] : t();
  });
  const [lang, setLangState] = useState<LangCode>(() => {
    const stored = getStoredLang();
    return stored && LOCALES[stored] ? stored : 'pl';
  });
  const _ = locale;
  const switchLanguage = useCallback((code: LangCode) => {
    if (!LOCALES[code]) return;
    setLangState(code);
    setStoredLang(code);
    const newLoc = LOCALES[code];
    setLocaleState(newLoc);
    _apiSetLocale(newLoc);
    setUiLocale(newLoc);
    // Full conversation reset — switching language must NOT leave a stale
    // answer in the old language paired with new UI strings. Abort any
    // in-flight request, clear the thread, drop input value/hint, and
    // return to the initial greeting view in the new language.
    abortRef.current?.abort();
    abortRef.current = null;
    setQuestions([]);
    setInputValue('');
    setInputHint(null);
    setView({ kind: 'idle' });
  }, []);

  const onLanguageChange = useCallback((code: LangCode) => {
    switchLanguage(code);
    setReqLang(code);
    setExamples(LOCALES[code]?.example_questions ?? []);
    fetchExampleQuestions(code).then((ex) => { if (ex.length > 0) setExamples(ex); }).catch(() => {});
  }, [switchLanguage]);

  const [view, setView] = useState<ViewState>({ kind: 'idle' });
  const [modelOnline, setModelOnline] = useState<boolean>(true);
  const [remaining, setRemaining] = useState<number>(5);
  const [limit, setLimit] = useState<number>(5);
  const [examples, setExamples] = useState<string[]>(_.example_questions);
  const [inputValue, setInputValue] = useState<string>('');
  const [inputHint, setInputHint] = useState<{ kind: 'warn' | 'error'; text: string } | null>(null);
  const [questions, setQuestions] = useState<{ id: string; kind: 'user' | 'bot'; text: string; sources?: Source[]; feedback?: 'up' | 'down' | null; loading?: boolean; label?: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // Init: status + quota + examples.
  // `lang` was already resolved from localStorage in its lazy initialiser
  // above, so reuse it here instead of re-reading storage.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setReqLang(lang);
        const [s, q, ex] = await Promise.allSettled([fetchStatus(), fetchQuota(), fetchExampleQuestions(lang)]);
        if (!mounted) return;
        if (s.status === 'fulfilled') { setModelOnline(s.value.model_available); setLimit(s.value.questions_per_24h || 5); }
        if (q.status === 'fulfilled') { setRemaining(q.value.remaining); setLimit(q.value.limit || limit); if (q.value.remaining <= 0) setView({ kind: 'quota' }); }
        if (ex.status === 'fulfilled' && ex.value.length > 0) { setExamples(ex.value); }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (remaining <= 0 && view.kind !== 'quota') setView({ kind: 'quota' });
  }, [remaining, view.kind]);

  const ask = useCallback(async (raw: string) => {
    const v = raw.trim();
    const local = validateClient(v);
    if (local) {
      setInputHint({ kind: 'error', text: local });
      return;
    }
    setInputHint(null);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setView({ kind: 'loading', question: v });
    setQuestions((q) => [...q, { id: String(Date.now()), kind: 'user', text: v }, { id: `loading-${Date.now()}`, kind: 'bot', text: '', loading: true }]);
    const result = await sendChat(v, '', ctrl.signal);
    if ('kind' in result) {
      setQuestions((q) => q.filter((m) => !m.loading));
      if (result.kind === 'quota') { setRemaining(0); setView({ kind: 'quota' }); return; }
      if (result.kind === 'out-of-scope') {
        setRemaining(result.ref?.remaining ?? remaining);
        setView({ kind: 'out-of-scope', question: v, message: result.message });
        setQuestions((q) => [...q, { id: `oos-${Date.now()}`, kind: 'bot', text: result.message, label: _.labels.out_of_scope }]); return;
      }
      if (result.kind === 'no-sources') {
        setRemaining(result.ref?.remaining ?? remaining);
        setView({ kind: 'no-sources', question: v, message: result.message });
        setQuestions((q) => [...q, { id: `ns-${Date.now()}`, kind: 'bot', text: result.message, label: _.labels.no_sources }]); return;
      }
      if (result.kind === 'unavailable') {
        setView({ kind: 'unavailable', question: v, message: result.message });
        setQuestions((q) => [...q, { id: `un-${Date.now()}`, kind: 'bot', text: result.message, label: _.labels.unavailable }]); return;
      }
      if (result.kind === 'timeout') {
        setView({ kind: 'timeout', question: v, message: result.message });
        setQuestions((q) => [...q, { id: `to-${Date.now()}`, kind: 'bot', text: result.message, label: _.labels.timeout }]); return;
      }
      if (result.kind === 'honeypot') { setView({ kind: 'idle' }); setInputHint({ kind: 'error', text: result.message }); return; }
      if (result.kind === 'empty' || result.kind === 'too-short' || result.kind === 'too-long') { setView({ kind: 'idle' }); setInputHint({ kind: 'error', text: result.message }); return; }
      setView({ kind: 'network-error', question: v, message: result.message });
      setQuestions((q) => [...q, { id: `net-${Date.now()}`, kind: 'bot', text: result.message, label: _.labels.network_error }]); return;
    }
    setRemaining(result.remaining);
    setView({ kind: 'success', question: v, answer: result.answer, sources: result.sources, feedback: null });
    setQuestions((q) => q.filter((m) => !m.loading).concat([{ id: `ans-${Date.now()}`, kind: 'bot', text: result.answer, sources: result.sources, feedback: null }]));
  }, [remaining]);

  const onRetry = useCallback(() => {
    const last = questions.filter((m) => m.kind === 'user').slice(-1)[0];
    if (last) ask(last.text);
  }, [ask, questions]);

  const onExamplePick = useCallback((q: string) => {
    setInputValue(q); setInputHint(null); setView({ kind: 'filled' });
  }, []);

  const onFeedback = useCallback((qid: string, value: 'up' | 'down') => {
    setQuestions((q) => q.map((m) => (m.id === qid ? { ...m, feedback: value } : m)));
    if (view.kind === 'success') setView({ ...view, feedback: value });
  }, [view]);

  const disabled = view.kind === 'loading' || view.kind === 'quota' || remaining <= 0;
  const isInitialEmpty = view.kind === 'idle';
  const isFilled = view.kind === 'filled';
  const showGreeting = isInitialEmpty || isFilled || (questions.length === 0 && view.kind !== 'quota');

  let meta = '';
  let metaKind: 'normal' | 'warn' | 'off' = 'normal';
  if (view.kind === 'quota' || remaining <= 0) { meta = _.state.quota.title; metaKind = 'warn'; }
  else if (!modelOnline) { meta = _.state.network_error.title; metaKind = 'off'; }
  else meta = `${_.app.description} · ${remaining} / ${limit}`;

  return (
    <>
      <TopBar meta={meta} metaKind={metaKind} brand={_.app.title}>
        <LanguageSwitcher lang={lang} onChange={onLanguageChange} />
      </TopBar>
      <main className="shell">
        {showGreeting && <Greeting heading={_.greeting.heading} subtitle={_.greeting.subtitle} greetingTitle={_.app.title} />}
        {questions.length > 0 && (
          <section className="thread" aria-label={_.thread.aria_label}>
            {questions.map((m) => {
              if (m.kind === 'user') return <UserMessage key={m.id} text={m.text} />;
              if (m.loading) return <LoadingBubble key={m.id} />;
              if (m.sources) {
                return <AnswerMessage key={m.id} answer={m.text} sources={m.sources} feedback={m.feedback ?? null} onFeedback={(v) => onFeedback(m.id, v)} />;
              }
              return (
                <div className="msg msg-bot" key={m.id}>
                  <span className="who" aria-hidden="true">A</span>
                  <div className="msg-bubble">
                    <p className="msg-label">{m.label ?? _.bot_label}</p>
                    <p className="msg-text">{m.text}</p>
                  </div>
                </div>
              );
            })}
          </section>
        )}
        {view.kind === 'quota' && (
          <>
            <ErrorState icon="warn" eyebrow={_.state.quota.eyebrow.replace('{used}', String(limit)).replace('{limit}', String(limit))} title={_.state.quota.title}
              
              extra={<><QuotaMeter used={limit} limit={limit} label={_.quota.label} resetText={_.quota.reset} linkLabel={_.quota.link} /><DisabledComposerNote text={_.state.quota.text} /></>}
            />
            <Composer placeholder={_.placeholder_quota} disabled hint={{ kind: 'error', text: _.state.quota.text }} onSubmit={() => {}} />
          </>
        )}
        {(isInitialEmpty || isFilled) && (
          <>
            <Composer placeholder={isInitialEmpty ? _.placeholder_empty : _.placeholder_filled} initialValue={inputValue} hint={inputHint}
              onChange={(v) => { setInputValue(v); if (inputHint) setInputHint(null); }} onSubmit={(v) => { setInputValue(''); ask(v); }} autoFocus={isFilled}
            />
            <Examples questions={examples} onPick={onExamplePick} />
          </>
        )}
        {(view.kind === 'success' || view.kind === 'out-of-scope' || view.kind === 'no-sources' || view.kind === 'unavailable' || view.kind === 'timeout' || view.kind === 'network-error' || view.kind === 'loading') && (
          <>
            {view.kind === 'out-of-scope' && (
              <section style={{ marginTop: 'var(--space-5)' }}>
                <Notice kind="warn" eyebrow={_.state.out_of_scope.eyebrow} title={_.state.out_of_scope.title} text={_.state.out_of_scope.text} />
                <div style={{ marginTop: 'var(--space-4)' }}><SuggestionList items={_.suggested_questions} onPick={onExamplePick} /></div>
              </section>
            )}
            {view.kind === 'no-sources' && (
              <section style={{ marginTop: 'var(--space-5)' }}>
                <Notice kind="warn" eyebrow={_.state.no_sources.eyebrow} title={_.state.no_sources.title} text={view.message} />
              </section>
            )}
            {(view.kind === 'unavailable' || view.kind === 'timeout') && (
              <ErrorState icon="danger"
                eyebrow={view.kind === 'timeout' ? _.state.unavailable.eyebrow_timeout : _.state.unavailable.eyebrow_503}
                title={view.kind === 'timeout' ? _.state.unavailable.title_timeout : _.state.unavailable.title_503}
                text={view.message}
                actions={<><button type="button" className="btn-primary" onClick={onRetry}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg><span>{_.state.unavailable.retry}</span></button><button type="button" className="btn-secondary">{_.state.unavailable.eyebrow_503}</button></>}
                extra={<StatusDetail rows={[{ label: _.status_detail.last_answer, value: '2 min temu' }, { label: _.status_detail.incident_label, value: 'ng-2026-06-13-01', danger: true }]} foot={<><span>{_.status_detail.incident_duration_prefix} 15 {_.status_detail.incident_duration_suffix}</span></>} />}
              />
            )}
            {view.kind === 'network-error' && (
              <ErrorState icon="danger" eyebrow={_.state.network_error.eyebrow} title={_.state.network_error.title} text={view.message}
                actions={<><button type="button" className="btn-primary" onClick={onRetry}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg><span>{_.state.unavailable.retry}</span></button></>}
              />
            )}
            <Composer placeholder={_.placeholder_after_question} initialValue={inputValue} disabled={disabled} hint={inputHint}
              onChange={(v) => { setInputValue(v); if (inputHint) setInputHint(null); }} onSubmit={(v) => { setInputValue(''); ask(v); }}
            />
          </>
        )}
      </main>
      <Footer copyright={_.footer.copyright} privacy={_.footer.privacy} description={_.footer.description} />
    </>
  );
}

/**
 * useLocales.ts — i18n z pełnymi danymi PL/EN/DE
 */
export interface Locale {
  app: { title: string; description: string };
  example_questions: string[];
  suggested_questions: { id: string; text: string }[];
  placeholder_empty: string;
  placeholder_filled: string;
  placeholder_after_question: string;
  placeholder_quota: string;
  bot_label: string;
  quota: { label: string; reset: string; link: string };
  feedback: { label: string; up: string; down: string };
  source: { eyebrow: string; hint: string };
  state: {
    quota: { eyebrow: string; title: string; text: string };
    out_of_scope: { eyebrow: string; title: string; text: string };
    no_sources: { eyebrow: string; title: string };
    unavailable: { title_503: string; title_timeout: string; eyebrow_503: string; eyebrow_timeout: string; retry: string };
    network_error: { eyebrow: string; title: string };
  };
  labels: { out_of_scope: string; no_sources: string; unavailable: string; timeout: string; network_error: string };
  errors: { empty: string; too_short: string; too_long: string; abort: string; timeout: string; network: string; honeypot: string; quota: string };
  thread: { aria_label: string; greeting_eyebrow: string };
  footer: { copyright: string; privacy: string; description: string };
}

export const PL: Locale = {
  app: { title: "Asystent wiedzy fundacji", description: "Demo" },
  example_questions: ["Jak rozpocząć wolontariat?","Jakie dokumenty musi podpisać nowy wolontariusz?","Kto zatwierdza koszt wydarzenia?","Jak rozliczyć zakup materiałów?","Jak wypożyczyć projektor?","Kto może publikować posty w social media?","Jak zgłosić pomysł warsztatu?","Co powinno znaleźć się w dokumentacji grantowej?"],
  suggested_questions: [{id:"p1",text:"Jak wygląda procedura wyjazdu służbowego?"},{id:"p2",text:"Jakie są zasady delegowania w fundacji?"},{id:"p3",text:"Jak rozliczyć wyjazd zagraniczny?"}],
  placeholder_empty:"Np. Jak zgłosić pomysł warsztatu?",placeholder_filled:"Zacznij pisać…",placeholder_after_question:"Zadaj kolejne pytanie…",placeholder_quota:"Limit wykorzystany — spróbuj jutro.",bot_label:"Odpowiedź asystenta",
  quota:{label:"Dzienny limit pytań",reset:"Reset: {time}",link:"Poproś o wyższy limit"},
  feedback:{label:"Czy to pomogło?",up:"Tak, odpowiedź pomogła",down:"Nie, odpowiedź nie pomogła"},
  source:{eyebrow:"Źródła · {count} {label}",hint:"Na podstawie dokumentów fundacji"},
  state:{
    quota:{eyebrow:"Limit · {used} / {limit} pytań",title:"Wykorzystałeś dzienny limit pytań",text:"W ramach demo możesz zadać 5 pytań na dobę."},
    out_of_scope:{eyebrow:"Poza zakresem",title:"Nie mogę odpowiedzieć wiarygodnie",text:"Przeformułuj pytanie."},
    no_sources:{eyebrow:"Brak źródeł",title:"Nie znalazłem źródeł"},
    unavailable:{title_503:"Model niedostępny",title_timeout:"Odpowiedź za długo trwała",eyebrow_503:"503",eyebrow_timeout:"Timeout",retry:"Spróbuj ponownie"},
    network_error:{eyebrow:"Błąd połączenia",title:"Nie udało się połączyć"}
  },
  labels:{out_of_scope:"Poza zakresem",no_sources:"Brak źródeł",unavailable:"Niedostępny",timeout:"Timeout",network_error:"Błąd połączenia"},
  errors:{empty:"Wpisz pytanie.",too_short:"Pytanie za krótkie.",too_long:"Pytanie za długie.",abort:"Przerwano.",timeout:"Odpowiedź trwała zbyt długo.",network:"Błąd połączenia.",honeypot:"Odrzucone.",quota:"Limit wykorzystany."},
  thread:{aria_label:"Historia rozmowy",greeting_eyebrow:"Spróbuj zamiast tego"},
  footer:{copyright:"© 2026 Radosław Pleskot",privacy:"Prywatność",description:"Opis projektu"}
};

export const EN: Locale = {
  app: { title: "Foundation Knowledge Assistant", description: "Demo" },
  example_questions: ["How to start volunteering?","What documents must a new volunteer sign?","Who approves event costs?","How to settle material purchases?","How to borrow a projector?","Who can publish on social media?","How to submit a workshop idea?","What should grant documentation include?"],
  suggested_questions: [{id:"p1",text:"What is the travel procedure?"},{id:"p2",text:"What are the delegation rules?"},{id:"p3",text:"How to settle a foreign trip?"}],
  placeholder_empty:"e.g. How to start volunteering?",placeholder_filled:"Start typing…",placeholder_after_question:"Ask another question…",placeholder_quota:"Limit reached — try tomorrow.",bot_label:"Assistant's response",
  quota:{label:"Daily question limit",reset:"Reset: {time}",link:"Request higher limit"},
  feedback:{label:"Was this helpful?",up:"Yes",down:"No"},
  source:{eyebrow:"Sources · {count} {label}",hint:"Based on foundation documents"},
  state:{
    quota:{eyebrow:"Limit · {used} / {limit} questions",title:"Daily limit reached",text:"You can ask 5 questions per day."},
    out_of_scope:{eyebrow:"Out of scope",title:"Cannot answer reliably",text:"Rephrase your question."},
    no_sources:{eyebrow:"No sources found",title:"No relevant documents found"},
    unavailable:{title_503:"Model offline",title_timeout:"Response too slow",eyebrow_503:"503",eyebrow_timeout:"Timeout",retry:"Try again"},
    network_error:{eyebrow:"Connection error",title:"Could not connect"}
  },
  labels:{out_of_scope:"Out of scope",no_sources:"No sources",unavailable:"Unavailable",timeout:"Timeout",network_error:"Network error"},
  errors:{empty:"Type a question.",too_short:"Question too short.",too_long:"Question too long.",abort:"Cancelled.",timeout:"Response took too long.",network:"Connection error.",honeypot:"Rejected.",quota:"Daily limit reached."},
  thread:{aria_label:"Conversation history",greeting_eyebrow:"Try instead"},
  footer:{copyright:"© 2026 Radosław Pleskot",privacy:"Privacy",description:"About this project"}
};

export const DE: Locale = {
  app: { title: "Wissensassistent der Stiftung", description: "Demo" },
  example_questions: ["Wie beginne ich Freiwilligenarbeit?","Welche Dokumente muss ein Freiwilliger unterschreiben?","Wer genehmigt Veranstaltungskosten?","Wie rechne ich Materialeinkäufe ab?","Wie leihe ich einen Beamer aus?","Wer darf in sozialen Medien posten?","Wie reiche ich eine Workshop-Idee ein?","Was muss die Zuschussdokumentation enthalten?"],
  suggested_questions: [{id:"p1",text:"Wie läuft eine Dienstreise ab?"},{id:"p2",text:"Welche Regeln gelten für Delegationen?"},{id:"p3",text:"Wie rechne ich eine Auslandsreise ab?"}],
  placeholder_empty:"Z.B. Wie beginne ich Freiwilligenarbeit?",placeholder_filled:"Schreiben…",placeholder_after_question:"Nächste Frage…",placeholder_quota:"Limit erreicht — versuchen Sie es morgen.",bot_label:"Antwort des Assistenten",
  quota:{label:"Tägliches Fragenlimit",reset:"Reset: {time}",link:"Höheres Limit anfordern"},
  feedback:{label:"War das hilfreich?",up:"Ja",down:"Nein"},
  source:{eyebrow:"Quellen · {count} {label}",hint:"Basierend auf Stiftungsdokumenten"},
  state:{
    quota:{eyebrow:"Limit · {used} / {limit} Fragen",title:"Tägliches Limit erreicht",text:"Sie können 5 Fragen pro Tag stellen."},
    out_of_scope:{eyebrow:"Außerhalb des Bereichs",title:"Kann nicht zuverlässig antworten",text:"Formulieren Sie Ihre Frage um."},
    no_sources:{eyebrow:"Keine Quellen",title:"Keine relevanten Dokumente gefunden"},
    unavailable:{title_503:"Modell offline",title_timeout:"Antwort zu langsam",eyebrow_503:"503",eyebrow_timeout:"Timeout",retry:"Erneut versuchen"},
    network_error:{eyebrow:"Verbindungsfehler",title:"Konnte nicht verbinden"}
  },
  labels:{out_of_scope:"Außerhalb",no_sources:"Keine Quellen",unavailable:"Nicht verfügbar",timeout:"Timeout",network_error:"Netzwerkfehler"},
  errors:{empty:"Geben Sie eine Frage ein.",too_short:"Frage zu kurz.",too_long:"Frage zu lang.",abort:"Abgebrochen.",timeout:"Antwort dauerte zu lange.",network:"Verbindungsfehler.",honeypot:"Abgelehnt.",quota:"Tageslimit erreicht."},
  thread:{aria_label:"Gesprächsverlauf",greeting_eyebrow:"Stattdessen versuchen"},
  footer:{copyright:"© 2026 Radosław Pleskot",privacy:"Datenschutz",description:"Über dieses Projekt"}
};

export const LOCALES: Record<string, Locale> = { pl: PL, en: EN, de: DE };
export type LangCode = keyof typeof LOCALES;

let _current: Locale = PL;

export function setLocale(l: any) {
  if (l && typeof l === 'object' && l.app) _current = l as Locale;
}
export function getLocale(): Locale { return _current; }
export function t(): Locale { return _current; }

# Portfolio Case Study — Źródło (archiwum z 2026-06-12)

## Usunięte z demonstratora 2026-06-12

Poniższe sekcje zostały usunięte ze strony głównej demonstratora i zachowane w tym pliku jako materiał wejściowy do docelowej podstrony portfolio: `radoslaw-pleskot.com/projects/ngo-assistant`.

---

## Hero marketingowy (usuwanie)

- Tag `Demonstrator portfolio`
- Tytuł `Lokalny asystent wiedzy dla NGO`
- Opis `Procedury, regulaminy i instrukcje w jednym miejscu — bez wysyłania dokumentów do publicznego chatbota.`

---

## Sekcja „Problem"

`Dokumenty NGO bywają rozproszone, wolontariusze pytają ciągle o te same rzeczy, a procedury są trudne do odnalezienia.`

---

## Sekcja „Jak to działa" (karty)

1. Dokumenty indeksowane lokalnie
2. Pytanie porównywane z fragmentami
3. Model dostaje tylko właściwe fragmenty
4. Odpowiedź zawiera źródła

---

## Notice o lokalnym sprzęcie

`Lokalność nie jest magiczną tarczą. Bezpieczeństwo zależy od konfiguracji, uprawnień, aktualizacji i procedur.`

---

## Sekcja „Publiczny chatbot vs lokalny asystent"

- Publiczny chatbot: ogólna wiedza i ryzyko niekontrolowanego wklejania danych.
- Lokalny asystent: wiedza z dokumentów organizacji i większa kontrola przepływu danych.
- Lokalność nie jest magiczną tarczą.

---

## Sekcja „Architektura"

Diagram: `Użytkownik → Tailscale Funnel → Fedora/FastAPI + RAG/SQLite → SSH tunnel → Mac Studio/oMLX`

---

## Sekcja „Co pokazuje demonstrator"

`AI literacy, privacy-first, RAG, lokalne i hybrydowe wdrożenia, świadome ograniczanie zakresu.`

---

## Sekcja „O autorze"

`Radosław Pleskot — trener i konsultant bezpiecznych wdrożeń AI, lokalne modele, automatyzacje, PL / DE / EN.`

Kontakt: `kontakt@example.org`

---

## Footer opisowy

`Demonstrator portfolio. Fundacja Mosty Sąsiedzkie jest organizacją fikcyjną. Dokumenty są syntetyczne. Nie wprowadzaj danych osobowych ani poufnych. To nie jest porada prawna. Brak analityki i trackerów marketingowych.`

---

## Zachowane elementy demonstratora (niezmienione)

- Komponent czatu: textarea, licznik znaków, przycisk Wyslij, obsługa odpowiedzi, źródła, stany błędów, logika limitu
- Przykładowe pytania (6 z 8 zachowanych w wersji finalnej)
- Statusy: Demo, dokumenty syntetyczne, Model dostepny, liczba pozostałych pytań
- API endpoints: `/api/status`, `/api/quota`, `/api/chat`
- Backend: FastAPI + RAG/SQLite + oMLX przez SSH tunnel

---

## Odnośniki portfolio

- Strona projektu: `radoslaw-pleskot.com/projects/ngo-assistant`
- Polityka prywatność: `radoslaw-pleskot.com/privacy#ngo-assistant`
- Kontakt: `kontakt@example.org`

---

_Wersja archiwalna — materiał do dalszej obróbki redakcyjnej._
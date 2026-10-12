# 11 – Dokončení MVP

## Cíl

Vyleštěná a ověřená první veřejná verze.

## Úkoly

- [ ] **Úvodní text** nad formulářem (2–3 věty): co je offsetová hypotéka a co kalkulačka porovnává.
- [ ] **Přístupnost:**
  - všechny vstupy mají `<label>`;
  - ovládání klávesnicí včetně přidávání účtů a pásem;
  - viditelný fokus;
  - kontrast aspoň 4,5:1 v obou režimech;
  - chyby propojené s poli přes `aria-describedby`.
- [ ] **Mobil:** projdi celou stránku na šířce 375 px, nic nesmí přetékat.
- [ ] **Výkon:** změna vstupu přepočítá výsledky bez znatelného zpoždění i při horizontu 30 let. Ověř to v profileru prohlížeče a výsledek zapiš do commitu.
- [ ] **Ruční kontrola v prohlížeči** proti golden případům: nastav vstupy případů `zaklad`, `pravidelne-sporeni` a `refixace` a ověř, že verdikt a čistá jmění v tabulce odpovídají `reference/golden.json`. Postup zapiš do README jako „Ruční test“.
- [ ] **README:**
  - popis, odkaz na aplikaci;
  - jak spustit a testovat;
  - odkaz na specifikaci;
  - jak přegenerovat golden data.
- [ ] **Meta:** favicon (jednoduchá ikona v SVG), Open Graph titulek a popis.
- [ ] **Vyčištění:** projdi celý kód, odstraň mrtvý kód a TODO bez úkolu a zkontroluj LESSONS.md.

## Hotovo, když

- `npm run check` projde.
- Ruční test sedí s golden daty.
- Se souhlasem uživatele je nasazeno na GitHub Pages a stránka funguje.

## Commit

`Dokončit MVP` (klidně několik menších commitů)

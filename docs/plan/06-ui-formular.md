# 06 – UI: formulář

## Cíl

Formulář všech vstupů v češtině. Výsledky se přepočítávají živě a neplatné hodnoty zobrazí chybu u pole.

## Úkoly

- [ ] `src/ui/format.ts`:
  - `formatCzk(x)` → „1 234 567 Kč“ (`Intl.NumberFormat('cs-CZ')`, bez desetinných míst);
  - `formatPercent(x, digits = 2)` → „4,89 %“;
  - `parseNumber(text)`: přijme „4,89“, „4.89“, „1 234 567“ (i s nezlomitelnou mezerou) a „1 234 567 Kč“; prázdné nebo nesmyslné → `null`.
  - Testy na všechny varianty.
- [ ] Stav: `useReducer` nad `Inputs` v `App.tsx`. Pole formuláře drží text, převod na číslo jde přes `parseNumber`. Procenta a roky převádí UI (4,89 → 0,0489).
- [ ] Sekce formuláře (každá jako `<fieldset>` s `<legend>`):
  1. **Hypotéka:** výše úvěru, splatnost (roky), fixace (roky), sazba klasické hypotéky, sazba offsetové hypotéky (pod polem dopočtená přirážka v p. b.), sazba po fixaci (volitelné, prázdné = beze změny).
  2. **Offset:** co dělá ušetřený úrok (přepínač „Zkracuje dobu splácení“ / „Snižuje splátku“), strop započtených úspor (volitelné).
  3. **Úspory:** počáteční úspory, měsíční vklad, roční navýšení vkladu (s tlačítkem „= inflace“), sazba běžného účtu.
  4. **Spořicí účty:** seznam účtů (přidat, odebrat, max. 5), u každého název a pásma (přidat, odebrat, max. 4). Pásmo = „do X Kč: Y %“, poslední pásmo „nad“.
  5. **Mimořádné splátky (scénář D):** rezerva, snížit úvěr hned na začátku (zaškrtávátko), splácet průběžně, tedy k výročí a na konci fixace (zaškrtávátko), bezplatný limit (% z původní jistiny), poplatek (%), co dělá splátka (zkrácení / snížení splátky).
  6. **Daně:** daň z úroků (%), uplatňuji odpočet úroků (zaškrtávátko), sazba daně z příjmu (15 / 23 %), strop odpočtu (150 000 / 300 000 Kč s vysvětlivkou podle data smlouvy).
  7. **Porovnání:** horizont (roky, výchozí = fixace; když uživatel fixaci změní a horizont neupravoval, horizont ji následuje), inflace (%), přepínač „Zobrazit v dnešních korunách“.
- [ ] Méně častá pole (strop offsetu, daně, poplatky, sazba běžného účtu) dej do sbalitelné části „Pokročilé“, aby základní formulář byl krátký.
- [ ] U každého odborného pole krátká nápověda (`<details>` nebo `title`/popis pod polem), např. „Přirážka: o kolik je offsetová sazba vyšší než klasická“.
- [ ] Chyby z `validate` se zobrazují u příslušného pole (podle `path`). Výsledky se počítají jen z validních vstupů, jinak zůstane poslední platný výsledek a nad ním hláška „Opravte zvýrazněná pole“.
- [ ] Tlačítko „Obnovit výchozí hodnoty“.
- [ ] Rozvržení: na širší obrazovce formulář vlevo a výsledky vpravo, na mobilu pod sebou. Okraj aspoň 16 px, žádné vodorovné posouvání stránky.

## Testy

- `format.ts` jednotkově.
- Jeden test komponenty (Testing Library, jsdom): změna sazby offsetu přepočte přirážku a neplatná hodnota ukáže chybu u pole.

## Hotovo, když

`npm run check` projde. V `npm run dev` jde vyplnit všechna pole, přidat a odebrat účet i pásmo a chyby se ukazují u správných polí.

## Mimo rozsah

Zobrazení výsledků (krok 07). Zatím stačí pod formulářem vypsat `ranking` a čisté jmění scénářů jako text.

## Commit

`Přidat formulář vstupů`

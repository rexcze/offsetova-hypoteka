# Kalkulačka offsetové hypotéky

Veřejná webová kalkulačka. Porovná offsetovou hypotéku s klasickou hypotékou, se spořicími účty a s mimořádnými splátkami a ukáže, co se domácnosti vyplatí víc.

## Rozhodnutí (neměnit bez uživatele)

- **Hosting:** jen GitHub Pages. Statická aplikace, žádný server, žádné API.
- **Soukromí:** žádná data neopouštějí prohlížeč. Žádné cookies, analytika ani externí požadavky za běhu (fonty a knihovny jsou součástí buildu).
- **Bez předvoleb bank:** uživatel zadává sazby a podmínky sám.
- **Čistě veřejný nástroj:** žádné formuláře pro poptávku ani affiliate odkazy.

## Kde co je

- [docs/specifikace.md](docs/specifikace.md): přesná pravidla výpočtu, jediný zdroj pravdy.
- [reference/model.py](reference/model.py) a [reference/golden.json](reference/golden.json): referenční model a kontrolní čísla. TypeScriptové jádro je musí reprodukovat na 0,01 Kč.
- [docs/plan/README.md](docs/plan/README.md): plán implementace po krocích se zaškrtávacím seznamem.
- [LESSONS.md](LESSONS.md): poučení z dosavadní práce. Přečti ho před prací a doplňuj ho průběžně.

## Pravidla pro kód

- `src/engine/` je čistý TypeScript bez Reactu a DOM. Výpočet nic nezaokrouhluje, zaokrouhluje se až při zobrazení.
- Částky jsou v Kč jako `number`, sazby jako desetinná čísla p. a. (`0.0489`). Převod z procent a let dělá jen UI.
- Všechny scénáře dostávají každý měsíc stejný rozpočet. Bez toho je srovnání zkreslené (viz LESSONS.md).
- Změna výpočtu = nejdřív specifikace a `reference/model.py`, pak přegenerovat `reference/golden.json` (`python3 reference/model.py > reference/golden.json`) a teprve potom TypeScript. Vše ve stejném commitu. Golden data nikdy neupravuj ručně ani tak, aby seděla na kód.
- Identifikátory a komentáře v kódu anglicky. Texty v UI česky.
- Nové závislosti jen s důvodem. Projekt má zůstat malý.

## Příkazy

- `npm run dev`: vývojový server
- `npm run check`: typecheck, lint, testy, build (musí projít před každým commitem)
- `python3 reference/model.py > reference/golden.json`: přegenerování golden dat

## Git

- Commit po každém kroku plánu, zprávy česky v rozkazovacím způsobu („Přidat …“, „Opravit …“).
- Nepushuj a neměň nastavení repa (Pages, oprávnění) bez výslovného souhlasu uživatele.
- **Dokončený krok vždy označ jako hotový, ve stejném commitu:** zaškrtni jeho úkoly v souboru kroku (`- [x]`) a krok v `docs/plan/README.md`. Dokument je pro další sezení jediný zdroj pravdy o tom, co je hotové. Krok, který nesplníš celý, nezaškrtávej a napiš do něj, co zbývá.
- Poučení patří do LESSONS.md ve stejném commitu jako změna, která ho přinesla.

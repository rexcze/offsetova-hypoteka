# Plán implementace

Kalkulačka offsetové hypotéky, která porovná offset s klasickou hypotékou, se spořicími účty i s mimořádnými splátkami. Běží jen v prohlížeči a je hostovaná na GitHub Pages.

## Jak podle plánu pracovat

1. Na začátku práce si přečti [CLAUDE.md](../../CLAUDE.md), [LESSONS.md](../../LESSONS.md) a [specifikaci](../specifikace.md).
2. Kroky dělej **po pořadí**. Každý krok má cíl, úkoly, podmínky dokončení a co do něj nepatří. Nic nad rámec kroku nepřidávej.
3. Krok je hotový, až projdou všechny jeho podmínky dokončení a `npm run check`. Ten skript zavede krok 01.
4. Každý krok ukonči commitem (nebo několika menšími). Ve stejném commitu zaškrtni úkoly v souboru kroku i krok v tomto souboru. Nedokončené úkoly nech nezaškrtnuté a popiš, co zbývá.
5. **Nepushuj**, dokud o to uživatel nepožádá. Výjimkou je krok 02, kde push a zapnutí GitHub Pages proveď až po výslovném souhlasu uživatele.
6. Když golden test nesedí, chyba je skoro jistě v TypeScriptu. Golden data neupravuj. Pokud jsi přesvědčený, že chyba je ve specifikaci, zastav se a zeptej se uživatele.
7. Narazíš-li na něco, co stálo čas nebo překvapilo, zapiš to do LESSONS.md (pravidla zápisu jsou v souboru).

## Kroky MVP

- [x] [01 – Kostra projektu](01-kostra-projektu.md)
- [x] [02 – Nasazení na GitHub Pages](02-nasazeni-github-pages.md)
- [x] [03 – Jádro: typy, validace a pomocné funkce](03-jadro-typy-a-pomocne-funkce.md)
- [x] [04 – Jádro: měsíční simulace](04-jadro-simulace.md)
- [x] [05 – Jádro: analýza výsledků](05-jadro-analyza.md)
- [x] [06 – UI: formulář](06-ui-formular.md)
- [x] [07 – UI: výsledky a vysvětlení](07-ui-vysledky.md)
- [x] [08 – UI: grafy](08-ui-grafy.md)
- [x] [09 – UI: splátkový kalendář](09-ui-splatkovy-kalendar.md)
- [x] [10 – Sdílení odkazem](10-sdileni-odkazem.md)
- [x] [11 – Dokončení MVP](11-dokonceni-mvp.md)

## Kroky redesignu (po MVP)

Vizuální vzor je [náhled](../design/nahled.html), styl schválil uživatel. Stack: Tailwind CSS + shadcn/ui. Výpočty (`src/engine/`) se nemění.

- [x] [12 – Vizuální základ](12-redesign-vizualni-zaklad.md)
- [ ] [13 – Stav formuláře pro jednoduché zadávání](13-redesign-model-formulare.md)
- [ ] [14 – Nový formulář](14-redesign-formular.md)
- [ ] [15 – Nové výsledky](15-redesign-vysledky.md)
- [ ] [16 – Nové grafy](16-redesign-grafy.md)
- [ ] [17 – Dokončení redesignu](17-redesign-dokonceni.md)

Další verze jsou v [backlogu](backlog.md). Na ty se sahá až po dokončení MVP a se souhlasem uživatele.

## Struktura projektu (cílový stav)

```
src/
  engine/            # čistý TypeScript, žádný React ani DOM
    types.ts
    defaults.ts
    validate.ts
    annuity.ts
    savings.ts
    simulate.ts
    analysis.ts
    *.test.ts
  ui/
    format.ts        # formátování a parsování čísel v češtině
    form/            # formulář vstupů
    results/         # verdikt, tabulky, varování, vysvětlení
    charts/          # grafy
    share.ts         # stav v URL
  App.tsx
  main.tsx
  styles.css
reference/           # referenční model v Pythonu a golden data (neměnit bez specifikace)
docs/                # specifikace a tento plán
```

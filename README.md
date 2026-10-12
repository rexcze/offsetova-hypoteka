# Kalkulačka offsetové hypotéky

Veřejná webová kalkulačka, která porovná offsetovou hypotéku s klasickou hypotékou, se spořicími účty a s mimořádnými splátkami a ukáže, co se domácnosti k vybranému datu (horizontu) vyplatí nejvíc. Běží jen v prohlížeči, žádná data se neodesílají, nepoužívá cookies ani analytiku.

**Aplikace:** https://rexcze.github.io/offsetova-hypoteka/

Kalkulačka je orientační a nejde o finanční poradenství. Výchozí hodnoty jsou ilustrační, banky ani jejich sazby v ní předvyplněné nejsou.

## Co umí

- čtyři scénáře při stejném měsíčním odtoku peněz: A klasická hypotéka a peníze na běžném účtu, B offset, C klasická hypotéka a spořicí účty, D klasická hypotéka a mimořádné splátky;
- verdikt, srovnání čistého jmění, varování a vysvětlení, proč to tak vychází;
- graf výhody v čase, mřížku „od jakých úspor se offset vyplatí“ a podrobný průběh po letech a měsících;
- zobrazení v dnešních korunách;
- sdílení zadání odkazem (data jsou v části URL za `#`, na server se neposílají).

## Vývoj

Potřebujete Node.js 24.

```bash
npm install      # instalace závislostí
npm run dev      # vývojový server
npm test         # testy
npm run check    # typecheck, lint, testy a build (musí projít před commitem)
```

Každý push do `main` spustí kontroly a nasazení na GitHub Pages (`.github/workflows/ci.yml`).

## Jak je to postavené

- [docs/specifikace.md](docs/specifikace.md): přesná pravidla výpočtu, jediný zdroj pravdy.
- `src/engine/`: čisté TypeScriptové jádro (simulace, analýza, validace) bez Reactu a DOM.
- `src/ui/`: formulář, výsledky, grafy a sdílení odkazem.
- [reference/model.py](reference/model.py) a [reference/golden.json](reference/golden.json): referenční model v Pythonu a kontrolní čísla. TypeScriptové jádro je musí reprodukovat na 0,01 Kč.
- [docs/plan/README.md](docs/plan/README.md): plán implementace po krocích, [LESSONS.md](LESSONS.md): poučení z práce.

### Změna výpočtu

Nejdřív specifikace a `reference/model.py`, pak přegenerovat golden data a teprve potom TypeScript, vše v jednom commitu. Golden data se nikdy neupravují ručně.

```bash
python3 reference/model.py > reference/golden.json
```

## Ruční test

Automatické testy ověřují jádro i to, že UI zobrazí golden čísla. Ruční test v prohlížeči (`npm run dev`) zkontroluje celou cestu od formuláře:

1. Klikněte na „Obnovit výchozí hodnoty“. Případ **`zaklad`** je výchozí zadání. Verdikt: nejlépe vychází „Klasická hypotéka a mimořádné splátky“. Pořadí a čisté jmění po 5 letech: D −3 124 464 Kč, C −3 158 425 Kč, B −3 169 157 Kč, A −3 210 783 Kč.
2. Nastavte měsíční vklad 5 000 Kč. Případ **`pravidelne-sporeni`**: pořadí D −2 791 216 Kč, B −2 827 473 Kč, C −2 845 537 Kč, A −2 910 783 Kč.
3. Vraťte vklad na 5 000 Kč, nastavte roční navýšení vkladu 3 %, horizont 10 let a sazbu klasické hypotéky po fixaci 5,5 % (offset si doplní přirážku sám, tedy 5,8 %). Případ **`refixace`**: pořadí D −1 594 644 Kč, B −1 649 054 Kč, C −1 837 397 Kč, A −2 016 996 Kč.

Částky v tabulce „Srovnání scénářů“ (sloupec Čisté jmění) se musí shodovat na celé koruny a nesmí být zapnuté „Zobrazit v dnešních korunách“. Zdroj čísel je `reference/golden.json`.

## Soukromí

Všechno se počítá ve vašem prohlížeči. Aplikace nepoužívá cookies, analytiku ani externí požadavky za běhu. Odkaz pro sdílení obsahuje vaše zadání v části za `#`, kterou prohlížeč na server neposílá.

# 12 – Redesign: vizuální základ

## Cíl

Do projektu přijde Tailwind CSS a shadcn/ui s motivem podle [náhledu](../design/nahled.html). Aplikace dostane novou hlavičku a rozvržení. Formulář a výsledky zatím zůstávají ve starém vzhledu, přepisují se v krocích 14 až 16.

## Kontext

Redesign navazuje na hotové MVP (kroky 01–11). Vizuální vzor je [docs/design/nahled.html](../design/nahled.html): světlé karty na šedém pozadí, modrá jako hlavní barva, zaoblené rohy, jemné stíny, tmavý režim. Nic z toho nemění výpočty ani `src/engine/`.

## Úkoly

- [x] Přidej Tailwind CSS v4 s oficiálním pluginem pro Vite (`tailwindcss`, `@tailwindcss/vite`). Ověř aktuální postup v dokumentaci Tailwindu, nehádej.
- [x] Inicializuj shadcn/ui pro Vite + React + TypeScript (`components.json` napsaný ručně, aby CLI nepřepsalo CSS a nepřidalo fonty, alias `@/` na `src/` v `tsconfig.app.json` i `vite.config.ts`, pomocná funkce `cn` v `src/lib/utils.ts`). Komponenty se kopírují do `src/components/ui/`, takže projekt na nich nezávisí za běhu. Instalace potřebuje síť jen při přidávání komponent.
- [x] Přidej komponenty, které budou potřeba: `button`, `card`, `input`, `label`, `slider`, `select`, `checkbox`, `switch`, `accordion`, `tabs`, `tooltip`, `badge`, `alert`. Ostatní přidávej až v krocích, které je potřebují.
- [x] Motiv v `src/styles.css` jako CSS proměnné (barvy shadcn: `--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, `--ring`, `--radius`). Světlý a tmavý režim, tmavý přes třídu `dark` na `<html>`. Barvu primární modrou a neutrální šedou vezmi z náhledu (modrá 600 / šedá zinc).
- [x] Barvy scénářů jako proměnné `--scenario-a`, `--scenario-b`, `--scenario-c`, `--scenario-d` (A šedá, B modrá, C zelená, D fialová, jako v náhledu), ve světlém i tmavém režimu s dostatečným kontrastem. Používat je budou kroky 15 a 16.
- [x] Přepínač tmavého režimu v hlavičce: výchozí podle `prefers-color-scheme`, ruční volba se pamatuje v `localStorage` pod klíčem `theme` (jen volba režimu, nic jiného). Čtení i zápis obal `try/catch`, aplikace musí fungovat i bez úložiště. Nastavení třídy `dark` proveď před prvním vykreslením (malý skript v `index.html`), ať stránka nebliká.
- [x] Nová hlavička (název s ikonou, tlačítko „Zkopírovat odkaz“ přesunuté z `ShareLink`, přepínač režimu) a rozvržení stránky: na široké obrazovce dva sloupce (formulář 380 px, výsledky zbytek), na mobilu pod sebou, maximální šířka 72 rem, okraj aspoň 16 px.
- [x] Úvodní text přepiš do kratší podoby podle náhledu („Vyplatí se vám offsetová hypotéka, spořicí účet, nebo mimořádné splátky? …“).
- [x] Písmo systémové (žádné externí fonty), aby se za běhu nestahovalo nic zvenku.

## Testy

- Stávající testy musí projít beze změny.
- Test přepínače režimu (jsdom): kliknutí přidá/odebere třídu `dark` na `<html>` a nespadne, když `localStorage` vyhodí výjimku.

## Hotovo, když

`npm run check` projde. Aplikace se v `npm run dev` zobrazí s novou hlavičkou a pozadím v obou režimech, formulář a výsledky fungují jako dřív. V síťovém panelu prohlížeče nejsou žádné požadavky mimo vlastní doménu.

## Mimo rozsah

Přepis formuláře, výsledků a grafů (kroky 14–16). Smazání starého CSS (krok 17).

## Commit

`Přidat Tailwind a shadcn/ui, motiv a nové rozvržení`

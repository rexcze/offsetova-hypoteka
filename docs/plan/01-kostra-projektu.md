# 01 – Kostra projektu

## Cíl

Prázdná aplikace Vite + React + TypeScript, která se sestaví, otestuje a zobrazí nadpis. Žádná logika kalkulačky.

## Úkoly

- [x] Založ projekt Vite se šablonou `react-ts`. Repo **není prázdné** a `create-vite` by se v něm interaktivně ptal, jestli smazat existující soubory. Proto:
  1. vygeneruj šablonu do dočasné složky mimo repo (`npm create vite@latest <dočasná-složka> -- --template react-ts`);
  2. zkopíruj její obsah do kořene repa;
  3. `.gitignore` sluč s existujícím, nepřepisuj ho;
  4. zkontroluj, že `CLAUDE.md`, `LESSONS.md`, `docs/` a `reference/` zůstaly beze změny (`git status`).
- [x] TypeScript v režimu `strict`, navíc `noUncheckedIndexedAccess`.
- [x] Přidej Vitest (prostředí `node` pro `src/engine`, `jsdom` jen kde je potřeba pro UI) a `@vitest/coverage-v8` pro měření pokrytí.
- [x] Přidej ESLint (doporučená pravidla pro TS a React hooks) a Prettier (šířka řádku 110, jednoduché uvozovky).
- [x] Skripty v `package.json`:
  - `dev`, `build`, `preview`
  - `test` (`vitest run`), `test:watch`, `coverage` (`vitest run --coverage`)
  - `typecheck` (`tsc -b`). Kořenový `tsconfig.json` šablony je jen rozcestník na `tsconfig.app.json` a `tsconfig.node.json`, takže `tsc --noEmit -p .` by nic nezkontroloval. Ověř, že typecheck pokrývá i testy a že jde importovat `reference/golden.json` mimo `src` (`resolveJsonModule`, případně doplnit `include`).
  - `lint`
  - `check` = `typecheck && lint && test && build`
- [x] Ve `vite.config.ts` nastav `base: '/offsetova-hypoteka/'`. Repo je `rexcze/offsetova-hypoteka` a Pages poběží na podcestě.
- [x] `index.html`: `lang="cs"`, titulek „Kalkulačka offsetové hypotéky“, meta description, viewport.
- [x] `App.tsx` zobrazí jen nadpis a větu „Připravujeme“. Smaž ukázkový obsah Vite (logo, počítadlo, jejich CSS a obrázky).
- [x] `src/styles.css`: barvy jako CSS proměnné na `:root`, tmavý režim přes `prefers-color-scheme`, systémové písmo, explicitní pozadí `body`.
- [x] Do existujícího `.gitignore` (už obsahuje `__pycache__/`) přidej `node_modules`, `dist`, `coverage` a `.DS_Store`.
- [x] Jeden test `src/engine/smoke.test.ts` (`expect(1 + 1).toBe(2)`), ať `npm test` něco spouští. V kroku 03 ho smaž.
- [x] Do `README.md` napiš krátce, co projekt je, a příkazy `npm install`, `npm run dev`, `npm run check`.

## Hotovo, když

- `npm install && npm run check` projde bez chyb a varování.
- `npm run dev` ukáže stránku s nadpisem ve světlém i tmavém režimu.

## Mimo rozsah

UI knihovny komponent, Tailwind, router, správa stavu (Redux a podobně), analytika. Nic z toho projekt nepotřebuje.

## Commit

`Založit projekt Vite + React + TypeScript`

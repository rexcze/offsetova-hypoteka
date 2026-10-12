# 01 – Kostra projektu

## Cíl

Prázdná aplikace Vite + React + TypeScript, která se sestaví, otestuje a zobrazí nadpis. Žádná logika kalkulačky.

## Úkoly

- [ ] Založ projekt Vite se šablonou `react-ts` přímo v kořeni repa. Neruš existující soubory (`CLAUDE.md`, `LESSONS.md`, `docs/`, `reference/`).
- [ ] TypeScript v režimu `strict`, navíc `noUncheckedIndexedAccess`.
- [ ] Přidej Vitest (prostředí `node` pro `src/engine`, `jsdom` jen kde je potřeba pro UI).
- [ ] Přidej ESLint (doporučená pravidla pro TS a React hooks) a Prettier (šířka řádku 110, jednoduché uvozovky).
- [ ] Skripty v `package.json`:
  - `dev`, `build`, `preview`
  - `test` (`vitest run`), `test:watch`
  - `typecheck` (`tsc --noEmit -p .`)
  - `lint`
  - `check` = `typecheck && lint && test && build`
- [ ] Ve `vite.config.ts` nastav `base: '/offsetova-hypoteka/'`. Repo je `rexcze/offsetova-hypoteka` a Pages poběží na podcestě.
- [ ] `index.html`: `lang="cs"`, titulek „Kalkulačka offsetové hypotéky“, meta description, viewport.
- [ ] `App.tsx` zobrazí jen nadpis a větu „Připravujeme“. Smaž ukázkový obsah Vite (logo, počítadlo, jejich CSS a obrázky).
- [ ] `src/styles.css`: barvy jako CSS proměnné na `:root`, tmavý režim přes `prefers-color-scheme`, systémové písmo, explicitní pozadí `body`.
- [ ] Do `.gitignore` přidej `node_modules`, `dist`, `coverage` a `.DS_Store`.
- [ ] Jeden test `src/engine/smoke.test.ts` (`expect(1 + 1).toBe(2)`), ať `npm test` něco spouští. V kroku 03 ho smaž.
- [ ] Do `README.md` napiš krátce, co projekt je, a příkazy `npm install`, `npm run dev`, `npm run check`.

## Hotovo, když

- `npm install && npm run check` projde bez chyb a varování.
- `npm run dev` ukáže stránku s nadpisem ve světlém i tmavém režimu.

## Mimo rozsah

UI knihovny komponent, Tailwind, router, správa stavu (Redux a podobně), analytika. Nic z toho projekt nepotřebuje.

## Commit

`Založit projekt Vite + React + TypeScript`

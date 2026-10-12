# 17 – Redesign: dokončení

## Cíl

Starý vzhled zmizí, nový je ověřený a nasazený.

## Úkoly

- [x] Smaž nepoužívané styly ze `src/styles.css` (zbyde motiv, základ Tailwindu a případně pár vlastních pravidel). Smaž komponenty a třídy, které nahradil nový vzhled. Žádný mrtvý kód.
- [x] Projdi aplikaci ručně na šířkách 375, 768 a 1280 px v obou režimech: nic nepřetéká, texty se vejdou, fokus je vidět, kontrast aspoň 4,5:1.
- [x] Projdi aplikaci jen klávesnicí (formulář, sekce Upřesnit, přepínače, tabulky, odkaz).
- [x] Ověř velikost buildu (`npm run build`). Pokud JS po gzipu přesáhne 150 kB, najdi příčinu (nepoužívané komponenty, nevhodné importy) a napiš výsledek do commitu.
- [x] Znovu spusť ruční test z README proti golden případům (`zaklad`, `pravidelne-sporeni`, `refixace`) a ověř, že čísla zůstala stejná.
- [x] README: aktualizuj popis (Tailwind, shadcn/ui, kde je motiv, jak přidat komponentu). Do CLAUDE.md přidej do Rozhodnutí řádek o UI stacku.
- [x] `docs/design/nahled.html` nech jako historický vzor a v README ho jedním řádkem zmiň.
- [x] Zkontroluj, že aplikace za běhu nic nestahuje mimo vlastní doménu (síťový panel).
- [x] Zaškrtni kroky 12 až 17 v tomto plánu.

## Vyžaduje souhlas uživatele

Push do `main` a tím nasazení na GitHub Pages. Před pushem se zeptej a ukaž, co se změnilo.

## Hotovo, když

`npm run check` projde, ruční test sedí s golden daty a po souhlasu je nasazeno na GitHub Pages a stránka funguje (zkontroluj `gh run list` a načtení assetů z podcesty).

## Commit

`Dokončit redesign`

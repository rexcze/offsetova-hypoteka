# 16 – Redesign: grafy

## Cíl

Grafy ve stejném stylu jako zbytek stránky, bez změny jejich významu. Zůstávají vlastní SVG komponenty, žádná nová knihovna.

## Úkoly

- [ ] `AdvantageChart.tsx` a `LineChart.tsx`: barvy čar z `--scenario-b/c/d`, mřížka a popisky z `--border` a `--muted-foreground`, tlustší čáry (2,5 px) se zaoblenými konci, osa y v „tis. Kč“. Čáry se liší i stylem (plná, čárkovaná, tečkovaná), ne jen barvou.
- [ ] Graf je v kartě s nadpisem „Výhoda v čase“, přepínač „v dnešních korunách“ v záhlaví karty (sdílený stav s kroky 14–15).
- [ ] Legenda pod grafem jako řada štítků (barva + styl čáry + název). Tooltip s hodnotami všech čar zůstává. Svislé značky zlomu a konce fixace zůstávají.
- [ ] `BreakEvenGridView.tsx` v kartě s nadpisem „Od kolika úspor se offset vyplatí“ a krátkým popiskem pod ním. Barvy buněk jako CSS proměnné (offset vyhrává / vyhrává jiná varianta / neutrální) s dobrým kontrastem v obou režimech. Zvýrazněná buňka odpovídající aktuálním vstupům zůstává.
- [ ] Graf i mřížka se přizpůsobí šířce kontejneru (375 px bez vodorovného posouvání stránky). Mřížka se na úzké obrazovce posouvá vodorovně uvnitř vlastního kontejneru.
- [ ] Přístupnost: zůstávají `role="img"`, `aria-label` se shrnutím a sbalitelná tabulka s daty pod každým grafem (stávající).

## Testy

Stávající `charts.test.tsx` a `scale.test.ts` projdou. Přidej test, že legenda obsahuje všechny tři scénáře a že čáry mají navzájem různé styly.

## Hotovo, když

`npm run check` projde. Grafy jsou čitelné v obou režimech a na šířce 375 px.

## Commit

`Sjednotit vzhled grafů s novým motivem`

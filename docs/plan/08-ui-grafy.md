# 08 – UI: grafy

## Cíl

Dva grafy, které ukážou, jak se výhoda vyvíjí v čase a od jakých úspor se offset vyplatí.

## Úkoly

- [x] Knihovna: Recharts (nebo jiná lehká knihovna; zdůvodni v commitu). Mřížku bodu zvratu vykresli vlastním SVG.
- [x] **Graf „Výhoda proti klasice s penězi na běžném účtu“:**
  - čárový graf, osa x = roky (po měsících), osa y = Kč;
  - tři čáry B, C, D z `advantageOverA`;
  - svislé značky v měsících zlomu `crossovers(offsetVsBest)` s popiskem;
  - svislá čára konce fixace, pokud je horizont delší;
  - tooltip s hodnotami všech čar;
  - legenda;
  - reaguje na přepínač „v dnešních korunách“.
- [x] **Mřížka bodu zvratu:**
  - tabulka 11 × 11 buněk z `breakEvenGrid`; osa x = počáteční úspory, osa y = přirážka offsetu;
  - barva buňky: divergentní škála, jedna barva = offset vyhrává, druhá = vyhrává nejlepší alternativa, neutrální = kolem nuly;
  - buňka odpovídající aktuálním vstupům zvýrazněná;
  - tooltip s přesnou hodnotou;
  - popisek: „Kolik byste získali (nebo ztratili) offsetem proti nejlepší jiné variantě“.
- [x] Barvy přes CSS proměnné, čitelné ve světlém i tmavém režimu. Barvy scénářů A–D všude stejné (tabulka, grafy, legenda). Nespoléhej jen na barvu, čáry rozliš i stylem nebo popiskem.
- [x] Přístupnost:
  - grafy mají `role="img"` a `aria-label` se shrnutím;
  - pod každým grafem sbalitelná tabulka s daty.
- [x] Výkon: pokud `breakEvenGrid` trvá víc než 150 ms (viz krok 05), přesuň výpočet do Web Workeru. Stav načítání se zobrazí, jen když výpočet trvá déle.

## Hotovo, když

`npm run check` projde. Grafy fungují na mobilu (375 px) bez vodorovného posouvání stránky a v obou barevných režimech.

## Commit

`Přidat graf výhody v čase a mřížku bodu zvratu`

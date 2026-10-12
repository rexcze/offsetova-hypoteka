# 07 – UI: výsledky a vysvětlení

## Cíl

Uživatel na první pohled vidí, co vyhrává a o kolik, a rozumí proč.

## Úkoly

- [ ] **Verdikt** (karta nahoře):
  - „Za {horizont} let vychází nejlépe: {název scénáře}“;
  - rozdíl proti druhému v Kč;
  - věta o offsetu proti spořicím účtům, například „Offset je proti spořicím účtům lepší o 21 000 Kč“ nebo „horší o …“;
  - věta o zlomu, pokud existuje, například „Offset začne vyhrávat ve 3. roce (měsíc 30)“, z `crossovers(offsetVsBest)`.
- [ ] **Tabulka scénářů** (řádky A–D v pořadí `ranking`):
  - čisté jmění (nominální, nebo reálné podle přepínače);
  - zbývající dluh, likvidní peníze, zaplacené úroky, daňová vratka, čistý úrok ze spoření, poplatky;
  - splaceno (měsíc a rok, nebo „ne do horizontu“).

  Vítěz je zvýrazněný. U scénáře D je poznámka, že má k dispozici jen rezervu.
- [ ] **Varování:** texty pro všechny kódy z `warnings`. Například pro `OFFSET_SATURATED` „Od {měsíce} máte na offsetovém účtu víc, než banka započítá. Přebytek počítáme na spořicích účtech.“ Varování mají vizuálně odlišenou úroveň (upozornění / informace).
- [ ] **Panel „Proč to tak vychází“** z `marginalRates`:
  - „Každá koruna na offsetu vám ušetří {x} % ročně“;
  - „Na spořicím účtu vydělá {y} % po zdanění“;
  - „Mimořádná splátka ušetří {z} %“;
  - „Přirážka offsetu vás stojí asi {k} Kč ročně“.

  Přidej jednu větu o daňovém odpočtu, pokud je aktivní `DEDUCTION_REDUCED`.
- [ ] **Předpoklady:** sbalitelný seznam zjednodušení z oddílu 8 specifikace a upozornění „Kalkulačka je orientační a nejde o finanční poradenství. Podmínky offsetu ověřte u své banky.“
- [ ] Přepínač „v dnešních korunách“ se týká všech částek ve výsledcích (`toReal`). Nadpis to musí zřetelně říkat.

## Testy

Test komponenty: s výchozími vstupy verdikt jmenuje scénář D a tabulka má 4 řádky v pořadí D, C, B, A. To je pořadí z golden případu `zaklad`.

## Hotovo, když

`npm run check` projde. Výsledky jsou čitelné na šířce 375 px.

## Commit

`Zobrazit verdikt, srovnání scénářů a vysvětlení`

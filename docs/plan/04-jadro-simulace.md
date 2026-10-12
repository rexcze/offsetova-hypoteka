# 04 – Jádro: měsíční simulace

## Cíl

`simulate(inputs): SimulationResult` v `src/engine/simulate.ts`. Reprodukuje referenční model na 0,01 Kč a splňuje všechny invarianty. Tohle je nejdůležitější krok projektu.

## Kontext

[Specifikace](../specifikace.md), oddíly 4, 5 a 7. Referenční implementace je funkce `simulate` v [reference/model.py](../../reference/model.py). Kód přepisuj věrně krok za krokem včetně pořadí operací, jinak se rozejdou výsledky v plovoucí čárce.

## Úkoly

- [x] Implementuj `simulate` přesně podle oddílu 4.3. Doporučená struktura: stav scénáře jako objekt (`debt`, `liquid`, `rate`, `annuity`, součty, měsíce událostí, `rows`) a jedna smyčka přes měsíce, ve které se postupně zpracují všechny čtyři scénáře.
- [x] Na nic nevolej zaokrouhlování. Zaokrouhluje jen UI při zobrazení.
- [x] `ranking` podle `Math.round(netWorth * 100)` sestupně, při shodě pořadí A, B, C, D (stabilní řazení).
- [x] Jádro nevolá `validate`. Předpokládá validní vstup (validuje UI).

## Testy

- [x] **Golden testy** (`simulate.golden.test.ts`): pro každý případ v `reference/golden.json` porovnej:
  - `budgets[0]` s `budgetFirst` a poslední prvek s `budgetLast`;
  - `ranking`;
  - pro každý scénář všechna pole `summary` (čísla s tolerancí `tolerance`, `null` přesně);
  - `checkpoints` (měsíce jsou klíče, 1 = první řádek).

  Při selhání vypiš název případu, scénář a pole.
- [x] **Invarianty** (`simulate.invariants.test.ts`): všech 7 bodů z oddílu 7 specifikace. Invarianty 1 a 2 ověř na všech golden případech.
- [x] **Hraniční případy:**
  - horizont = splatnost (úvěr se splatí, po splacení jde celý rozpočet do likvidních peněz);
  - úspory > úvěr (B má nulový úrok od 1. měsíce, D má `payoffMonth = 0`);
  - fixace = splatnost (žádná refixace);
  - strop offsetu menší než úspory (`offsetSaturatedMonth = 1`);
  - režim `lowerPayment` u offsetu (jistina B sleduje splátkový kalendář).

## Hotovo, když

Všechny golden testy projdou s tolerancí ze souboru (0,01 Kč) a všechny invarianty jsou zelené. `npm run check` projde.

## Když golden test nesedí

1. Najdi první měsíc, kde se výsledek rozchází: dočasně porovnej `rows` s výstupem Python modelu (`python3 reference/model.py` a funkce `simulate` z něj).
2. Zkontroluj pořadí kroků (4.3 a–h), hlavně kdy se počítá `counted`, z jakého zůstatku se počítá úrok ze spoření a kdy se připisuje daňová vratka.
3. Golden data neměň. Pokud věříš, že chyba je ve specifikaci, zastav se a zeptej se uživatele.

## Mimo rozsah

Analýza, mřížka bodu zvratu a mezní sazby (krok 05).

## Commit

`Implementovat měsíční simulaci scénářů` (případně rozdělit na implementaci a testy)

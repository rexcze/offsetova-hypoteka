# 03 – Jádro: typy, validace a pomocné funkce

## Cíl

Základ výpočetního jádra v `src/engine/`: typy, výchozí vstupy, validace, anuita a úrok ze spoření. Všechno čisté funkce bez Reactu a DOM.

## Kontext

[Specifikace](../specifikace.md), oddíly 2 a 3. Referenční implementace jsou funkce `annuity` a `savings_interest_gross` v [reference/model.py](../../reference/model.py).

## Úkoly

- [ ] `types.ts`: typy `Inputs`, `SavingsAccount`, `ScenarioId`, `MonthRow`, `ScenarioSummary`, `SimulationResult` přesně podle specifikace (oddíly 2 a 5). Názvy polí musí odpovídat `reference/golden.json`.
- [ ] `defaults.ts`: `defaultInputs(): Inputs` podle oddílu 2.2. Musí odpovídat `input` golden případu `zaklad`, ověř to testem.
- [ ] `validate.ts`: `validate(inputs): ValidationError[]` podle oddílu 2.1, kde `ValidationError = { path: string; message: string }`. `path` je tečková cesta, např. `savings.accounts.0.tiers.1.upTo`. Zprávy česky a srozumitelně, např. „Hranice pásma musí být vyšší než u předchozího pásma.“
- [ ] `annuity.ts`: `annuity(principal, annualRate, months)` podle oddílu 3.1.
- [ ] `savings.ts`: `savingsInterestGross(amount, accounts, currentAccountRate)` podle oddílu 3.2. Navíc `marginalSavingsRate(amount, accounts, currentAccountRate)`: hrubá sazba slotu, kam by padla další koruna (použije se v kroku 05). Je to první slot v pořadí podle sazby, jehož kumulativní kapacita je **ostře větší** než `amount`, takže při částce přesně na hranici pásma se bere další slot.
- [ ] Smaž `smoke.test.ts` z kroku 01.

## Testy

- `annuity(4_000_000, 0.0489, 360)` ≈ 21 204,76 (na 0,01); nulová sazba = P/n; P ≤ 0 nebo n ≤ 0 = 0.
- Úrok ze spoření (počítáno ručně, měsíční hrubý úrok):
  - jeden účet 3,5 % do 300 000 a 2 % nad, částka 500 000 → (300 000·0,035 + 200 000·0,02)/12 = 1 208,33;
  - dva účty [4 % do 250 000, 0,5 % nad] a [5 % do 100 000, 3 % do 500 000, 1 % nad], běžný účet 0,1 %, částka 800 000 → sloty 5 % (100 000), 4 % (250 000), 3 % (400 000), 1 % (zbytek 50 000) → (5 000 + 10 000 + 12 000 + 500)/12 = 2 291,67;
  - částka ≤ 0 → 0; bez účtů → jen běžný účet.
- `marginalSavingsRate`: účet 3,5 % do 300 000 a 2 % nad; částka 299 999 → 0,035; 300 000 → 0,02; bez účtů → `currentAccountRate`.
- Validace:
  - výchozí vstupy nemají chyby;
  - každé pravidlo z oddílu 2.1 má aspoň jeden test, který ho poruší, a ověří `path`;
  - rostoucí sazba v rámci účtu je chyba.
- `defaultInputs()` se hluboce rovná `input` z golden případu `zaklad` (načti `reference/golden.json` v testu).

## Hotovo, když

`npm run check` projde. `npm run coverage` ukáže pro `src/engine` aspoň 95 % řádků.

## Mimo rozsah

Simulace (krok 04), formátování čísel pro UI (krok 06).

## Commit

`Přidat typy, validaci a pomocné funkce výpočtu`

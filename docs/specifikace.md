# Specifikace výpočtu

Jediný zdroj pravdy pro výpočetní jádro. Spustitelná podoba je v [reference/model.py](../reference/model.py) a kontrolní čísla v [reference/golden.json](../reference/golden.json). TypeScriptové jádro musí golden výsledky reprodukovat s přesností 0,01 Kč.

Pokud najdeš rozpor mezi specifikací, modelem a golden daty, **nepřizpůsobuj golden data kódu**. Zastav se a zeptej se uživatele. Opravu dělej ve specifikaci i v modelu ve stejném commitu a golden soubor přegeneruj: `python3 reference/model.py > reference/golden.json`.

## 1. Co kalkulačka porovnává

Domácnost si bere hypotéku a má úspory. Kalkulačka porovná, kde je na tom domácnost k jednomu datu (horizontu) nejlépe, když se stejnými penězi naloží různě.

| ID | Scénář (text v UI) | Kam jdou úspory |
|---|---|---|
| A | Klasická hypotéka, peníze na běžném účtu | Běžný účet se sazbou `currentAccountRate` (výchozí 0 %) |
| B | Offsetová hypotéka | Nejdřív na offsetový účet (neúročený, snižuje úročený dluh), co se do offsetu nezapočítá, na spořicí účty |
| C | Klasická hypotéka a spořicí účty | Spořicí účty podle pásem, zbytek na běžný účet |
| D | Klasická hypotéka a mimořádné splátky | Na začátku si půjčí méně, pak každý rok splácí vše nad rezervu. Rezerva leží na spořicích účtech |

Metrika je **čisté jmění** = všechny likvidní peníze scénáře − zbývající dluh. Vyhrává scénář s nejvyšším čistým jměním k horizontu.

Scénář D má méně likvidních peněz než ostatní (jen rezervu). UI to musí říct, protože právě dostupnost peněz je hlavní výhoda offsetu proti mimořádné splátce.

## 2. Vstupy

Peníze v Kč jako `number` bez zaokrouhlení. Sazby jako desetinná čísla p. a. (4,89 % = `0.0489`). Doby v celých letech. UI převádí procenta a roky, jádro pracuje jen s tímto tvarem.

```ts
export interface Inputs {
  loan: {
    principal: number;                // výše úvěru
    termYears: number;                // splatnost, 1–40
    fixationYears: number;            // délka fixace, 1–termYears
    classicRate: number;              // sazba klasické hypotéky
    offsetRate: number;               // sazba offsetové hypotéky (obvykle vyšší)
    rateAfterFixation: number | null; // klasická sazba po fixaci; offset = tato + (offsetRate − classicRate); null = beze změny
  };
  offset: {
    mode: 'shortenTerm' | 'lowerPayment'; // co dělá ušetřený úrok (viz 4.3)
    cap: number | null;                   // max. částka, kterou banka započítá; null = bez limitu
  };
  savings: {
    initial: number;              // úspory na začátku
    monthlyDeposit: number;       // pravidelný měsíční vklad
    depositGrowth: number;        // roční navýšení vkladu (např. o inflaci), 0.03 = 3 %
    currentAccountRate: number;   // sazba běžného účtu
    accounts: SavingsAccount[];   // 0–5 spořicích účtů
  };
  prepayment: {                   // jen scénář D
    reserve: number;              // rezerva, která se nikdy nesplácí
    initial: boolean;             // úspory nad rezervu sníží úvěr hned na začátku
    annual: boolean;              // průběžně splácet vše nad rezervu (k výročí a na konci fixace)
    freeAnnualShare: number;      // podíl PŮVODNÍ jistiny, který lze ročně splatit zdarma (0–1)
    feeRate: number;              // poplatek z části nad bezplatný limit (0.01 = 1 %)
    mode: 'shortenTerm' | 'lowerPayment';
  };
  tax: {
    savingsInterestTax: number;   // srážková daň z úroků, 0.15
    deductMortgageInterest: boolean; // uplatňuji odpočet úroků z hypotéky
    incomeTaxRate: number;        // 0.15 nebo 0.23
    deductionCap: number;         // 150 000 (smlouvy od 2021) nebo 300 000 (starší)
  };
  horizonYears: number;           // ke kterému roku porovnáváme, 1–termYears; výchozí = fixationYears
  inflation: number;              // jen pro přepočet do dnešních Kč, na pořadí nemá vliv
}

export interface SavingsAccount {
  name: string;
  tiers: { upTo: number | null; rate: number }[]; // kumulativní hranice; poslední může mít upTo = null
}
```

### 2.1 Validace

Jádro dostává jen validní vstupy. Validace vrací seznam chyb `{ path: string; message: string }` v češtině.

- `principal` > 0; `termYears` celé 1–40; `fixationYears` celé 1–`termYears`; `horizonYears` celé 1–`termYears`.
- Všechny sazby 0–0,25. `offsetRate` může být nižší než `classicRate` (jen upozornění, ne chyba).
- `cap` je `null` nebo > 0. Částky (`initial`, `monthlyDeposit`, `reserve`) ≥ 0.
- `freeAnnualShare` 0–1, `feeRate` 0–0,1, `depositGrowth` −0,1–0,2, `inflation` −0,05–0,3.
- Pásma účtu: aspoň jedno; `upTo` ostře rostoucí a kladné; `null` jen u posledního pásma; **sazby v rámci účtu nerostou** (vyšší zůstatek nesmí mít vyšší sazbu, jinak by hladové rozdělení nefungovalo).

### 2.2 Výchozí hodnoty v UI

Stejné jako golden případ `zaklad` (funkce `base_input()` v modelu): úvěr 4 000 000 Kč, 30 let, fixace 5 let, 4,89 % a offset 5,19 %, sazba po fixaci beze změny, offset `shortenTerm` bez limitu, úspory 300 000 Kč, vklad 0, jeden spořicí účet 3,5 % do 300 000 Kč a 2 % nad, běžný účet 0 %, rezerva 100 000 Kč, D: `initial` i `annual` zapnuto, bezplatný limit 0 %, poplatek 1 %, `shortenTerm`, daň z úroků 15 %, odpočet zapnut, 15 %, strop 150 000 Kč, horizont 5 let, inflace 2,5 %.

## 3. Pomocné funkce

### 3.1 Anuita

```
annuity(P, r, n) = 0                     pokud P ≤ 0 nebo n ≤ 0
                 = P / n                 pokud r = 0
                 = P·i / (1 − (1+i)^−n)  kde i = r/12
```

Kontrola: `annuity(4 000 000, 0.0489, 360)` = 21 204,76.

### 3.2 Úrok ze spoření (hladové rozdělení do pásem)

Předpoklad: uživatel každý měsíc přesune peníze tak, aby vynášely co nejvíc. Úrok se počítá z počátečního zůstatku měsíce a připisuje se měsíčně, takže se skládá.

1. Každé pásmo každého účtu je „slot“ s kapacitou `upTo − předchozí upTo` (nebo neomezenou) a sazbou.
2. Přidej slot běžného účtu s neomezenou kapacitou a sazbou `currentAccountRate`.
3. Seřaď sloty podle sazby sestupně a plň je částkou `amount`.
4. Hrubý měsíční úrok = Σ (část ve slotu × sazba / 12). Pro `amount` ≤ 0 je úrok 0.
5. Čistý úrok = hrubý × (1 − `savingsInterestTax`).

Scénář A nepoužívá spořicí účty, jen běžný účet: hrubý úrok = max(0, pool) × `currentAccountRate` / 12.

## 4. Měsíční simulace

Všechny scénáře se simulují **současně, měsíc po měsíci** (m = 1 … H, H = `horizonYears`·12), protože sdílejí měsíční rozpočet. Označení: n = `termYears`·12, F = `fixationYears`·12, P = `principal`, rc = `classicRate`, ro = `offsetRate`, přirážka = ro − rc.

### 4.1 Inicializace

- Každý scénář: `debt = P`, `liquid = savings.initial`, sazba ro pro B, jinak rc.
- Scénář D, pokud `prepayment.initial`: `a0 = min(P, max(0, initial − reserve))`; `debt −= a0`, `liquid −= a0`. Je to „půjčit si méně“, takže bez poplatku. Pokud dluh klesne na 0, `payoffMonth = 0`.
- Každý scénář: `annuity = annuity(debt, sazba, n)`.
- `budgetBase` = maximum `annuity` přes scénáře s dluhem > 0 (0, pokud žádný nemá dluh).

### 4.2 Pravidlo stejného rozpočtu (nejdůležitější invariant)

Každý měsíc dostane **každý scénář stejnou částku** `budget_m = budgetBase + deposit_m`, kde `deposit_m = monthlyDeposit · (1 + depositGrowth)^floor((m−1)/12)`. Scénář z ní zaplatí svou splátku a zbytek (i záporný) jde do jeho likvidních peněz. Bez tohoto pravidla vychází srovnání zkresleně (viz LESSONS.md).

### 4.3 Kroky v měsíci m

**Krok 1 – Refixace.** Pokud `m == F + 1` a `F < n`: nová klasická sazba = `rateAfterFixation ?? rc`, nová sazba B = nová klasická + přirážka. Každý scénář s dluhem > 0 přepočte `annuity = annuity(debt, nová sazba, n − F)`. Pokud má aspoň jeden scénář dluh, `budgetBase` = max těchto nových anuit.

**Krok 2 – Rozpočet.** Spočti `budget_m` podle 4.2 a ulož ho do pole `budgets`.

**Krok 3 – Pro každý scénář** (s počátečními hodnotami měsíce `debt0`, `liquid0`):

a) *Započtená částka (jen B).* Pokud `debt0 > 0` a `liquid0 > 0`: `capEff = cap == null ? debt0 : min(cap, debt0)`, `counted = min(liquid0, capEff)`. Pokud `liquid0 > capEff + 1e−6` a `offsetSaturatedMonth` ještě není nastaven, nastav ho na m. Jinak `counted = 0`.

b) *Úrok a jistina.* Pokud `debt0 > 0`:
- `interest = (debt0 − counted) · sazba / 12`
- `scheduled` = pro B v režimu `lowerPayment`: `annuity − debt0 · sazba / 12` (jistina podle splátkového kalendáře, úspora úroku snižuje splátku); jinak `annuity − interest` (splátka stejná, úspora úroku jde do jistiny a zkracuje splatnost).
- `principal = min(debt0, scheduled)`; pokud `debt0 − principal ≤ 1e−6`, pak `principal = debt0` a `payoffMonth = m`.
- `debt = debt0 − principal`.

Jinak `interest = principal = 0`. `payment = interest + principal`.

c) *Úrok ze spoření.* `pool = liquid0 − counted`. A: běžný účet (viz 3.2), B, C, D: hladové rozdělení přes `accounts`. `net` = čistý úrok. Offsetový účet sám se neúročí.

d) *Hotovost.* `liquid = liquid0 + budget_m − payment + net`. Přičti `interest` do `yearInterest` a do součtu `interestPaid`, `net` do `savingsInterestNet`.

e) *Konec smluvního roku* (`m % 12 == 0`): `refund = deductMortgageInterest ? min(yearInterest, deductionCap) · incomeTaxRate : 0`. `liquid += refund`, `taxRefund += refund`, `yearInterest = 0`. Zjednodušení: odpočet se počítá po smluvních letech a vratka přijde hned na konci roku.

f) *Mimořádná splátka (jen D, pokud `debt > 0` a `annual`).*
- *Konec fixace* (`m == F` a `F < n`): zdarma a bez limitu. `prepay = min(liquid − reserve, debt)`, pokud je kladná.
- *Jinak k výročí* (`annual` a `m % 12 == 0`): `avail = liquid − reserve`; pokud `avail > 0`: `free = freeAnnualShare · P`; `x = avail ≤ free ? avail : free + (avail − free) / (1 + feeRate)`; `prepay = min(x, debt)`; `fee = feeRate · max(0, prepay − free)`.
- `debt −= prepay`, `liquid −= prepay + fee`, `prepaymentFees += fee`. Pokud `debt ≤ 1e−6`: `debt = 0`, `payoffMonth = m`. Jinak v režimu `prepayment.mode == 'lowerPayment'`: `annuity = annuity(debt, sazba, n − m)`.

g) *Kontrola.* Pokud `liquid < −0.005` a `negativeLiquidMonth` není nastaven, nastav ho na m.

h) *Záznam řádku* `MonthRow` (viz 5).

### 4.4 Po splacení

Scénář bez dluhu má splátku 0 a celý rozpočet jde do likvidních peněz. U B se po splacení nic nezapočítává (`counted = 0`) a vše leží na spořicích účtech.

## 5. Výstupy jádra

```ts
export type ScenarioId = 'A' | 'B' | 'C' | 'D';

export interface MonthRow {
  month: number; budget: number; payment: number; interest: number; principal: number;
  prepayment: number; prepaymentFee: number; savingsInterestNet: number; taxRefund: number;
  counted: number; debt: number; liquid: number; netWorth: number; // netWorth = liquid − debt
}

export interface ScenarioSummary {
  netWorth: number; netWorthReal: number; // netWorthReal = netWorth / (1 + inflation)^(H/12)
  debt: number; liquid: number; interestPaid: number; taxRefund: number;
  savingsInterestNet: number; prepaymentFees: number;
  payoffMonth: number | null;           // měsíc splacení, 0 = hned na začátku, null = ne do horizontu
  offsetSaturatedMonth: number | null;  // jen B: první měsíc, kdy se část úspor do offsetu nevešla
  negativeLiquidMonth: number | null;   // první měsíc se zápornými likvidními penězi
}

export interface SimulationResult {
  budgets: number[];                    // budget_m pro m = 1 … H
  scenarios: Record<ScenarioId, { rows: MonthRow[]; summary: ScenarioSummary }>;
  ranking: ScenarioId[];                // podle Math.round(netWorth * 100) sestupně; při shodě pořadí A, B, C, D
}

export function simulate(inputs: Inputs): SimulationResult;
```

Struktura `reference/golden.json`: `{ tolerance, cases: [{ name, description, input, expected: { budgetFirst, budgetLast, ranking, scenarios: { A: { summary, checkpoints: { "1": {debt, liquid, netWorth, payment}, "12": …, "<H>": … } }, … } } }] }`.

## 6. Odvozené metriky (analýza pro UI)

Nejsou v golden datech, testují se ručně spočtenými příklady.

- **Výhoda v čase:** pro X ∈ {B, C, D} řada `netWorth_X,m − netWorth_A,m`. „O kolik jsem bohatší než s penězi na běžném účtu.“
- **Zlom:** obecná funkce `crossovers(diff: number[]): number[]` vrátí měsíce m, kde se znaménko `diff` změní proti poslednímu nenulovému znaménku. UI používá `B − max(A, C, D)` („offset proti nejlepší alternativě“) a `B − C` („offset proti spořicím účtům“).
- **Mřížka bodu zvratu:** osa x = počáteční úspory, 11 bodů od 0 do `max(2·initial, P/2)` zaokrouhleno na 10 000 Kč; osa y = přirážka offsetu 0–1 p. b. po 0,1. Hodnota = `netWorth_B − max(netWorth_A, netWorth_C, netWorth_D)` k horizontu, ostatní vstupy beze změny (`offsetRate = classicRate + přirážka`).
- **Mezní sazby („proč“)** pro první rok:
  - offset: `ro · (1 − incomeTaxRate)`, pokud se uplatňuje odpočet a úroky B za 1. rok ≤ `deductionCap`, jinak `ro`;
  - mimořádná splátka: totéž s rc a úroky D;
  - spořicí účet: sazba slotu, kam by padla další koruna z poolu scénáře C v měsíci 1, × (1 − daň z úroků);
  - cena přirážky za rok ≈ `(ro − rc) · max(0, P − min(initial, cap ?? ∞))`.
- **Varování** (kód + parametry, texty dělá UI):
  - `OFFSET_SATURATED`: u B je nastaven `offsetSaturatedMonth`;
  - `NEGATIVE_LIQUID`: některý scénář má `negativeLiquidMonth`;
  - `BEYOND_FIXATION_NO_RATE`: horizont > fixace a `rateAfterFixation == null`;
  - `D_LOWER_LIQUIDITY`: informace, kolik má D na konci k dispozici proti B;
  - `DEDUCTION_REDUCED`: odpočet zapnut a úroky B za 1. rok < `deductionCap` (offset snižuje daňový odpočet);
  - `NO_SAVINGS_ACCOUNTS`: žádný spořicí účet, C je pak stejné jako A;
  - `OFFSET_RATE_BELOW_CLASSIC`: `offsetRate < classicRate`.

## 7. Invarianty (povinné testy)

1. **Peněžní bilance:** pro každý řádek `liquid_m = liquid_{m−1} + budget − payment + savingsInterestNet + taxRefund − prepayment − prepaymentFee` (počáteční `liquid` u D po úvodní splátce).
2. **Stejný rozpočet:** `rows[m].budget` je ve všech scénářích stejný a rovná se `budgets[m]`.
3. Při `offsetRate == classicRate`, `initial = 0`, `monthlyDeposit = 0` a bez odpočtu daní jsou A a B v každém měsíci totožné.
4. Při nulové přirážce, nulových sazbách spoření a bez daní je B v každém měsíci aspoň tak dobré jako A.
5. Při `rateAfterFixation == null` se splátka scénáře A při refixaci nezmění.
6. Změna `inflation` nezmění `ranking`.
7. Výchozí vstupy nevyvolají `negativeLiquidMonth` v žádném scénáři.

## 8. Zjednodušení, která musí UI přiznat

- Mechanika offsetu se liší podle banky (co se započítává, strop, zda klesá splátka, nebo se zkracuje splatnost). Uživatel ji má ověřit u své banky.
- Úrok ze spoření z počátečního zůstatku měsíce, připsaný měsíčně. Pásmové úročení: nižší sazbou se úročí jen část nad hranicí.
- Peníze mezi spořicími účty se přesouvají optimálně každý měsíc.
- Odpočet úroků po smluvních letech, vratka hned na konci roku. Strop odpočtu je na domácnost.
- Poplatek za mimořádnou splátku je zjednodušený. Na konci fixace je splátka zdarma.
- Po refixaci se anuita přepočte na zbývající původní splatnost.
- Nezahrnuje poplatky za vedení účtů, pojištění ani jednorázové výdaje (viz backlog).
- Nejde o finanční poradenství.

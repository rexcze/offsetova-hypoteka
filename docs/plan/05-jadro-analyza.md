# 05 – Jádro: analýza výsledků

## Cíl

`src/engine/analysis.ts`: odvozené metriky, které UI zobrazí. Je to vrstva nad `simulate`, simulaci samotnou neupravuje.

## Kontext

[Specifikace](../specifikace.md), oddíl 6.

## Úkoly

- [ ] `advantageOverA(result): Record<'B' | 'C' | 'D', number[]>`: rozdíl čistého jmění proti A po měsících.
- [ ] `crossovers(diff: number[]): number[]`: měsíce (číslované od 1), kde se znaménko změní proti poslednímu nenulovému znaménku.
- [ ] `offsetVsBest(result): number[]`: `B − max(A, C, D)` po měsících; `offsetVsSavings(result)`: `B − C`.
- [ ] `breakEvenGrid(inputs): { savings: number[]; surcharges: number[]; values: number[][] }` podle oddílu 6. `values[iy][ix]` patří k `surcharges[iy]` a `savings[ix]`.
- [ ] `marginalRates(inputs, result)`: `{ offset, prepayment, savings, currentAccount, surchargeCostPerYear }` podle oddílu 6. Použij `marginalSavingsRate` z kroku 03.
- [ ] `warnings(inputs, result): Warning[]`, kde `Warning = { code: WarningCode; params: Record<string, number | string> }`, kódy podle oddílu 6. Texty nepatří sem, dělá je UI.
- [ ] `toReal(value, month, inflation)`: přepočet na dnešní Kč, `value / (1 + inflation)^(month/12)`.
- [ ] Změř `breakEvenGrid` pro horizont 30 let. Pokud trvá víc než 150 ms, zapiš to do LESSONS.md a v kroku 08 ho počítej ve Web Workeru. Jinak stačí `useMemo`.

## Testy

- `crossovers`:
  - `[−1, −1, 2, 3, −1]` → `[3, 5]`;
  - `[0, 0, 1]` → `[]` (od nuly to zlom není);
  - `[1, 0, −1]` → `[3]`.
- Golden případ `zaklad`: `offsetVsSavings` je v posledním měsíci záporný (C vyhrává) a odpovídá rozdílu ze `summary` B a C.
- `breakEvenGrid`: rozměry 11 × 11. Pro přirážku 0 a úspory 0 je hodnota rovna `netWorth_B − max(ostatní)` ze samostatně spuštěné `simulate`.
- `marginalRates` pro výchozí vstupy:
  - offset = 0,0519, protože úroky B za 1. rok jsou 190 310,54 Kč, tedy nad stropem 150 000;
  - mimořádná splátka = 0,0489, protože úroky D za 1. rok jsou 184 549,64 Kč, také nad stropem;
  - spořicí účet = 0,02 · 0,85 = 0,017: pool C je přesně 300 000, pásmo 3,5 % je plné a další koruna padne do pásma 2 %;
  - běžný účet = 0.
- `marginalRates` s úvěrem 1 500 000 Kč (golden případ `maly-uver-strop-offsetu`): úroky jsou pod stropem, takže offset = sazba B · 0,85.
- `warnings`: každý kód má test, který ho vyvolá, a výchozí vstupy nevyvolají `NEGATIVE_LIQUID`.

## Hotovo, když

`npm run check` projde.

## Commit

`Přidat analýzu výsledků: zlomy, bod zvratu, mezní sazby, varování`

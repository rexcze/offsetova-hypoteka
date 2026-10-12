# 13 – Redesign: stav formuláře pro jednoduché zadávání

## Cíl

Stav formuláře (`src/ui/form/state.ts`) podporuje jednoduché zadávání: sazbu offsetu stačí zadat jen tehdy, když se liší, a spořicí účet se dá nastavit jednou sazbou. Žádný vzhled se nemění a `src/engine/` se nemění.

## Kontext

Uživatel nechce počítat přirážku. Zadá sazbu hypotéky, a jen když banka nabízí u offsetu jinou, zadá celou sazbu offsetu tak, jak ji řekla banka. Přirážku (rozdíl) dopočítává aplikace.

## Úkoly

- [x] Do `FormState` přidej `offsetRateDiffers: boolean`.
  - Počáteční hodnota: `inputs.loan.offsetRate !== inputs.loan.classicRate`. Platí pro výchozí hodnoty i pro načtený odkaz.
  - Dokud je `false`, každá změna `loan.classicRate` nastaví i `loan.offsetRate` na stejnou hodnotu (v `inputs` i v `lastValid`).
  - Zapnutí (`true`) ponechá aktuální `offsetRate`. Vypnutí nastaví `offsetRate = classicRate`.
  - Nová akce `{ type: 'offsetRateDiffers'; value: boolean }`.
- [x] Pomocná funkce `surchargePoints(inputs): number` v `src/ui/` (rozdíl `offsetRate − classicRate` v procentních bodech, zaokrouhlený na 2 desetinná místa) pro štítek „+0,30 p. b.“. Záporná hodnota je povolená (štítek ukáže „−0,10 p. b.“).
- [x] Akce `{ type: 'simpleSavingsRate'; rate: number }` pro jednoduchý spořicí účet:
  - existuje-li aspoň jeden účet, nastaví sazbu **prvního pásma prvního účtu**;
  - neexistuje-li žádný, vytvoří účet „Spořicí účet“ s jedním pásmem bez hranice (`upTo: null`) a touto sazbou;
  - sazbu ostatních pásem nemění. Pokud nová sazba vyšší než sazba druhého pásma poruší pravidlo „sazby nerostou“, validace to ukáže a výsledky zůstanou z posledních platných vstupů.
- [x] Selektor `simpleSavingsRate(inputs): { rate: number | null; hasMoreTiers: boolean }`, ze kterého UI pozná, jestli má u jednoduchého pole ukázat poznámku „Z části úspor nad hranicí platí nižší sazba, viz Upřesnit“.
- [x] Akce `{ type: 'example' }`: nastaví výchozí hodnoty (`defaultInputs()`) a `offsetRateDiffers` podle nich. Je to „Vyzkoušet na příkladu“. Na rozdíl od `reset` nemaže `showReal`.
- [x] Odkaz (`share.ts`) se **nemění**: v odkazu zůstávají plné `Inputs`, `offsetRateDiffers` se odvozuje při načtení.

## Testy

- Změna `classicRate` při `offsetRateDiffers: false` přenese sazbu do `offsetRate`; při `true` ne.
- Zapnutí a vypnutí zaškrtávátka nastaví správné hodnoty.
- Načtení odkazu s rozdílnými sazbami dá `offsetRateDiffers: true`, s shodnými `false`.
- `surchargePoints`: 0,0519 − 0,0489 → 0,30; záporný případ.
- `simpleSavingsRate` upraví jen první pásmo; bez účtů vytvoří účet; `hasMoreTiers` je správně.
- `golden.ui.test.tsx` a ostatní stávající testy projdou.

## Hotovo, když

`npm run check` projde.

## Mimo rozsah

Žádné nové komponenty ani vzhled (krok 14).

## Commit

`Přidat do stavu formuláře odvozenou sazbu offsetu a jednoduchý spořicí účet`

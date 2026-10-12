# 15 – Redesign: výsledky

## Cíl

Výsledky podle [náhledu](../design/nahled.html): velký verdikt, čtyři karty scénářů a vysvětlení. Podrobné tabulky jsou níž, sbalené.

## Kontext

Logika zůstává v `src/ui/results/Results.tsx` a `warningText.ts` (texty verdiktu, varování a vysvětlení). Mění se jen podoba.

## Úkoly

- [x] **Verdikt** (karta s jemným modrým přechodem): popisek „Za {horizont} let vychází nejlépe“, název vítěze jako nadpis, pod ním věta s rozdílem proti druhému a věta o offsetu proti spořicím účtům i věta o zlomu (stávající texty).
- [x] **Čtyři karty scénářů** v pořadí podle `ranking`: barevná tečka scénáře (`--scenario-*`), pořadí („1. místo“), název, výhoda proti penězům na běžném účtu v Kč (velké číslo se znaménkem), vedlejší popisek a štítek dostupnosti peněz („K dispozici jen {rezerva} Kč rezerva“ u D, „Peníze zůstávají k dispozici“ u ostatních). Vítěz má zvýrazněný rámeček. Scénář A je „Peníze na běžném účtu“ a má 0 Kč.
- [x] Čísla ve verdiktu a kartách se řídí přepínačem „v dnešních korunách“ (`toReal`), jeho umístění přesuň do záhlaví karet.
- [x] **Varování** přes shadcn `Alert`, odlišená úroveň (upozornění / informace) barvou a ikonou, ne jen barvou.
- [x] **Vysvětlení „Proč to tak vychází“** jako karta se třemi až čtyřmi větami (stávající `marginalRates`) a větou o odpočtu, když je aktivní `DEDUCTION_REDUCED`.
- [x] **Podrobnosti** pod grafy v `Accordion`: „Srovnání v tabulce“ (stávající tabulka scénářů), „Podrobný průběh“ (stávající kalendář), „Předpoklady a omezení“. Výchozí stav sbalený.
- [x] Na mobilu je pod hlavičkou **lepivý souhrnný pruh** s vítězem a rozdílem (jedna řádka), aby při úpravě posuvníků bylo vidět, co se děje. Zmizí, když je verdikt na obrazovce.
- [x] Při neplatném formuláři zůstanou výsledky z posledních platných vstupů a nad nimi je upozornění (stávající chování).
- [x] Žádná čísla v kartách nejsou zaokrouhlená jinak než dosud, zaokrouhluje jen formátování.

## Testy

- Stávající `Results.test.tsx` a `golden.ui.test.tsx` uprav na novou strukturu, ale zachovej, co ověřují (verdikt pro výchozí vstupy jmenuje scénář D, pořadí D, C, B, A).
- Karty mají správné pořadí a vítěz je označen.
- Lepivý pruh se zobrazí jen na úzké obrazovce (ověř přes třídy, ne přes měření).

## Hotovo, když

`npm run check` projde. Výsledky jsou čitelné na šířce 375 px, ve světlém i tmavém režimu.

## Mimo rozsah

Grafy (krok 16).

## Commit

`Přepsat výsledky: verdikt, karty scénářů a vysvětlení`

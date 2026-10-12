# 14 – Redesign: nový formulář

## Cíl

Formulář podle [náhledu](../design/nahled.html): šest základních údajů s posuvníky a sbalené sekce „Upřesnit“. Zabere méně místa a nevyžaduje odborné znalosti.

## Kontext

Navazuje na kroky 12 (komponenty a motiv) a 13 (stav formuláře). Stávající `InputForm.tsx` a `fields.tsx` přepiš, texty a jména polí drž v češtině podle tabulky níže.

## Pojmy v UI (jednoduchá čeština)

| Pole | Text v UI | Nápověda |
|---|---|---|
| `loan.principal` | Výše úvěru | |
| `loan.classicRate` | Úroková sazba hypotéky | Roční sazba z vaší smlouvy nebo nabídky. |
| `offsetRateDiffers` | Banka nabízí u offsetu jinou sazbu | Jinak počítáme se stejnou sazbou jako u klasické hypotéky. |
| `loan.offsetRate` | Úroková sazba offsetové hypotéky | Celá sazba, jak ji uvádí banka. Štítek ukazuje rozdíl proti klasické (+0,30 p. b.). |
| `savings.initial` | Kolik máte úspor | |
| `savings.monthlyDeposit` | Kolik měsíčně spoříte | Částka, kterou každý měsíc odložíte. |
| jednoduchý spořicí účet | Úrok vašeho spořicího účtu | Roční úrok před zdaněním. |
| `loan.fixationYears` | Fixace | Na jak dlouho je sazba pevná. |
| `horizonYears` | Porovnat za | Za kolik let se výsledky porovnávají. |

## Úkoly

- [x] Komponenta `SliderField` (shadcn `Slider` + `Input`): popisek vlevo, hodnota vpravo, posuvník pod nimi, k tomu políčko pro přesné číslo. Posuvník i políčko upravují tutéž hodnotu. Políčko přijímá českou notaci (`parseNumber`), neplatný zápis ukáže chybu u pole (`aria-invalid`, `aria-describedby`). Rozsahy posuvníků: úvěr 500 000 – 12 000 000 (krok 100 000), sazby 0 – 10 % (krok 0,01 p. b.), úspory 0 – 4 000 000 (krok 50 000), spoření 0 – 50 000 (krok 500). Hodnota mimo rozsah posuvníku, zadaná do políčka, je povolená (posuvník se zastaví na kraji).
- [x] Karta „Základní údaje“ se šesti položkami z tabulky, zaškrtávátko „Banka nabízí u offsetu jinou sazbu“ s polem sazby a štítkem rozdílu, dvojicí výběrů Fixace (1, 2, 3, 5, 7, 10 let) a Porovnat za (1 až splatnost, výběr po letech). Horizont následuje fixaci, dokud ho uživatel neupraví (stávající chování `horizonTouched`).
- [x] Odkaz „Vyzkoušet na příkladu“ v záhlaví karty (akce `example`), tlačítko „Obnovit výchozí hodnoty“ dole.
- [x] Sbalené sekce `Accordion` pod kartou, každá přesune stávající pole:
  - **Upřesnit hypotéku a offset:** splatnost, sazba po fixaci (prázdné = beze změny), strop započtených úspor, co dělá ušetřený úrok;
  - **Upřesnit spoření:** roční navýšení vkladu (s tlačítkem „= inflace“), sazba běžného účtu, seznam spořicích účtů s pásmy (přidat, odebrat);
  - **Upřesnit mimořádné splátky:** rezerva, snížit úvěr hned na začátku, splácet průběžně, bezplatný limit, poplatek, co dělá splátka;
  - **Upřesnit daně a inflaci:** daň z úroků, uplatňuji odpočet úroků, sazba daně z příjmu, strop odpočtu, inflace.
  
  Ve stávajícím formuláři zůstávají všechna pole, jen jinde. Sekce, ve které je chyba validace, se po chybě sama rozbalí.
- [x] Nápovědy jako popis pod polem (`text-muted-foreground`), tedy i na dotykových zařízeních. Samostatný `Tooltip` jsem nepoužil, protože by jen opakoval text pod polem. Na dotykových zařízeních nesmí být obsah jen v tooltipu: stejný text je pod polem nebo v rozbalovací části.
- [x] U jednoduchého spořicího účtu (selektor z kroku 13) ukaž poznámku, když `hasMoreTiers`.
- [x] Všechna pole mají `<label>`, jdou ovládat klávesnicí (včetně posuvníků šipkami) a mají viditelný fokus.
- [x] Na mobilu je formulář pod výsledky nebo nad nimi podle pořadí v kroku 12. Posuvníky mají dost velkou plochu pro prst (aspoň 44 px výška ovládacího prvku).

## Testy

Uprav stávající testy formuláře (`InputForm.test.tsx`) na nové ovládání a přidej:
- změna sazby hypotéky přenese hodnotu do sazby offsetu, dokud není zaškrtnuté „jinou sazbu“; po zaškrtnutí ne;
- zadání „5,19“ do pole sazby offsetu ukáže štítek „+0,30 p. b.“;
- posuvník i políčko drží stejnou hodnotu, neplatný text ukáže chybu a nezablokuje výsledky;
- sekce „Upřesnit“ se při chybě v jejím poli rozbalí;
- „Vyzkoušet na příkladu“ nastaví výchozí hodnoty.

## Hotovo, když

`npm run check` projde. Všechna pole ze starého formuláře jsou dosažitelná. Formulář je použitelný na šířce 375 px bez vodorovného posouvání.

## Mimo rozsah

Výsledky a grafy (kroky 15, 16).

## Commit

`Přepsat formulář: základní údaje s posuvníky a sekce Upřesnit`

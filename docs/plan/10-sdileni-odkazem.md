# 10 – Sdílení odkazem

## Cíl

Nastavení kalkulačky jde sdílet odkazem. Data zůstávají v části URL za `#`, kterou prohlížeč neposílá na server.

## Úkoly

- [x] `src/ui/share.ts`:
  - `encodeInputs(inputs): string` a `decodeInputs(hash): Inputs | null`;
  - formát s verzí, např. `#v1=` + kompaktní JSON zakódovaný přes `encodeURIComponent` nebo base64url;
  - neznámá verze nebo poškozená data → `null` a aplikace použije výchozí hodnoty;
  - dekódovaný vstup musí projít `validate`, jinak výchozí hodnoty a nenápadná hláška.
- [x] Při načtení stránky se vstupy vezmou z hashe, pokud tam jsou.
- [x] Při změně vstupů se hash aktualizuje přes `history.replaceState`, ne `pushState`, aby se nezaplnila historie. Aktualizace s debounce kolem 300 ms.
- [x] Tlačítko „Zkopírovat odkaz“ (Clipboard API, se záložním řešením a potvrzením „Zkopírováno“).
- [x] Do UI krátká věta: „Odkaz obsahuje vaše zadání. Nikam ho neodesíláme, sdílíte ho jen vy.“
- [x] Žádný `localStorage` pro vstupy. Stav nese jen URL, aby bylo chování předvídatelné.

## Testy

- `decodeInputs(encodeInputs(x))` se rovná `x` pro výchozí vstupy i pro všechny golden vstupy.
- Poškozený hash → `null`.

## Hotovo, když

`npm run check` projde. Odkaz zkopírovaný v jednom okně otevře v novém okně stejné výsledky.

## Commit

`Umožnit sdílení nastavení odkazem`

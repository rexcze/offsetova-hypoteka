# Poučení z projektu

Co se pokazilo nebo nás překvapilo a co s tím dělat. Pravidla patří do CLAUDE.md, tady jsou důvody za nimi.

## Model výpočtu

**Scénáře se dají srovnávat jen při stejném měsíčním odtoku peněz.**
V prvním prototypu měla offsetová hypotéka (sazba o 0,30 p. b. vyšší) splátku o 735 Kč měsíčně vyšší než klasická. Srovnání čistého jmění tak nadsadilo výhodu offsetu: u úspor 300 tis. Kč a horizontu 10 let to vyšlo zhruba o 117 tis. Kč, při stejném odtoku jen o 21 tis. Kč. Na horizontu 1 a 5 let navíc vyhrál spořicí účet.
Co dělat: každý scénář platí měsíčně stejnou částku. Rozdíl proti vlastní splátce jde do úspor daného scénáře. Hlídat to testem invariantu.

**Pravidelné spoření otočí výsledek, takže patří do první verze.**
Při počátečních úsporách 300 tis. Kč a horizontu 5 let vyhrál bez vkladů spořicí účet zhruba o 11 tis. Kč. S vkladem 5 tis. Kč měsíčně vyhrál offset o 18 tis. Kč (golden případ `pravidelne-sporeni`), s vkladem 15 tis. Kč v prototypu o 72 tis. Kč. Výhoda offsetu roste s výší zůstatku, kdežto přirážka se platí z celého úvěru.
Co dělat: měsíční vklad je základní vstup MVP. Hlídat, kdy zůstatek na offsetu překročí dluh nebo strop zápočtu.

**Některé scénáře vycházejí přesně stejně, pořadí proto určují haléře.**
Když úspory převýší úvěr, mají offset (B) i mimořádná splátka (D) stejné čisté jmění. Bez spořicích účtů platí totéž pro A a C. Řazení podle surového `number` pak rozhoduje šum v plovoucí čárce a Python a JavaScript mohou seřadit jinak.
Co dělat: řadit podle `Math.round(netWorth * 100)` se stabilním pořadím A, B, C, D při shodě. Model i specifikace to tak mají.

## Data o trhu

**Údaje o sazbách a bankách na srovnávačích jsou nekonzistentní a zastaralé.**
Dvě podstránky jednoho srovnávače uváděly pro stejný úvěr různé sazby (4,69 % a 4,84 %). Nejnovější nalezený seznam bank s offsetovou hypotékou byl z roku 2017.
Co dělat: kalkulačka nemá předvolby bank (rozhodnutí uživatele). Výchozí hodnoty ve formuláři jsou jen ilustrační a UI to říká. Fakta o pravidlech (daně, poplatky) ověřovat a v textech uvádět, že se mohou změnit.

## Nástroje

**Prettier přeformátoval dokumenty a referenční data.**
První `prettier --write .` přepsal Markdown ve `docs/` a `reference/golden.json`, které se nesmějí měnit mimo specifikaci. Šablona Vite navíc nově dodává oxlint místo ESLintu, plán ale počítá s ESLintem.
Co dělat: `.prettierignore` vylučuje `docs`, `reference` a `*.md`. Při zakládání projektu porovnat výchozí nástroje šablony s plánem.

**Záporné likvidní peníze se z platných vstupů vyvolat nedají.**
Rozpočet je každý měsíc aspoň tak velký jako největší splátka, rezerva scénáře D se nesplácí a úvodní splátka D nepřesáhne úspory nad rezervou. Pokus vyrobit `NEGATIVE_LIQUID` vstupem (nulové úspory, vysoká sazba po fixaci, nulová rezerva) selhal, kontrola `negativeLiquidMonth` slouží jako pojistka.
Co dělat: varování testovat na upraveném výsledku simulace, ne hledáním vstupu. Pokud se v budoucnu přidají výdaje nebo poplatky (backlog), tohle znovu ověřit.

**Prettier přepisuje escapy `\u00a0` na skutečné nezlomitelné mezery, ESLint je pak odmítne.**
Po `prettier --write` hlásil `no-irregular-whitespace` chyby v `format.ts` a v jeho testu, kde byly původně zápisy `\u00a0` a `\u202f` v regulárním výrazu.
Co dělat: po formátování zkontrolovat `npm run lint`; pokud se to stane, escapy vrátit. Nezlomitelné mezery v kódu psát vždy jako escape.

**Mřížka bodu zvratu má pro výchozí vstupy hrubý krok, nejbližší buňka je jen přibližná.**
Osa úspor jde od 0 do max(2 · úspory, úvěr / 2), u výchozích vstupů tedy do 2 000 000 Kč s krokem 200 000 Kč. Úspory 300 000 Kč leží přesně mezi dvěma sloupci a zvýrazní se ten vyšší. Zvýraznění proto říká „nejblíž vašemu zadání“ a přesná čísla jsou v textu pod mřížkou.
Co dělat: kdyby se mřížka měla zpřesnit, měnit osu ve specifikaci (oddíl 6), ne v UI.

**Skrytý panel prohlížeče zpomaluje `requestAnimationFrame` na 1 s, takže měření odezvy UI s ním lže.**
Při měření odezvy formuláře při horizontu 30 let vycházelo 1000 ms na změnu. Stránka měla `visibilityState: hidden` a prohlížeč omezil snímky. Přes `MessageChannel` vyšlo 16 až 32 ms a žádný dlouhý úkol.
Co dělat: odezvu měřit bez `requestAnimationFrame` (zpráva přes `MessageChannel`, `PerformanceObserver` pro dlouhé úkoly) a před závěrem zkontrolovat `document.visibilityState`.

**Kontrast textu v nejsytějších buňkách mřížky nestačil, přitom nikdo na první pohled nic nepoznal.**
Výpočet kontrastu ukázal 4,25:1 ve světlém a 2,5:1 v tmavém režimu pro text na buňkách s 85% sytostí. Po omezení sytosti na 55 % je to nejméně 4,7:1.
Co dělat: u barev s proměnnou sytostí kontrast spočítat (skriptem), ne odhadovat okem. Vite šablona také dodala výchozí favicon, který je potřeba vyměnit.

**Příkaz `shadcn add` napsal do komponent import z cizího npm balíčku `cn` místo z vlastního `src/lib/utils.ts`.**
Po ručně napsaném `components.json` CLI do všech 13 komponent vložilo `import { cn } from "cn"` a přidalo do `package.json` závislost `cn`, což je nesouvisející balíček. TypeScript to přijal, protože balíček existuje.
Co dělat: po `shadcn add` projít `git diff package.json` i importy v `src/components/ui/`, špatný balíček odinstalovat a importy přepsat na `@/lib/utils`. Ověřit i ostatní nově přidané závislosti.

**Starý CSS a Tailwind spolu nejdou bez kaskádových vrstev a přejmenování proměnných.**
Starý `styles.css` používal `--muted` a `--accent` jako barvy textu, shadcn je používá jako světlé pozadí. Nevrstvené staré pravidlo by navíc přebilo utility třídy nových tlačítek a Tailwind preflight smazal odrážky seznamů a `display` u `svg`.
Co dělat: staré styly dát do vrstvy `legacy` (pořadí `theme, base, legacy, components, utilities`), jejich proměnné přejmenovat na `--legacy-*` a navázat na nový motiv, tmavý režim řídit třídou `dark` místo `prefers-color-scheme`. Při jednosloupcové mřížce vždy `grid-cols-[minmax(0,1fr)]`, jinak se sloupec roztáhne podle širokých tabulek (na mobilu stránka 1304 px).

**Komponenty Radix v jsdom spadnou na chybějící `ResizeObserver`, a to celé UI testy najednou.**
Po přidání posuvníku a zaškrtávátek z shadcn selhalo 19 testů, i těch, které formulář netestují, protože všechny vykreslují `App`. jsdom nemá `ResizeObserver`, `hasPointerCapture` ani `scrollIntoView`.
Co dělat: polyfilly jsou v `src/test/setup.ts` (nastaveno ve `setupFiles`, jen pro jsdom). Select z Radixu se v testech otevře klávesou Enter na tlačítku a volba klávesou Enter na položce.

**Dvě pole nad stejnou hodnotou nesmí sdílet `id`.**
Jednoduché pole „Úrok vašeho spořicího účtu“ a první pásmo v sekci Upřesnit spoření upravují stejnou sazbu a obě používaly `id` odvozené z cesty. Po rozbalení sekce byla na stránce dvě stejná `id` a popisek ukazoval na špatné pole.
Co dělat: jednoduché pole má vlastní `id`; test kontroluje, že na stránce nejsou duplicitní `id`. Navíc: zvýšení sazby prvního pásma pravidlo „sazby nerostou“ neporuší, poruší ho až snížení pod sazbu druhého pásma.

**Rozdíl vítěze se v režimu „dnešní koruny“ od kroku 7 přepočítával dvakrát.**
Verdikt počítal rozdíl z už přepočtených čistých jmění a pak ho poslal do funkce, která přepočítává znovu. Ve výchozím nastavení (nominální koruny) chyba nebyla vidět, v dnešních korunách byl rozdíl o inflační faktor menší. Nenašly ji testy ani ruční kontrola, protože nikdo neporovnal číslo ve verdiktu s ručním výpočtem.
Co dělat: funkce `summarize` vrací rozdíl už ve zvolených korunách a říká to v komentáři. Test porovnává číslo ve verdiktu v dnešních korunách s hodnotou spočtenou z jádra. U přepínače režimu zobrazení vždy ověřit jednu konkrétní hodnotu, ne jen to, že se změnil nadpis.

**Testing Library neporovnává nezlomitelné mezery v hledaném textu.**
`getByText('+86 319 Kč')` s textem z `formatCzk` nenašlo prvek, protože ve formátované částce jsou nezlomitelné mezery a hledaný text je v testu převeden na obyčejné.
Co dělat: v testech použít porovnání funkcí (`withText`), které obě strany normalizuje.


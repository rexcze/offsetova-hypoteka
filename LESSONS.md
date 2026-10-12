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

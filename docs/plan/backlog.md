# Backlog (po MVP)

Na tyto body se sahá až po dokončení MVP a po domluvě s uživatelem. Každá změna výpočtu znamená nejdřív upravit specifikaci a referenční model, přidat golden případ a teprve pak TypeScript.

## v2: věrnější model

- **Jednorázové vklady a výběry:** seznam „měsíc, částka, popis“ (např. auto ve 3. roce). Ukáže hlavní výhodu offsetu proti mimořádné splátce: peníze zůstávají k dispozici. Scénář D musí při výběru nad rezervu řešit nedostatek peněz (varování).
- **Vývoj sazby spořicího účtu:** sazba se mění v čase (např. „za 2 roky 2,5 %“), protože během fixace je hypotéka pevná, kdežto spořicí účet ne. Případně tři varianty (optimistická, střední, pesimistická) zobrazené vedle sebe.
- **Zátěžový test sazeb po fixaci:** tři varianty sazby po fixaci najednou.
- **Scénář E (kombinace):** offset a spořicí účty s optimálním rozdělením podle mezní sazby po zdanění a odpočtu. Dnešní B dává offset vždy na první místo.
- **Akční sazby spořicích účtů:** platnost akční sazby (např. 6 měsíců), pak jiná sazba. Podmínky typu „sazba jen při aktivním používání“ jako přepínač.
- **Poplatky:** měsíční poplatek za účet / offsetovou službu po scénářích.
- **Odpočet po kalendářních letech** s vratkou v dubnu následujícího roku a zadáním měsíce, kdy smlouva začala.

## v3: pohodlí

- Export výsledků do CSV a tisk / PDF (tisková šablona přes CSS `@media print`).
- Investiční scénář (očekávaný výnos ETF, zřetelně označený jako rizikový, s rozptylem výsledků).
- Porovnání více nabídek offsetových hypoték vedle sebe (různé sazby a stropy).

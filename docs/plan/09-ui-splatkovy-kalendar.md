# 09 – UI: splátkový kalendář

## Cíl

Uživatel si může projít vývoj každého scénáře po letech a ověřit, odkud čísla pocházejí.

## Úkoly

- [ ] Sbalitelná sekce „Podrobný průběh“ s výběrem scénáře (záložky A–D).
- [ ] Tabulka po letech, agregovaná z `rows`:
  - **součty za rok:** splátky, úroky, jistina, mimořádné splátky, poplatky, úrok ze spoření, daňová vratka;
  - **stav na konci roku:** dluh, likvidní peníze, čisté jmění;
  - **u B navíc:** průměrná započtená částka.
- [ ] Rozbalením roku se ukážou jednotlivé měsíce.
- [ ] Respektuje přepínač „v dnešních korunách“ (každý měsíc vlastním faktorem).
- [ ] Na mobilu tabulka vodorovně posouvatelná uvnitř svého kontejneru, ne celá stránka.

## Testy

Agregační funkce (čistá funkce v `src/ui/results/`): součty za rok sedí se součtem `rows` a stav na konci roku odpovídá řádku 12, 24, …

## Hotovo, když

`npm run check` projde.

## Commit

`Přidat splátkový kalendář po letech`

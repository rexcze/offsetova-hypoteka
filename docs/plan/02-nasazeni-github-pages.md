# 02 – Nasazení na GitHub Pages

## Cíl

Každý push do `main` spustí kontroly a nasadí aplikaci na `https://rexcze.github.io/offsetova-hypoteka/`. Pull requesty spustí jen kontroly.

## Úkoly

- [x] `.github/workflows/ci.yml`:
  - spouštěč `push` do `main` a `pull_request`;
  - job `check`: `actions/checkout`, `actions/setup-node` (Node 24, cache npm), `npm ci`, `npm run check`;
  - job `deploy` (jen při `push` do `main`, závisí na `check`): `npm ci`, `npm run build`, `actions/configure-pages`, `actions/upload-pages-artifact` s `path: dist`, `actions/deploy-pages`;
  - oprávnění `contents: read`, `pages: write`, `id-token: write`; prostředí `github-pages`; `concurrency` skupina `pages`.
- [x] Použij aktuální hlavní verze oficiálních actions (ověř na GitHubu, nehádej).
- [x] Do README přidej odkaz na nasazenou aplikaci.

## Vyžaduje souhlas uživatele

Tyto kroky jsou navenek viditelné. Před každým se zeptej:

1. **Zapnutí Pages se zdrojem „GitHub Actions“.** Buď uživatel v nastavení repa (Settings → Pages → Source: GitHub Actions), nebo po souhlasu příkazem `gh api -X POST repos/rexcze/offsetova-hypoteka/pages -f build_type=workflow`.
2. **Push do `main`.**

## Hotovo, když

- Běh workflow na GitHubu skončil zeleně (zkontroluj přes `gh run list` / `gh run view`).
- Stránka na Pages se načte bez chyb v konzoli, styly i skripty se načítají z podcesty `/offsetova-hypoteka/`.

## Mimo rozsah

Vlastní doména, náhledová nasazení pro PR.

## Commit

`Přidat CI a nasazení na GitHub Pages`

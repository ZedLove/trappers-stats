# Trappers Stats

A static site for the Trappers slo-pitch team's season stats — rosters, game lines,
standings, and playoff brackets. Built with React + TypeScript + Vite and Material UI,
served from GitHub Pages. It ships a light/dark theme with a toggle and is fully
responsive (the stats leaderboard becomes a card list on phones).

- **Public site:** https://zedlove.github.io/trappers-stats/
- **Local admin:** http://localhost:5173/trappers-stats/admin.html (dev only — see below)

## Stats

The site derives standard batting stats from raw per-game lines. Tracked per line:
at-bats, hits by type (single, double, triple, home run), walks, sacrifice flies,
strikeouts, and runs. From those it computes games played, plate appearances, total
bases, and the rate stats AVG, OBP, SLG, and OPS. Walks and sacrifice flies count
toward plate appearances but not at-bats. There is no pitching, and players are known
by nickname or "First L." only — never full names.

## Data model

All data lives as hand-editable JSON under [`data/`](data/):

- `players.json` — the roster.
- `teams.json` — our team plus every opponent.
- `locations.json` — the fields we play at (games reference a location id).
- `seasons/*.json` — one file per season (games, standings, playoff results).

The Zod schemas that define and validate every shape live in
[`src/shared/schema.ts`](src/shared/schema.ts). They are parsed and cross-validated at
build time by [`src/shared/data.ts`](src/shared/data.ts), so an invalid hand-edit fails
`npm run build` with the full list of problems rather than shipping a broken site.

```jsonc
// Example (identifiers are slugged, names are handles — never full names):
{
  "players": [{ "id": "z-man", "name": "Z-Man" }],
  "teams": [
    { "id": "trappers", "name": "Trappers", "us": true },
    { "id": "hornets", "name": "Hornets" }
  ],
  "locations": [{ "id": "doverfield-park", "name": "Doverfield Park" }]
}
```

## Admin (local only)

Stats entry happens through a small admin UI that is **never shipped** — the admin
endpoints only exist in the Vite dev server, and the admin page is built for local use.
It covers game entry (with a live box-score preview), players, teams, locations, and
season results.

```sh
npm install
npm run dev
```

Then open <http://localhost:5173/trappers-stats/admin.html>. It reads and writes the
JSON files under `data/` through local-only `/__admin` endpoints (see
[`src/admin/server/vite-plugin-admin.ts`](src/admin/server/vite-plugin-admin.ts)).

## Deploy

Deployment is fully automatic: pushing to `main` builds the site and publishes it to
GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). There
is nothing to run locally.

## Dependencies

[Dependabot](.github/dependabot.yml) opens weekly update PRs, grouping minor + patch
bumps into one reviewable PR and leaving majors ungrouped. A
[triage workflow](.github/workflows/dependabot-triage.yml) posts an AI risk summary on
each Dependabot PR and auto-merges minor/patch updates; majors are left for a human to
read and merge. TypeScript is pinned below 7 until typescript-eslint supports it.

## Development

Node 24 is expected (see [`.nvmrc`](.nvmrc)).

```sh
npm test        # unit + component tests (Vitest)
npm run lint    # ESLint
npm run build   # typecheck + production build (also validates data/)
```

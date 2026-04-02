# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

This is a **Backstage Developer Portal** (v1.49.1) — a Yarn workspaces monorepo under `backstage/` with two packages:
- `packages/app` — React frontend (dev server on port **3000**)
- `packages/backend` — Node.js backend (port **7007**)

### Running the dev environment

From `backstage/`:
- `yarn start` — starts both frontend and backend concurrently
- Backend uses **SQLite in-memory** (`better-sqlite3`) in dev mode; no external DB needed
- Auth is **guest provider** — click "Enter" to sign in, no credentials required

### Lint / Test / Build

See `backstage/package.json` scripts. Key commands (run from `backstage/`):
- `yarn lint:all` — ESLint + Prettier on all packages
- `yarn test` — runs Jest tests (uses `backstage-cli repo test`; to run with results use `yarn backstage-cli package test --watchAll=false` inside a specific package)
- `yarn tsc` — TypeScript type-checking
- `yarn build:all` — full production build

### Gotchas

- `yarn test` (repo-level) uses `--since` by default and may produce no output if there are no changed packages. Run package-level tests directly for guaranteed output: `cd packages/app && yarn backstage-cli package test --watchAll=false`.
- The Kubernetes and PostgreSQL search plugins log warnings at startup — this is expected in dev mode (no K8s config, no Postgres).
- TechDocs generator is configured to `runIn: 'docker'` in `app-config.yaml`. If Docker is not available, change to `runIn: 'local'` (requires `mkdocs` installed) or ignore TechDocs generation errors.
- `GITHUB_TOKEN` env var is optional; without it, GitHub integrations (catalog imports, scaffolder GitHub actions) won't work but the portal runs fine.

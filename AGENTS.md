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

### Custom Scaffolder Templates Page

The app overrides the default scaffolder templates sub-page (`sub-page:scaffolder/templates`) with a custom Vercel-inspired design in `packages/app/src/modules/scaffolder/`. Key files:
- `index.tsx` — `createFrontendModule` that overrides the sub-page via `SubPageBlueprint.makeWithOverrides`
- `VercelTemplatesPage.tsx` — Custom templates list with search, type filters, card grid
- `TemplateWizardPage.tsx` — Wizard wrapper using `Workflow` from `@backstage/plugin-scaffolder-react/alpha`
- `TemplatesPageWrapper.tsx` — Routes wrapper connecting list and wizard

The module is registered in `App.tsx` via the `features` array. Templates are fetched from the **catalog API** (not the scaffolder API). The wizard uses `Workflow` component which requires `extensions`, `onCreate`, and `onError` props.

### Gotchas

- `yarn test` (repo-level) uses `--since` by default and may produce no output if there are no changed packages. Run package-level tests directly for guaranteed output: `cd packages/app && yarn backstage-cli package test --watchAll=false`.
- The Kubernetes and PostgreSQL search plugins log warnings at startup — this is expected in dev mode (no K8s config, no Postgres).
- TechDocs generator is configured to `runIn: 'docker'` in `app-config.yaml`. If Docker is not available, change to `runIn: 'local'` (requires `mkdocs` installed) or ignore TechDocs generation errors.
- `GITHUB_TOKEN` env var is optional; without it, GitHub integrations (catalog imports, scaffolder GitHub actions) won't work but the portal runs fine.
- When overriding scaffolder sub-pages via `SubPageBlueprint`, the parent `PageBlueprint` mounts them with `path="<subpage>/*"` — nested `<Routes>` inside the sub-page loader work correctly for sub-routing (e.g., wizard forms).

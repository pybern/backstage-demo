# Customizing Backstage Extensions

This guide explains how the Backstage new frontend system works and how to override any plugin page or component. It uses the custom Scaffolder templates page in this repository as a worked example.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Key Concepts](#key-concepts)
4. [Step-by-Step: Overriding a Sub-Page Extension](#step-by-step-overriding-a-sub-page-extension)
5. [Worked Example: Custom Scaffolder Templates Page](#worked-example-custom-scaffolder-templates-page)
6. [Other Customization Patterns](#other-customization-patterns)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js** 22 or 24
- **Yarn** 4.4.1 (bundled via Corepack — run `corepack enable` first)

### Install and Run

```bash
cd backstage
yarn install
yarn start
```

This starts two processes concurrently:

| Service  | URL                    | Description                          |
|----------|------------------------|--------------------------------------|
| Frontend | http://localhost:3000   | React dev server (Rspack/Webpack)    |
| Backend  | http://localhost:7007   | Node.js API server                   |

Open http://localhost:3000 and click **ENTER** to sign in as a guest.

### Useful Commands

All commands run from the `backstage/` directory.

| Command | Purpose |
|---------|---------|
| `yarn start` | Start frontend + backend in dev mode |
| `yarn tsc` | TypeScript type-checking |
| `yarn lint:all` | ESLint + Prettier across all packages |
| `yarn backstage-cli package test --watchAll=false` | Run tests in the current package |
| `yarn build:all` | Full production build |
| `yarn new` | Scaffold a new plugin or package |

### Dev Environment Notes

- The backend uses **SQLite in-memory** by default — no database setup required.
- Auth uses the **guest provider** — no credentials needed.
- The `GITHUB_TOKEN` env var is optional; only needed for GitHub integrations.
- Kubernetes and PostgreSQL search warnings at startup are expected and harmless.

---

## Architecture Overview

This app uses the **Backstage new frontend system** (declarative, extension-based). Here is the project structure:

```
backstage/
├── app-config.yaml                    # App + backend configuration
├── package.json                       # Monorepo root (Yarn workspaces)
├── examples/
│   ├── entities.yaml                  # Sample catalog entities
│   ├── org.yaml                       # Sample org data (users, groups)
│   └── template/template.yaml         # Sample scaffolder template
├── packages/
│   ├── app/                           # Frontend React application
│   │   ├── package.json
│   │   └── src/
│   │       ├── App.tsx                # App entry — registers features
│   │       ├── App.test.tsx
│   │       └── modules/
│   │           ├── nav/               # Sidebar navigation override
│   │           │   ├── index.ts
│   │           │   └── Sidebar.tsx
│   │           └── scaffolder/        # Custom templates page override
│   │               ├── index.tsx
│   │               ├── VercelTemplatesPage.tsx
│   │               ├── TemplatesPageWrapper.tsx
│   │               └── TemplateWizardPage.tsx
│   └── backend/                       # Backend Node.js application
│       ├── package.json
│       └── src/
│           └── index.ts               # Backend plugin registration
└── plugins/                           # Custom plugins (currently empty)
```

### How Plugins Load

The app entry point (`packages/app/src/App.tsx`) is minimal:

```tsx
import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { navModule } from './modules/nav';
import { scaffolderTemplatesModule } from './modules/scaffolder';

export default createApp({
  features: [catalogPlugin, navModule, scaffolderTemplatesModule],
});
```

Most plugins are loaded **automatically** thanks to this line in `app-config.yaml`:

```yaml
app:
  packages: all
```

This tells Backstage to discover every `@backstage/plugin-*` package listed in `packages/app/package.json` and register it. You only need to add a plugin to `features` explicitly when you want to:

- Override a specific extension from that plugin
- Load a custom module that targets a plugin's extension slot

---

## Key Concepts

### Extensions

Every visible piece of a Backstage app is an **extension**: pages, sub-pages, nav items, API implementations. Each has a unique **extension ID** like `page:scaffolder` or `sub-page:scaffolder/templates`.

### Blueprints

Blueprints are factory patterns for creating extensions. The most common ones:

| Blueprint | Purpose | Extension ID pattern |
|-----------|---------|---------------------|
| `PageBlueprint` | Full page with its own route | `page:<plugin>` |
| `SubPageBlueprint` | Tab within a page | `sub-page:<plugin>/<name>` |
| `NavItemBlueprint` | Sidebar navigation item | `nav-item:<plugin>` |
| `ApiBlueprint` | API implementation | `api:<plugin>` |

### Modules

A **module** (`createFrontendModule`) is a bag of extensions that targets a specific plugin by `pluginId`. Modules are how you override extensions from outside the plugin — without forking the plugin itself.

### Override Flow

```
Plugin defines extension (e.g. sub-page:scaffolder/templates)
    ↓
Module provides replacement extension (same name + pluginId)
    ↓
App registers module in features array
    ↓
Backstage resolves: module's extension replaces plugin's default
```

---

## Step-by-Step: Overriding a Sub-Page Extension

This is the general recipe. The next section shows the concrete implementation.

### 1. Identify the Extension to Override

Every plugin registers extensions. You need:

- The **plugin ID** (e.g. `scaffolder`)
- The **extension name** (e.g. `templates` for `sub-page:scaffolder/templates`)
- The **blueprint type** (e.g. `SubPageBlueprint`)

To find these, look at the plugin's `alpha` export:
```
node_modules/@backstage/plugin-<name>/dist/alpha/extensions.esm.js
```

### 2. Create a Module Directory

```
packages/app/src/modules/<your-module>/
├── index.tsx          # Module definition + extension override
└── YourComponent.tsx  # Your custom UI
```

### 3. Define the Override Extension

Use `<Blueprint>.makeWithOverrides` to replace the extension's factory:

```tsx
// index.tsx
import { createFrontendModule, SubPageBlueprint } from '@backstage/frontend-plugin-api';

const myExtension = SubPageBlueprint.makeWithOverrides({
  name: '<extension-name>',     // Must match the original extension's name
  factory(originalFactory) {
    return originalFactory({
      path: '<route-path>',
      title: '<Tab Title>',
      loader: async () => {
        const { MyComponent } = await import('./MyComponent');
        return <MyComponent />;
      },
    });
  },
});

export const myModule = createFrontendModule({
  pluginId: '<target-plugin-id>',  // Must match the plugin you're overriding
  extensions: [myExtension],
});
```

### 4. Register the Module

```tsx
// App.tsx
import { myModule } from './modules/<your-module>';

export default createApp({
  features: [catalogPlugin, navModule, myModule],
});
```

### 5. Add Dependencies

If your component imports from packages not yet in `packages/app/package.json`, add them:

```bash
yarn --cwd packages/app add @backstage/plugin-catalog-react @backstage/catalog-model
```

> Backstage's linter (`@backstage/no-undeclared-imports`) will catch missing declarations.

### 6. Verify

```bash
yarn tsc          # Type-check
yarn lint:all     # Lint
yarn start        # Run and test in browser
```

---

## Worked Example: Custom Scaffolder Templates Page

This repository replaces the default Scaffolder "Templates" tab with a Vercel-inspired design. Here is how it was built.

### What Was Overridden

| Original extension | `sub-page:scaffolder/templates` |
|--------------------|---------------------------------|
| Plugin ID | `scaffolder` |
| Extension name | `templates` |
| Blueprint | `SubPageBlueprint` |
| Route | `/create/templates` |
| Original component | `TemplatesSubPage` (internal to `@backstage/plugin-scaffolder`) |

### File-by-File Walkthrough

#### `packages/app/src/modules/scaffolder/index.tsx` — Module Definition

```tsx
import { createFrontendModule, SubPageBlueprint } from '@backstage/frontend-plugin-api';

const customTemplatesSubPage = SubPageBlueprint.makeWithOverrides({
  name: 'templates',
  factory(originalFactory) {
    return originalFactory({
      path: 'templates',
      title: 'Templates',
      loader: async () => {
        const { TemplatesPageWrapper } = await import('./TemplatesPageWrapper');
        return <TemplatesPageWrapper />;
      },
    });
  },
});

export const scaffolderTemplatesModule = createFrontendModule({
  pluginId: 'scaffolder',
  extensions: [customTemplatesSubPage],
});
```

Key points:
- `name: 'templates'` matches the original extension's name — this is what causes the override.
- `pluginId: 'scaffolder'` targets the scaffolder plugin.
- `loader` returns a lazy-loaded React element — the custom page.

#### `packages/app/src/modules/scaffolder/TemplatesPageWrapper.tsx` — Router

```tsx
import { Routes, Route } from 'react-router-dom';
import { VercelTemplatesPage } from './VercelTemplatesPage';
import { TemplateWizardPage } from './TemplateWizardPage';

export function TemplatesPageWrapper() {
  return (
    <Routes>
      <Route index element={<VercelTemplatesPage />} />
      <Route path=":namespace/:templateName" element={<TemplateWizardPage />} />
    </Routes>
  );
}
```

This is critical: the parent `PageBlueprint` mounts sub-pages with a `/*` wildcard route, so nested `<Routes>` inside the loader work for sub-routing. The `index` route shows the template list; `:namespace/:templateName` shows the wizard for a specific template.

#### `packages/app/src/modules/scaffolder/VercelTemplatesPage.tsx` — Custom List UI

The custom page:
- Fetches templates via `catalogApiRef.getEntities({ filter: { kind: 'Template' } })` — templates are catalog entities, not fetched from the scaffolder API.
- Renders a search bar, sidebar type filters, and a responsive card grid.
- Navigates to the wizard via relative path: `navigate(\`${namespace}/${name}\`)`.

Data flow:
```
catalogApiRef.getEntities({ filter: { kind: 'Template' } })
    → Entity[]
    → filter by search query + selected types
    → render cards
    → onClick → navigate('default/example-nodejs-template')
    → Routes matches :namespace/:templateName
    → TemplateWizardPage renders
```

#### `packages/app/src/modules/scaffolder/TemplateWizardPage.tsx` — Template Wizard

```tsx
import { Workflow } from '@backstage/plugin-scaffolder-react/alpha';
import { SecretsContextProvider, scaffolderApiRef } from '@backstage/plugin-scaffolder-react';

export function TemplateWizardPage() {
  const { namespace, templateName } = useParams();
  const scaffolderApi = useApi(scaffolderApiRef);

  const onCreate = useCallback(async (values) => {
    const { taskId } = await scaffolderApi.scaffold({
      templateRef: `template:${namespace}/${templateName}`,
      values,
    });
    navigate(`../../tasks/${taskId}`);
  }, [scaffolderApi, namespace, templateName, navigate]);

  return (
    <SecretsContextProvider>
      <Workflow
        namespace={namespace}
        templateName={templateName}
        extensions={[]}
        onCreate={onCreate}
        onError={error => <div>Error: {error?.message}</div>}
      />
    </SecretsContextProvider>
  );
}
```

The `Workflow` component is a public API from `@backstage/plugin-scaffolder-react/alpha`. It handles loading the template's parameter schema and rendering the multi-step form.

#### `packages/app/src/App.tsx` — Registration

```tsx
import { scaffolderTemplatesModule } from './modules/scaffolder';

export default createApp({
  features: [catalogPlugin, navModule, scaffolderTemplatesModule],
});
```

### Dependencies Added

```bash
yarn --cwd packages/app add \
  @backstage/plugin-catalog-react \
  @backstage/catalog-model \
  @backstage/plugin-scaffolder-react \
  @backstage/types
```

---

## Other Customization Patterns

### Override a Full Page

To replace an entire page (not just a tab), use `PageBlueprint.makeWithOverrides`:

```tsx
import { PageBlueprint } from '@backstage/frontend-plugin-api';

const myPage = PageBlueprint.makeWithOverrides({
  factory(originalFactory) {
    return originalFactory({
      routeRef: myRouteRef,
      path: '/my-path',
      title: 'My Page',
      loader: async () => {
        const { MyPage } = await import('./MyPage');
        return <MyPage />;
      },
    });
  },
});
```

### Override a Nav Item

```tsx
import { NavItemBlueprint } from '@backstage/frontend-plugin-api';
import MyIcon from '@material-ui/icons/Star';

const myNavItem = NavItemBlueprint.make({
  params: {
    routeRef: someRouteRef,
    title: 'My Custom Title',
    icon: MyIcon,
  },
});
```

### Override an API Implementation

```tsx
import { ApiBlueprint } from '@backstage/frontend-plugin-api';

const myApi = ApiBlueprint.make({
  params: defineParams => defineParams({
    api: someApiRef,
    deps: { fetchApi: fetchApiRef },
    factory: ({ fetchApi }) => new MyCustomApiClient({ fetchApi }),
  }),
});
```

### Configure Extensions via `app-config.yaml`

Some extensions support configuration without code. For example, remapping the catalog page to `/`:

```yaml
app:
  extensions:
    - page:catalog:
        config:
          path: /
```

---

## Troubleshooting

### "Extension not found" or override doesn't take effect

- Verify `pluginId` matches the target plugin exactly.
- Verify the extension `name` matches exactly (e.g. `templates`, not `template`).
- Make sure the module is registered in the `features` array in `App.tsx`.

### Undeclared import lint errors

Run the suggested command:
```bash
yarn --cwd packages/app add @backstage/<package-name>
```

### Nested routes don't work inside a sub-page

The parent `PageBlueprint` mounts sub-pages with `path="<name>/*"`. Use `<Routes>` inside your loader component for nested routing. See `TemplatesPageWrapper.tsx` for the pattern.

### Templates list is empty

Templates are catalog entities. Check:
1. `app-config.yaml` has a catalog location pointing to your template YAML.
2. The backend is running (`http://localhost:7007/.backstage/health/v1/readiness`).
3. The template YAML has `kind: Template` and valid `apiVersion: scaffolder.backstage.io/v1beta3`.

### Hot reload not picking up changes

The frontend dev server uses Rspack with HMR. If changes aren't reflected:
1. Check the terminal for compilation errors.
2. Hard-refresh the browser (`Ctrl+Shift+R`).
3. Restart `yarn start` if the module structure changed.

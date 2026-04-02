# Custom `/create` Page POC

This module is a small proof of concept that shows how to customize an existing
Backstage route using the new frontend system.

## What this changes

- Overrides the default scaffolder page at `/create`
- Keeps the route path and plugin identity owned by `scaffolder`
- Replaces the landing experience with a richer page that:
  - loads real `Template` entities from the catalog
  - shows a curated discovery layout
  - updates a live preview panel as the user changes selection
  - deep-links into the existing scaffolder wizard flow

## Files

- `index.ts` - frontend module that overrides `page:scaffolder`
- `CustomCreatePage.tsx` - custom `/create` UI

## Pattern to reuse for other pages

The key pattern is:

1. Import the frontend plugin from its `/alpha` entrypoint when it exposes
   overridable extensions.
2. Create a frontend module with the same `pluginId`.
3. Override a specific page or sub-page extension by ID.
4. Provide a custom `loader` that renders your replacement React component.
5. Install the module in `packages/app/src/App.tsx`.

In this POC the override is:

- plugin: `scaffolder`
- extension ID: `page:scaffolder`

That makes it a good starting point for experimenting with customized UI without
forking the whole plugin.

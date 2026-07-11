---
name: Monorepo prod build gotchas
description: Why publishing can fail when dev works, and how to reproduce the production build locally.
---

## Rule
Before suggesting a publish, run the web artifact's production build locally. Vite resolves `@workspace/*` libs to their **source** (`src/index.ts`), so any symbol imported by an app must actually be exported from the lib source — dev servers and stale typecheck caches can mask this, but the deployment build fails hard.

**Why:** A publish failed because a frontend page imported a symbol that had not yet been exported from the shared API client lib; dev HMR and typecheck appeared fine at the time.

**How to apply:**
- Reproduce the deployment build locally with the env vars the platform injects, e.g. `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/<app> run build` (the vite config throws if PORT/BASE_PATH are missing).
- To debug a failed publish: `listDeploymentBuilds` → `getDeploymentBuild({buildId})` in the code sandbox shows the full build log including the exact compile error.
- After changing shared lib types, run `pnpm -w run typecheck:libs` before app typechecks, or stale build info gives false results.

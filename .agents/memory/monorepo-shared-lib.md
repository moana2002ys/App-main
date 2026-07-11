---
name: Adding a shared lib package (pnpm monorepo)
description: Steps/gotchas when creating a new lib/* workspace package consumed by artifacts.
---

Shared lib packages (e.g. `lib/db`, `lib/mission-bank`) are **declaration-only** composite TS projects: their `dist/` holds only `.d.ts` (no `.js`). Runtime `.js` is produced by each artifact's own bundler (api-server = esbuild via build.mjs with customConditions "workspace" resolving the package's `src/*.ts`; jogak = Vite). So you cannot `node dist/index.js` — use `npx tsx` against `src/index.ts` to smoke-test engine code directly.

`dist/` and `*.tsbuildinfo` are gitignored, so fresh clones build from scratch.

**Rule:** when you add a new consumed lib package you must:
1. Add `"@workspace/<pkg>": "workspace:*"` to each consuming artifact's package.json + a tsconfig `references` entry, then `pnpm install`.
2. **Also add `{ "path": "./lib/<pkg>" }` to the ROOT `tsconfig.json` references.**

**Why:** root `typecheck` = `tsc --build` (typecheck:libs) then per-artifact `tsc -p ... --noEmit`. The artifact typecheck uses project references and requires the referenced package's `.d.ts` to already exist. `tsc --build` only builds packages reachable from root references. If the new package isn't in root references, its `.d.ts` never gets built in a clean environment and the artifact typecheck fails with `TS6305: Output file '.../dist/index.d.ts' has not been built from source file '.../src/index.ts'`. A stale local `tsconfig.tsbuildinfo` can mask this ("up to date"); delete dist+tsbuildinfo to reproduce a clean-env build.

**Attachment filename gotcha:** Korean attachment filenames can have NFC/NFD Unicode mismatch — direct `read`/`cat` of the exact path may fail; a wildcard `cat attached_assets/*<id>*.md` works.

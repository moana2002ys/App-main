---
name: jogak BA cycle invariants
description: Non-negotiable product rules and quirks for the 조각조각 (jogak) app
---
- **Rule:** Never expose 고립/은둔/위험군 labels, scores, cutoffs, or difficulty numbers (L1…) in UI. Gates (금지조건) may never be relaxed by code — the only clearing path is the 4-week gate-recheck card via user self-report. When stage is (re)confirmed, forbidden tags must be a *union* with existing ones, never a reset.
- **Why:** Clinical safety design; an architect review caught a gate reset during know-yourself finalization as a violation.
- **How to apply:** Any code touching `forbidden`, bands, or stage transitions must only add or preserve gates; demotion never happens on days with any completion.
- Difficulty is plan-first ("B안"): final level = clamp(band + user toggle); mood only sets the toggle default.
- Slot generation is fully local (mission-bank engine); the LLM generation API path was removed 2026-07 — re-adding LLM variety is an optional follow-up.
- Build quirk: `pnpm --filter @workspace/jogak run build` requires `PORT` and `BASE_PATH` env vars (vite.config throws otherwise).

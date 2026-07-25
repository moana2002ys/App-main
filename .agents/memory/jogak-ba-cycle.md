---
name: Jogak cycle — kit rebuild rolled back
description: Design-kit BA cycle rebuild was reverted by user choice; only 3 elements kept. What survived and why.
---

# Kit rebuild rollback (user decision)

- A full design-kit cycle rebuild (mood 5-scale check-in, P/M 0–10 scales, 7-day start week, skip-reason flow, kit palette) was built, verified, then **rolled back**: the user approved only three elements and asked to keep the pre-existing main version otherwise.
- Kept: (1) accepted-challenge verification screen UX, (2) challenge-tailored open reflection question (reflectQ), (3) single-scroll mypage with mood×activity chart.
- The mypage chart is fed by a `moodLog` derived from the daily check-in condition (바닥/그저그럼/괜찮음 → 2/3/4) and marked completed on reflection finish — there is no direct mood question in the live flow.
- **Why:** user prefers the established main flow; kit model exists only in `lib/cycle.ts` leftovers used by the mypage.
- **How to apply:** don't re-introduce kit-cycle mechanics (start week, P/M scales, skip chips) without explicit user request; treat `lib/cycle.ts` as a utility source for the mypage, not the active model.

# E2E testing lesson

- `runTest` runs inside a 600s notebook limit; long flows (onboarding survey + multi-day loops) time out. Split into short runs (login persists server-side) or seed `users.state` jsonb directly via psql to skip loops. Automated testing can also be disabled mid-session — fall back to screenshots + typecheck.

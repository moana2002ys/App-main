---
name: Survey JSON as scoring source of truth
description: How the jogak onboarding/know-yourself survey JSON drives scoring, and pitfalls found during review.
---

- The onboarding survey JSON (v1.2) is the single source of truth: items, scales, reverse items, branching, and structured scoring params (outing-burden ranges, isolation cutoffs) are parsed at runtime. Some rules exist only as prose in the JSON (seclusion rule, severity bands, stage mapping) and are implemented as constants matched to that prose — keep them in sync if the JSON version changes.
- **Why:** hardcoding params drifted from spec in review; range strings like "1-2"/"0~43" are parsed generically so JSON updates flow through without code edits.
- **How to apply:** when the survey JSON is bumped, re-run the scoring verification script under the app's scripts/ dir and re-check the prose-only rules manually.
- Lesson: on chapter/step flows with local component state, an "exit" handler that persists local progress indices can clobber the store after a completion handler already advanced it — guard exits by phase. Also, "finalize" transitions must reset derived constraints even when the top-level classification is unchanged.
- Lesson: the Playwright testing subagent can report false failures from stale aria snapshots; cross-check its screenshot and the persisted DB state before treating a failure as real.

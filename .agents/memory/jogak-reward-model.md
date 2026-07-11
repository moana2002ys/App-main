---
name: Jogak reward model
description: How badges/items are granted in the jogak (조각조각) app and why counting is category-level.
---

# Jogak reward model

Badges/items follow `attached_assets/character_reward_design_*.md`. Core rules that must hold:

- **Cumulative only.** Counts never reset, no streak/expiry conditions, earned badges/items are never revoked. Progress is additive.
- **Category-level, not area-level.** Grant on a fine subcategory (e.g. 산책→운동화, 음악→헤드폰, 책→책더미), NOT on the 4 broad areas. An earlier area-level implementation was rejected in code review for exactly this — do not regress to area counting.
- **Threshold = 3 per category** (MVP single threshold). Optional 7/15 upgrade tiers are deliberately skipped to avoid an unwieldy gallery.
- **No-stigma / no-competition** framing everywhere; never reflect *missed* days negatively.
- **Difficulty-weighted points**: level×5 (L1=5 … L5=25).
- **Background expands with outward progress**: 방 안→방 밖→현관·창밖→동네, tied to walk/relationship/social badges (not generic accumulation).

## Why classification is needed
The mission generation engine tags each challenge only with a broad `area` + free-text title — it has no fine subcategory code, and changing generation is out of scope. So completed challenges are classified into a subcategory by title keywords, with a per-area default for no-match. **Why this matters:** the design's category→badge→item table is the contract; if a future task adds real subcategory codes to challenges, prefer those over the keyword classifier.

## Demo determinism
No LLM integration is configured, so generation always falls back to a deterministic bank (stable within a real calendar day). With identical daily-checkin answers and burden 😐 ("적당해요"), the difficulty band stays constant, so the same first card reappears each day → same category → reliably reaches 3. This is what makes the "3회째에 뱃지+아이템" demo repeatable. **Why it matters:** if generation later becomes non-deterministic (LLM enabled), the 3-in-one-category demo is no longer guaranteed by picking the same card — the flow would need the user to intentionally repeat one theme.

## State scope
All reward/growth state is browser-memory only (resets on refresh) — an intentional demo constraint, flagged as a follow-up to persist.

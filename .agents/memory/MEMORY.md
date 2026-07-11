# Memory Index

- [Monorepo prod build gotchas](monorepo-prod-build.md) — vite prod builds bundle workspace lib *source*, so missing lib exports break publish even when dev works; local prod builds need PORT/BASE_PATH env.
- [Adding a shared lib package](monorepo-shared-lib.md) — new lib/* must be added to root tsconfig.json references or `tsc --build` skips its .d.ts and artifact typecheck fails TS6305.
- [한 미션=한 활동 보장](mission-one-activity-guard.md) — 검증시드+감지기+최종패스 3중; 한국어 ~고/·/싶 오탐 주의.

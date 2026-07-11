# Memory Index

- [Monorepo prod build gotchas](monorepo-prod-build.md) — vite prod builds bundle workspace lib *source*, so missing lib exports break publish even when dev works; local prod builds need PORT/BASE_PATH env.
- [Adding a shared lib package](monorepo-shared-lib.md) — new lib/* must be added to root tsconfig.json references or `tsc --build` skips its .d.ts and artifact typecheck fails TS6305.
- [미션 구성 규칙 보장](mission-one-activity-guard.md) — LLM 프롬프트 규칙은 결정적 후처리 가드 필수; 한국어 ~고/채/뒤/·/싶 오탐 주의.
- [한 미션=한 활동 보장](mission-one-activity-guard.md) — 검증시드+감지기+최종패스 3중; 한국어 ~고/·/싶 오탐 주의.
- [미션 4개 구성(선택2+다양성2)](mission-diversity-set.md) — 다양성 후보 밴드는 선택영역 캡 적용 전 밴드로 산출; 후보 개수별 규칙·게이트 단일출처.

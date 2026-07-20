# Memory Index

- [Monorepo prod build gotchas](monorepo-prod-build.md) — vite prod builds bundle workspace lib *source*, so missing lib exports break publish even when dev works; local prod builds need PORT/BASE_PATH env.
- [Adding a shared lib package](monorepo-shared-lib.md) — new lib/* must be added to root tsconfig.json references or `tsc --build` skips its .d.ts and artifact typecheck fails TS6305.
- [미션 구성 규칙 보장](mission-one-activity-guard.md) — LLM 프롬프트 규칙은 결정적 후처리 가드 필수; 한국어 ~고/채/뒤/·/싶 오탐 주의.
- [미션 4개 구성(선택2+다양성2)](mission-diversity-set.md) — 다양성 후보 밴드는 선택영역 캡 적용 전 밴드로 산출; 후보 개수별 규칙·게이트 단일출처.
- [Jogak reward model](jogak-reward-model.md) — badges granted per fine CATEGORY (12), not per broad area; keyword classifier + deterministic-fallback demo + interest branch.
- [활동 선택 설문 게이트](activity-survey-gating.md) — 체크인 2번째 질문=구체 활동; 노출 게이트를 determineTodayArea와 일치, activityId로 미션 생성 연동.
- [Survey JSON scoring](survey-json-scoring.md) — survey JSON v1.2 is single source of truth; prose-only rules mirrored as constants; guard exit handlers on step flows; verify e2e failures against DB state.

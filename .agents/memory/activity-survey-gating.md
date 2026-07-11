---
name: 활동 선택 설문 게이트(2번째 질문)
description: 데일리 체크인 2번째 질문이 구체 활동 선택으로 바뀐 뒤의 게이트·연동 규칙
---

# 데일리 체크인 활동 선택 게이트

데일리 체크인 2번째 질문("오늘은 어떤 걸 해보고 싶나요?")은 4개 광의 개선영역이 아니라
시드뱅크 카테고리(구체 활동)를 영역별로 묶어 보여준다. 진단/임상 용어는 절대 노출하지 않음.

## 노출 규칙 (Option A)
활동은 `isAreaEligible(area, forbidden)` **AND** 카테고리 게이트를 모두 통과할 때만 표시.
- id→영역: `1-*`=rhythm, `2-*`=selfcare, `3-*`=relationship, `4-*`=social
- 카테고리 게이트: 2-D(외출, minCond 그저그럼), 3-D(외출·대면), 3-E(전화·대면), 4-F(외출, minCond 그저그럼)
- 검증된 단계별 결과: 은둔→rhythm+selfcare만(컨디션 낮으면 바깥연결 숨김), 고도고립→+비대면 relationship, 위험군/비위험군→전 영역

**Why:** 노출 규칙을 기존 `determineTodayArea`와 정확히 일치시켜야 사용자가 고른 활동의 영역이
사후에 다른 영역으로 리다이렉트되지 않는다.

## 미션 생성 연동
선택 활동 id는 `activityId`로 흐른다: daily 상태 → home.tsx 생성 payload + fallback 옵션 →
서버 challenges route(프롬프트 힌트) / mission-bank `selectDiverseFallbackMissions`.
- 서버·폴백 모두 `preferredCategoryId`는 **선택 영역과 활동 영역이 일치할 때만** 반영(그 외 무시).
- LLM 프롬프트엔 선택 영역 N개 중 최소 1개를 그 활동과 잇도록 시드 힌트를 추가.
- "잘 모르겠어요" → area='unknown'(단계 기본 영역 사용), activityId 없음.

**How to apply:** 활동/영역/게이트를 바꿀 땐 `getSurveyCategories`(engine.ts)와 UI 노출 필터,
그리고 `determineTodayArea`가 같은 게이트를 공유하도록 세 곳을 함께 확인.

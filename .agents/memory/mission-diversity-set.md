---
name: 미션 4개(선택2+다양성2) 구성 규칙
description: 하루 미션이 선택 영역 2 + 다른 영역 2로 구성될 때 다양성 후보 밴드 산출 순서와 후보 개수별 규칙.
---

하루 미션은 선택 영역 2개 + 다양성 후보 영역 2개(총 4개)로 구성한다.

**다양성 후보 밴드는 "선택 영역 캡 적용 전"의 컨디션 반영 밴드에서 산출해야 한다.**
- **Why:** 선택 영역이 relationship이면 `capBandForArea`가 은둔/고도고립에서 밴드를 L1~2로 눌러버린다. 이 캡된 밴드를 그대로 다양성 후보에 쓰면, 관계와 무관한 rhythm/selfcare 후보까지 잘못 눌린다.
- **How to apply:** 홈에서 (1) 컨디션 -1 조정 → (2) 그 밴드로 `getDiversityAreas`(내부에서 후보 영역별로 다시 `capBandForArea`) → (3) 선택 영역은 별도로 `capBandForArea`. 순서를 섞지 말 것.

**후보 개수별 규칙(서버·클라이언트 폴백·LLM 프롬프트 동일):**
- 후보 ≥2 → 서로 다른 두 영역에서 1개씩. 후보 1 → 그 영역에서 2개. 후보 0 → 4개 모두 선택 영역.
- 영역 게이트는 classifier(`isAreaEligible`, determineTodayArea와 동일 규칙)가 단일 출처. social=외출 금지 시 제외, relationship=관계대면 금지 시 제외.
- 부족분(시드/게이트로 못 채운 카드)은 선택 영역에서 우아하게 보충 → 빈 카드 없음.
- LLM 파싱은 각 미션 area를 자기 영역 밴드로만 클램프하고, 구성(2+2) 미달이면 throw → 폴백 뱅크(`selectDiverseFallbackMissions`)로 전량 대체.

import { Area } from "./classifier";
import { Challenge } from "@workspace/api-client-react";
import { AreaBand, selectDiverseFallbackMissions } from "@workspace/mission-bank";

// 심화판 시드 뱅크(공유 패키지 @workspace/mission-bank)를 단일 소스로 사용한다.
// LLM 실패/지연(5초) 시에도 같은 원리(카테고리 뼈대 × 변주)로 미션이 나오며,
// 한 활동 원칙·게이트·무비용·컨디션 규칙을 동일하게 지킨다.
// 하루 4개 구성: 선택 영역 2개 + 다양성 후보 영역 2개(후보 부족 시 선택 영역으로 보충).
export function getFallbackChallenges(
  selected: { area: Area; bandLow: number; bandHigh: number },
  diversity: AreaBand[],
  opts?: {
    forbidden?: string[];
    condition?: string;
    interest?: string;
    preferredCategoryId?: string;
  },
): Challenge[] {
  const missions = selectDiverseFallbackMissions({
    selected: {
      area: selected.area,
      bandLow: selected.bandLow,
      bandHigh: selected.bandHigh,
    },
    diversity,
    forbidden: opts?.forbidden ?? [],
    condition: opts?.condition ?? "그저 그럼",
    interest: opts?.interest,
    preferredCategoryId: opts?.preferredCategoryId,
    // 하루 안에서 안정적으로 같은 결과가 나오도록 날짜 기반 회전값 사용
    rotation: Math.floor(Date.now() / (1000 * 60 * 60 * 24)),
  });

  return missions.map((m) => ({
    area: m.area as Challenge["area"],
    level: m.level,
    title: m.title,
    minutes: m.minutes,
    reflectQ: m.reflectQ,
  }));
}

import { ChallengeArea, ChallengeRequestArea, ChallengeRequestStage } from "@workspace/api-client-react";

export const STAGES = {
  secluded: 'secluded',
  highly_isolated: 'highly_isolated',
  at_risk: 'at_risk',
  not_at_risk: 'not_at_risk',
} as const;

export type Stage = typeof STAGES[keyof typeof STAGES];

export const AREAS = {
  rhythm: 'rhythm',
  selfcare: 'selfcare',
  relationship: 'relationship',
  social: 'social',
} as const;

export type Area = typeof AREAS[keyof typeof AREAS];

export interface OnboardingAnswers {
  sleep: string; // 밤낮 바뀜 / 새벽 / 자정 전후 / 규칙적
  outing: string; // 매우 부담 / 조금 부담 / 괜찮음
  contact: string; // 혼자가 편함 / 문자 / 전화 / 대면 괜찮음
  area: Area | 'unknown'; 
}

export interface DailyAnswers {
  condition: string; // 바닥 / 그저 그럼 / 괜찮음
  area: Area | 'unknown';
  interest: string;
  // 설문 2번째 질문에서 고른 구체 활동의 시드뱅크 카테고리 id (예: "2-D").
  // '잘 모르겠어요' 선택 시 undefined → 단계 기본 영역으로 처리.
  activityId?: string;
}

export function determineStage(answers: OnboardingAnswers): { stage: Stage, baseBandLow: number, baseBandHigh: number, forbidden: string[] } {
  // (A) 회복 단계 판정 — 온보딩 직후 1회
  // - 외출부담=상 AND 대인=혼자        → 은둔        (기본밴드 L1, 금지: 외출·대면·전화·관계대면)
  // - 외출부담=중 OR 대인=문자          → 고도고립    (기본밴드 L1~2, 금지: 대면·전화·외출)
  // - 외출부담=하 AND 대인=전화/대면부담 → 고립위험군  (기본밴드 L2~3, 금지: 대면은 저강도만)
  // - 외출부담=하 AND 대인=대면 괜찮음   → 비위험군    (기본밴드 L3~4, 금지: 없음)

  const isOutingHigh = answers.outing === '매우 부담';
  const isOutingMedium = answers.outing === '조금 부담';
  const isOutingLow = answers.outing === '괜찮음';

  const isContactAlone = answers.contact === '혼자가 편함';
  const isContactText = answers.contact === '문자';
  const isContactCall = answers.contact === '전화';
  const isContactFace = answers.contact === '대면 괜찮음';

  if (isOutingHigh && isContactAlone) {
    return { stage: STAGES.secluded, baseBandLow: 1, baseBandHigh: 1, forbidden: ['외출', '대면', '전화', '관계대면'] };
  }
  if (isOutingMedium || isContactText) {
    return { stage: STAGES.highly_isolated, baseBandLow: 1, baseBandHigh: 2, forbidden: ['대면', '전화', '외출'] };
  }
  if (isOutingLow && (isContactCall || isContactAlone || isContactText)) {
    // Actually rule says 대인=전화/대면부담. Let's assume if it's not face, it's this.
    return { stage: STAGES.at_risk, baseBandLow: 2, baseBandHigh: 3, forbidden: ['대면은 저강도만'] };
  }
  
  // Default to not_at_risk
  return { stage: STAGES.not_at_risk, baseBandLow: 3, baseBandHigh: 4, forbidden: [] };
}

// 회복단계별 허용(제안) 영역 — 단계가 오를수록 하위 영역에 하나씩 누적된다(2026-07-15 확정 규칙).
// 은둔: 생활리듬 / 고도고립: +자기돌봄 / 고립위험군: +관계 / 비위험군: +사회진입(전 영역)
// 배열의 마지막 원소 = 그 단계에서 정복해야 하는 '타깃 영역'.
const STAGE_ALLOWED_AREAS: Record<Stage, Area[]> = {
  [STAGES.secluded]: [AREAS.rhythm],
  [STAGES.highly_isolated]: [AREAS.rhythm, AREAS.selfcare],
  [STAGES.at_risk]: [AREAS.rhythm, AREAS.selfcare, AREAS.relationship],
  [STAGES.not_at_risk]: [AREAS.rhythm, AREAS.selfcare, AREAS.relationship, AREAS.social],
};

// 단계 미확정(온보딩 전) 시에는 가장 안전한 생활리듬만 노출한다.
export function getStageAllowedAreas(stage: Stage | null | undefined): Area[] {
  if (!stage) return [AREAS.rhythm];
  return STAGE_ALLOWED_AREAS[stage];
}

// 단계별 타깃 영역 = 허용 영역 중 최상단(가장 나중에 열린) 영역.
// 금지조건 게이트(관계대면·외출)에 막히면 바로 아래 영역으로 안전하게 내려간다.
export function getStageTargetArea(stage: Stage | null | undefined, forbidden: string[]): Area {
  const allowed = getStageAllowedAreas(stage);
  for (let i = allowed.length - 1; i >= 0; i--) {
    if (isAreaEligible(allowed[i]!, forbidden)) return allowed[i]!;
  }
  return AREAS.rhythm;
}

export function determineTodayArea(stage: Stage, _desiredArea: Area | 'unknown', forbidden: string[]): Area {
  // (B) 오늘 챌린지 선택 영역 = 회복단계의 타깃 영역(고정).
  // 데일리 설문의 활동 선택은 타깃 영역 안에서만 이뤄지므로 희망영역 값은 참고하지 않는다.
  return getStageTargetArea(stage, forbidden);
}

// 은둔·고도고립 단계에서 관계 영역이 배정될 땐 저강도(읽기·비대면)만 허용
export function capBandForArea(stage: Stage, area: Area, low: number, high: number): { low: number; high: number } {
  if (area === AREAS.relationship) {
    if (stage === STAGES.secluded) return { low: 1, high: 1 };
    if (stage === STAGES.highly_isolated) return { low: Math.min(low, 2), high: Math.min(high, 2) };
  }
  return { low, high };
}

// 영역 게이트: 금지조건에 걸리는 영역은 후보에서 제외한다(determineTodayArea와 동일 규칙, 단일 출처).
// - 사회진입(social): 외출이 금지조건이면 제외
// - 관계(relationship): 모든 접촉이 부담(관계대면 금지)이면 제외
export function isAreaEligible(area: Area, forbidden: string[]): boolean {
  if (area === AREAS.social && forbidden.includes('외출')) return false;
  if (area === AREAS.relationship && forbidden.includes('관계대면')) return false;
  return true;
}

// 다양성 후보 영역 산출: 선택 영역을 제외한 나머지 영역 중 게이트를 통과하는 영역만,
// 각 영역의 (컨디션 반영·단계 캡 적용) 난이도 밴드와 함께 돌려준다.
// low/high는 이미 오늘 컨디션 조정이 반영된 밴드를 넘긴다(선택 영역 캡 적용 전 값).
export function getDiversityAreas(
  stage: Stage,
  selectedArea: Area,
  forbidden: string[],
  low: number,
  high: number,
): { area: Area; bandLow: number; bandHigh: number }[] {
  return getStageAllowedAreas(stage)
    .filter((a) => a !== selectedArea && isAreaEligible(a, forbidden))
    .map((a) => {
      const capped = capBandForArea(stage, a, low, high);
      return { area: a, bandLow: capped.low, bandHigh: capped.high };
    });
}

export function adjustBandNextDay(
  currentBandLow: number, 
  currentBandHigh: number,
  completed: boolean,
  burden: '😌' | '😐' | '😣' | null, // 쉬웠어요 / 적당 / 버거웠어요
  consecutiveSkips: number
): { bandLow: number, bandHigh: number, message?: string } {
  let low = currentBandLow;
  let high = currentBandHigh;
  let message;

  if (completed && burden) {
    if (burden === '😌') {
      low = Math.min(5, low + 1);
      high = Math.min(5, high + 1);
      message = "조금씩 익숙해지고 있네요. 오늘은 살짝 다른 걸 해볼까요?";
    } else if (burden === '😐') {
      // keep
    } else if (burden === '😣') {
      // keep or -1. let's do -1 safely
      low = Math.max(1, low - 1);
      high = Math.max(1, high - 1);
      message = "어제는 조금 버거웠군요. 오늘은 조금 더 가볍게 가볼까요?";
    }
  } else {
    // missed
    low = Math.max(1, low - 1);
    high = Math.max(1, high - 1);
    
    if (consecutiveSkips >= 2) {
      low = 1;
      high = 1;
      message = "괜찮아요, 쉬어가는 날도 있는 법이죠. 아주 작은 조각부터 다시 시작해봐요.";
    }
  }

  return { bandLow: low, bandHigh: Math.max(low, high), message };
}

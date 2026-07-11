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

export function determineTodayArea(stage: Stage, desiredArea: Area | 'unknown', forbidden: string[]): Area {
  // (B) 오늘 챌린지 영역 = 데일리 설문의 희망영역. (잘 모르겠음 → 회복단계 기본 우선영역)
  // 단, 금지조건에 걸리는 영역은 제외. 은둔·고도고립 초기에는 생활리듬·자기돌봄 우선.
  // 관계·사회진입 영역은 게이트(대인/외출 부담) 통과 시에만 배정.

  const stageDefault: Area =
    stage === STAGES.secluded || stage === STAGES.highly_isolated ? AREAS.rhythm : AREAS.selfcare;

  let targetArea: Area = desiredArea === 'unknown' ? stageDefault : desiredArea;

  // 사회진입 게이트: 외출·경제활동이 필요한 영역 → 외출이 금지조건인 동안은 배정하지 않음
  if (targetArea === AREAS.social && forbidden.includes('외출')) {
    targetArea = stageDefault;
  }

  // 관계 게이트: 모든 접촉(대면·전화·문자)이 부담인 은둔 단계 초기에는 리듬·돌봄 우선
  if (targetArea === AREAS.relationship && forbidden.includes('관계대면')) {
    targetArea = stageDefault;
  }

  return targetArea;
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
  const allAreas: Area[] = [AREAS.rhythm, AREAS.selfcare, AREAS.relationship, AREAS.social];
  return allAreas
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

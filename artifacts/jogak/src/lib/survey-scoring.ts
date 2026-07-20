// 설문 채점 로직 — 전부 순수 함수. JSON(scoring 명세)과 일치해야 한다.
// 결과(은둔 여부·심각도·단계·점수)는 내부 상태 전용이며 화면에 절대 노출하지 않는다.
import { Stage, STAGES, Area, AREAS } from "./classifier";
import {
  getChapters,
  getReverseItems,
  getScaleMax,
  getOutingBurdenRules,
  getIsolationCutoffs,
  FlatFirstLaunchItem,
} from "./survey";

export type SurveyResponses = Record<string, number>;

// ---- 첫 실행 채점 ----

// 은둔 판정: sc_q1 ∈ {1..4} AND sc_q2 ∉ {4,5}
export function isSecluded(responses: SurveyResponses): boolean {
  const q1 = responses["sc_q1"];
  const q2 = responses["sc_q2"];
  if (q1 == null || q2 == null) return false;
  return q1 >= 1 && q1 <= 4 && q2 !== 4 && q2 !== 5;
}

// 외출부담: JSON first_launch.scoring.outing_burden_from_sc_q1에서 읽음 (1-2=상 / 3-4=중 / 5-8=하)
export type OutingBurden = "상" | "중" | "하";
export function outingBurdenFromScQ1(v: number): OutingBurden {
  for (const rule of getOutingBurdenRules()) {
    if (v >= rule.min && v <= rule.max) return rule.label as OutingBurden;
  }
  return "하";
}

// 심각도: Σ(ss1..ss15) 0~45 → 밴드
export function severitySum(responses: SurveyResponses): number {
  let sum = 0;
  for (let i = 1; i <= 15; i++) {
    sum += responses[`ss${i}`] ?? 0;
  }
  return sum;
}

export type SeverityBand = "낮음" | "중간" | "높음";
export function severityBand(sum: number): SeverityBand {
  if (sum <= 10) return "낮음";
  if (sum <= 25) return "중간";
  return "높음";
}

// 초기 난이도 밴드: 낮음→L3~4 / 중간→L2 / 높음→L1
export function bandFromSeverity(band: SeverityBand): { low: number; high: number } {
  if (band === "낮음") return { low: 3, high: 4 };
  if (band === "중간") return { low: 2, high: 2 };
  return { low: 1, high: 1 };
}

// 영역 시드: Σ(응답값 × 영역 가중치)를 영역별 누적
export function computeAreaSeeds(
  items: FlatFirstLaunchItem[],
  responses: SurveyResponses,
): Record<string, number> {
  const seeds: Record<string, number> = {};
  for (const item of items) {
    if (!item.areas) continue;
    const v = responses[item.id];
    if (v == null) continue;
    for (const [area, weight] of Object.entries(item.areas)) {
      seeds[area] = (seeds[area] ?? 0) + v * weight;
    }
  }
  return seeds;
}

// 은둔심각도 시드가 높은지(관계·사회진입 게이트 잠금 기준).
// ss5·ss6·ss14 가중치 1.0 × 최대응답 3 = 최대 9점. 평균 '자주 그래(2)' 이상이면 높음.
export const SECLUSION_SEVERITY_LOCK_THRESHOLD = 6;
export function isSeclusionSeverityHigh(seeds: Record<string, number>): boolean {
  return (seeds["은둔심각도"] ?? 0) >= SECLUSION_SEVERITY_LOCK_THRESHOLD;
}

// 임시 단계: 은둔=true → 은둔(우선), 아니면 심각도 밴드 기반
export function tempStageFrom(secluded: boolean, band: SeverityBand): Stage {
  if (secluded) return STAGES.secluded;
  if (band === "높음") return STAGES.highly_isolated;
  if (band === "중간") return STAGES.at_risk;
  return STAGES.not_at_risk;
}

// 단계별 기본 금지조건(기존 규칙 유지)
export function stageForbidden(stage: Stage): string[] {
  switch (stage) {
    case STAGES.secluded:
      return ["외출", "대면", "전화", "관계대면"];
    case STAGES.highly_isolated:
      return ["대면", "전화", "외출"];
    case STAGES.at_risk:
      return ["대면은 저강도만"];
    default:
      return [];
  }
}

// 단계별 기본 난이도 밴드(기존 규칙 유지) — 단계 확정 시 사용
export function stageBands(stage: Stage): { low: number; high: number } {
  switch (stage) {
    case STAGES.secluded:
      return { low: 1, high: 1 };
    case STAGES.highly_isolated:
      return { low: 1, high: 2 };
    case STAGES.at_risk:
      return { low: 2, high: 3 };
    default:
      return { low: 3, high: 4 };
  }
}

export interface FirstLaunchResult {
  secluded: boolean;
  outingBurden: OutingBurden;
  severitySum: number;
  severityBand: SeverityBand;
  areaSeeds: Record<string, number>;
  stage: Stage; // 임시 단계 (나 알아가기 완료 시 확정)
  baseBandLow: number;
  baseBandHigh: number;
  forbidden: string[];
}

// 첫 실행 설문 전체 채점(단일 진입점)
export function scoreFirstLaunch(
  items: FlatFirstLaunchItem[],
  responses: SurveyResponses,
): FirstLaunchResult {
  const secluded = isSecluded(responses);
  const burden = outingBurdenFromScQ1(responses["sc_q1"] ?? 8);
  const sum = severitySum(responses);
  const band = severityBand(sum);
  const seeds = computeAreaSeeds(items, responses);
  const stage = tempStageFrom(secluded, band);
  const bands = secluded ? { low: 1, high: 1 } : bandFromSeverity(band);

  // 금지조건: 단계 기본 + 외출부담 + 은둔심각도 게이트 잠금(관계·사회진입)
  const forbidden = new Set(stageForbidden(stage));
  if (burden === "상") {
    forbidden.add("외출");
    forbidden.add("대면");
  } else if (burden === "중") {
    forbidden.add("외출");
  }
  if (isSeclusionSeverityHigh(seeds)) {
    forbidden.add("관계대면"); // 관계 게이트 잠금
    forbidden.add("외출"); // 사회진입 게이트 잠금
  }

  return {
    secluded,
    outingBurden: burden,
    severitySum: sum,
    severityBand: band,
    areaSeeds: seeds,
    stage,
    baseBandLow: bands.low,
    baseBandHigh: bands.high,
    forbidden: Array.from(forbidden),
  };
}

// 미션 생성 API 호환용 레거시 온보딩 답 파생(화면 비노출·프롬프트 맥락 전달용)
export function deriveLegacyAnswers(
  responses: SurveyResponses,
  result: FirstLaunchResult,
): { sleep: string; outing: string; contact: string; area: Area | "unknown" } {
  const ss1 = responses["ss1"] ?? 0; // 밤낮 바뀜
  const ss2 = responses["ss2"] ?? 0; // 불규칙
  const sleep = ss1 >= 2 ? "밤낮 바뀜" : ss1 === 1 || ss2 >= 2 ? "새벽" : ss2 === 1 ? "자정 전후" : "규칙적";

  const outing = result.outingBurden === "상" ? "매우 부담" : result.outingBurden === "중" ? "조금 부담" : "괜찮음";

  const ss10 = responses["ss10"] ?? 0; // 연락·만남 회피
  const contact = ss10 >= 3 ? "혼자가 편함" : ss10 === 2 ? "문자" : ss10 === 1 ? "전화" : "대면 괜찮음";

  // 시드 점수가 가장 높은 영역(부담 큰 영역) → 희망영역 맥락으로 전달
  const areaMap: Record<string, Area> = {
    생활리듬: AREAS.rhythm,
    자기돌봄_신체: AREAS.selfcare,
    관계: AREAS.relationship,
    사회진입: AREAS.social,
  };
  let best: Area | "unknown" = "unknown";
  let bestScore = 0;
  for (const [k, area] of Object.entries(areaMap)) {
    const s = result.areaSeeds[k] ?? 0;
    if (s > bestScore) {
      bestScore = s;
      best = area;
    }
  }
  return { sleep, outing, contact, area: best };
}

// ---- '나 알아가기' 채점 (고립 척도 25문항) ----

export interface KnowYourselfScore {
  answeredCount: number;
  rawTotal: number; // 역코딩 적용 합
  maxPossible: number; // 응답 문항 기준 만점
  scaled100: number; // 100점 만점 비례 환산
  isolationLevel: "비위험군" | "위험군" | "고위험군";
}

// 역코딩(reverse=4−v) 적용 총점 → 응답 문항 기준 100점 비례 환산 → 컷오프
export function scoreKnowYourself(responses: SurveyResponses): KnowYourselfScore {
  const reverse = getReverseItems();
  let rawTotal = 0;
  let maxPossible = 0;
  let answeredCount = 0;

  for (const ch of getChapters()) {
    for (const item of ch.items) {
      const v = responses[item.id];
      if (v == null) continue;
      const max = getScaleMax(item.scale);
      const value = reverse.has(item.id) ? max - v : v;
      rawTotal += value;
      maxPossible += max;
      answeredCount += 1;
    }
  }

  const scaled100 = maxPossible > 0 ? (rawTotal / maxPossible) * 100 : 0;
  // 컷오프는 JSON know_yourself.scoring.cutoffs에서 읽음(0~43 비위험군 / 44~59 위험군 / 60~100 고위험군)
  const cutoffs = getIsolationCutoffs();
  let isolationLevel: KnowYourselfScore["isolationLevel"] = "비위험군";
  for (const c of cutoffs) {
    if (scaled100 >= c.min) isolationLevel = c.label as KnowYourselfScore["isolationLevel"];
  }
  return { answeredCount, rawTotal, maxPossible, scaled100, isolationLevel };
}

// 최종 단계 확정: 은둔체크 양성=은둔(우선), 60+=고도고립, 44~59=고립위험군, 0~43=비위험군
export function finalStageFrom(secluded: boolean, score: KnowYourselfScore): Stage {
  if (secluded) return STAGES.secluded;
  if (score.isolationLevel === "고위험군") return STAGES.highly_isolated;
  if (score.isolationLevel === "위험군") return STAGES.at_risk;
  return STAGES.not_at_risk;
}

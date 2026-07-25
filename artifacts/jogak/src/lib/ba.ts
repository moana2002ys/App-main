import {
  Area,
  AREAS,
  Stage,
  STAGES,
  capBandForArea,
  determineTodayArea,
  getStageAllowedAreas,
  isAreaEligible,
} from "./classifier";
import {
  selectAreaMissions,
  defaultMinutesForLevel,
  type GeneratedMission,
} from "@workspace/mission-bank";

// ─────────────────────────────────────────────────────────────
// BA 사이클 v2 (알고리즘_v2_BA사이클.md · 2026-07-24 구현)
//  - 데일리 설문 2문항: 기분 5단계 + 활동 선택 (관심사는 주 1회 카드)
//  - 슬롯: 타깃 2 + 즐거움 1 + 회피 1 (본 사이클 첫 주는 3슬롯)
//  - 난이도 합성 = B안(계획 우선형): clamp(밴드 + 토글). 기분은 계산 불개입,
//    기분 ≤2일 때 토글 '기본값'만 가볍게로 추천.
//  - 사후 P/M 0–10 슬라이더(완료만), 미조작 시 내부 3.
//  - adjustBandNextDayV2: day_result 3분기, 완료→하향 없음.
//  - 진급: 주 1회 배치, 3조건 AND(첫 평가 M추세 면제), 동의 탭, 강등 없음.
//  - 금지어·낙인 원칙: 숫자·라벨·점수 UI 비노출. 게이트는 절대 완화하지 않는다.
// ─────────────────────────────────────────────────────────────

export type Mood = 1 | 2 | 3 | 4 | 5;

export const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: 1, label: "매우 별로", emoji: "🌧️" },
  { value: 2, label: "별로", emoji: "☁️" },
  { value: 3, label: "보통", emoji: "⛅" },
  { value: 4, label: "좋음", emoji: "☀️" },
  { value: 5, label: "매우 좋음", emoji: "🌈" },
];

// v1 3단 컨디션 게이트(minCondition)와의 브리지: 기분 ≥3 = "그저 그럼" 이상.
export function moodToCondition(mood: Mood | number): string {
  if (mood <= 2) return "바닥";
  if (mood === 3) return "그저 그럼";
  return "괜찮음";
}

// ── 사후 P/M ────────────────────────────────────────────────
// 0–10 슬라이더 → 내부 5구간. 0–2→1, 3–4→2, 5–6→3, 7–8→4, 9–10→5.
export function pmTo5(v: number): number {
  const x = Math.max(0, Math.min(10, Math.round(v)));
  if (x <= 2) return 1;
  if (x <= 4) return 2;
  if (x <= 6) return 3;
  if (x <= 8) return 4;
  return 5;
}

// ── 토글(사전 난이도 선택) ──────────────────────────────────
export type Toggle = "light" | "normal" | "challenge";

export const TOGGLE_LABEL: Record<Toggle, string> = {
  light: "가볍게",
  normal: "보통",
  challenge: "도전",
};

const TOGGLE_DELTA: Record<Toggle, number> = {
  light: -1,
  normal: 0,
  challenge: 1,
};

// 토글 기본값(B안): 기본 '가볍게'. 넛지 상향 시 '보통'.
// 기분 ≤2인 날은 넛지와 무관하게 기본 '가볍게'(추천만, 선택은 존중).
export function defaultToggle(mood: number, nudgeDefaultNormal: boolean): Toggle {
  if (mood <= 2) return "light";
  return nudgeDefaultNormal ? "normal" : "light";
}

// 최종 시도 난이도 = clamp(밴드기준 + 토글). 영역캡은 상한, 클램프는 마지막 1회.
export function effectiveLevel(
  baseLevel: number,
  toggle: Toggle,
  stage: Stage,
  area: Area,
): number {
  const raw = baseLevel + TOGGLE_DELTA[toggle];
  const cap = capBandForArea(stage, area, 1, 5);
  return Math.max(1, Math.min(cap.high, Math.min(5, raw)));
}

// ── 슬롯 ────────────────────────────────────────────────────
export type SlotKind = "target" | "pleasure" | "avoidance";

export const SLOT_BADGE: Record<SlotKind, string> = {
  target: "내가 고른 영역",
  pleasure: "즐거움 활동",
  avoidance: "조금 어려워했던 활동",
};

// 왜 이 조각을 추천했는지(BA 근거) — 낙인 언어 없이 이유만.
export const SLOT_REASON: Record<SlotKind, string> = {
  target: "오늘 체크인에서 고른 방향과 이어지는 조각이에요.",
  pleasure: "최근 즐겁게 해낸 조각과 닮았어요. 즐거움은 회복의 연료거든요.",
  avoidance: "요즘 미뤄뒀던 조각을 아주 작게 쪼갰어요. 작게 다시 만나보면 돼요.",
};

// "어디서 해볼까요?" 선택지 — 챌린지 종류에 따라 공간 범위를 다르게 제시.
// 실외형이면 집 밖의 단계적 공간, 부엌형이면 부엌 포함, 그 외 기본 내 방/거실/집 밖.
// 외출 게이트가 있으면 실외 선택지는 권하지 않는다(활동 자체는 게이트로 이미 걸러짐).
export interface PlaceOption {
  label: string;
  emoji: string;
}

const OUTDOOR_TITLE = /밖|산책|걷|외출|현관|편의점|공원|바깥|나가/;
const KITCHEN_TITLE = /요리|밥|식사|설거지|물 한 잔|차 한 잔|마시/;

export function placeOptionsForSlot(
  slot: { area: Area; title: string },
  forbidden: string[],
): PlaceOption[] {
  const outdoorGated = forbidden.includes("외출");
  if (OUTDOOR_TITLE.test(slot.title) && !outdoorGated) {
    // 실외형: 부담이 낮은 순서의 단계적 공간
    return [
      { label: "현관 앞", emoji: "🚪" },
      { label: "집 근처", emoji: "🏘️" },
      { label: "공원·산책로", emoji: "🌳" },
    ];
  }
  if (KITCHEN_TITLE.test(slot.title)) {
    return [
      { label: "부엌", emoji: "🫖" },
      { label: "거실", emoji: "🛋️" },
      { label: "내 방", emoji: "🛏️" },
    ];
  }
  const base: PlaceOption[] = [
    { label: "내 방", emoji: "🛏️" },
    { label: "거실", emoji: "🛋️" },
    { label: "집 밖", emoji: "🌳" },
  ];
  return outdoorGated ? base.filter((p) => p.label !== "집 밖") : base;
}

// 토글 기본값을 왜 그렇게 추천했는지 한 줄 설명(선택은 언제나 사용자 몫).
export function toggleDefaultReason(mood: number, nudgeDefaultNormal: boolean): string {
  if (mood <= 2) return "오늘은 마음이 조금 무거운 날이라, '가볍게'부터 추천해요.";
  if (nudgeDefaultNormal)
    return "'가볍게'를 이틀 연속 잘 해내서, 이번엔 '보통'부터 추천해요.";
  return "처음엔 부담 없이, '가볍게'부터 시작하길 추천해요.";
}

export type TimeOfDay = "morning" | "noon" | "evening";
export const TIME_LABEL: Record<TimeOfDay, string> = {
  morning: "아침",
  noon: "점심",
  evening: "저녁",
};

export interface DaySlot {
  id: string; // `${dayCount}-${index}`
  kind: SlotKind;
  area: Area;
  level: number; // 밴드 기준 레벨(토글 미적용)
  title: string;
  minutes: number;
  reflectQ: string;
  // 계획(사전) 입력
  toggle: Toggle;
  timeOfDay: TimeOfDay | null;
  place?: string; // 고립위험군+ "어디서"
  withWhom?: string; // 비위험군+ "누구와"
  // 상태
  status: "proposed" | "accepted" | "completed" | "skipped";
  // 사후 평정(완료 시)
  p?: number; // 0–10 원값
  m?: number; // 0–10 원값
  memo?: string; // "기억하고 싶은 순간" (선택)
  skipReason?: string;
}

// 단계별 계획 깊이: 고립위험군부터 "어디서", 비위험군은 "누구와"까지.
export function planDepth(stage: Stage | null): { place: boolean; withWhom: boolean } {
  if (stage === STAGES.at_risk) return { place: true, withWhom: false };
  if (stage === STAGES.not_at_risk) return { place: true, withWhom: true };
  return { place: false, withWhom: false };
}

// ── 하루 기록(마이페이지 그래프·진급 배치의 원장) ───────────
export interface DayRecord {
  day: number;
  mood: number | null; // 데일리 설문 기분(1~5), 무응답 null
  proposedTarget: number;
  proposedPleasure: number;
  completedTarget: number;
  completedPleasure: number;
  completedAvoidance: number;
  explicitSkips: number;
  // 완료 슬롯의 P/M(내부 5구간 평균)
  mAvg: number | null; // 완료 타깃 슬롯 M 평균
  pAvg: number | null; // 완료 전 슬롯 P 평균
}

export type DayResult = "completed" | "kept" | "missed";

export function classifyDayResult(slots: DaySlot[]): DayResult {
  const done = slots.filter((s) => s.status === "completed");
  if (done.some((s) => s.kind === "target")) return "completed";
  if (done.length > 0) return "kept";
  return "missed";
}

// ── 다음 날 밴드 조정 v2 (v1 표 대체) ───────────────────────
// day_result 3분기. 완료(어떤 형태든) → 하향 없음.
export interface BandAdjustV2Input {
  bandLow: number;
  bandHigh: number;
  slots: DaySlot[];
  missedStreak: number; // 오늘 이전까지의 연속 미완료 일수
  nudgeStreak: number; // 완료&M≥4&토글 보통이하 연속 카운터
  lowMStreak: number; // 완료&M≤2 연속 카운터
  nudgeDefaultNormal: boolean;
}

export interface BandAdjustV2Result {
  bandLow: number;
  bandHigh: number;
  missedStreak: number;
  nudgeStreak: number;
  lowMStreak: number;
  nudgeDefaultNormal: boolean;
  pleasureBoost: boolean; // (완료&M≤2&P_day≤2) → 즐거움 가중치↑ 신호
  message?: string;
}

export function adjustBandNextDayV2(input: BandAdjustV2Input): BandAdjustV2Result {
  const { slots } = input;
  let low = input.bandLow;
  let high = input.bandHigh;
  let missedStreak = input.missedStreak;
  let nudgeStreak = input.nudgeStreak;
  let lowMStreak = input.lowMStreak;
  let nudgeDefaultNormal = input.nudgeDefaultNormal;
  let pleasureBoost = false;
  let message: string | undefined;

  const result = classifyDayResult(slots);
  const doneTargets = slots.filter((s) => s.kind === "target" && s.status === "completed");
  const doneAll = slots.filter((s) => s.status === "completed");

  const mBand =
    doneTargets.length > 0
      ? Math.round(
          doneTargets.reduce((s, x) => s + pmTo5(x.m ?? 3), 0) / doneTargets.length,
        )
      : null;
  const pDay =
    doneAll.length > 0
      ? Math.round(doneAll.reduce((s, x) => s + pmTo5(x.p ?? 3), 0) / doneAll.length)
      : null;
  const tBand: Toggle | null =
    doneTargets.length > 0
      ? doneTargets.reduce<Toggle>(
          (acc, x) => (TOGGLE_DELTA[x.toggle] > TOGGLE_DELTA[acc] ? x.toggle : acc),
          "light",
        )
      : null;

  if (result === "completed") {
    missedStreak = 0;
    if (mBand !== null && mBand >= 4) {
      lowMStreak = 0;
      if (tBand === "challenge") {
        low = Math.min(5, low + 1);
        high = Math.min(5, high + 1);
        nudgeStreak = 0;
        message = "어제 스스로 고른 도전을 해냈어요. 오늘은 조금 더 나아가 볼까요?";
      } else {
        nudgeStreak += 1;
        if (nudgeStreak >= 2) {
          if (!nudgeDefaultNormal) {
            // 넛지 도달: 기본값 '보통' + 밴드 +1 (표: nudge_streak 2 도달 시 +1)
            low = Math.min(5, low + 1);
            high = Math.min(5, high + 1);
          }
          nudgeDefaultNormal = true;
          nudgeStreak = 0;
        }
      }
    } else if (mBand !== null && mBand <= 2) {
      nudgeStreak = 0;
      lowMStreak += 1;
      message = "어제는 마음이 좀 무거웠나 봐요. 해낸 것만으로 충분해요.";
      if (lowMStreak >= 2) {
        nudgeDefaultNormal = false; // 토글 기본값 '가볍게' 복귀(밴드 불변)
        lowMStreak = 0;
      }
      if (pDay !== null && pDay <= 2) pleasureBoost = true;
    } else {
      nudgeStreak = 0;
      lowMStreak = 0;
    }
  } else if (result === "kept") {
    // 즐거움·회피만 완료 = 유지(ΔB 0) + 연속 미완료 카운터 리셋
    missedStreak = 0;
  } else {
    missedStreak += 1;
    if (missedStreak >= 2) {
      low = 1;
      high = 1;
      message = "괜찮아요, 쉬어가는 날도 있는 법이죠. 아주 작은 조각부터 다시 시작해봐요.";
    } else {
      low = Math.max(1, low - 1);
      high = Math.max(1, high - 1);
      message = "어제는 그냥 지나간 날이었어요. 오늘은 더 작은 조각을 준비했어요.";
    }
  }

  return {
    bandLow: low,
    bandHigh: Math.max(low, high),
    missedStreak,
    nudgeStreak,
    lowMStreak,
    nudgeDefaultNormal,
    pleasureBoost,
    message,
  };
}

// ── skip 원장(명시적 skip만) ────────────────────────────────
export interface SkipEntry {
  day: number;
  area: Area;
  title: string;
  level: number;
  reason?: string;
}

export const SKIP_REASONS = [
  "너무 피곤했어요",
  "잊어버렸어요",
  "시간이 부족했어요",
  "다른 일이 생겼어요",
  "그냥 하기 싫었어요",
];

// 2주 창 내 같은 영역 명시적 skip이 가장 잦은 항목 → 회피 슬롯 대상.
// 우선순위: skip 횟수 내림차순, 동률 시 최근성.
export function pickAvoidanceSource(
  skipLog: SkipEntry[],
  today: number,
): SkipEntry | null {
  const windowLog = skipLog.filter((e) => today - e.day <= 14);
  if (windowLog.length === 0) return null;
  const byArea = new Map<Area, { count: number; latest: SkipEntry }>();
  for (const e of windowLog) {
    const cur = byArea.get(e.area);
    if (!cur) byArea.set(e.area, { count: 1, latest: e });
    else {
      cur.count += 1;
      if (e.day >= cur.latest.day) cur.latest = e;
    }
  }
  let best: { count: number; latest: SkipEntry } | null = null;
  for (const v of byArea.values()) {
    if (!best || v.count > best.count || (v.count === best.count && v.latest.day > best.latest.day)) {
      best = v;
    }
  }
  // 회피 슬롯 자격: 같은 세부영역 2회 이상
  return best && best.count >= 2 ? best.latest : null;
}

// ── 영역별 P/M 누적(마이페이지 + 즐거움 슬롯 가중치) ────────
export interface AreaPM {
  pSum: number;
  pN: number;
  mSum: number;
  mN: number;
}

export type AreaPMMap = Partial<Record<Area, AreaPM>>;

export function accumulateAreaPM(map: AreaPMMap, slots: DaySlot[]): AreaPMMap {
  const next: AreaPMMap = { ...map };
  for (const s of slots) {
    if (s.status !== "completed") continue;
    const cur = next[s.area] ?? { pSum: 0, pN: 0, mSum: 0, mN: 0 };
    next[s.area] = {
      pSum: cur.pSum + pmTo5(s.p ?? 3),
      pN: cur.pN + 1,
      mSum: cur.mSum + pmTo5(s.m ?? 3),
      mN: cur.mN + 1,
    };
  }
  return next;
}

// 즐거움 슬롯 영역: P 평균 상위(허용∩게이트) 영역. 데이터 없으면 null(→관심사 폴백).
export function topPleasureArea(
  areaPM: AreaPMMap,
  stage: Stage,
  forbidden: string[],
  boostArea?: Area | null,
): Area | null {
  const allowed = getStageAllowedAreas(stage).filter((a) => isAreaEligible(a, forbidden));
  let best: Area | null = null;
  let bestAvg = 0;
  for (const a of allowed) {
    const pm = areaPM[a];
    if (!pm || pm.pN === 0) continue;
    let avg = pm.pSum / pm.pN;
    if (boostArea === a) avg += 0.5;
    if (avg > bestAvg) {
      bestAvg = avg;
      best = a;
    }
  }
  return best;
}

// ── 오늘의 슬롯 생성 ────────────────────────────────────────
export interface PlanSlotsParams {
  dayCount: number;
  stage: Stage;
  forbidden: string[];
  bandLow: number;
  bandHigh: number;
  mood: number; // 1~5
  desiredArea: Area | "unknown";
  activityId?: string;
  areaSeeds?: Record<string, number> | null;
  interests: string[];
  areaPM: AreaPMMap;
  skipLog: SkipEntry[];
  cycleStartDay: number; // 본 사이클 시작 dayCount
  nudgeDefaultNormal: boolean;
  earlyAvoidance: boolean; // 온보딩 skip_pattern으로 조기 활성화
  pleasureBoostArea?: Area | null;
}

// 첫 주 3슬롯(타깃2+즐거움1), 2주차부터 회피 슬롯 추가.
export function planTodaySlots(params: PlanSlotsParams): DaySlot[] {
  const {
    dayCount, stage, forbidden, mood, interests, areaPM, skipLog,
  } = params;
  const condition = moodToCondition(mood as Mood);
  const rotation = dayCount; // 데모: dayCount 기반 회전(하루 안 안정)
  const usedTitles = new Set<string>();
  const usedCategories = new Set<string>();
  const slots: DaySlot[] = [];
  const toggleDefault = defaultToggle(mood, params.nudgeDefaultNormal);

  const push = (kind: SlotKind, m: GeneratedMission) => {
    usedTitles.add(m.title);
    slots.push({
      id: `${dayCount}-${slots.length}`,
      kind,
      area: m.area as Area,
      level: m.level,
      title: m.title,
      minutes: m.minutes,
      reflectQ: m.reflectQ,
      toggle: toggleDefault,
      timeOfDay: null,
      status: "proposed",
    });
  };

  // 1–2 타깃: 설문 선택 활동 → 슬롯 1 반영, 난이도 서로 다르게.
  const targetArea = determineTodayArea(stage, params.desiredArea, forbidden, params.areaSeeds);
  const cappedT = capBandForArea(stage, targetArea, params.bandLow, params.bandHigh);
  const targetMissions = selectAreaMissions({
    area: targetArea,
    bandLow: cappedT.low,
    bandHigh: cappedT.high,
    forbidden,
    condition,
    interest: interests[0],
    rotation,
    count: 2,
    avoidTitles: usedTitles,
    usedCategories,
    preferredCategoryId: params.activityId,
  });
  for (const m of targetMissions.slice(0, 2)) push("target", m);

  // 3 즐거움: P 누적 상위 영역, 없으면 관심사 폴백(타깃 영역에서 취향 변주).
  const pArea = topPleasureArea(areaPM, stage, forbidden, params.pleasureBoostArea) ?? targetArea;
  const cappedP = capBandForArea(stage, pArea, params.bandLow, params.bandHigh);
  const pleasureMissions = selectAreaMissions({
    area: pArea,
    bandLow: Math.max(1, cappedP.low - (mood <= 2 ? 1 : 0)),
    bandHigh: cappedP.low, // 즐거움은 부담 낮게: 밴드 하단 사용
    forbidden,
    condition,
    interest: interests[0],
    rotation: rotation + 3,
    count: 1,
    avoidTitles: usedTitles,
    usedCategories,
  });
  if (pleasureMissions[0]) push("pleasure", pleasureMissions[0]);

  // 4 회피: 2주차부터(또는 조기 활성화). 반복 skip 영역의 더 작은 버전(더 낮은 밴드).
  const weekIndex = Math.floor((dayCount - params.cycleStartDay) / 7); // 0 = 첫 주
  const avoidanceOpen = weekIndex >= 1 || params.earlyAvoidance;
  if (avoidanceOpen) {
    const source = pickAvoidanceSource(skipLog, dayCount);
    if (source && isAreaEligible(source.area, forbidden)) {
      const smallerLevel = Math.max(1, source.level - 1);
      const avoidMissions = selectAreaMissions({
        area: source.area,
        bandLow: smallerLevel,
        bandHigh: smallerLevel,
        forbidden,
        condition,
        rotation: rotation + 7,
        count: 1,
        avoidTitles: usedTitles,
        usedCategories,
      });
      if (avoidMissions[0]) push("avoidance", avoidMissions[0]);
    } else {
      // skip 데이터 없음 = 좋은 신호 → 타깃 다양성 미션으로 대체
      const extra = selectAreaMissions({
        area: targetArea,
        bandLow: cappedT.low,
        bandHigh: cappedT.high,
        forbidden,
        condition,
        interest: interests[0],
        rotation: rotation + 11,
        count: 1,
        avoidTitles: usedTitles,
        usedCategories,
      });
      if (extra[0]) push("target", extra[0]);
    }
  }

  return slots;
}

// ── 진급(주 1회 배치) ───────────────────────────────────────
export const STAGE_ORDER: Stage[] = [
  STAGES.secluded,
  STAGES.highly_isolated,
  STAGES.at_risk,
  STAGES.not_at_risk,
];

export function nextStage(stage: Stage): Stage | null {
  const i = STAGE_ORDER.indexOf(stage);
  return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1]! : null;
}

// 트리거(전부 AND):
// ① 최근 2주 완료율 ≥60% — 분모 = 타깃+즐거움 제안 수, 회피 완료는 분자 보너스
// ② 2주 창 타깃 완료 ≥3회
// ③ M 추세 비하락(뒤 1주 평균 ≥ 앞 1주 평균) — 첫 평가는 면제
export function checkPromotion(
  records: DayRecord[],
  today: number,
  firstEvaluation: boolean,
): boolean {
  const win = records.filter((r) => today - r.day <= 14 && r.day < today);
  const denom = win.reduce((s, r) => s + r.proposedTarget + r.proposedPleasure, 0);
  if (denom === 0) return false;
  const numer = win.reduce(
    (s, r) => s + r.completedTarget + r.completedPleasure + r.completedAvoidance,
    0,
  );
  if (numer / denom < 0.6) return false;
  const targetDone = win.reduce((s, r) => s + r.completedTarget, 0);
  if (targetDone < 3) return false;
  if (!firstEvaluation) {
    const withM = win.filter((r) => r.mAvg !== null);
    const older = withM.filter((r) => today - r.day > 7);
    const recent = withM.filter((r) => today - r.day <= 7);
    if (older.length > 0 && recent.length > 0) {
      const avg = (xs: DayRecord[]) => xs.reduce((s, r) => s + (r.mAvg ?? 0), 0) / xs.length;
      if (avg(recent) < avg(older)) return false;
    }
  }
  return true;
}

// ── 마이크로 피드백 가드 ────────────────────────────────────
// 최근 7일 완료일 ≥3 AND 미완료일 ≥2 AND (완료일 기분 − 미완료일 기분) > 0 일 때만.
export function microFeedback(records: DayRecord[], today: number): string | null {
  const win = records.filter((r) => today - r.day <= 7);
  const doneDays = win.filter(
    (r) => r.completedTarget + r.completedPleasure + r.completedAvoidance > 0 && r.mood !== null,
  );
  const missedDays = win.filter(
    (r) => r.completedTarget + r.completedPleasure + r.completedAvoidance === 0 && r.mood !== null,
  );
  if (doneDays.length < 3 || missedDays.length < 2) return null;
  const avg = (xs: DayRecord[]) => xs.reduce((s, r) => s + (r.mood ?? 0), 0) / xs.length;
  const diff = avg(doneDays) - avg(missedDays);
  if (diff <= 0) return null;
  const rounded = Math.round(diff * 10) / 10;
  return `이번 주, 조각을 맞춘 날 기분이 평균 ${rounded}칸 높았어요.`;
}

// ── 온보딩 1주 고정 미션 ────────────────────────────────────
// 실패가 거의 불가능한 초소형 미션. 계획 입력 없음(하거나/건너뛰거나만).
export interface OnboardingMission {
  day: number; // 1~7
  title: string;
  minutes: number;
  area: Area;
  // Day1 심리교육 / Day2 상황 체크리스트(설문 미션) / 나머지 초소형 미션
  kind?: "learn" | "survey";
  // 게이트: 외출 금지 사용자용 대체 문구
  outdoorAlt?: string;
}

export const ONBOARDING_WEEK: OnboardingMission[] = [
  { day: 1, title: "고립과 은둔, 가볍게 알아보기", minutes: 3, area: AREAS.selfcare, kind: "learn" },
  { day: 2, title: "내 상황 돌아보기 체크리스트", minutes: 5, area: AREAS.selfcare, kind: "survey" },
  { day: 3, title: "물 한 잔 마시기", minutes: 1, area: AREAS.rhythm },
  { day: 4, title: "커튼 걷고 잠깐 환기하기", minutes: 2, area: AREAS.rhythm },
  { day: 5, title: "1분 기지개·스트레칭", minutes: 1, area: AREAS.selfcare },
  {
    day: 6,
    title: "현관문 밖에 잠깐 나갔다 오기",
    minutes: 2,
    area: AREAS.rhythm,
    outdoorAlt: "창밖 풍경 1분 바라보기",
  },
  { day: 7, title: "좋아하는 노래 1곡 듣기", minutes: 4, area: AREAS.selfcare },
];

export function getOnboardingMission(day: number, forbidden: string[]): OnboardingMission {
  const m = ONBOARDING_WEEK[Math.max(0, Math.min(6, day - 1))]!;
  if (m.outdoorAlt && forbidden.includes("외출")) {
    return { ...m, title: m.outdoorAlt, outdoorAlt: undefined };
  }
  return m;
}

export interface OnboardingDayEntry {
  day: number; // 1~7
  mood: number; // 1~5
  completed: boolean;
  p?: number; // 1~5 (탭)
  m?: number; // 1~5 (탭)
  skipped?: boolean;
}

export interface OnboardingWeekState {
  dayIndex: number; // 다음 진행할 온보딩 날(1~7). 8 = 완료
  entries: OnboardingDayEntry[];
  done: boolean;
}

export const emptyOnboardingWeek = (): OnboardingWeekState => ({
  dayIndex: 1,
  entries: [],
  done: false,
});

// 온보딩 1주 → 시작 데이터
export function summarizeOnboardingWeek(state: OnboardingWeekState): {
  moodBaseline: number | null;
  earlyAvoidance: boolean;
  initialAreaPM: AreaPMMap;
} {
  const moods = state.entries.map((e) => e.mood).filter((v) => v >= 1);
  const moodBaseline =
    moods.length > 0
      ? Math.round((moods.reduce((s, v) => s + v, 0) / moods.length) * 10) / 10
      : null;
  // 명시적 skip ≥2회 → 회피 슬롯 조기 활성화
  const skips = state.entries.filter((e) => e.skipped).length;
  const initialAreaPM: AreaPMMap = {};
  for (const e of state.entries) {
    if (!e.completed) continue;
    const mission = ONBOARDING_WEEK[e.day - 1];
    if (!mission) continue;
    const cur = initialAreaPM[mission.area] ?? { pSum: 0, pN: 0, mSum: 0, mN: 0 };
    initialAreaPM[mission.area] = {
      pSum: cur.pSum + (e.p ?? 3),
      pN: cur.pN + 1,
      mSum: cur.mSum + (e.m ?? 3),
      mN: cur.mN + 1,
    };
  }
  return { moodBaseline, earlyAvoidance: skips >= 2, initialAreaPM };
}

// ── 4주 게이트 재평가(1문항) ────────────────────────────────
// 금지조건 1개를 골라 가벼운 확인. 게이트 플래그만 갱신, 단계·밴드 불변.
export const GATE_RECHECK_QUESTION: Record<string, string> = {
  외출: "요즘 잠깐 바깥에 나가는 건 어때요?",
  전화: "요즘 전화는 어때요?",
  대면: "요즘 누군가와 마주치는 건 어때요?",
  관계대면: "요즘 사람을 만나는 건 어때요?",
};

export function pickGateRecheckTarget(forbidden: string[]): string | null {
  for (const key of ["외출", "전화", "대면", "관계대면"]) {
    if (forbidden.includes(key)) return key;
  }
  return null;
}

export { defaultMinutesForLevel };

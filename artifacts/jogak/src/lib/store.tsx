import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { Area, Stage, OnboardingAnswers } from "./classifier";
import { getMe, saveState, logout as logoutApi } from "@workspace/api-client-react";
import { GrowthEvent, emptyCounts } from "./rewards";
import { DecoEquipped, PlacedFurniture } from "./decor";
import { DateKey, addDays, diffDays, todayKey } from "./day";
import {
  AreaPMMap,
  DayRecord,
  DaySlot,
  OnboardingWeekState,
  SkipEntry,
  adjustBandNextDayV2,
  checkPromotion,
  classifyDayResult,
  accumulateAreaPM,
  nextStage,
} from "./ba";

export type ViewState =
  | 'loading'
  | 'auth'
  | 'onboarding'
  | 'taster'
  | 'onboarding_week'
  | 'daily_checkin'
  | 'know_yourself'
  | 'home'
  | 'reflection'
  | 'growth'
  | 'deco_character'
  | 'deco_room';

// 데일리 설문 v2: 기분 5단계 + 활동 선택(2문항). 관심사는 주 1회 카드.
export interface DailyAnswersV2 {
  mood: number; // 1~5
  area: Area | 'unknown';
  activityId?: string;
}

export interface UserState {
  email: string;
  nickname: string;
  characterColor: string;
  stage: Stage | null;
  baseBandLow: number;
  baseBandHigh: number;
  currentBandLow: number;
  currentBandHigh: number;
  forbidden: string[];

  onboarding: OnboardingAnswers | null;
  daily: DailyAnswersV2 | null;

  // 설문 JSON 기반 온보딩 내부 상태(화면 비노출)
  surveyResponses: Record<string, number> | null; // sc_q1·sc_q2·ss1~ss15 원응답
  secluded: boolean; // 은둔 체크 양성 여부(단계 확정 시 우선 적용)
  areaSeeds: Record<string, number> | null; // 영역 시드(부담 프로파일)

  // '나 알아가기' (고립 척도 25문항 · 5챕터) 진행 상태
  knowYourself: KnowYourselfState | null;

  // ── BA 사이클 v2 ─────────────────────────────────────────
  phase: 'onboarding_week' | 'cycle'; // 설문 직후 1주 고정 미션 → 본 사이클
  onboardingWeek: OnboardingWeekState | null;
  moodBaseline: number | null; // 온보딩 1주 기분 평균(그래프 기준선)
  interests: string[]; // 온보딩 수집 + 주 1회 갱신 카드
  interestAskedDay: number | null; // 마지막으로 관심사 카드를 보여준 dayCount
  interestBoostUntil: number | null; // 갱신 직후 3일 부스트 종료 dayCount
  areaPM: AreaPMMap; // 영역별 P/M 누적(즐거움 슬롯 가중치 + 마이페이지)
  skipLog: SkipEntry[]; // 명시적 skip 원장
  dayRecords: DayRecord[]; // 하루 요약 원장(그래프·진급 배치)
  todaySlots: DaySlot[] | null; // 오늘의 슬롯(타깃2+즐거움1+회피1)
  reflectSlotId: string | null; // 지금 사후 평정 중인 슬롯
  nudgeStreak: number;
  lowMStreak: number;
  missedStreak: number; // 연속 미완료 일수
  nudgeDefaultNormal: boolean; // 토글 기본값 '보통' 넛지 상태
  pleasureBoostArea: Area | null;
  cycleStartDay: number | null; // 본 사이클 시작 dayCount ("2주차" 기준)
  lastPromotionCheckDay: number | null;
  promotionEvaluated: boolean; // 첫 평가 여부(M추세 면제 판단)
  promotionOffer: boolean; // "다음 조각으로 넘어가볼까요?" 노출 대기
  promotionDeclinedDay: number | null; // 거절 시 2주 뒤 재제안
  gateRecheckDay: number | null; // 마지막 게이트 재평가 dayCount
  gateRecheckPending: string | null; // 재평가 대상 금지 태그

  points: number;
  totalCompletions: number;
  streakDays: number;

  // 보상 상태 (누적·회수 없음) — 세부 카테고리별 누적 완료 카운트
  categoryCounts: Record<string, number>;
  badges: string[];
  equippedItems: string[];
  backgroundStage: number;
  growthLog: GrowthEvent[];

  // 꾸미기 (deco-lab 통합): 캐릭터 착용 아이템(카테고리별 1개) + 방 가구 배치
  decoEquipped: DecoEquipped;
  roomPlacements: PlacedFurniture[];

  dayCount: number;

  // ── 실날짜(개인별 온보딩 날짜) ───────────────────────────
  // dayCount는 startedAt과 오늘 날짜에서 파생된다. 사람마다 가입일이 다르므로
  // 같은 날 앱을 열어도 각자 다른 Day를 본다. 아래 3개가 그 원천.
  startedAt: DateKey | null; // 온보딩을 시작한 날(가입일)
  lastSeenDate: DateKey | null; // 마지막으로 앱을 연 날 — 롤오버 감지용
  demoDayOffset: number; // 시연용으로 앞당긴 일수(실제 날짜엔 영향 없음)

  taster: TasterState | null; // 맛보기 챌린지(설문 직후 1회)

  consecutiveSkips: number;
  lastMessage?: string;
  pendingPraise?: string;
}

// 맛보기 챌린지 — 설문 직후 "실패가 불가능한" 1개를 즉시 해보는 구간.
export interface TasterState {
  missionId: string;
  completed: boolean;
  skipped: boolean;
  p?: number; // 즐거움 1~5(간이 탭)
  dateKey: DateKey | null;
}

interface AppContextType {
  view: ViewState;
  setView: (v: ViewState) => void;
  user: UserState;
  updateUser: (updates: Partial<UserState>) => void;
  nextDay: () => void;
  enterFromServer: (email: string, state: Record<string, unknown> | null | undefined) => void;
  signOut: () => Promise<void>;
}

const defaultUser: UserState = {
  email: '',
  nickname: '',
  characterColor: '#FBBF24',
  stage: null,
  baseBandLow: 1,
  baseBandHigh: 1,
  currentBandLow: 1,
  currentBandHigh: 1,
  forbidden: [],
  onboarding: null,
  daily: null,
  surveyResponses: null,
  secluded: false,
  areaSeeds: null,
  knowYourself: null,
  phase: 'onboarding_week',
  onboardingWeek: null,
  moodBaseline: null,
  interests: [],
  interestAskedDay: null,
  interestBoostUntil: null,
  areaPM: {},
  skipLog: [],
  dayRecords: [],
  todaySlots: null,
  reflectSlotId: null,
  nudgeStreak: 0,
  lowMStreak: 0,
  missedStreak: 0,
  nudgeDefaultNormal: false,
  pleasureBoostArea: null,
  cycleStartDay: null,
  lastPromotionCheckDay: null,
  promotionEvaluated: false,
  promotionOffer: false,
  promotionDeclinedDay: null,
  gateRecheckDay: null,
  gateRecheckPending: null,
  points: 0,
  totalCompletions: 0,
  streakDays: 0,
  categoryCounts: emptyCounts(),
  badges: [],
  equippedItems: [],
  backgroundStage: 0,
  growthLog: [],
  decoEquipped: {},
  roomPlacements: [],
  dayCount: 1,
  startedAt: null,
  lastSeenDate: null,
  demoDayOffset: 0,
  taster: null,
  consecutiveSkips: 0,
};

// ── 날짜 → dayCount 파생 ────────────────────────────────────
/** 가입일과 오늘 날짜로 계산한 "오늘은 며칠째인가". 가입 당일 = 1. */
export function targetDayCount(user: UserState, today: DateKey = todayKey()): number {
  if (!user.startedAt) return user.dayCount; // 레거시 저장분: 기존 카운터 유지
  const elapsed = diffDays(today, user.startedAt);
  return Math.max(1, elapsed + 1 + user.demoDayOffset);
}

/** 오늘이 가입 후 며칠째인지에 대응하는 날짜 키. 타임라인 표시용. */
export function dateKeyForDay(user: UserState, day: number): DateKey | null {
  if (!user.startedAt) return null;
  return addDays(user.startedAt, day - 1 - user.demoDayOffset);
}

// '나 알아가기' 진행 상태 — 하루 1챕터, 중단 지점 저장·이어하기, 분기 스킵 기록
export interface KnowYourselfState {
  responses: Record<string, number>; // k1~k25 원응답
  chapterIndex: number; // 다음에 진행할 챕터 인덱스(0~4)
  itemIndex: number; // 해당 챕터에서 이어할 문항 인덱스
  skippedChapters: string[]; // 분기 '아니오'로 건너뛴 챕터 id
  completedChapters: string[]; // 완료(응답)한 챕터 id
  lastChapterDay: number | null; // 마지막으로 챕터를 진행한 dayCount (하루 1장 제한)
  finalized: boolean; // 5챕터 완료 → 단계 확정됨
}

export const emptyKnowYourself = (): KnowYourselfState => ({
  responses: {},
  chapterIndex: 0,
  itemIndex: 0,
  skippedChapters: [],
  completedChapters: [],
  lastChapterDay: null,
  finalized: false,
});

const AppContext = createContext<AppContextType | null>(null);

// 하루 요약 레코드 생성(그래프·진급 배치용 원장).
function buildDayRecord(prev: UserState): DayRecord {
  const slots = prev.todaySlots ?? [];
  const done = slots.filter((s) => s.status === 'completed');
  const doneTargets = done.filter((s) => s.kind === 'target');
  const to5 = (v: number | undefined) => {
    const x = Math.max(0, Math.min(10, Math.round(v ?? 3)));
    if (x <= 2) return 1;
    if (x <= 4) return 2;
    if (x <= 6) return 3;
    if (x <= 8) return 4;
    return 5;
  };
  return {
    day: prev.dayCount,
    mood: prev.daily?.mood ?? null,
    proposedTarget: slots.filter((s) => s.kind === 'target').length,
    proposedPleasure: slots.filter((s) => s.kind === 'pleasure').length,
    completedTarget: doneTargets.length,
    completedPleasure: done.filter((s) => s.kind === 'pleasure').length,
    completedAvoidance: done.filter((s) => s.kind === 'avoidance').length,
    explicitSkips: slots.filter((s) => s.status === 'skipped').length,
    mAvg:
      doneTargets.length > 0
        ? doneTargets.reduce((s, x) => s + to5(x.m), 0) / doneTargets.length
        : null,
    pAvg: done.length > 0 ? done.reduce((s, x) => s + to5(x.p), 0) / done.length : null,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewState>('loading');
  const [user, setUser] = useState<UserState>(defaultUser);

  const updateUser = useCallback((updates: Partial<UserState>) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  // 로그인/가입/세션 복원 후 서버에 저장된 상태로 이어서 시작
  const enterFromServer = useCallback((email: string, state: Record<string, unknown> | null | undefined) => {
    const saved = (state ?? null) as Partial<UserState> | null;
    const today = todayKey();
    if (saved && saved.stage) {
      let merged = { ...defaultUser, ...saved, email };
      // 구버전 저장분(BA 이전) 호환: phase 없으면 본 사이클로 간주
      if (!(saved as Record<string, unknown>).phase) {
        merged.phase = 'cycle';
      }
      // 실날짜 도입 전 저장분: 가입일을 모르므로 "오늘이 그 사람의 dayCount번째 날"로
      // 역산해 startedAt을 채운다. 이렇게 해야 기존 진도를 잃지 않는다.
      if (!merged.startedAt) {
        merged.startedAt = addDays(today, -(merged.dayCount - 1));
      }
      // phase='cycle'인데 cycleStartDay가 비어 있으면(레거시) 오늘을 기준점으로 고정 —
      // 없으면 weekIndex가 매일 0으로 계산되어 2주차 회피 슬롯이 영영 열리지 않는다.
      if (merged.phase === 'cycle' && merged.cycleStartDay == null) {
        merged.cycleStartDay = merged.dayCount;
      }
      // 마지막 접속 이후 지난 날들을 한 번에 마감(미완료일도 원장에 남는다)
      const target = targetDayCount(merged, today);
      let guard = 0;
      while (merged.dayCount < target && guard < 90) {
        merged = closeDay(merged);
        guard += 1;
      }
      merged.dayCount = Math.max(merged.dayCount, target);
      merged.lastSeenDate = today;

      setUser(merged);
      if (merged.phase === 'onboarding_week' && !merged.onboardingWeek?.done) {
        setView(merged.taster && !merged.taster.completed && !merged.taster.skipped
          ? 'taster'
          : 'onboarding_week');
      } else {
        setView(merged.daily ? 'home' : 'daily_checkin');
      }
    } else {
      // 신규: 오늘이 이 사람의 Day1. 가입 날짜가 사람마다 다르므로 여정도 각자 다르게 흐른다.
      setUser({ ...defaultUser, email, startedAt: today, lastSeenDate: today, dayCount: 1 });
      setView('onboarding');
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // 세션이 이미 만료됐어도 화면은 로그아웃 처리
    }
    setUser(defaultUser);
    setView('auth');
  }, []);

  // 앱 시작 시 세션 복원
  useEffect(() => {
    let cancelled = false;
    getMe()
      .then(me => {
        if (!cancelled) enterFromServer(me.email, me.state);
      })
      .catch(() => {
        if (!cancelled) setView('auth');
      });
    return () => { cancelled = true; };
  }, [enterFromServer]);

  // 상태가 바뀔 때마다 서버에 자동 저장 (디바운스)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user.email) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState({ state: user as unknown as Record<string, unknown> }).catch(() => {
        // 저장 실패는 다음 변경 때 다시 시도됨
      });
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [user]);

  // 다음 날로(데모 버튼): 하루 마감 + 오프셋 1일 앞당기기
  const nextDay = useCallback(() => {
    let nextView: ViewState = 'daily_checkin';
    setUser(prev => {
      const next = closeDay(prev);
      nextView = next.phase === 'onboarding_week' ? 'onboarding_week' : 'daily_checkin';
      // 실제 달력은 건드리지 않고 오프셋으로만 앞당긴다 — 시연이 끝나도 날짜가 꼬이지 않는다.
      return { ...next, demoDayOffset: prev.demoDayOffset + 1 };
    });
    setView(nextView);
  }, []);

  // 앱을 열 때·다시 포커스될 때 실제 날짜와 맞춘다.
  // 며칠 안 들어왔다면 그 일수만큼 하루 마감을 반복 적용해 원장에 '미완료일'을 남긴다.
  const syncToday = useCallback(() => {
    setUser(prev => {
      if (!prev.startedAt) return prev;
      const today = todayKey();
      const target = targetDayCount(prev, today);
      if (prev.lastSeenDate === today && prev.dayCount === target) return prev;
      let next = prev;
      let guard = 0;
      while (next.dayCount < target && guard < 90) {
        next = closeDay(next);
        guard += 1;
      }
      return { ...next, dayCount: Math.max(next.dayCount, target), lastSeenDate: today };
    });
  }, []);

  useEffect(() => {
    syncToday();
    const onWake = () => syncToday();
    window.addEventListener('focus', onWake);
    document.addEventListener('visibilitychange', onWake);
    // 자정을 넘겨 앱을 켜둔 경우에도 하루가 넘어가도록 주기 확인
    const timer = setInterval(syncToday, 60_000);
    return () => {
      window.removeEventListener('focus', onWake);
      document.removeEventListener('visibilitychange', onWake);
      clearInterval(timer);
    };
  }, [syncToday]);

  return (
    <AppContext.Provider value={{ view, setView, user, updateUser, nextDay, enterFromServer, signOut }}>
      {children}
    </AppContext.Provider>
  );
}

// 하루 마감(순수 함수) — 원장 기록 → 밴드 v2 → 진급 배치 → 게이트 재평가 예약.
// 데모 버튼과 실날짜 따라잡기가 같은 로직을 쓰도록 AppProvider 밖으로 뺐다.
function closeDay(prev: UserState): UserState {
  // 온보딩 주간은 고정 미션 타임라인이라 사이클 마감 로직을 태우지 않는다.
  if (prev.phase === 'onboarding_week') {
    return { ...prev, dayCount: prev.dayCount + 1 };
  }

  const slots = prev.todaySlots ?? [];
  const record = buildDayRecord(prev);
  const dayRecords = [...prev.dayRecords.filter((r) => r.day !== record.day), record];

  const adj = adjustBandNextDayV2({
    bandLow: prev.currentBandLow,
    bandHigh: prev.currentBandHigh,
    slots,
    missedStreak: prev.missedStreak,
    nudgeStreak: prev.nudgeStreak,
    lowMStreak: prev.lowMStreak,
    nudgeDefaultNormal: prev.nudgeDefaultNormal,
  });

  const areaPM = accumulateAreaPM(prev.areaPM, slots);
  const dayResult = classifyDayResult(slots);
  const streakDays = dayResult === 'missed' ? 0 : prev.streakDays;

  // 즐거움 가중치↑ 신호: 오늘 완료 슬롯 중 P 최고 영역에 3일 부스트
  let pleasureBoostArea = prev.pleasureBoostArea;
  if (adj.pleasureBoost) {
    const done = slots.filter((s) => s.status === 'completed');
    if (done.length > 0) {
      pleasureBoostArea = done.reduce((a, b) => ((a.p ?? 0) >= (b.p ?? 0) ? a : b)).area;
    }
  }

  const newDay = prev.dayCount + 1;

  // 진급: 주 1회 배치(밴드와 독립). 거절 시 2주 뒤 재제안. 강등 없음.
  let promotionOffer = prev.promotionOffer;
  let lastPromotionCheckDay = prev.lastPromotionCheckDay;
  let promotionEvaluated = prev.promotionEvaluated;
  const canPromote = prev.stage && nextStage(prev.stage) !== null;
  const cycleStart = prev.cycleStartDay ?? prev.dayCount;
  const sinceLastCheck = lastPromotionCheckDay === null
    ? newDay - cycleStart
    : newDay - lastPromotionCheckDay;
  const declinedRecently =
    prev.promotionDeclinedDay !== null && newDay - prev.promotionDeclinedDay < 14;
  if (canPromote && !promotionOffer && sinceLastCheck >= 7 && !declinedRecently) {
    lastPromotionCheckDay = newDay;
    const ok = checkPromotion(dayRecords, newDay, !promotionEvaluated);
    promotionEvaluated = true;
    if (ok) promotionOffer = true;
  }

  // 4주마다 금지조건 1개 가벼운 재확인(게이트 플래그만 갱신)
  let gateRecheckPending = prev.gateRecheckPending;
  const lastGateDay = prev.gateRecheckDay ?? cycleStart;
  if (!gateRecheckPending && prev.forbidden.length > 0 && newDay - lastGateDay >= 28) {
    gateRecheckPending = prev.forbidden.find((f) =>
      ['외출', '전화', '대면', '관계대면'].includes(f),
    ) ?? null;
  }

  return {
    ...prev,
    dayCount: newDay,
    daily: null,
    todaySlots: null,
    reflectSlotId: null,
    dayRecords,
    areaPM,
    currentBandLow: adj.bandLow,
    currentBandHigh: adj.bandHigh,
    missedStreak: adj.missedStreak,
    nudgeStreak: adj.nudgeStreak,
    lowMStreak: adj.lowMStreak,
    nudgeDefaultNormal: adj.nudgeDefaultNormal,
    pleasureBoostArea,
    lastMessage: adj.message,
    streakDays,
    promotionOffer,
    lastPromotionCheckDay,
    promotionEvaluated,
    gateRecheckPending,
    consecutiveSkips: dayResult === 'missed' ? prev.consecutiveSkips + 1 : 0,
  };
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}

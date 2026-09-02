import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { Area, Stage, OnboardingAnswers } from "./classifier";
import { getMe, saveState, logout as logoutApi } from "@workspace/api-client-react";
import { GrowthEvent, emptyCounts } from "./rewards";
import { DecoEquipped, PlacedFurniture } from "./decor";
import {
  AreaPMMap,
  AreaReadinessMap,
  AutonomyLevel,
  AutonomySignals,
  DayRecord,
  DaySlot,
  OnboardingWeekState,
  SkipEntry,
  adjustBandNextDayV2,
  classifyDayResult,
  accumulateAreaPM,
  emptyAutonomySignals,
  evaluateAutonomyLevel,
} from "./ba";

export type ViewState =
  | 'loading'
  | 'auth'
  | 'onboarding'
  | 'onboarding_week'
  | 'daily_checkin'
  | 'know_yourself'
  | 'home'
  | 'reflection'
  | 'growth'
  | 'deco_character'
  | 'deco_room'
  | 'recovery_report';

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
  // 미시도 영역 의향(준비도) — 데일리 3번 문항(주 1~2회). '해보고 싶어요'만 계획 후보에 반영.
  areaReadiness: AreaReadinessMap;
  readinessAskedDay: number | null; // 마지막으로 의향 문항을 보여준 dayCount
  // 자율성 사다리(A0~A4) — 내부 레벨. 권한 개방일 뿐 요구 아님. 강등·노출 없음.
  autonomyLevel: AutonomyLevel;
  autonomySignals: AutonomySignals;
  autonomyCheckDay: number | null; // 마지막 주간 판정 dayCount
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

  consecutiveSkips: number;
  lastMessage?: string;
  pendingPraise?: string;
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
  areaReadiness: {},
  readinessAskedDay: null,
  autonomyLevel: 0,
  autonomySignals: emptyAutonomySignals(),
  autonomyCheckDay: null,
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
  consecutiveSkips: 0,
};

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
    if (saved && saved.stage) {
      const merged = { ...defaultUser, ...saved, email };
      // 구버전 저장분(BA 이전) 호환: phase 없으면 본 사이클로 간주
      if (!(saved as Record<string, unknown>).phase) {
        merged.phase = 'cycle';
      }
      // phase='cycle'인데 cycleStartDay가 비어 있으면(레거시) 오늘을 기준점으로 고정 —
      // 없으면 weekIndex가 매일 0으로 계산되어 2주차 회피 슬롯이 영영 열리지 않는다.
      if (merged.phase === 'cycle' && merged.cycleStartDay == null) {
        merged.cycleStartDay = merged.dayCount;
      }
      setUser(merged);
      if (merged.phase === 'onboarding_week' && !merged.onboardingWeek?.done) {
        setView('onboarding_week');
      } else {
        setView(merged.daily ? 'home' : 'daily_checkin');
      }
    } else {
      setUser({ ...defaultUser, email });
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

  // 다음 날로: 하루 마감(원장 기록 → 밴드 v2 → 진급 배치 → 게이트 재평가 예약)
  const nextDay = useCallback(() => {
    let nextView: ViewState = 'daily_checkin';
    setUser(prev => {
      // 온보딩 주간은 온보딩 화면이 자체적으로 일자를 진행하므로 여기선 본 사이클만.
      if (prev.phase === 'onboarding_week') {
        nextView = 'onboarding_week';
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

      // 오늘 완료된 직접 연/직접 만든 조각 → 자율성 신호 집계
      const doneToday = slots.filter((s) => s.status === 'completed');
      const autonomySignals: AutonomySignals = {
        ...prev.autonomySignals,
        exploreCompletions:
          prev.autonomySignals.exploreCompletions +
          doneToday.filter((s) => s.kind === 'explore').length,
        selfCompletions:
          prev.autonomySignals.selfCompletions +
          doneToday.filter((s) => s.kind === 'self').length,
      };

      // 자율성 레벨: 주 1회 배치(단계 진급 배치를 대체 — 허용영역·진급 개념 폐지).
      // 권한 개방만 있고 강등 없음. 레벨업 시 조각이의 한 줄(성장 프레이밍)로만 표면화.
      let autonomyLevel = prev.autonomyLevel;
      let autonomyCheckDay = prev.autonomyCheckDay;
      let autonomyMessage: string | null = null;
      const cycleStart = prev.cycleStartDay ?? prev.dayCount;
      const sinceAutonomyCheck = autonomyCheckDay === null
        ? newDay - cycleStart
        : newDay - autonomyCheckDay;
      if (sinceAutonomyCheck >= 7) {
        autonomyCheckDay = newDay;
        const evaled = evaluateAutonomyLevel(autonomyLevel, autonomySignals, dayRecords, newDay);
        autonomyLevel = evaled.level;
        autonomyMessage = evaled.message;
      }

      // (구) 단계 진급 배치는 폐지 — promotionOffer는 더 이상 켜지지 않는다.
      const promotionOffer = false;
      const lastPromotionCheckDay = prev.lastPromotionCheckDay;
      const promotionEvaluated = prev.promotionEvaluated;

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
        lastMessage: autonomyMessage ?? adj.message, // 레벨업 한 줄이 있으면 우선
        streakDays,
        autonomySignals,
        autonomyLevel,
        autonomyCheckDay,
        promotionOffer,
        lastPromotionCheckDay,
        promotionEvaluated,
        gateRecheckPending,
        consecutiveSkips: dayResult === 'missed' ? prev.consecutiveSkips + 1 : 0,
      };
    });
    setView(nextView);
  }, []);

  return (
    <AppContext.Provider value={{ view, setView, user, updateUser, nextDay, enterFromServer, signOut }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}

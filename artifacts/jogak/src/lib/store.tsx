import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { Area, Stage, OnboardingAnswers, DailyAnswers, adjustBandNextDay } from "./classifier";
import { Challenge, getMe, saveState, logout as logoutApi } from "@workspace/api-client-react";
import { GrowthEvent, emptyCounts } from "./rewards";
import { DecoEquipped, PlacedFurniture } from "./decor";

export type ViewState =
  | 'loading'
  | 'auth'
  | 'onboarding'
  | 'daily_checkin'
  | 'know_yourself'
  | 'home'
  | 'reflection'
  | 'growth'
  | 'deco_character'
  | 'deco_room';

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
  daily: DailyAnswers | null;

  // 설문 JSON 기반 온보딩 내부 상태(화면 비노출)
  surveyResponses: Record<string, number> | null; // sc_q1·sc_q2·ss1~ss15 원응답
  secluded: boolean; // 은둔 체크 양성 여부(단계 확정 시 우선 적용)
  areaSeeds: Record<string, number> | null; // 영역 시드(부담 프로파일)

  // '나 알아가기' (고립 척도 25문항 · 5챕터) 진행 상태
  knowYourself: KnowYourselfState | null;

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

  todayChallenges: Challenge[] | null;
  acceptedChallenge: Challenge | null;
  
  consecutiveSkips: number;
  forceLowBurdenArea: boolean;
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
  todayChallenges: null,
  acceptedChallenge: null,
  consecutiveSkips: 0,
  forceLowBurdenArea: false,
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
      setUser({ ...defaultUser, ...saved, email });
      setView(saved.daily ? 'home' : 'daily_checkin');
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

  const nextDay = useCallback(() => {
    setUser(prev => {
      // Pressed on Home = today's challenge was skipped; pressed on Growth = day completed via reflection.
      const skipped = view === 'home';
      const newConsecutiveSkips = skipped ? prev.consecutiveSkips + 1 : 0;

      let bandLow = prev.currentBandLow;
      let bandHigh = prev.currentBandHigh;
      let lastMessage = prev.lastMessage;
      let streakDays = prev.streakDays;

      if (skipped) {
        const adj = adjustBandNextDay(prev.currentBandLow, prev.currentBandHigh, false, null, newConsecutiveSkips);
        bandLow = adj.bandLow;
        bandHigh = adj.bandHigh;
        lastMessage = adj.message ?? "괜찮아요. 오늘은 더 가벼운 것부터 시작해봐요.";
        streakDays = 0;
      }

      return {
        ...prev,
        dayCount: prev.dayCount + 1,
        daily: null,
        todayChallenges: null,
        acceptedChallenge: null,
        consecutiveSkips: newConsecutiveSkips,
        forceLowBurdenArea: skipped && newConsecutiveSkips >= 2,
        currentBandLow: bandLow,
        currentBandHigh: bandHigh,
        lastMessage,
        streakDays,
      };
    });
    setView('daily_checkin');
  }, [view]);

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
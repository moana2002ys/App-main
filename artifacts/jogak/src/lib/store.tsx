import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { Area, Stage, OnboardingAnswers, DailyAnswers, adjustBandNextDay } from "./classifier";
import { Challenge, getMe, saveState, logout as logoutApi } from "@workspace/api-client-react";

export type ViewState =
  | 'loading'
  | 'auth'
  | 'onboarding'
  | 'daily_checkin'
  | 'home'
  | 'reflection'
  | 'growth';

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

  points: number;
  totalCompletions: number;
  streakDays: number;
  items: string[];
  
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
  points: 0,
  totalCompletions: 0,
  streakDays: 0,
  items: [],
  dayCount: 1,
  todayChallenges: null,
  acceptedChallenge: null,
  consecutiveSkips: 0,
  forceLowBurdenArea: false,
};

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
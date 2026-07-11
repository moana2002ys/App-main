import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Area, Stage, OnboardingAnswers, DailyAnswers, adjustBandNextDay } from "./classifier";
import { Challenge } from "@workspace/api-client-react";

export type ViewState = 
  | 'onboarding'
  | 'daily_checkin'
  | 'home'
  | 'reflection'
  | 'growth';

export interface UserState {
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
}

interface AppContextType {
  view: ViewState;
  setView: (v: ViewState) => void;
  user: UserState;
  updateUser: (updates: Partial<UserState>) => void;
  nextDay: () => void;
}

const defaultUser: UserState = {
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
  const [view, setView] = useState<ViewState>('onboarding');
  const [user, setUser] = useState<UserState>(defaultUser);

  const updateUser = useCallback((updates: Partial<UserState>) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

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
    <AppContext.Provider value={{ view, setView, user, updateUser, nextDay }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}

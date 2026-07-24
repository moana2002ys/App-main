import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  MOOD_OPTIONS,
  getOnboardingMission,
  emptyOnboardingWeek,
  summarizeOnboardingWeek,
  OnboardingDayEntry,
} from "@/lib/ba";

const INTERESTS = [
  "게임", "음악", "동물", "식물", "요리·먹는 것", "책·글", "스포츠", "그림·만들기",
];

// P/M 간이 탭(온보딩 주간 전용 — 슬라이더는 본 사이클부터)
const PM_TAPS = [
  { v: 1, label: "별로였어요" },
  { v: 3, label: "그냥 그랬어요" },
  { v: 5, label: "좋았어요" },
];

// 온보딩 1주: 하루 1개 고정 초소형 미션. 계획 입력 없음(하거나/건너뛰거나만).
// 매일 기분 + 완료 시 P/M 탭 → mood_baseline·pm_pattern·skip_pattern 수집.
export function OnboardingWeek() {
  const { user, updateUser, setView } = useAppStore();
  const week = user.onboardingWeek ?? emptyOnboardingWeek();
  const dayIdx = week.dayIndex; // 1~7
  const mission = getOnboardingMission(dayIdx, user.forbidden);

  // step: 0 기분 → 1 미션 카드 → 2 P/M(완료 시) → 3 오늘 마침 → (Day7 후) 4 관심사 → 5 시작 안내
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<number | null>(null);
  const [p, setP] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const saveEntry = (entry: OnboardingDayEntry) => {
    const entries = [...week.entries.filter((e) => e.day !== entry.day), entry];
    updateUser({
      onboardingWeek: { ...week, entries },
    });
  };

  const finishDay = (entry: OnboardingDayEntry) => {
    saveEntry(entry);
    setStep(3);
  };

  const goNextDay = () => {
    const isLast = dayIdx >= 7;
    if (isLast) {
      setStep(4);
      return;
    }
    updateUser({
      onboardingWeek: { ...week, entries: user.onboardingWeek?.entries ?? week.entries, dayIndex: dayIdx + 1 },
      dayCount: user.dayCount + 1,
    });
    setMood(null);
    setP(null);
    setCompleted(false);
    setStep(0);
  };

  const finishWeek = () => {
    const finalWeek = { ...(user.onboardingWeek ?? week), done: true, dayIndex: 8 };
    const summary = summarizeOnboardingWeek(finalWeek);
    updateUser({
      onboardingWeek: finalWeek,
      phase: 'cycle',
      cycleStartDay: user.dayCount + 1,
      dayCount: user.dayCount + 1,
      moodBaseline: summary.moodBaseline,
      areaPM: summary.initialAreaPM,
      interests: selectedInterests,
      interestAskedDay: user.dayCount + 1,
      // 온보딩 skip_pattern: 명시적 skip ≥2회면 회피 슬롯 1주차 조기 활성화
      skipLog: [],
      daily: null,
    });
    setView("daily_checkin");
  };

  const entryBase = { day: dayIdx, mood: mood ?? 3 };

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="h-10 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">함께 시작하는 일주일 · {Math.min(dayIdx, 7)}/7</p>
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="mood"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-center"><Character size="sm" /></div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 text-center">
                <p className="text-lg text-foreground leading-relaxed">
                  오늘 기분은 어때요?
                </p>
                <p className="text-xs text-muted-foreground mt-1">탭 한 번이면 충분해요.</p>
              </div>
              <div className="flex justify-between gap-1">
                {MOOD_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => { setMood(o.value); setStep(1); }}
                    className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-secondary transition-colors"
                  >
                    <span className="text-2xl">{o.emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{o.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : step === 1 ? (
            <motion.div
              key="mission"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-medium text-foreground">오늘의 조각</h2>
                <p className="text-sm text-muted-foreground">이미 준비해뒀어요. 하거나, 건너뛰거나 — 그거면 돼요.</p>
              </div>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-border/50 space-y-4"
              >
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span className="px-3 py-1 bg-secondary rounded-full">아주 작은 조각</span>
                  <span>약 {mission.minutes}분</span>
                </div>
                <p className="text-xl font-medium text-foreground leading-relaxed">{mission.title}</p>
              </motion.div>
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full rounded-2xl h-14 text-lg"
                  onClick={() => { setCompleted(true); setStep(2); }}
                >
                  했어요
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full rounded-2xl h-12 text-muted-foreground"
                  onClick={() => finishDay({ ...entryBase, completed: false, skipped: true })}
                >
                  오늘은 건너뛸래요
                </Button>
              </div>
            </motion.div>
          ) : step === 2 ? (
            <motion.div
              key="pm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-medium text-foreground">해냈네요!</h2>
                <p className="text-sm text-muted-foreground">방금 한 건 어땠는지, 가볍게만 알려주세요.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 space-y-3">
                <p className="text-sm text-foreground">즐거움은 어땠어요?</p>
                <div className="flex gap-2">
                  {PM_TAPS.map((t) => (
                    <button
                      key={t.v}
                      onClick={() => setP(t.v)}
                      className={`flex-1 py-3 rounded-xl text-sm border transition-colors ${p === t.v ? 'bg-primary text-white border-primary' : 'bg-white border-border/50 hover:bg-secondary/50'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {p !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 space-y-3"
                >
                  <p className="text-sm text-foreground">뿌듯함은요?</p>
                  <div className="flex gap-2">
                    {PM_TAPS.map((t) => (
                      <button
                        key={t.v}
                        onClick={() => finishDay({ ...entryBase, completed: true, p: p ?? 3, m: t.v })}
                        className="flex-1 py-3 rounded-xl text-sm border bg-white border-border/50 hover:bg-secondary/50 transition-colors"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : step === 3 ? (
            <motion.div
              key="dayDone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8 text-center"
            >
              <div className="flex justify-center"><Character size="lg" /></div>
              <div className="space-y-2">
                <h2 className="text-2xl font-medium text-foreground">
                  {completed ? "오늘의 조각을 맞췄어요" : "괜찮아요, 내일 또 만나요"}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {completed
                    ? "이렇게 작은 조각들이 모이는 걸 함께 지켜봐요."
                    : "건너뛰는 날도 있는 법이에요. 기록만 살짝 해둘게요."}
                </p>
              </div>
              <Button size="lg" className="w-full rounded-2xl h-14" onClick={goNextDay}>
                {dayIdx >= 7 ? "일주일 마무리하기" : "다음 날로 → (데모)"}
              </Button>
            </motion.div>
          ) : step === 4 ? (
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-medium text-foreground">일주일을 함께 했어요</h2>
                <p className="text-sm text-muted-foreground">
                  마지막으로 하나만요. 요즘 조금이라도 눈길이 가는 게 있다면? (여러 개 골라도 좋아요)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {INTERESTS.map((i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setSelectedInterests((prev) =>
                        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
                      )
                    }
                    className={`py-3 px-4 rounded-2xl text-sm border transition-colors ${selectedInterests.includes(i) ? 'bg-primary text-white border-primary' : 'bg-white border-border/50 hover:bg-secondary/50'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <Button size="lg" className="w-full rounded-2xl h-14" onClick={() => setStep(5)}>
                {selectedInterests.length > 0 ? "좋아요" : "잘 모르겠어요, 넘어갈게요"}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 text-center"
            >
              <div className="flex justify-center"><Character size="lg" /></div>
              <div className="space-y-3">
                <h2 className="text-2xl font-medium text-foreground">이제 진짜 시작이에요</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  지난 일주일의 기록을 바탕으로,<br />
                  내일부터는 {user.nickname || '조각이 친구'}님에게 맞는<br />
                  조각들을 골라서 보여드릴게요.
                </p>
              </div>
              <Button size="lg" className="w-full rounded-2xl h-14" onClick={finishWeek}>
                좋아요, 시작할게요
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

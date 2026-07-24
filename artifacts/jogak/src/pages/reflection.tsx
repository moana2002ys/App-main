import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { applyCompletion, EarnedReward } from "@/lib/rewards";
import { Character } from "@/components/Character";
import { BadgeIcon } from "@/components/BadgeIcon";
import { microFeedback } from "@/lib/ba";

// 사후 평정 v2: 부담 이모지 폐지 → P(즐거움)·M(뿌듯함) 0–10 슬라이더.
// 초기값 표시는 중앙이지만 '미조작'이면 내부 3으로 저장(중앙값 편향 방지).
// 밴드 조정은 여기서 하지 않는다 — 다음 날 아침(nextDay)에 하루 전체로 판정.
function PMSlider({
  label,
  hintLow,
  hintHigh,
  value,
  touched,
  onChange,
}: {
  label: string;
  hintLow: string;
  hintHigh: string;
  value: number;
  touched: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-base text-foreground">{label}</p>
        <span className={`text-sm ${touched ? "text-primary font-medium" : "text-muted-foreground"}`}>
          {touched ? value : "—"}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--primary,#F59E0B)] h-2 cursor-pointer"
        aria-label={label}
      />
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{hintLow}</span>
        <span>{hintHigh}</span>
      </div>
    </div>
  );
}

export function Reflection() {
  const { user, updateUser, setView } = useAppStore();
  const [step, setStep] = useState(0);

  const [p, setP] = useState(5);
  const [m, setM] = useState(5);
  const [pTouched, setPTouched] = useState(false);
  const [mTouched, setMTouched] = useState(false);
  const [earned, setEarned] = useState<EarnedReward[]>([]);

  const slot = (user.todaySlots ?? []).find((s) => s.id === user.reflectSlotId) ?? null;

  if (!slot) {
    setView("home");
    return null;
  }

  const feedbackLine = microFeedback(user.dayRecords, user.dayCount);

  const handleFinish = () => {
    // 미조작 시 내부 3 저장(0–10 원값 기준)
    const pFinal = pTouched ? p : 3;
    const mFinal = mTouched ? m : 3;

    const reward = applyCompletion(
      {
        categoryCounts: user.categoryCounts,
        points: user.points,
        totalCompletions: user.totalCompletions,
        badges: user.badges,
        equippedItems: user.equippedItems,
        backgroundStage: user.backgroundStage,
        growthLog: user.growthLog,
        day: user.dayCount,
        interest: user.interests[0],
      },
      {
        area: slot.area,
        level: slot.level,
        title: slot.title,
        minutes: slot.minutes,
        reflectQ: slot.reflectQ,
      },
    );

    updateUser({
      todaySlots: (user.todaySlots ?? []).map((s) =>
        s.id === slot.id ? { ...s, status: "completed" as const, p: pFinal, m: mFinal } : s,
      ),
      reflectSlotId: null,
      streakDays: user.streakDays + 1,
      consecutiveSkips: 0,
      categoryCounts: reward.categoryCounts,
      points: reward.points,
      totalCompletions: reward.totalCompletions,
      badges: reward.badges,
      equippedItems: reward.equippedItems,
      backgroundStage: reward.backgroundStage,
      growthLog: reward.growthLog,
      pendingPraise: undefined,
    });

    if (reward.earned.length > 0) {
      setEarned(reward.earned);
      setStep(2); // 축하 화면
    } else {
      setView("home");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="h-10 flex items-center">
        <button
          onClick={() => (step > 0 && step < 2 ? setStep(step - 1) : setView("home"))}
          aria-label="뒤로 가기"
          className="p-2 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-medium text-foreground leading-snug">
                  {user.pendingPraise || "수고했어요!"}
                </h2>
                <p className="text-muted-foreground">방금 한 건 어땠는지, 손끝으로만 알려주세요.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-border/50 space-y-8">
                <PMSlider
                  label="즐거움은 어땠어요?"
                  hintLow="전혀"
                  hintHigh="아주 많이"
                  value={p}
                  touched={pTouched}
                  onChange={(v) => { setP(v); setPTouched(true); }}
                />
                <PMSlider
                  label="뿌듯함(해냈다는 느낌)은요?"
                  hintLow="전혀"
                  hintHigh="아주 많이"
                  value={m}
                  touched={mTouched}
                  onChange={(v) => { setM(v); setMTouched(true); }}
                />
                <p className="text-[11px] text-muted-foreground text-center">
                  안 움직여도 괜찮아요. 그대로 넘어가도 돼요.
                </p>
                <Button size="lg" className="w-full rounded-2xl h-13" onClick={() => setStep(1)}>
                  다음
                </Button>
              </div>

              {feedbackLine && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-primary text-center"
                >
                  {feedbackLine}
                </motion.p>
              )}
            </motion.div>
          ) : step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-border/50 text-center space-y-6">
                <p className="text-lg font-medium text-foreground">{slot.reflectQ}</p>
                <textarea
                  className="w-full bg-secondary/30 rounded-2xl p-4 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                  placeholder="한 단어도 좋고, 적지 않아도 괜찮아요."
                />
                <Button size="lg" className="w-full rounded-2xl h-14" onClick={handleFinish}>
                  기록 완료하기
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="celebrate"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8 text-center"
            >
              <div className="space-y-2">
                <motion.p
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-primary font-medium"
                >
                  꾸준히 해낸 당신에게
                </motion.p>
                <h2 className="text-2xl font-medium text-foreground">새로운 조각이 생겼어요</h2>
              </div>

              <div className="flex justify-center">
                <Character size="lg" />
              </div>

              <div className="space-y-3">
                {earned.map((e, i) => (
                  <motion.div
                    key={e.categoryId}
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.12 }}
                    className="bg-white p-5 rounded-3xl shadow-sm border border-border/50 flex items-center gap-4 text-left"
                  >
                    <BadgeIcon categoryId={e.categoryId} size={52} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-semibold leading-snug">{e.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{e.badgeName}</p>
                      {(e.itemLabel || e.backgroundLabel) && (
                        <p className="text-[11px] text-primary/80 mt-1">
                          {e.itemLabel && `${e.itemLabel} 획득`}
                          {e.backgroundLabel && ` · 세상이 '${e.backgroundLabel}'까지 넓어졌어요`}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button size="lg" className="w-full rounded-2xl h-14" onClick={() => setView("home")}>
                좋아요
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

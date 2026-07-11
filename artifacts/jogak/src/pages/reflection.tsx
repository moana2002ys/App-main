import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { adjustBandNextDay } from "@/lib/classifier";
import { applyCompletion, EarnedReward } from "@/lib/rewards";
import { Character } from "@/components/Character";
import { BadgeIcon } from "@/components/BadgeIcon";

export function Reflection() {
  const { user, updateUser, setView } = useAppStore();
  const [step, setStep] = useState(0);

  const [burden, setBurden] = useState<'😌'|'😐'|'😣'|null>(null);
  const [satisfaction, setSatisfaction] = useState<'👍'|'🤔'|'👎'|null>(null);
  const [earned, setEarned] = useState<EarnedReward[]>([]);

  const challenge = user.acceptedChallenge;

  if (!challenge) {
    setView("home");
    return null;
  }

  const handleFinish = () => {
    const { bandLow, bandHigh, message } = adjustBandNextDay(
      user.currentBandLow,
      user.currentBandHigh,
      true,
      burden,
      0
    );

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
        interest: user.daily?.interest,
      },
      challenge
    );

    updateUser({
      currentBandLow: bandLow,
      currentBandHigh: bandHigh,
      lastMessage: message,
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
      setStep(3); // 축하 화면
    } else {
      setView("growth");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="h-10 flex items-center">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : setView("home"))}
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
              className="space-y-8 text-center"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-medium text-foreground leading-snug">
                  {user.pendingPraise || "수고했어요!"}
                </h2>
                <p className="text-muted-foreground">방금 한 건 어땠나요?</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-border/50">
                <p className="text-lg mb-8">부담감은 어느 정도였나요?</p>
                <div className="flex justify-center gap-4">
                  {[
                    { e: '😌', l: '쉬웠어요' },
                    { e: '😐', l: '적당해요' },
                    { e: '😣', l: '버거웠어요' }
                  ].map(b => (
                    <button
                      key={b.e}
                      onClick={() => { setBurden(b.e as any); setStep(1); }}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-secondary transition-colors"
                    >
                      <span className="text-4xl">{b.e}</span>
                      <span className="text-xs text-muted-foreground">{b.l}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 text-center"
            >
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-border/50">
                <p className="text-lg mb-8">나에게 도움이 된 것 같나요?</p>
                <div className="flex justify-center gap-4">
                  {[
                    { e: '👍', l: '도움됐어요' },
                    { e: '🤔', l: '그냥 그래요' },
                    { e: '👎', l: '별로예요' }
                  ].map(b => (
                    <button
                      key={b.e}
                      onClick={() => { setSatisfaction(b.e as any); setStep(2); }}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-secondary transition-colors"
                    >
                      <span className="text-4xl">{b.e}</span>
                      <span className="text-xs text-muted-foreground">{b.l}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : step === 2 ? (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-border/50 text-center space-y-6">
                <p className="text-lg font-medium text-foreground">{challenge.reflectQ}</p>
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

              <Button size="lg" className="w-full rounded-2xl h-14" onClick={() => setView("growth")}>
                좋아요
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

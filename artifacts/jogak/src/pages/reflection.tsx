import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { adjustBandNextDay } from "@/lib/classifier";

export function Reflection() {
  const { user, updateUser, setView } = useAppStore();
  const [step, setStep] = useState(0);
  
  const [burden, setBurden] = useState<'😌'|'😐'|'😣'|null>(null);
  const [satisfaction, setSatisfaction] = useState<'👍'|'🤔'|'👎'|null>(null);

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

    let newItems = [...user.items];
    // Attach item based on challenge content heuristically
    if (challenge.title.includes('산책') || challenge.title.includes('걷기') || challenge.title.includes('외출')) {
      if (!newItems.includes('shoes')) newItems.push('shoes');
    } else if (challenge.title.includes('음악') || challenge.title.includes('듣기')) {
      if (!newItems.includes('headphone')) newItems.push('headphone');
    } else if (challenge.title.includes('식물') || challenge.title.includes('화분')) {
      if (!newItems.includes('plant')) newItems.push('plant');
    }

    updateUser({
      currentBandLow: bandLow,
      currentBandHigh: bandHigh,
      lastMessage: message,
      points: user.points + 10,
      totalCompletions: user.totalCompletions + 1,
      streakDays: user.streakDays + 1,
      items: newItems,
      consecutiveSkips: 0,
      pendingPraise: undefined
    });

    setView("growth");
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
          ) : (
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
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerateChallenges } from "@workspace/api-client-react";
import { determineTodayArea, capBandForArea, Area, AREAS } from "@/lib/classifier";
import { getFallbackChallenges } from "@/lib/fallback-bank";
import { Challenge } from "@workspace/api-client-react";

export function Home() {
  const { user, updateUser, setView, nextDay } = useAppStore();
  const generateMut = useGenerateChallenges();
  const [loading, setLoading] = useState(!user.todayChallenges && !user.acceptedChallenge);

  useEffect(() => {
    if (user.todayChallenges || user.acceptedChallenge || !user.stage || !user.onboarding || !user.daily) {
      setLoading(false);
      return;
    }

    const stage = user.stage;
    // 이틀 연속 건너뛴 다음 날은 부담이 낮은 영역(생활리듬)부터 다시 시작
    let targetArea = user.forceLowBurdenArea
      ? AREAS.rhythm
      : determineTodayArea(stage, user.daily.area as Area | 'unknown', user.forbidden);

    let low = user.currentBandLow;
    let high = user.currentBandHigh;

    if (user.daily.condition === '바닥') {
      low = Math.max(1, low - 1);
      high = Math.max(1, high - 1);
    }

    const capped = capBandForArea(stage, targetArea, low, high);
    low = capped.low;
    high = capped.high;

    const payload = {
      stage,
      area: targetArea,
      bandLow: low,
      bandHigh: high,
      forbidden: user.forbidden,
      sleep: user.onboarding.sleep,
      outing: user.onboarding.outing,
      contact: user.onboarding.contact,
      condition: user.daily.condition,
      interest: user.daily.interest
    };

    generateMut.mutate({ data: payload }, {
      onSuccess: (data) => {
        updateUser({ todayChallenges: data.challenges });
        setLoading(false);
      },
      onError: () => {
        // Fallback
        const fallback = getFallbackChallenges(targetArea, low, high);
        updateUser({ todayChallenges: fallback });
        setLoading(false);
      }
    });

  }, [user.todayChallenges, user.acceptedChallenge]);

  const acceptChallenge = (challenge: Challenge) => {
    updateUser({ acceptedChallenge: challenge });
  };

  const navToReflection = () => {
    setView("reflection");
  };

  const navToGrowth = () => {
    setView("growth");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-6 pt-8 pb-4 flex justify-between items-center bg-white/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-20">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Day {user.dayCount}</h2>
        </div>
        <button onClick={navToGrowth} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-border/50 hover:bg-secondary/50 transition-colors">
          <Character size="sm" className="scale-[0.4] -mx-4" />
          <span className="text-sm font-medium text-primary">{user.points} pt</span>
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto pb-24">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-secondary border-t-primary rounded-full"
            />
            <p className="text-muted-foreground text-sm animate-pulse">오늘의 작은 조각을 찾고 있어요...</p>
          </div>
        ) : user.acceptedChallenge ? (
          <div className="h-full flex flex-col items-center justify-center space-y-12">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-medium text-foreground leading-snug">
                오늘의 조각
              </h3>
              <p className="text-muted-foreground">무리하지 말고, 천천히 해봐요.</p>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full bg-white p-8 rounded-3xl shadow-sm border border-border/50 space-y-6"
            >
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span className="px-3 py-1 bg-secondary rounded-full">{areaLabels[user.acceptedChallenge.area]}</span>
                <span>약 {user.acceptedChallenge.minutes}분</span>
              </div>
              <p className="text-xl font-medium text-foreground leading-relaxed">
                {user.acceptedChallenge.title}
              </p>
            </motion.div>

            <Button size="lg" className="w-full rounded-2xl h-14 text-lg shadow-md" onClick={navToReflection}>
              완료했어요
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mb-8 pl-2 border-l-4 border-primary">
              <h2 className="text-xl font-medium text-foreground">
                이 중에 하나만<br/>가볍게 해볼까요?
              </h2>
            </div>
            
            <AnimatePresence>
              {user.todayChallenges?.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-secondary text-foreground text-xs rounded-full font-medium">
                      {areaLabels[c.area]}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">약 {c.minutes}분</span>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-6 leading-relaxed">
                    {c.title}
                  </h3>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl hover:bg-primary hover:text-white transition-colors"
                    onClick={() => acceptChallenge(c)}
                  >
                    이거 할래요
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && (
          <div className="mt-8 pb-4 flex justify-center">
            <Button
              variant="ghost"
              className="rounded-full text-muted-foreground hover:text-foreground bg-white/60 border border-border/50 px-6"
              onClick={nextDay}
            >
              다음 날로 → (데모)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const areaLabels: Record<string, string> = {
  [AREAS.rhythm]: "하루 리듬",
  [AREAS.selfcare]: "나 돌보기",
  [AREAS.relationship]: "사람 관계",
  [AREAS.social]: "사회 활동"
};

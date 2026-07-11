import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Camera } from "lucide-react";
import { useGenerateChallenges, useVerifyChallengePhoto } from "@workspace/api-client-react";
import { determineTodayArea, capBandForArea, getDiversityAreas, Area, AREAS } from "@/lib/classifier";
import { getFallbackChallenges } from "@/lib/fallback-bank";
import { Challenge } from "@workspace/api-client-react";
import { fileToDataUrl } from "@/lib/image";

const COMPLETION_PRAISES = [
  "오늘 이만큼 해낸 것, 정말 멋져요.",
  "작은 한 걸음이 모여 큰 변화가 돼요. 잘했어요.",
  "천천히, 그리고 확실하게 해냈네요. 대단해요.",
  "오늘 하루에 이 순간을 만들어낸 게 참 좋아요.",
  "스스로 해낸 오늘의 조각, 참 소중해요.",
];

function pickPraise(nickname?: string) {
  const base = COMPLETION_PRAISES[Math.floor(Math.random() * COMPLETION_PRAISES.length)];
  return nickname ? `${nickname}님, ${base}` : base;
}

export function Home() {
  const { user, updateUser, setView, nextDay, signOut } = useAppStore();
  const generateMut = useGenerateChallenges();
  const verifyMut = useVerifyChallengePhoto();
  const [loading, setLoading] = useState(!user.todayChallenges && !user.acceptedChallenge);
  const [verifying, setVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

    // 오늘 컨디션 반영 밴드(선택 영역 캡 적용 전) — 다양성 후보 밴드 산출의 기준값
    let low = user.currentBandLow;
    let high = user.currentBandHigh;

    if (user.daily.condition === '바닥') {
      low = Math.max(1, low - 1);
      high = Math.max(1, high - 1);
    }

    // 다양성 후보 영역(선택 영역 제외 · 게이트 통과 · 영역별 캡 적용)
    const diversityAreas = getDiversityAreas(stage, targetArea, user.forbidden, low, high);

    // 선택 영역 캡 적용
    const capped = capBandForArea(stage, targetArea, low, high);
    const selLow = capped.low;
    const selHigh = capped.high;

    const payload = {
      stage,
      area: targetArea,
      bandLow: selLow,
      bandHigh: selHigh,
      forbidden: user.forbidden,
      sleep: user.onboarding.sleep,
      outing: user.onboarding.outing,
      contact: user.onboarding.contact,
      condition: user.daily.condition,
      interest: user.daily.interest,
      diversityAreas
    };

    generateMut.mutate({ data: payload }, {
      onSuccess: (data) => {
        updateUser({ todayChallenges: data.challenges });
        setLoading(false);
      },
      onError: () => {
        // Fallback (심화판 시드 뱅크 기반 · 게이트·한 활동·컨디션 규칙 준수)
        // 선택 영역 2개 + 다양성 후보 2개(후보 부족 시 선택 영역으로 보충)
        const fallback = getFallbackChallenges(
          { area: targetArea, bandLow: selLow, bandHigh: selHigh },
          diversityAreas,
          {
            forbidden: user.forbidden,
            condition: user.daily?.condition,
            interest: user.daily?.interest,
          },
        );
        updateUser({ todayChallenges: fallback });
        setLoading(false);
      }
    });

  }, [user.todayChallenges, user.acceptedChallenge]);

  const acceptChallenge = (challenge: Challenge) => {
    updateUser({ acceptedChallenge: challenge });
  };

  const navToReflection = () => {
    updateUser({ pendingPraise: pickPraise(user.nickname || undefined) });
    setView("reflection");
  };

  const onPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user.acceptedChallenge) return;
    setVerifying(true);
    try {
      const imageDataUrl = await fileToDataUrl(file);
      const res = await verifyMut.mutateAsync({
        data: {
          imageDataUrl,
          title: user.acceptedChallenge.title,
          nickname: user.nickname || undefined,
        },
      });
      updateUser({ pendingPraise: res.praise });
    } catch {
      // 분석이 안 되어도 완료는 그대로 인정 (실패 처벌 없음)
      updateUser({ pendingPraise: pickPraise(user.nickname || undefined) });
    }
    setVerifying(false);
    setView("reflection");
  };

  const navToGrowth = () => {
    setView("growth");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-6 pt-8 pb-4 flex justify-between items-center bg-white/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-20">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Day {user.dayCount} · {user.nickname || '조각이 친구'}님</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={navToGrowth} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-border/50 hover:bg-secondary/50 transition-colors">
            <Character size="sm" className="scale-[0.4] -mx-4" />
            <span className="text-sm font-medium text-primary">{user.points} pt</span>
          </button>
          <button
            onClick={signOut}
            aria-label="로그아웃"
            title="로그아웃"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
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

            {verifying ? (
              <div className="w-full flex flex-col items-center space-y-4 py-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 border-4 border-secondary border-t-primary rounded-full"
                />
                <p className="text-muted-foreground text-sm animate-pulse">사진을 살펴보고 있어요...</p>
              </div>
            ) : (
              <div className="w-full space-y-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-2xl h-14 text-lg border-primary/40 text-primary hover:bg-primary hover:text-white transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  사진으로 인증하기
                </Button>
                <Button size="lg" className="w-full rounded-2xl h-14 text-lg shadow-md" onClick={navToReflection}>
                  완료했어요
                </Button>
                <p className="text-xs text-muted-foreground text-center pt-1">
                  사진은 확인 후 바로 사라져요. 저장되지 않아요.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPhotoSelected}
                  aria-label="인증 사진 선택"
                />
              </div>
            )}
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

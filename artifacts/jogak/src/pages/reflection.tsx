import { useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Camera, Check } from "lucide-react";
import { applyCompletion, EarnedReward } from "@/lib/rewards";
import { Character } from "@/components/Character";
import { BadgeIcon } from "@/components/BadgeIcon";
import { microFeedback, SKIP_REASONS } from "@/lib/ba";
import { useVerifyChallengePhoto } from "@workspace/api-client-react";
import { fileToDataUrl } from "@/lib/image";

// 사후 평정 v3: 한 페이지 스크롤 — P·M 슬라이더 카드 + 메모(선택) + 사진 인증(선택).
// '미조작'이면 내부 3으로 저장(중앙값 편향 방지). 밴드 조정은 다음 날 아침에.
function PMSliderCard({
  emoji,
  title,
  question,
  hintLow,
  hintHigh,
  value,
  touched,
  onChange,
}: {
  emoji: string;
  title: string;
  question: string;
  hintLow: string;
  hintHigh: string;
  value: number;
  touched: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <p className="text-base font-medium text-foreground">{title}</p>
        </div>
        <span className={`text-sm ${touched ? "text-primary font-medium" : "text-muted-foreground"}`}>
          {touched ? value : "—"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{question}</p>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary h-2 cursor-pointer"
        aria-label={title}
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
  const verifyMut = useVerifyChallengePhoto();

  const [p, setP] = useState(5);
  const [m, setM] = useState(5);
  const [pTouched, setPTouched] = useState(false);
  const [mTouched, setMTouched] = useState(false);
  const [memo, setMemo] = useState("");
  const [earned, setEarned] = useState<EarnedReward[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const [skipMode, setSkipMode] = useState(false);
  const [photoAttached, setPhotoAttached] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const slot = (user.todaySlots ?? []).find((s) => s.id === user.reflectSlotId) ?? null;

  if (!slot) {
    setView("home");
    return null;
  }

  const feedbackLine = microFeedback(user.dayRecords, user.dayCount);

  const onPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setVerifying(true);
    try {
      const imageDataUrl = await fileToDataUrl(file);
      const res = await verifyMut.mutateAsync({
        data: { imageDataUrl, title: slot.title, nickname: user.nickname || undefined },
      });
      updateUser({ pendingPraise: res.praise });
    } catch {
      // 분석이 안 되어도 인증은 그대로 인정 (실패 처벌 없음)
    }
    setVerifying(false);
    setPhotoAttached(true);
  };

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
        s.id === slot.id
          ? {
              ...s,
              status: "completed" as const,
              p: pFinal,
              m: mFinal,
              memo: memo.trim() || undefined,
            }
          : s,
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
      setCelebrating(true);
    } else {
      setView("home");
    }
  };

  // "혹시 조각을 건너뛰었나요?" — 완료를 착오로 눌렀을 때의 되돌림 경로.
  const handleSkip = (reason: string) => {
    updateUser({
      todaySlots: (user.todaySlots ?? []).map((s) =>
        s.id === slot.id ? { ...s, status: "skipped" as const, skipReason: reason } : s,
      ),
      reflectSlotId: null,
      pendingPraise: undefined,
      skipLog: [
        ...user.skipLog,
        { day: user.dayCount, area: slot.area, title: slot.title, level: slot.level, reason },
      ],
    });
    setView("home");
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="max-w-sm mx-auto w-full p-6">
        <div className="h-10 flex items-center">
          <button
            onClick={() => setView("home")}
            aria-label="뒤로 가기"
            className="p-2 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {celebrating ? (
            <motion.div
              key="celebrate"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8 text-center pt-6"
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
          ) : skipMode ? (
            <motion.div
              key="skip"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 pt-6"
            >
              <div className="text-center space-y-2">
                <span className="text-4xl">🫂</span>
                <h2 className="text-xl font-medium text-foreground">괜찮아요, 그럴 수 있어요</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  건너뛴 것도 소중한 기록이에요.<br />어떤 게 발목을 잡았는지만 알려주세요.
                </p>
              </div>
              <div className="space-y-2.5">
                {SKIP_REASONS.map((r) => (
                  <Button
                    key={r}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30"
                    onClick={() => handleSkip(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
              <button
                onClick={() => setSkipMode(false)}
                className="w-full text-center text-sm text-muted-foreground underline"
              >
                돌아가기
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6 pb-10"
            >
              {/* 헤더 */}
              <div className="text-center space-y-3 pt-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-3xl">😊</span>
                </div>
                <h1 className="text-2xl font-semibold text-foreground">작은 조각을 맞췄어요!</h1>
                <div className="flex justify-center">
                  <span className="px-3 py-1.5 bg-secondary rounded-full text-sm text-foreground">
                    {slot.title}
                  </span>
                </div>
                {user.pendingPraise && (
                  <p className="text-sm text-primary leading-relaxed">{user.pendingPraise}</p>
                )}
              </div>

              <PMSliderCard
                emoji="😊"
                title="즐거움"
                question="이 활동을 하며 얼마나 즐거웠나요?"
                hintLow="전혀"
                hintHigh="아주 많이"
                value={p}
                touched={pTouched}
                onChange={(v) => { setP(v); setPTouched(true); }}
              />
              <PMSliderCard
                emoji="💪"
                title="뿌듯함"
                question="해냈다는 느낌은 얼마나 드나요?"
                hintLow="전혀"
                hintHigh="아주 많이"
                value={m}
                touched={mTouched}
                onChange={(v) => { setM(v); setMTouched(true); }}
              />
              <p className="text-[11px] text-muted-foreground text-center -mt-2">
                안 움직여도 괜찮아요. 그대로 넘어가도 돼요.
              </p>

              {feedbackLine && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3">
                  <p className="text-sm text-primary text-center">{feedbackLine}</p>
                </div>
              )}

              {/* 메모(선택) */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 space-y-3">
                <p className="text-xs text-muted-foreground">기억하고 싶은 순간 (선택)</p>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {slot.reflectQ || "해보니 어땠나요? 아주 짧게라도 좋아요."}
                </p>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full bg-secondary/30 rounded-2xl p-4 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground text-sm"
                  placeholder="한 단어도 좋고, 적지 않아도 괜찮아요."
                />
              </div>

              {/* 사진 인증(선택) */}
              <Button
                variant="outline"
                size="lg"
                className={`w-full rounded-2xl h-13 ${photoAttached ? "border-primary/50 text-primary" : ""}`}
                disabled={verifying}
                onClick={() => fileInputRef.current?.click()}
              >
                {verifying ? (
                  "사진을 살펴보고 있어요..."
                ) : photoAttached ? (
                  <><Check className="w-4 h-4 mr-1.5" />사진을 확인했어요</>
                ) : (
                  <><Camera className="w-4 h-4 mr-1.5" />사진 첨부하기</>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center -mt-3">
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

              <Button size="lg" className="w-full rounded-2xl h-14" onClick={handleFinish}>
                {photoAttached ? "인증 완료!" : "기록 저장하기"}
              </Button>

              <button
                onClick={() => setSkipMode(true)}
                className="w-full text-center text-xs text-muted-foreground underline"
              >
                혹시 조각을 건너뛰었나요?
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

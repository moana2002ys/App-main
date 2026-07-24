import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Area, AREAS as AREA_KEYS, getStageTargetArea, getStageAllowedAreas } from "@/lib/classifier";
import { getSurveyCategories } from "@workspace/mission-bank";
import { MOOD_OPTIONS, moodToCondition, GATE_RECHECK_QUESTION } from "@/lib/ba";

// 개선 유형(영역) → 화면 표시 라벨. 진단 라벨·임상 용어 없음.
const AREA_LABEL: Record<Area, string> = {
  rhythm: "규칙적인 하루 리듬",
  selfcare: "나를 돌보는 시간",
  relationship: "사람들과의 관계",
  social: "일이나 진로 방향",
};
// 유형 노출 순서(항상 안전한 생활리듬·자기돌봄이 먼저).
const AREA_ORDER: Area[] = [
  AREA_KEYS.rhythm,
  AREA_KEYS.selfcare,
  AREA_KEYS.relationship,
  AREA_KEYS.social,
];

const INTERESTS = [
  "게임", "음악", "동물", "식물", "요리·먹는 것", "책·글", "스포츠", "그림·만들기",
];

// 데일리 설문 v2: 2문항(기분 5단계 + 활동 선택).
// 관심사는 주 1회 갱신 카드로 이동, 4주마다 게이트 재확인 1문항이 앞에 끼어들 수 있다.
export function DailyCheckin() {
  const { updateUser, setView, user } = useAppStore();
  const [opened, setOpened] = useState(false);

  // 끼어드는 카드: 게이트 재확인(4주) → 관심사 갱신(주 1회) → 본 설문 2문항
  const needGateRecheck = !!user.gateRecheckPending;
  const needInterestCard =
    user.interestAskedDay === null || user.dayCount - user.interestAskedDay >= 7;

  // step: 'gate' | 'interest' | 0(기분) | 1(활동)
  const [step, setStep] = useState<'gate' | 'interest' | 0 | 1>(
    needGateRecheck ? 'gate' : needInterestCard ? 'interest' : 0,
  );
  const [mood, setMood] = useState<number | null>(null);

  const totalMain = 2;

  // 설문 2번째 질문 활동 후보 = 회복단계의 '타깃 영역' 안의 활동만.
  // 카테고리 게이트(금지태그·최소컨디션=기분≥3)는 그대로 적용, 전부 닫히면 스텝다운.
  const activityGroups = useMemo(() => {
    const forbidden = user.forbidden ?? [];
    const condition = moodToCondition((mood ?? 3) as 1 | 2 | 3 | 4 | 5);
    const open = getSurveyCategories({ forbidden, condition });
    const allowed = getStageAllowedAreas(user.stage);
    let targetArea = getStageTargetArea(user.stage, forbidden);
    if (!open.some((c) => c.area === targetArea)) {
      const idx = allowed.indexOf(targetArea);
      for (let i = idx - 1; i >= 0; i--) {
        if (open.some((c) => c.area === allowed[i])) {
          targetArea = allowed[i]!;
          break;
        }
      }
    }
    const eligible = open.filter((c) => c.area === targetArea);
    return AREA_ORDER.map((area) => ({
      area,
      label: AREA_LABEL[area],
      items: eligible
        .filter((c) => c.area === area)
        .map((c) => ({ id: c.id, label: c.label })),
    })).filter((g) => g.items.length > 0);
  }, [user.forbidden, user.stage, mood]);

  // 게이트 재확인: "괜찮아졌어요" → 해당 금지 플래그 해제(단계·밴드 불변). 아니면 유지.
  const handleGateRecheck = (better: boolean) => {
    const tag = user.gateRecheckPending!;
    updateUser({
      gateRecheckPending: null,
      gateRecheckDay: user.dayCount,
      forbidden: better ? user.forbidden.filter((f) => f !== tag) : user.forbidden,
    });
    setStep(needInterestCard ? 'interest' : 0);
  };

  // 주 1회 관심사 카드: 선택 시 관심사 풀 갱신 + 3일 부스트, 건너뛰기 가능.
  const handleInterest = (interest: string | null) => {
    if (interest) {
      const rest = user.interests.filter((i) => i !== interest);
      updateUser({
        interests: [interest, ...rest],
        interestAskedDay: user.dayCount,
        interestBoostUntil: user.dayCount + 3,
      });
    } else {
      updateUser({ interestAskedDay: user.dayCount });
    }
    setStep(0);
  };

  const handleMood = (v: number) => {
    setMood(v);
    setStep(1);
  };

  const handleActivity = (area: Area | 'unknown', activityId?: string) => {
    updateUser({ daily: { mood: mood ?? 3, area, activityId } });
    setView("home");
  };

  if (!opened) {
    return (
      <div className="flex flex-col h-full bg-background p-6">
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full space-y-10 text-center">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Day {user.dayCount}</p>
            <h2 className="text-xl font-medium text-foreground leading-relaxed">
              {user.nickname || '조각이 친구'}님,<br />오늘의 편지가 도착했어요.
            </h2>
          </div>

          <motion.button
            onClick={() => setOpened(true)}
            initial={{ y: -160, rotate: -6, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            whileHover={{ scale: 1.03, rotate: 1 }}
            whileTap={{ scale: 0.97 }}
            className="relative w-64 focus:outline-none"
            aria-label="편지 열어보기"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="relative w-full h-40 bg-[#FFFDF8] rounded-2xl shadow-md border border-border/60 overflow-hidden">
                <div
                  className="absolute inset-x-0 top-0 h-20 bg-[#FFF6E9] border-b border-border/50"
                  style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
                ></div>
                <div className="absolute left-1/2 top-14 -translate-x-1/2 w-10 h-10 rounded-full bg-primary/90 shadow-sm flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-white/40"></div>
                </div>
                <p className="absolute bottom-4 inset-x-0 text-sm text-muted-foreground">
                  To. {user.nickname || '조각이 친구'}
                </p>
              </div>
            </motion.div>
          </motion.button>

          <Button size="lg" className="w-full max-w-xs rounded-2xl h-14" onClick={() => setOpened(true)}>
            열어보기
          </Button>
        </div>
      </div>
    );
  }

  const stepKey = typeof step === 'string' ? step : `step${step}`;

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="h-10 flex items-center">
        <button
          onClick={() => (step === 1 ? setStep(0) : setOpened(false))}
          aria-label="뒤로 가기"
          className="p-2 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepKey}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-center mb-6">
              <Character size="sm" />
            </div>

            {step === 'gate' ? (
              <>
                <div className="bg-[#FFFDF8] p-6 rounded-3xl shadow-sm border border-border/60 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-primary/30"></div>
                  <p className="text-xs text-muted-foreground mb-3">잠깐, 하나만요</p>
                  <p className="text-foreground text-lg leading-relaxed">
                    {GATE_RECHECK_QUESTION[user.gateRecheckPending!] ?? "요즘 마음의 문턱은 어때요?"}
                  </p>
                </div>
                <div className="space-y-3 mt-8">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30"
                    onClick={() => handleGateRecheck(true)}
                  >
                    예전보다 조금 괜찮아졌어요
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30"
                    onClick={() => handleGateRecheck(false)}
                  >
                    아직은 비슷해요
                  </Button>
                </div>
              </>
            ) : step === 'interest' ? (
              <>
                <div className="bg-[#FFFDF8] p-6 rounded-3xl shadow-sm border border-border/60 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-primary/30"></div>
                  <p className="text-xs text-muted-foreground mb-3">이번 주 안부</p>
                  <p className="text-foreground text-lg leading-relaxed">요즘 빠져있는 게 있나요?</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5 mt-8">
                  {INTERESTS.map((i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className={`justify-center text-center h-auto py-3 px-4 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30 ${user.interests[0] === i ? 'border-primary/50 bg-primary/5' : ''}`}
                      onClick={() => handleInterest(i)}
                    >
                      {i}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    className="col-span-2 justify-center text-center h-auto py-3 px-4 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 text-muted-foreground"
                    onClick={() => handleInterest(null)}
                  >
                    이번 주는 건너뛸게요
                  </Button>
                </div>
              </>
            ) : (
              <>
                <motion.div
                  initial={step === 0 ? { scaleY: 0.85, opacity: 0 } : false}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="bg-[#FFFDF8] p-6 rounded-3xl shadow-sm border border-border/60 relative overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-primary/30"></div>
                  <p className="text-xs text-muted-foreground mb-3">오늘의 편지 · {(step as number) + 1}/{totalMain}</p>
                  {user.lastMessage && step === 0 ? (
                    <>
                      <p className="text-sm text-primary mb-2 font-medium">{user.lastMessage}</p>
                      <p className="text-foreground text-lg leading-relaxed">오늘 기분이나 컨디션은 좀 어때요?</p>
                    </>
                  ) : (
                    <p className="text-foreground text-lg leading-relaxed">
                      {step === 0 ? "오늘 기분이나 컨디션은 좀 어때요?" : "오늘은 어떤 걸 해보고 싶나요?"}
                    </p>
                  )}
                </motion.div>

                {step === 0 ? (
                  <div className="flex justify-between gap-1 mt-8">
                    {MOOD_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => handleMood(o.value)}
                        className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white border border-border/50 hover:bg-secondary/50 hover:border-primary/30 transition-colors"
                      >
                        <span className="text-2xl">{o.emoji}</span>
                        <span className="text-[10px] text-muted-foreground">{o.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-8 space-y-6">
                    {activityGroups.map((group) => (
                      <div key={group.area} className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground px-1">{group.label}</p>
                        <div className="space-y-2">
                          {group.items.map((item) => (
                            <Button
                              key={item.id}
                              variant="outline"
                              className="w-full justify-start text-left h-auto py-3.5 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30"
                              onClick={() => handleActivity(group.area, item.id)}
                            >
                              {item.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full justify-center text-center h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30 text-muted-foreground"
                      onClick={() => handleActivity('unknown', undefined)}
                    >
                      잘 모르겠어요
                    </Button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

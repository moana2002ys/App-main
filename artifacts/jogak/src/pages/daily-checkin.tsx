import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { DailyAnswers, Area, AREAS as AREA_KEYS, getStageTargetArea, getStageAllowedAreas } from "@/lib/classifier";
import { getSurveyCategories } from "@workspace/mission-bank";

const CONDITIONS = [
  { label: "바닥이에요", value: "바닥", emoji: "💧" },
  { label: "그저 그래요", value: "그저 그럼", emoji: "☁️" },
  { label: "조금 괜찮아요", value: "괜찮음", emoji: "☀️" }
];

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
  "게임", "음악", "동물", "식물", "요리·먹는 것", "책·글", "스포츠", "그림·만들기", "잘 모르겠어요"
];

export function DailyCheckin() {
  const { updateUser, setView, user } = useAppStore();
  const [opened, setOpened] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<DailyAnswers>>({});

  // 설문 2번째 질문 활동 후보 = 회복단계의 '타깃 영역' 안의 활동만.
  // (타깃 미션 2개가 이 영역에서 나오므로, 고른 활동이 자연스럽게 반영된다.)
  // 카테고리 게이트(getSurveyCategories: 금지태그·컨디션)는 그대로 함께 적용하고,
  // 타깃 영역의 활동이 컨디션 게이트로 전부 닫히면 바로 아래 허용 영역으로 내려간다.
  const activityGroups = useMemo(() => {
    const forbidden = user.forbidden ?? [];
    const condition = answers.condition ?? "그저 그럼";
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
  }, [user.forbidden, user.stage, answers.condition]);

  const handleNext = (val: string) => {
    let newAnswers = { ...answers };

    if (step === 0) newAnswers.condition = val;
    if (step === 2) newAnswers.interest = val;

    setAnswers(newAnswers);

    if (step < 2) {
      setStep(step + 1);
    } else {
      updateUser({ daily: newAnswers as DailyAnswers });
      setView("home");
    }
  };

  // 설문 2번째 질문: 구체 활동 선택 → 활동이 속한 개선 유형(영역)이 자동 결정된다.
  const handleActivity = (area: Area | 'unknown', activityId?: string) => {
    setAnswers({ ...answers, area, activityId });
    setStep(2);
  };

  const currentQ = step === 0 
    ? "오늘 기분이나 컨디션은 좀 어때요?" 
    : step === 1 
    ? "오늘은 어떤 걸 해보고 싶나요?"
    : "요즘 아주 조금이라도 눈길이 가는 게 있다면?";

  const options: { label: string; value: string; prefix?: string }[] = step === 0 
    ? CONDITIONS.map(c => ({ label: c.label, value: c.value, prefix: c.emoji }))
    : step === 2
    ? INTERESTS.map(i => ({ label: i, value: i }))
    : [];

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
              {/* Envelope body */}
              <div className="relative w-full h-40 bg-[#FFFDF8] rounded-2xl shadow-md border border-border/60 overflow-hidden">
                {/* Flap */}
                <div
                  className="absolute inset-x-0 top-0 h-20 bg-[#FFF6E9] border-b border-border/50"
                  style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
                ></div>
                {/* Seal */}
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

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="h-10 flex items-center">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : setOpened(false))}
          aria-label="뒤로 가기"
          className="p-2 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={`step${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-center mb-6">
              <Character size="sm" />
            </div>

            {/* Letter paper */}
            <motion.div
              initial={step === 0 ? { scaleY: 0.85, opacity: 0 } : false}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-[#FFFDF8] p-6 rounded-3xl shadow-sm border border-border/60 relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-primary/30"></div>
              <p className="text-xs text-muted-foreground mb-3">오늘의 편지 · {step + 1}/3</p>
              {user.lastMessage && step === 0 ? (
                <>
                  <p className="text-sm text-primary mb-2 font-medium">{user.lastMessage}</p>
                  <p className="text-foreground text-lg leading-relaxed">{currentQ}</p>
                </>
              ) : (
                <p className="text-foreground text-lg leading-relaxed">{currentQ}</p>
              )}
            </motion.div>

            {step === 1 ? (
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
            ) : (
            <div className={`mt-8 ${step === 2 ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
              {options.map((opt) => (
                <Button
                  key={opt.value}
                  variant="outline"
                  className={`w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30 ${step === 2 ? 'px-4 py-3 justify-center text-center col-span-1' : ''} ${step === 2 && opt.value === '잘 모르겠어요' ? 'col-span-2' : ''}`}
                  onClick={() => handleNext(opt.value)}
                >
                  {opt.prefix && <span className="mr-3 text-xl">{opt.prefix}</span>}
                  {opt.label}
                </Button>
              ))}
            </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

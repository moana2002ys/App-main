import { useMemo, useState } from "react";
import { useAppStore, emptyKnowYourself } from "@/lib/store";
import { todayKey } from "@/lib/day";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, LogOut } from "lucide-react";
import { getFirstLaunchItems } from "@/lib/survey";
import { scoreGatingOnly, deriveLegacyAnswers, SurveyResponses } from "@/lib/survey-scoring";
import { emptyOnboardingWeek } from "@/lib/ba";
import { CardDeck } from "@/components/CardDeck";
import { Baebdal } from "@/components/onboarding/Baebdal";
import { SlotsVisual, ResizeVisual, KeepVisual } from "@/components/onboarding/Visuals";
import { D0_1_WELCOME, D0_2_NICKNAME, D0_3_PHILOSOPHY, D0_4_USAGE } from "@/lib/onboarding-copy";

// Day 0 — 가입 당일 (v5 기획안 D0-1 ~ D0-5. D0-6 맛보기는 taster.tsx)
//   D0-1 환영 4장 → D0-2 닉네임(필수) → D0-3 설계철학 3장 → D0-4 사용법 3장 → D0-5 은둔 체크 2문항
// 설명을 먼저 하고 질문을 나중에 한다(결정근거 D-11). 문구는 lib/onboarding-copy.ts.
type Step = "welcome" | "nickname" | "philosophy" | "usage" | "survey";
const ORDER: Step[] = ["welcome", "nickname", "philosophy", "usage", "survey"];

export function Onboarding() {
  const { user, updateUser, setView, signOut } = useAppStore();
  // 첫 실행은 은둔 체크(sc_q1·sc_q2)만. 상황 체크리스트 15문항은 Day1로 (9.4 결정).
  const items = useMemo(
    () => getFirstLaunchItems().filter((i) => i.moduleId === "seclusion_check"),
    [],
  );
  const [step, setStep] = useState<Step>("welcome");
  const [qIndex, setQIndex] = useState(0);
  const [responses, setResponses] = useState<SurveyResponses>({});
  const [nickname, setNickname] = useState("");

  const go = (s: Step) => setStep(s);
  const back = () => {
    if (step === "survey" && qIndex > 0) return setQIndex(qIndex - 1);
    const i = ORDER.indexOf(step);
    if (i > 0) setStep(ORDER[i - 1]!);
  };

  const currentItem = step === "survey" ? items[qIndex] : null;
  const progress = currentItem ? (qIndex + 1) / (items.length + 1) : 0;
  const nick = nickname.trim();

  const handleAnswer = (v: number) => {
    if (!currentItem) return;
    const next = { ...responses, [currentItem.id]: v };
    setResponses(next);
    if (qIndex < items.length - 1) setQIndex(qIndex + 1);
    else finish(next);
  };

  const finish = (finalResponses: SurveyResponses) => {
    // 은둔 체크만으로 보수적 임시 판정 — Day1 15문항 완료 시 정식 채점으로 갱신
    const result = scoreGatingOnly(finalResponses);
    const legacy = deriveLegacyAnswers(finalResponses, result);
    updateUser({
      nickname: nick, // 필수 입력(9.9). 기본 호칭 없음.
      onboarding: legacy,
      surveyResponses: finalResponses,
      secluded: result.secluded,
      areaSeeds: result.areaSeeds,
      knowYourself: emptyKnowYourself(),
      stage: result.stage,
      baseBandLow: result.baseBandLow,
      baseBandHigh: result.baseBandHigh,
      currentBandLow: result.baseBandLow,
      currentBandHigh: result.baseBandHigh,
      forbidden: result.forbidden,
      phase: "onboarding_week",
      onboardingWeek: emptyOnboardingWeek(),
      // 가입한 날 = 이 사람의 Day0. 여기서부터 각자의 달력이 흐른다.
      startedAt: user.startedAt ?? todayKey(),
      lastSeenDate: todayKey(),
      dayCount: 1,
    });
    setView("taster"); // D0-6 맛보기 → Day0 끝
  };

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="h-10 flex items-center gap-3">
        {step !== "welcome" && (
          <button
            onClick={back}
            aria-label="뒤로 가기"
            className="p-2 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {progress > 0 && (
          <div className="flex-1 h-1.5 bg-secondary/60 rounded-full overflow-hidden" aria-hidden="true">
            <motion.div
              className="h-full bg-primary/50 rounded-full"
              initial={false}
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        )}
        <div className="flex-1" />
        <button
          onClick={signOut}
          aria-label="로그아웃"
          className="p-2 -mr-2 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === "welcome" ? (
            <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
              {/* D0-1 환영 4장 — 인사 / 소개 / 이름 질문 / 핍 소개 */}
              <CardDeck cards={D0_1_WELCOME} onDone={() => go("nickname")} mascot="wave" lastCta="다음" />
            </motion.div>
          ) : step === "nickname" ? (
            <motion.div
              key="nickname"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 flex flex-col items-center text-center my-auto w-full"
            >
              {/* D0-2 닉네임 — 필수, 기본 호칭 없음, 캐릭터 색 선택 삭제 (9.9) */}
              <Baebdal state="idle" size="lg" />
              <h2 className="text-xl font-medium text-foreground leading-relaxed">{D0_2_NICKNAME.ask}</h2>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && nick) go("philosophy"); }}
                maxLength={10}
                autoFocus
                placeholder={D0_2_NICKNAME.placeholder}
                className="w-full bg-white rounded-2xl px-5 py-4 text-center text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button size="lg" className="w-full rounded-2xl h-14" disabled={!nick} onClick={() => go("philosophy")}>
                {D0_2_NICKNAME.cta}
              </Button>
            </motion.div>
          ) : step === "philosophy" ? (
            <motion.div key="philosophy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
              {/* D0-3 설계철학 3장 (내부 라벨: 자율성·유능성·관계성 — 비노출) */}
              <CardDeck cards={D0_3_PHILOSOPHY} onDone={() => go("usage")} mascot="happy" lastCta="다음" />
            </motion.div>
          ) : step === "usage" ? (
            <motion.div key="usage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
              {/* D0-4 사용법 3장 */}
              <CardDeck
                cards={D0_4_USAGE}
                visuals={[<SlotsVisual key="s" />, <ResizeVisual key="r" />, <KeepVisual key="k" />]}
                onDone={() => go("survey")}
                lastCta="알겠어"
              />
            </motion.div>
          ) : currentItem ? (
            <motion.div
              key={`q-${currentItem.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 my-auto w-full py-4"
            >
              {/* D0-5 은둔 체크 2문항 — 문항·선택지는 onboarding-survey.json 단일 출처 */}
              <div className="flex justify-center mb-6"><Baebdal state="idle" size="sm" /></div>
              <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-border/50 text-foreground text-lg leading-relaxed relative">
                {currentItem.q}
                <div className="absolute top-0 -left-3 w-4 h-4 bg-white border-l border-t border-border/50 transform -skew-x-[20deg]" />
              </div>
              {/* 선택지는 항상 1열 (결정근거 D-13) */}
              <div className={`mt-6 ${currentItem.options.length > 5 ? "space-y-2" : "space-y-3"}`}>
                {currentItem.options.map((opt) => (
                  <Button
                    key={`${currentItem.id}-${opt.v}`}
                    variant="outline"
                    className={`w-full justify-start text-left h-auto rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30 whitespace-normal ${currentItem.options.length > 5 ? "py-3 px-5 text-[15px]" : "py-4 px-6"}`}
                    onClick={() => handleAnswer(opt.v)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { determineStage, OnboardingAnswers } from "@/lib/classifier";

const QUESTIONS = [
  {
    id: "sleep",
    question: "어제 몇 시쯤 주무셨나요?",
    options: ["밤낮이 바뀌었어요", "새벽 늦게 잤어요", "자정 전후에 잤어요", "규칙적으로 자고 있어요"],
    values: ["밤낮 바뀜", "새벽", "자정 전후", "규칙적"]
  },
  {
    id: "outing",
    question: "요즘 집 밖에 나가는 건 얼마나 부담되나요?",
    options: ["매우 부담돼요", "조금 부담돼요", "괜찮아요"],
    values: ["매우 부담", "조금 부담", "괜찮음"]
  },
  {
    id: "contact",
    question: "지금 편한 소통 방식은 어떤 건가요?",
    options: ["혼자가 편해요", "문자가 좋아요", "전화도 괜찮아요", "만나서 대화도 괜찮아요"],
    values: ["혼자가 편함", "문자", "전화", "대면 괜찮음"]
  },
  {
    id: "area",
    question: "지금 가장 신경 쓰이는 부분은 어디인가요?",
    options: ["규칙적인 하루 리듬", "나를 돌보는 시간", "사람들과의 관계", "일이나 진로 방향", "잘 모르겠어요"],
    values: ["rhythm", "selfcare", "relationship", "social", "unknown"]
  }
];

const COLORS = [
  { id: "#FBBF24", name: "따뜻한 노랑" },
  { id: "#60A5FA", name: "차분한 파랑" },
  { id: "#34D399", name: "포근한 초록" },
  { id: "#F472B6", name: "부드러운 분홍" }
];

export function Onboarding() {
  const { updateUser, setView } = useAppStore();
  const [step, setStep] = useState(0); // 0: color, 1-4: questions
  const [color, setColor] = useState("#FBBF24");
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});

  const handleNext = (val?: string) => {
    if (step === 0) {
      updateUser({ characterColor: color });
      setStep(1);
    } else {
      const q = QUESTIONS[step - 1];
      const newAnswers = { ...answers, [q.id]: val } as Partial<OnboardingAnswers>;
      setAnswers(newAnswers);
      
      if (step < QUESTIONS.length) {
        setStep(step + 1);
      } else {
        // Finish onboarding
        const finalAnswers = newAnswers as OnboardingAnswers;
        const { stage, baseBandLow, baseBandHigh, forbidden } = determineStage(finalAnswers);
        
        updateUser({
          onboarding: finalAnswers,
          stage,
          baseBandLow,
          baseBandHigh,
          currentBandLow: baseBandLow,
          currentBandHigh: baseBandHigh,
          forbidden
        });
        setView("daily_checkin");
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 flex flex-col items-center text-center"
            >
              <div className="space-y-2">
                <h1 className="text-2xl font-medium text-foreground">반가워요.</h1>
                <p className="text-muted-foreground">함께할 조각이의 색을 골라볼까요?</p>
              </div>

              <div className="my-8">
                <Character className="scale-125" showItems={false} />
              </div>

              <div className="flex gap-4 justify-center">
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setColor(c.id)}
                    className={`w-12 h-12 rounded-full transition-transform ${color === c.id ? 'scale-125 ring-4 ring-offset-4 ring-primary/30' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c.id }}
                  />
                ))}
              </div>

              <Button size="lg" className="w-full rounded-2xl mt-8" onClick={() => handleNext()}>
                좋아요
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key={`step${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-center mb-8">
                <Character size="sm" showItems={false} />
              </div>

              <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-border/50 text-foreground text-lg leading-relaxed relative">
                {QUESTIONS[step - 1].question}
                {/* Speech bubble tail */}
                <div className="absolute top-0 -left-3 w-4 h-4 bg-white border-l border-t border-border/50 transform -skew-x-[20deg]"></div>
              </div>

              <div className="space-y-3 mt-8">
                {QUESTIONS[step - 1].options.map((opt, i) => (
                  <Button
                    key={opt}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30"
                    onClick={() => handleNext(QUESTIONS[step - 1].values[i])}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

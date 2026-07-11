import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { DailyAnswers, Area } from "@/lib/classifier";

const CONDITIONS = [
  { label: "바닥이에요", value: "바닥", emoji: "💧" },
  { label: "그저 그래요", value: "그저 그럼", emoji: "☁️" },
  { label: "조금 괜찮아요", value: "괜찮음", emoji: "☀️" }
];

const AREAS = [
  { label: "규칙적인 하루 리듬", value: "rhythm" },
  { label: "나를 돌보는 시간", value: "selfcare" },
  { label: "사람들과의 관계", value: "relationship" },
  { label: "일이나 진로 방향", value: "social" },
  { label: "잘 모르겠어요", value: "unknown" }
];

const INTERESTS = [
  "게임", "음악", "동물", "식물", "요리·먹는 것", "책·글", "스포츠", "그림·만들기", "잘 모르겠어요"
];

export function DailyCheckin() {
  const { updateUser, setView, user } = useAppStore();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<DailyAnswers>>({});

  const handleNext = (val: string) => {
    let newAnswers = { ...answers };
    
    if (step === 0) newAnswers.condition = val;
    if (step === 1) newAnswers.area = val as Area | 'unknown';
    if (step === 2) newAnswers.interest = val;

    setAnswers(newAnswers);

    if (step < 2) {
      setStep(step + 1);
    } else {
      updateUser({ daily: newAnswers as DailyAnswers });
      setView("home");
    }
  };

  const currentQ = step === 0 
    ? "오늘 기분이나 컨디션은 좀 어때요?" 
    : step === 1 
    ? "오늘은 어떤 걸 해보고 싶나요?"
    : "요즘 아주 조금이라도 눈길이 가는 게 있다면?";

  const options: { label: string; value: string; prefix?: string }[] = step === 0 
    ? CONDITIONS.map(c => ({ label: c.label, value: c.value, prefix: c.emoji }))
    : step === 1
    ? AREAS.map(a => ({ label: a.label, value: a.value }))
    : INTERESTS.map(i => ({ label: i, value: i }));

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={`step${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-center mb-8">
              <Character size="sm" />
            </div>

            <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-border/50 text-foreground text-lg leading-relaxed relative">
              {user.lastMessage && step === 0 ? (
                <>
                  <p className="text-sm text-primary mb-2 font-medium">{user.lastMessage}</p>
                  <p>{currentQ}</p>
                </>
              ) : (
                currentQ
              )}
              <div className="absolute top-0 -left-3 w-4 h-4 bg-white border-l border-t border-border/50 transform -skew-x-[20deg]"></div>
            </div>

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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

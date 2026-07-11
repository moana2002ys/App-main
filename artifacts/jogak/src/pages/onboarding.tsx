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

// step 0: 인트로 / 1~4: 온보딩 설문 / 5: 닉네임·캐릭터 색
export function Onboarding() {
  const { updateUser, setView } = useAppStore();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const [nickname, setNickname] = useState("");
  const [color, setColor] = useState("#FBBF24");

  const handleAnswer = (val: string) => {
    const q = QUESTIONS[step - 1];
    setAnswers(prev => ({ ...prev, [q.id]: val }));
    setStep(step + 1);
  };

  const handleFinish = () => {
    const finalAnswers = answers as OnboardingAnswers;
    const { stage, baseBandLow, baseBandHigh, forbidden } = determineStage(finalAnswers);

    updateUser({
      nickname: nickname.trim() || "조각이 친구",
      characterColor: color,
      onboarding: finalAnswers,
      stage,
      baseBandLow,
      baseBandHigh,
      currentBandLow: baseBandLow,
      currentBandHigh: baseBandHigh,
      forbidden
    });
    setView("daily_checkin");
  };

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 flex flex-col items-center text-center"
            >
              <div className="my-6">
                <Character className="scale-125" showItems={false} />
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-medium text-foreground">반가워요.</h1>
                <p className="text-muted-foreground leading-relaxed">
                  조각조각은 하루에 하나,<br />
                  아주 작은 조각을 함께 모으는 공간이에요.
                </p>
                <p className="text-sm text-muted-foreground">
                  먼저 몇 가지만 가볍게 여쭤볼게요.<br />
                  정답은 없으니 편하게 골라주세요.
                </p>
              </div>

              <Button size="lg" className="w-full rounded-2xl mt-4 h-14" onClick={() => setStep(1)}>
                천천히 시작하기
              </Button>
            </motion.div>
          ) : step <= QUESTIONS.length ? (
            <motion.div
              key={`q${step}`}
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
                <div className="absolute top-0 -left-3 w-4 h-4 bg-white border-l border-t border-border/50 transform -skew-x-[20deg]"></div>
              </div>

              <div className="space-y-3 mt-8">
                {QUESTIONS[step - 1].options.map((opt, i) => (
                  <Button
                    key={opt}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30"
                    onClick={() => handleAnswer(QUESTIONS[step - 1].values[i])}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 flex flex-col items-center text-center"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-medium text-foreground">거의 다 왔어요.</h2>
                <p className="text-muted-foreground">함께할 조각이를 꾸며볼까요?</p>
              </div>

              <motion.div
                key={color}
                initial={{ scale: 0.92 }}
                animate={{ scale: 1 }}
                className="my-4"
              >
                <Character className="scale-125" showItems={false} colorOverride={color} />
              </motion.div>

              <div className="flex gap-4 justify-center">
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setColor(c.id)}
                    aria-label={c.name}
                    className={`w-12 h-12 rounded-full transition-transform ${color === c.id ? 'scale-125 ring-4 ring-offset-4 ring-primary/30' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c.id }}
                  />
                ))}
              </div>

              <div className="w-full space-y-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  maxLength={10}
                  placeholder="닉네임을 지어주세요 (예: 새벽별)"
                  className="w-full bg-white rounded-2xl px-5 py-4 text-center text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-xs text-muted-foreground">비워두면 '조각이 친구'로 불러드릴게요.</p>
              </div>

              <Button size="lg" className="w-full rounded-2xl h-14" onClick={handleFinish}>
                좋아요, 시작할게요
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

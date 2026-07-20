import { useMemo, useState } from "react";
import { useAppStore, emptyKnowYourself } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { getFirstLaunchItems, firstLaunchIntro } from "@/lib/survey";
import { scoreFirstLaunch, deriveLegacyAnswers, SurveyResponses } from "@/lib/survey-scoring";

const COLORS = [
  { id: "#FBBF24", name: "따뜻한 노랑" },
  { id: "#60A5FA", name: "차분한 파랑" },
  { id: "#34D399", name: "포근한 초록" },
  { id: "#F472B6", name: "부드러운 분홍" }
];

// step 0: 인트로 / 1~N: 설문 문항(JSON 단일 출처, 한 번에 하나씩) / N+1: 닉네임·캐릭터 색
export function Onboarding() {
  const { updateUser, setView } = useAppStore();
  const items = useMemo(() => getFirstLaunchItems(), []);
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<SurveyResponses>({});
  const [nickname, setNickname] = useState("");
  const [color, setColor] = useState("#FBBF24");

  const totalSteps = items.length;
  const currentItem = step >= 1 && step <= totalSteps ? items[step - 1] : null;
  // 진행 표시: 숫자 없이 부드러운 게이지만
  const progress = step >= 1 && step <= totalSteps ? step / (totalSteps + 1) : 0;

  const handleAnswer = (v: number) => {
    if (!currentItem) return;
    setResponses(prev => ({ ...prev, [currentItem.id]: v }));
    setStep(step + 1);
  };

  const handleFinish = () => {
    const result = scoreFirstLaunch(items, responses);
    const legacy = deriveLegacyAnswers(responses, result);

    updateUser({
      nickname: nickname.trim() || "조각이 친구",
      characterColor: color,
      onboarding: legacy,
      surveyResponses: responses,
      secluded: result.secluded,
      areaSeeds: result.areaSeeds,
      knowYourself: emptyKnowYourself(),
      stage: result.stage,
      baseBandLow: result.baseBandLow,
      baseBandHigh: result.baseBandHigh,
      currentBandLow: result.baseBandLow,
      currentBandHigh: result.baseBandHigh,
      forbidden: result.forbidden
    });
    setView("daily_checkin");
  };

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="h-10 flex items-center gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
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
      </div>
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
                <p className="text-sm text-muted-foreground">{firstLaunchIntro}</p>
              </div>

              <Button size="lg" className="w-full rounded-2xl mt-4 h-14" onClick={() => setStep(1)}>
                천천히 시작하기
              </Button>
            </motion.div>
          ) : currentItem ? (
            <motion.div
              key={`q-${currentItem.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-center mb-6">
                <Character size="sm" showItems={false} />
              </div>

              <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-border/50 text-foreground text-lg leading-relaxed relative">
                {currentItem.q}
                <div className="absolute top-0 -left-3 w-4 h-4 bg-white border-l border-t border-border/50 transform -skew-x-[20deg]"></div>
              </div>

              <div className={`mt-6 ${currentItem.options.length > 5 ? 'grid grid-cols-2 gap-2.5' : 'space-y-3'}`}>
                {currentItem.options.map((opt) => (
                  <Button
                    key={`${currentItem.id}-${opt.v}`}
                    variant="outline"
                    className={`w-full justify-start text-left h-auto rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30 whitespace-normal ${currentItem.options.length > 5 ? 'py-3 px-4 text-sm' : 'py-4 px-6'}`}
                    onClick={() => handleAnswer(opt.v)}
                  >
                    {opt.label}
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

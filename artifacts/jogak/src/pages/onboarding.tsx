import { useMemo, useState } from "react";
import { useAppStore, emptyKnowYourself } from "@/lib/store";
import { todayKey } from "@/lib/day";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { getFirstLaunchItems, firstLaunchIntro } from "@/lib/survey";
import { scoreGatingOnly, deriveLegacyAnswers, SurveyResponses } from "@/lib/survey-scoring";
import { emptyOnboardingWeek } from "@/lib/ba";

const COLORS = [
  { id: "#FBBF24", name: "따뜻한 노랑" },
  { id: "#60A5FA", name: "차분한 파랑" },
  { id: "#34D399", name: "포근한 초록" },
  { id: "#F472B6", name: "부드러운 분홍" }
];

// 설계철학 — 문항을 묻기 '전에' 약속부터 한다.
// 팀 불변 원칙(스트릭 미표시·보상 회수 없음·낙인 언어 금지)을 사용자 언어로 옮긴 것이다.
const INTRO_CARDS: { title: string; body: string; note?: string }[] = [
  {
    title: "반가워요.",
    body: "조각조각은 하루에 하나,\n아주 작은 조각을 함께 모으는 공간이에요.",
  },
  {
    title: "여기선 아무도\n재촉하지 않아요",
    body: "안 한 날이 있어도 그대로 이어가요.\n며칠 연속 했는지 세지 않고,\n한 번 모은 조각을 도로 가져가지도 않아요.",
  },
  {
    title: "몇 가지만\n여쭤볼게요",
    body: "답은 오늘 어떤 조각을 놓아둘지\n고르는 데에만 써요.\n어딘가에 보여지거나 등급을 매기지 않아요.",
  },
];

// step 0~2: 설계철학 인트로 / 그 다음 N개: 설문 문항(JSON 단일 출처) / 마지막: 닉네임·캐릭터 색
export function Onboarding() {
  const { user, updateUser, setView } = useAppStore();
  // 첫 실행은 고립 여부를 가르는 은둔 체크(sc_q1·sc_q2)만.
  // 나머지 상황 체크리스트(ss1~ss15)는 온보딩 주간 Day2 미션으로 진행한다.
  const items = useMemo(
    () => getFirstLaunchItems().filter((i) => i.moduleId === "seclusion_check"),
    [],
  );
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<SurveyResponses>({});
  const [nickname, setNickname] = useState("");
  const [color, setColor] = useState("#FBBF24");

  const introCount = INTRO_CARDS.length;
  const totalSteps = items.length;
  const inIntro = step < introCount;
  const currentItem =
    step >= introCount && step < introCount + totalSteps ? items[step - introCount] : null;
  // 진행 표시: 숫자 없이 부드러운 게이지만(설문 구간에서만)
  const progress = currentItem ? (step - introCount + 1) / (totalSteps + 1) : 0;

  const handleAnswer = (v: number) => {
    if (!currentItem) return;
    setResponses(prev => ({ ...prev, [currentItem.id]: v }));
    setStep(step + 1);
  };

  const handleFinish = () => {
    // 은둔 체크만으로 보수적 임시 판정 — Day2 체크리스트 완료 시 정식 채점으로 갱신
    const result = scoreGatingOnly(responses);
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
      forbidden: result.forbidden,
      phase: 'onboarding_week',
      onboardingWeek: emptyOnboardingWeek(),
      // 온보딩을 시작한 날 = 이 사람의 Day1. 여기서부터 각자의 달력이 흐른다.
      startedAt: user.startedAt ?? todayKey(),
      lastSeenDate: todayKey(),
      dayCount: 1,
    });
    // 설문 → 맛보기 챌린지(첫 성공) → 앱 원리 설명 → 온보딩 주간
    setView("taster");
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
      {/* justify-center 대신 자식 my-auto: 선택지가 길어 넘칠 때 위가 잘리지 않고 스크롤된다 */}
      <div className="flex-1 flex flex-col overflow-y-auto max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {inIntro ? (
            <motion.div
              key={`intro-${step}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 flex flex-col items-center text-center my-auto w-full"
            >
              <div className="my-6">
                <Character className="scale-125" showItems={false} />
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-medium text-foreground whitespace-pre-line leading-snug">
                  {INTRO_CARDS[step]!.title}
                </h1>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {INTRO_CARDS[step]!.body}
                </p>
                {step === introCount - 1 && (
                  <p className="text-sm text-muted-foreground">{firstLaunchIntro}</p>
                )}
              </div>

              {/* 인트로 진행 점 — 숫자 대신 점으로만 */}
              <div className="flex gap-1.5" aria-hidden="true">
                {INTRO_CARDS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? "w-5 bg-primary/60" : "w-1.5 bg-secondary"
                    }`}
                  />
                ))}
              </div>

              <Button
                size="lg"
                className="w-full rounded-2xl mt-2 h-14"
                onClick={() => setStep(step + 1)}
              >
                {step === introCount - 1 ? "천천히 시작하기" : "다음"}
              </Button>
            </motion.div>
          ) : currentItem ? (
            <motion.div
              key={`q-${currentItem.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 my-auto w-full py-4"
            >
              <div className="flex justify-center mb-6">
                <Character size="sm" showItems={false} />
              </div>

              <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-border/50 text-foreground text-lg leading-relaxed relative">
                {currentItem.q}
                <div className="absolute top-0 -left-3 w-4 h-4 bg-white border-l border-t border-border/50 transform -skew-x-[20deg]"></div>
              </div>

              {/* 선택지는 항상 1열 — 2열 격자는 시선이 갈지자로 움직여 읽기 어렵다(8.12 피드백) */}
              <div className={`mt-6 ${currentItem.options.length > 5 ? 'space-y-2' : 'space-y-3'}`}>
                {currentItem.options.map((opt) => (
                  <Button
                    key={`${currentItem.id}-${opt.v}`}
                    variant="outline"
                    className={`w-full justify-start text-left h-auto rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30 whitespace-normal ${currentItem.options.length > 5 ? 'py-3 px-5 text-[15px]' : 'py-4 px-6'}`}
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
              className="space-y-8 flex flex-col items-center text-center my-auto w-full"
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

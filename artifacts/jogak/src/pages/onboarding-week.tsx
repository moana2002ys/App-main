import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import {
  MOOD_OPTIONS,
  getOnboardingMission,
  emptyOnboardingWeek,
  summarizeOnboardingWeek,
  OnboardingDayEntry,
} from "@/lib/ba";
import { getFirstLaunchItems } from "@/lib/survey";
import { scoreFirstLaunch, deriveLegacyAnswers, SurveyResponses } from "@/lib/survey-scoring";

// Day1 심리교육 슬라이드 — 진단·낙인 언어 없이, '상태'와 '작은 행동'의 이야기만.
type LearnFace = "frown" | "wink" | "smile" | "joy";

const LEARN_CARDS: {
  face: LearnFace;
  title: string;
  body: string;
  diagram?: "cycle" | "arrow";
  cta?: string;
}[] = [
  {
    face: "frown",
    title: "아무것도\n하고 싶지 않은 날이 있죠?",
    body: "이불 밖으로 나가기도 벅차고,\n모든 것이 무의미하게 느껴질 때가 있어요.",
  },
  {
    face: "wink",
    title: "우리는 보통 기분이\n나아지면 움직이려 해요",
    body: "하지만 무기력할 때 기다리기만 하면\n오히려 더 우울해지곤 하죠.",
    diagram: "cycle",
  },
  {
    face: "smile",
    title: "일단 아주 작은 것부터\n움직여 볼까요?",
    body: "신기하게도 작은 행동을 먼저 하면,\n그 뒤에 기분이 서서히 따라온답니다.",
    diagram: "arrow",
  },
  {
    face: "joy",
    title: "이제부터 당신만의\n작은 조각을 맞춰볼까요?",
    body: "매일 조금씩 성취감과 즐거움을 주는\n나만의 조각들을 찾아봐요.",
    cta: "내 가치 찾기",
  },
];

// 목업의 노란 얼굴 — 슬라이드별 표정
function LearnFaceSvg({ face }: { face: LearnFace }) {
  return (
    <svg viewBox="0 0 100 100" className="w-40 h-40 mx-auto">
      <circle cx="50" cy="50" r="46" fill="#FCD34D" />
      {face === "frown" && (
        <>
          <path d="M28 34 L42 40" stroke="#3F3B33" strokeWidth="4" strokeLinecap="round" />
          <path d="M72 34 L58 40" stroke="#3F3B33" strokeWidth="4" strokeLinecap="round" />
          <circle cx="36" cy="47" r="4.5" fill="#3F3B33" />
          <circle cx="64" cy="47" r="4.5" fill="#3F3B33" />
          <path d="M38 68 Q50 58 62 68" stroke="#3F3B33" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {face === "wink" && (
        <>
          <path d="M60 26 Q64 20 68 26" stroke="#3F3B33" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="36" cy="44" r="5" fill="#3F3B33" />
          <circle cx="63" cy="44" r="3.5" fill="#3F3B33" />
          <path d="M42 62 Q50 68 58 62" stroke="#3F3B33" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )}
      {face === "smile" && (
        <>
          <circle cx="35" cy="42" r="5" fill="#3F3B33" />
          <circle cx="65" cy="42" r="5" fill="#3F3B33" />
          <ellipse cx="28" cy="52" rx="5" ry="3" fill="#F9A8A8" opacity="0.7" />
          <ellipse cx="72" cy="52" rx="5" ry="3" fill="#F9A8A8" opacity="0.7" />
          <path d="M32 56 Q50 74 68 56" stroke="#3F3B33" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {face === "joy" && (
        <>
          <path d="M24 26 L34 20 L36 30 Z" fill="#FB923C" />
          <path d="M76 26 L66 20 L64 30 Z" fill="#FB923C" />
          <path d="M28 44 Q35 36 42 44" stroke="#3F3B33" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M58 44 Q65 36 72 44" stroke="#3F3B33" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M30 56 Q50 78 70 56" stroke="#3F3B33" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

// 슬라이드 2: 기분 저하 → 더 우울함 → 미루기/회피 악순환 다이어그램
function CycleDiagram() {
  return (
    <div className="relative w-56 h-40 mx-auto">
      <svg viewBox="0 0 224 160" className="absolute inset-0 w-full h-full">
        <circle cx="112" cy="84" r="46" fill="none" stroke="#D6D3CB" strokeWidth="2" strokeDasharray="4 6" />
      </svg>
      <span className="absolute left-1/2 -translate-x-1/2 top-0 bg-white border border-border/50 rounded-full px-4 py-1.5 text-sm text-foreground/80 shadow-sm">
        기분 저하
      </span>
      <span className="absolute left-2 bottom-2 bg-secondary border border-border/50 rounded-full px-4 py-1.5 text-sm text-foreground font-medium shadow-sm">
        더 우울함
      </span>
      <span className="absolute right-0 bottom-2 bg-white border border-border/50 rounded-full px-4 py-1.5 text-sm text-foreground/80 shadow-sm">
        미루기/회피
      </span>
    </div>
  );
}

// 슬라이드 3: 작은 행동 → 기분이 따라옴!
function ArrowDiagram() {
  return (
    <div className="flex flex-col items-center gap-0">
      <span className="bg-white border-2 border-primary rounded-full px-6 py-2.5 text-base font-medium text-foreground shadow-sm">
        작은 행동
      </span>
      <div className="w-1 h-8 bg-primary/60 rounded-full my-1.5" />
      <span className="bg-primary/15 border border-primary/40 rounded-2xl px-5 py-2 text-sm font-medium text-foreground">
        기분이 따라옴!
      </span>
    </div>
  );
}

const INTERESTS = [
  "게임", "음악", "동물", "식물", "요리·먹는 것", "책·글", "스포츠", "그림·만들기",
];

// P/M 간이 탭(온보딩 주간 전용 — 슬라이더는 본 사이클부터)
const PM_TAPS = [
  { v: 1, label: "별로였어요" },
  { v: 3, label: "그냥 그랬어요" },
  { v: 5, label: "좋았어요" },
];

type Step = "journey" | "mood" | "mission" | "learn" | "survey" | "pm" | "interests" | "ready";

// 온보딩 1주: 지정된 하루 1개 초소형 미션이라 '오늘 뭘 할까'가 아니라
// '7일 여정 위 어디쯤인가'가 보여야 한다 → 타임라인이 기본 화면.
export function OnboardingWeek() {
  const { user, updateUser, setView } = useAppStore();
  const week = user.onboardingWeek ?? emptyOnboardingWeek();
  const dayIdx = Math.min(week.dayIndex, 7); // 1~7
  const mission = getOnboardingMission(dayIdx, user.forbidden);

  const [step, setStep] = useState<Step>("journey");
  const [mood, setMood] = useState<number | null>(null);
  const [p, setP] = useState<number | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  // Day1 심리교육 / Day2 상황 체크리스트 진행 상태
  const [learnIndex, setLearnIndex] = useState(0);
  const [ssIndex, setSsIndex] = useState(0);
  const [ssResponses, setSsResponses] = useState<SurveyResponses>({});
  const ssItems = getFirstLaunchItems().filter((i) => i.moduleId === "seclusion_status");

  const entries = user.onboardingWeek?.entries ?? week.entries;
  const todayEntry = entries.find((e) => e.day === dayIdx) ?? null;
  const completedCount = entries.filter((e) => e.completed).length;

  const finishDay = (entry: OnboardingDayEntry) => {
    updateUser({
      onboardingWeek: { ...week, entries: [...entries.filter((e) => e.day !== entry.day), entry] },
    });
    setStep("journey");
  };

  const goNextDay = () => {
    if (dayIdx >= 7) {
      setStep("interests");
      return;
    }
    updateUser({
      onboardingWeek: { ...week, entries, dayIndex: dayIdx + 1 },
      dayCount: user.dayCount + 1,
    });
    setMood(null);
    setP(null);
    setStep("journey");
  };

  const finishWeek = () => {
    const finalWeek = { ...(user.onboardingWeek ?? week), done: true, dayIndex: 8 };
    const summary = summarizeOnboardingWeek(finalWeek);
    updateUser({
      onboardingWeek: finalWeek,
      phase: 'cycle',
      cycleStartDay: user.dayCount + 1,
      dayCount: user.dayCount + 1,
      moodBaseline: summary.moodBaseline,
      areaPM: summary.initialAreaPM,
      interests: selectedInterests,
      interestAskedDay: user.dayCount + 1,
      // 온보딩 skip_pattern: 명시적 skip ≥2회면 회피 슬롯 1주차 조기 활성화
      skipLog: [],
      daily: null,
    });
    setView("daily_checkin");
  };

  const entryBase = { day: dayIdx, mood: mood ?? 3 };

  // Day2 체크리스트 완료: 온보딩 응답과 합쳐 정식 첫 실행 채점으로 갱신.
  // 금지조건은 절대 완화하지 않는다 — 기존 게이트와 새 결과의 합집합만 허용.
  const finishSurveyMission = (finalResponses: SurveyResponses) => {
    const allItems = getFirstLaunchItems();
    const merged = { ...(user.surveyResponses ?? {}), ...finalResponses };
    const result = scoreFirstLaunch(allItems, merged);
    const legacy = deriveLegacyAnswers(merged, result);
    updateUser({
      surveyResponses: merged,
      secluded: result.secluded,
      areaSeeds: result.areaSeeds,
      onboarding: legacy,
      stage: result.stage,
      baseBandLow: result.baseBandLow,
      baseBandHigh: result.baseBandHigh,
      currentBandLow: result.baseBandLow,
      currentBandHigh: result.baseBandHigh,
      forbidden: Array.from(new Set([...user.forbidden, ...result.forbidden])),
    });
    setStep("pm");
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full p-6">
        <AnimatePresence mode="wait">
          {step === "journey" ? (
            <motion.div
              key="journey"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex-1 flex flex-col"
            >
              <div className="pt-4 pb-6 space-y-1.5">
                <h1 className="text-2xl font-semibold text-foreground">나의 시작 데이터 쌓기</h1>
                <p className="text-sm text-muted-foreground">7일 동안 아주 작은 조각을 모아봐요</p>
              </div>

              {/* 7일 타임라인 */}
              <div className="relative">
                {/* 세로 연결선 */}
                <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" />
                <div className="space-y-3">
                  {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => {
                    const m = getOnboardingMission(d, user.forbidden);
                    const entry = entries.find((e) => e.day === d) ?? null;
                    const isPast = d < dayIdx || (d === dayIdx && todayEntry !== null);
                    const isToday = d === dayIdx;
                    const isFuture = d > dayIdx;
                    return (
                      <div key={d} className="relative flex items-start gap-4">
                        {/* 타임라인 점 */}
                        <div className="relative z-10 mt-4 shrink-0">
                          {isPast && entry ? (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${entry.completed ? "bg-primary/15" : "bg-secondary"}`}>
                              <Check className={`w-4 h-4 ${entry.completed ? "text-primary" : "text-muted-foreground/50"}`} strokeWidth={3} />
                            </div>
                          ) : isToday ? (
                            <div className="w-8 h-8 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                              <motion.div
                                animate={{ scale: [1, 1.25, 1] }}
                                transition={{ repeat: Infinity, duration: 1.8 }}
                                className="w-2.5 h-2.5 rounded-full bg-primary"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary/70 border border-border/60" />
                          )}
                        </div>

                        {/* 카드 */}
                        <motion.div
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: d * 0.05 }}
                          className={`flex-1 rounded-2xl border p-4 ${
                            isToday && !todayEntry
                              ? "bg-white border-primary/60 shadow-[0_2px_12px_rgba(245,158,11,0.15)]"
                              : isFuture
                                ? "bg-secondary/40 border-border/40"
                                : "bg-white border-border/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className={`text-[11px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                              Day {d}
                            </p>
                            {isPast && entry && (
                              <span className="text-[11px] text-muted-foreground">
                                {entry.completed ? "완료" : "쉬어감"}
                              </span>
                            )}
                          </div>
                          <p className={`mt-1 text-[15px] leading-snug ${isFuture ? "text-muted-foreground/70" : "text-foreground font-medium"}`}>
                            {m.title}
                          </p>
                          {isToday && !todayEntry && (
                            <Button
                              size="sm"
                              className="w-full mt-3 rounded-xl h-10"
                              onClick={() => setStep("mood")}
                            >
                              오늘의 조각 맞추기
                            </Button>
                          )}
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 응원 말풍선 + 캐릭터 */}
              <div className="mt-6 flex items-end justify-end gap-2">
                <div className="bg-white border border-border/50 rounded-2xl rounded-br-sm px-4 py-3 shadow-sm max-w-[220px]">
                  <p className="text-sm text-foreground leading-snug">
                    {todayEntry
                      ? todayEntry.completed
                        ? "오늘 조각도 맞췄어요! 내일 또 만나요."
                        : "쉬어가는 날도 여정의 일부예요."
                      : completedCount > 0
                        ? `벌써 ${completedCount}개의 조각을 맞췄어요! 오늘도 응원할게요.`
                        : "첫 조각부터 함께 시작해봐요!"}
                  </p>
                </div>
                <Character size="sm" />
              </div>

              {/* 오늘 기록이 끝났으면 다음으로 */}
              {todayEntry && (
                <div className="mt-4">
                  <Button size="lg" className="w-full rounded-2xl h-13" onClick={goNextDay}>
                    {dayIdx >= 7 ? "일주일 마무리하기" : "다음 날로 → (데모)"}
                  </Button>
                </div>
              )}
            </motion.div>
          ) : step === "mood" ? (
            <motion.div
              key="mood"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center space-y-8"
            >
              <div className="flex justify-center"><Character size="sm" /></div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 text-center">
                <p className="text-lg text-foreground leading-relaxed">
                  오늘 기분은 어때요?
                </p>
                <p className="text-xs text-muted-foreground mt-1">탭 한 번이면 충분해요.</p>
              </div>
              <div className="flex justify-between gap-1">
                {MOOD_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => { setMood(o.value); setStep("mission"); }}
                    className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-secondary transition-colors"
                  >
                    <span className="text-2xl">{o.emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{o.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : step === "mission" ? (
            <motion.div
              key="mission"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-medium text-foreground">Day {dayIdx} · 오늘의 조각</h2>
                <p className="text-sm text-muted-foreground">이미 준비해뒀어요. 하거나, 건너뛰거나 — 그거면 돼요.</p>
              </div>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-border/50 space-y-4"
              >
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span className="px-3 py-1 bg-secondary rounded-full">아주 작은 조각</span>
                  <span>약 {mission.minutes}분</span>
                </div>
                <p className="text-xl font-medium text-foreground leading-relaxed">{mission.title}</p>
              </motion.div>
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full rounded-2xl h-14 text-lg"
                  onClick={() => {
                    if (mission.kind === "learn") {
                      setLearnIndex(0);
                      setStep("learn");
                    } else if (mission.kind === "survey") {
                      setSsIndex(0);
                      setSsResponses({});
                      setStep("survey");
                    } else {
                      setStep("pm");
                    }
                  }}
                >
                  {mission.kind ? "시작해볼게요" : "했어요"}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full rounded-2xl h-12 text-muted-foreground"
                  onClick={() => finishDay({ ...entryBase, completed: false, skipped: true })}
                >
                  오늘은 건너뛸래요
                </Button>
              </div>
            </motion.div>
          ) : step === "learn" ? (
            <motion.div
              key="learn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* 상단 진행바 + 건너뛰기 */}
              <div className="flex items-center gap-4 pt-4 pb-2">
                <div className="flex-1 h-2 bg-secondary/70 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${((learnIndex + 1) / LEARN_CARDS.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <button
                  onClick={() => setStep("pm")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  건너뛰기
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`learn-slide-${learnIndex}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col items-center justify-center text-center gap-8"
                >
                  <LearnFaceSvg face={LEARN_CARDS[learnIndex]!.face} />
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground leading-snug whitespace-pre-line">
                      {LEARN_CARDS[learnIndex]!.title}
                    </h2>
                    <p className="text-[15px] text-muted-foreground leading-relaxed whitespace-pre-line">
                      {LEARN_CARDS[learnIndex]!.body}
                    </p>
                  </div>
                  {LEARN_CARDS[learnIndex]!.diagram === "cycle" && <CycleDiagram />}
                  {LEARN_CARDS[learnIndex]!.diagram === "arrow" && <ArrowDiagram />}
                </motion.div>
              </AnimatePresence>

              <div className="pb-2">
                <Button
                  size="lg"
                  className="w-full rounded-2xl h-14 text-base"
                  onClick={() => {
                    if (learnIndex < LEARN_CARDS.length - 1) setLearnIndex(learnIndex + 1);
                    else setStep("pm");
                  }}
                >
                  {LEARN_CARDS[learnIndex]!.cta ?? "다음"}
                </Button>
              </div>
            </motion.div>
          ) : step === "survey" ? (
            <motion.div
              key={`survey-${ssIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center space-y-6"
            >
              <div className="h-1.5 bg-secondary/60 rounded-full overflow-hidden" aria-hidden="true">
                <div
                  className="h-full bg-primary/50 rounded-full transition-all"
                  style={{ width: `${Math.round(((ssIndex + 1) / ssItems.length) * 100)}%` }}
                />
              </div>
              <div className="flex justify-center"><Character size="sm" showItems={false} /></div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 text-foreground text-lg leading-relaxed">
                {ssItems[ssIndex]?.q}
              </div>
              <div className="space-y-3">
                {(ssItems[ssIndex]?.options ?? []).map((opt) => (
                  <Button
                    key={`${ssItems[ssIndex]!.id}-${opt.v}`}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30 whitespace-normal"
                    onClick={() => {
                      const next = { ...ssResponses, [ssItems[ssIndex]!.id]: opt.v };
                      setSsResponses(next);
                      if (ssIndex < ssItems.length - 1) setSsIndex(ssIndex + 1);
                      else finishSurveyMission(next);
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          ) : step === "pm" ? (
            <motion.div
              key="pm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-medium text-foreground">해냈네요!</h2>
                <p className="text-sm text-muted-foreground">방금 한 건 어땠는지, 가볍게만 알려주세요.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 space-y-3">
                <p className="text-sm text-foreground">즐거움은 어땠어요?</p>
                <div className="flex gap-2">
                  {PM_TAPS.map((t) => (
                    <button
                      key={t.v}
                      onClick={() => setP(t.v)}
                      className={`flex-1 py-3 rounded-xl text-sm border transition-colors ${p === t.v ? 'bg-primary text-white border-primary' : 'bg-white border-border/50 hover:bg-secondary/50'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {p !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 space-y-3"
                >
                  <p className="text-sm text-foreground">뿌듯함은요?</p>
                  <div className="flex gap-2">
                    {PM_TAPS.map((t) => (
                      <button
                        key={t.v}
                        onClick={() => finishDay({ ...entryBase, completed: true, p: p ?? 3, m: t.v })}
                        className="flex-1 py-3 rounded-xl text-sm border bg-white border-border/50 hover:bg-secondary/50 transition-colors"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : step === "interests" ? (
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-medium text-foreground">일주일을 함께 했어요</h2>
                <p className="text-sm text-muted-foreground">
                  마지막으로 하나만요. 요즘 조금이라도 눈길이 가는 게 있다면? (여러 개 골라도 좋아요)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {INTERESTS.map((i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setSelectedInterests((prev) =>
                        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
                      )
                    }
                    className={`py-3 px-4 rounded-2xl text-sm border transition-colors ${selectedInterests.includes(i) ? 'bg-primary text-white border-primary' : 'bg-white border-border/50 hover:bg-secondary/50'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <Button size="lg" className="w-full rounded-2xl h-14" onClick={() => setStep("ready")}>
                {selectedInterests.length > 0 ? "좋아요" : "잘 모르겠어요, 넘어갈게요"}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col justify-center space-y-8 text-center"
            >
              <div className="flex justify-center"><Character size="lg" /></div>
              <div className="space-y-3">
                <h2 className="text-2xl font-medium text-foreground">이제 진짜 시작이에요</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  지난 일주일의 기록을 바탕으로,<br />
                  내일부터는 {user.nickname || '조각이 친구'}님에게 맞는<br />
                  조각들을 골라서 보여드릴게요.
                </p>
              </div>
              <Button size="lg" className="w-full rounded-2xl h-14" onClick={finishWeek}>
                좋아요, 시작할게요
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

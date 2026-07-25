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

// Day1 심리교육 카드 — 진단·낙인 언어 없이, '상태'와 '작은 행동'의 이야기만.
const LEARN_CARDS = [
  {
    emoji: "🌙",
    title: "혼자의 시간이 길어질 때",
    body: "방 안에서 보내는 시간이 길어지는 건 누구에게나 일어날 수 있는 일이에요. 게으름이나 성격의 문제가 아니라, 마음이 스스로를 지키려는 자연스러운 반응이에요.",
  },
  {
    emoji: "🔄",
    title: "쉼과 고립의 차이",
    body: "쉼은 에너지를 다시 채워주지만, 혼자의 시간이 너무 길어지면 오히려 기운이 더 빠지기도 해요. 하고 싶은 일이 줄고, 사람을 만나는 게 점점 더 무거워지는 식으로요.",
  },
  {
    emoji: "🧩",
    title: "회복은 아주 작은 행동에서",
    body: "기분이 나아지길 기다렸다가 움직이는 게 아니라, 아주 작은 행동이 먼저 기분을 조금씩 움직여줘요. 물 한 잔, 창문 열기 같은 정말 작은 조각부터요.",
  },
  {
    emoji: "🤝",
    title: "조각조각이 함께해요",
    body: "여기서는 잘하고 못하고를 재지 않아요. 하루에 하나, 지금의 나에게 맞는 작은 조각을 함께 고르고, 해낸 만큼만 천천히 넓혀갈 거예요.",
  },
];

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
              key={`learn-${learnIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-medium text-foreground">고립과 은둔, 가볍게 알아보기</h2>
                <p className="text-sm text-muted-foreground">{learnIndex + 1} / {LEARN_CARDS.length}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-border/50 space-y-4 text-center">
                <span className="text-4xl">{LEARN_CARDS[learnIndex]!.emoji}</span>
                <h3 className="text-lg font-medium text-foreground">{LEARN_CARDS[learnIndex]!.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{LEARN_CARDS[learnIndex]!.body}</p>
              </div>
              <div className="flex justify-center gap-1.5">
                {LEARN_CARDS.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === learnIndex ? "bg-primary" : "bg-border"}`} />
                ))}
              </div>
              <Button
                size="lg"
                className="w-full rounded-2xl h-14"
                onClick={() => {
                  if (learnIndex < LEARN_CARDS.length - 1) setLearnIndex(learnIndex + 1);
                  else setStep("pm");
                }}
              >
                {learnIndex < LEARN_CARDS.length - 1 ? "다음" : "다 읽었어요"}
              </Button>
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

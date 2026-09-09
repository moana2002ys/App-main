import { useMemo, useRef, useState } from "react";
import { useAppStore, dateKeyForDay } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Check, LogOut } from "lucide-react";
import {
  MOOD_OPTIONS,
  ONBOARDING_DAYS,
  getOnboardingMission,
  emptyOnboardingWeek,
  summarizeOnboardingWeek,
  pickOnboardingRecommendation,
  OnboardingDayEntry,
  OnboardingExtraSlot,
} from "@/lib/ba";
import { getFirstLaunchItems } from "@/lib/survey";
import { scoreFirstLaunch, deriveLegacyAnswers, SurveyResponses } from "@/lib/survey-scoring";
import { formatKorean, formatRelative, todayKey } from "@/lib/day";
import { CardDeck } from "@/components/CardDeck";
import { Baebdal } from "@/components/onboarding/Baebdal";
import { KnowYourselfChapter } from "@/components/KnowYourselfChapter";
import {
  LearnFaceSvg, CycleDiagram, ArrowDiagram, LoopDiagram, SpacesVisual,
} from "@/components/onboarding/Visuals";
import {
  MOOD, PM, CHALLENGE, TIMELINE,
  D1_2_BA, D1_2_BA_TITLE, D1_3_WHY15, D1_4_SURVEY,
  D2_2_JOURNEY, D2_3_LEVELUP, D3_4_DECO, D4_4_INTEREST_WHY, D4_5_INTERESTS, D4_6_GRADUATE,
} from "@/lib/onboarding-copy";

// 온보딩 Day1 ~ Day4 (v5 기획안 2장). Day0는 onboarding.tsx + taster.tsx.
// 날마다 '대본(SCRIPT)'을 순서대로 밟는다. 화면 하나 = 대본 한 칸 = 문서의 화면 ID 하나.
//   Day1  D1-1 기분 → D1-2 원리 5장 → D1-3 묻는 이유 → D1-4 15문항 → D1-5 고정 챌린지
//   Day2  D2-1 기분 → D2-2 여정 5장 → D2-3 레벨업 3장 → D2-4 챕터1 → D2-5 고정 챌린지
//   Day3  D3-1 기분 → D3-2 챕터2·3 → D3-3 혼합 2개 → D3-4 꾸미기 4장
//   Day4  D4-1 기분 → D4-2 챕터4·5 → D4-3 혼합 2개 → D4-4 관심사 이유 → D4-5 관심사 → D4-6 졸업
// Day는 실제 달력에서 나온다(가입일 기준). 종료일 Day4 고정 — 챕터를 건너뛰어도 같다.
type Step =
  | "mood" | "learn" | "why15" | "survey15" | "fixed"
  | "journey" | "levelup" | "chapter" | "mixed" | "deco"
  | "interestWhy" | "interests" | "graduate";

const SCRIPT: Record<number, Step[]> = {
  1: ["mood", "learn", "why15", "survey15", "fixed"],
  2: ["mood", "journey", "levelup", "chapter", "fixed"],
  3: ["mood", "chapter", "chapter", "mixed", "deco"],
  4: ["mood", "chapter", "chapter", "mixed", "interestWhy", "interests", "graduate"],
};

// 하루치 기록 초안 — 대본을 밟는 동안 채우고, 끝나면 entries에 넣는다.
interface Draft {
  mood: number | null;
  completed: boolean;
  p?: number;
  m?: number;
  skipped: boolean;
  extra?: OnboardingExtraSlot;
}
const emptyDraft = (): Draft => ({ mood: null, completed: false, skipped: false });

export function OnboardingWeek() {
  const { user, updateUser, setView, nextDay, signOut } = useAppStore();
  const week = user.onboardingWeek ?? emptyOnboardingWeek();
  const dayIdx = Math.min(Math.max(user.dayCount, 1), ONBOARDING_DAYS);
  const script = SCRIPT[dayIdx] ?? SCRIPT[1]!;
  const fixedMission = getOnboardingMission(dayIdx, user.forbidden);

  // -1 = 타임라인(기본 화면), 0~ = 대본 진행 중
  const [stepIdx, setStepIdx] = useState(-1);
  const draft = useRef<Draft>(emptyDraft());
  const [, bump] = useState(0);
  const rerender = () => bump((n) => n + 1);

  const entries = week.entries;
  const todayEntry = entries.find((e) => e.day === dayIdx) ?? null;
  const completedCount = entries.filter((e) => e.completed || e.extra?.completed).length;
  const today = todayKey();
  const nextDayKey = dateKeyForDay(user, dayIdx + 1);
  const nextDayLabel = nextDayKey ? formatRelative(nextDayKey, today) : "내일";

  const step: Step | null = stepIdx >= 0 ? (script[stepIdx] ?? null) : null;
  const nextStep: Step | null = stepIdx >= 0 ? (script[stepIdx + 1] ?? null) : null;

  const startToday = () => { draft.current = emptyDraft(); setStepIdx(0); };
  const backToTimeline = () => setStepIdx(-1);

  const finishDay = () => {
    const d = draft.current;
    const entry: OnboardingDayEntry = {
      day: dayIdx, mood: d.mood ?? 3, completed: d.completed, p: d.p, m: d.m, skipped: d.skipped, extra: d.extra,
    };
    updateUser({ onboardingWeek: { ...week, dayIndex: dayIdx, entries: [...entries.filter((e) => e.day !== dayIdx), entry] } });
    setStepIdx(-1);
  };

  const next = () => {
    if (stepIdx + 1 < script.length) setStepIdx(stepIdx + 1);
    else finishDay();
  };

  // 시연용 하루 넘기기. 실제 사용자는 날짜가 바뀌어야 다음 Day가 열린다(store.syncToday).
  const advanceDayForDemo = () => {
    if (dayIdx >= ONBOARDING_DAYS) return;
    updateUser({ onboardingWeek: { ...week, entries, dayIndex: dayIdx + 1 } });
    setStepIdx(-1);
    nextDay();
    // store.nextDay는 다음 화면을 setUser 갱신 함수 안에서 정하는데, 같은 이벤트에서 앞선
    // updateUser 때문에 그 함수가 늦게 실행되어 기본값(daily_checkin)이 먼저 적용된다.
    // 온보딩 중엔 여기서 화면을 명시한다 — 같은 배치의 마지막 setView가 이긴다. (9.9 검수에서 발견)
    setView("onboarding_week");
  };

  // D4-6 졸업 → 본 사이클. 나 알아가기 5챕터는 이미 챕터 컴포넌트가 단계를 확정했다.
  const finishOnboarding = (interests: string[]) => {
    const finalWeek = { ...week, entries: entriesWithToday(), done: true, dayIndex: ONBOARDING_DAYS + 1 };
    const summary = summarizeOnboardingWeek(finalWeek);
    updateUser({
      onboardingWeek: finalWeek,
      phase: "cycle",
      cycleStartDay: user.dayCount, // 본 사이클 기준일 = 온보딩을 마친 오늘
      moodBaseline: summary.moodBaseline,
      areaPM: summary.initialAreaPM,
      interests,
      interestAskedDay: user.dayCount,
      skipLog: [],
      daily: null,
    });
    setView("daily_checkin");
  };
  const entriesWithToday = (): OnboardingDayEntry[] => {
    const d = draft.current;
    const entry: OnboardingDayEntry = {
      day: dayIdx, mood: d.mood ?? 3, completed: d.completed, p: d.p, m: d.m, skipped: d.skipped, extra: d.extra,
    };
    return [...entries.filter((e) => e.day !== dayIdx), entry];
  };

  // ── D1-4 15문항 ────────────────────────────────────────────
  const ssItems = useMemo(() => getFirstLaunchItems().filter((i) => i.moduleId === "seclusion_status"), []);
  const [ssPhase, setSsPhase] = useState<"intro" | "items" | "done">("intro");
  const [ssIndex, setSsIndex] = useState(0);
  const [ssResponses, setSsResponses] = useState<SurveyResponses>({});
  // 완료: 온보딩 응답과 합쳐 정식 채점. 금지조건은 절대 완화하지 않는다(합집합만).
  const finishSurvey = (finalResponses: SurveyResponses) => {
    const merged = { ...(user.surveyResponses ?? {}), ...finalResponses };
    const result = scoreFirstLaunch(getFirstLaunchItems(), merged);
    updateUser({
      surveyResponses: merged,
      secluded: result.secluded,
      areaSeeds: result.areaSeeds,
      onboarding: deriveLegacyAnswers(merged, result),
      stage: result.stage,
      baseBandLow: result.baseBandLow,
      baseBandHigh: result.baseBandHigh,
      currentBandLow: result.baseBandLow,
      currentBandHigh: result.baseBandHigh,
      forbidden: Array.from(new Set([...user.forbidden, ...result.forbidden])),
    });
    setSsPhase("done");
  };

  // ── 챌린지 카드 + P/M (고정·혼합 공용) ──────────────────────
  const [pmFor, setPmFor] = useState<"fixed" | "extra" | null>(null);
  const [pTap, setPTap] = useState<number | null>(null);
  const [mixedSlot, setMixedSlot] = useState<0 | 1>(0);
  const recommended = useMemo(
    () => (dayIdx >= 3 && user.stage
      ? pickOnboardingRecommendation({
          dayCount: user.dayCount, stage: user.stage, forbidden: user.forbidden,
          bandLow: user.currentBandLow, bandHigh: user.currentBandHigh,
          mood: draft.current.mood ?? 3, areaSeeds: user.areaSeeds, avoidTitles: [fixedMission.title],
        })
      : null),
    // 기분·날짜가 정해진 뒤 한 번만 뽑는다(하루 안 안정)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayIdx, user.stage, stepIdx >= 1],
  );

  const recordChallenge = (which: "fixed" | "extra", completed: boolean, p?: number, m?: number) => {
    const d = draft.current;
    if (which === "fixed") {
      d.completed = completed; d.skipped = !completed; d.p = p; d.m = m;
    } else if (recommended) {
      d.extra = { title: recommended.title, area: recommended.area, level: recommended.level, completed, p, m };
    }
    rerender();
  };

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // ─────────────────────────── 화면들
  const challengeCard = (which: "fixed" | "extra", onAfter: () => void) => {
    const m = which === "fixed" ? fixedMission : recommended;
    if (!m) { onAfter(); return null; }
    const inPm = pmFor === which;
    return (
      <motion.div key={`ch-${which}-${inPm}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center space-y-6">
        {!inPm ? (
          <>
            {step === "mixed" && mixedSlot === 0 && which === "fixed" && (
              <p className="text-center text-sm text-muted-foreground">{CHALLENGE.mixedIntro}</p>
            )}
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl shadow-sm border border-border/50 space-y-4">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span className={`px-3 py-1 rounded-full ${which === "extra" ? "bg-primary/15 text-foreground" : "bg-secondary"}`}>
                  {which === "extra" ? CHALLENGE.recommendedTag : CHALLENGE.tinyTag}
                </span>
                <span>약 {m.minutes}분</span>
              </div>
              <p className="text-xl font-medium text-foreground leading-relaxed">{m.title}</p>
            </motion.div>
            <div className="space-y-3">
              <Button size="lg" className="w-full rounded-2xl h-14 text-lg" onClick={() => { setPTap(null); setPmFor(which); }}>
                {CHALLENGE.did}
              </Button>
              <Button size="lg" variant="ghost" className="w-full rounded-2xl h-12 text-muted-foreground" onClick={() => { recordChallenge(which, false); onAfter(); }}>
                {CHALLENGE.skip}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-medium text-foreground">{PM.title}</h2>
              <p className="text-sm text-muted-foreground">{PM.sub}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 space-y-3">
              <p className="text-sm text-foreground">{PM.pleasure}</p>
              <div className="flex gap-2">
                {PM.taps.map((t) => (
                  <button key={t.v} onClick={() => setPTap(t.v)} className={`flex-1 py-3 rounded-xl text-sm border transition-colors ${pTap === t.v ? "bg-primary text-white border-primary" : "bg-white border-border/50 hover:bg-secondary/50"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {pTap !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 space-y-3">
                <p className="text-sm text-foreground">{PM.mastery}</p>
                <div className="flex gap-2">
                  {PM.taps.map((t) => (
                    <button key={t.v} onClick={() => { recordChallenge(which, true, pTap, t.v); setPmFor(null); onAfter(); }} className="flex-1 py-3 rounded-xl text-sm border bg-white border-border/50 hover:bg-secondary/50 transition-colors">
                      {t.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    );
  };

  const deck = (key: string, props: Parameters<typeof CardDeck>[0]) => (
    <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
      <CardDeck {...props} />
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full p-6">
        <AnimatePresence mode="wait">
          {step === null ? (
            // ── 타임라인(기본 화면) ─────────────────────────────
            <motion.div key="timeline" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex-1 flex flex-col">
              <div className="pt-4 pb-6 flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">{formatKorean(today)}</p>
                  <h1 className="text-2xl font-semibold text-foreground">{TIMELINE.title}</h1>
                  <p className="text-sm text-muted-foreground">{TIMELINE.sub}</p>
                </div>
                <button onClick={signOut} aria-label="로그아웃" className="mt-1 p-2 -mr-2 shrink-0 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" />
                <div className="space-y-3">
                  {Array.from({ length: ONBOARDING_DAYS }, (_, i) => i + 1).map((d) => {
                    const entry = entries.find((e) => e.day === d) ?? null;
                    const isPast = d < dayIdx || (d === dayIdx && todayEntry !== null);
                    const isToday = d === dayIdx;
                    const isFuture = d > dayIdx;
                    const done = !!entry && (entry.completed || !!entry.extra?.completed);
                    return (
                      <div key={d} className="relative flex items-start gap-4">
                        <div className="relative z-10 mt-4 shrink-0">
                          {isPast && entry ? (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? "bg-primary/15" : "bg-secondary"}`}>
                              <Check className={`w-4 h-4 ${done ? "text-primary" : "text-muted-foreground/50"}`} strokeWidth={3} />
                            </div>
                          ) : isToday ? (
                            <div className="w-8 h-8 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                              <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} className="w-2.5 h-2.5 rounded-full bg-primary" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary/70 border border-border/60" />
                          )}
                        </div>
                        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: d * 0.05 }} className={`flex-1 rounded-2xl border p-4 ${isToday && !todayEntry ? "bg-white border-primary/60 shadow-[0_2px_12px_rgba(245,158,11,0.15)]" : isFuture ? "bg-secondary/40 border-border/40" : "bg-white border-border/50"}`}>
                          <div className="flex items-center justify-between">
                            <p className={`text-[11px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                              Day {d}{(() => { const k = dateKeyForDay(user, d); return k ? ` · ${formatKorean(k)}` : ""; })()}
                            </p>
                            {isPast && entry && <span className="text-[11px] text-muted-foreground">{done ? "완료" : "쉬어감"}</span>}
                          </div>
                          <p className={`mt-1 text-[15px] leading-snug ${isFuture ? "text-muted-foreground/70" : "text-foreground font-medium"}`}>
                            {TIMELINE.dayLabels[d]}
                          </p>
                          {isToday && !todayEntry && (
                            <Button size="sm" className="w-full mt-3 rounded-xl h-10" onClick={startToday}>{TIMELINE.todayCta}</Button>
                          )}
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex items-end justify-end gap-2">
                <div className="bg-white border border-border/50 rounded-2xl rounded-br-sm px-4 py-3 shadow-sm max-w-[220px]">
                  <p className="text-sm text-foreground leading-snug">
                    {todayEntry
                      ? (todayEntry.completed || todayEntry.extra?.completed) ? TIMELINE.bubbleDone : TIMELINE.bubbleRest
                      : completedCount > 0 ? TIMELINE.bubbleProgress.replace("{n}", String(completedCount)) : TIMELINE.bubbleFirst}
                  </p>
                </div>
                <Baebdal state="idle" size="sm" />
              </div>

              {todayEntry && dayIdx < ONBOARDING_DAYS && (
                <div className="mt-4 space-y-2">
                  <div className="rounded-2xl border border-border/50 bg-white px-5 py-4 text-center">
                    <p className="text-sm text-foreground">{TIMELINE.doneToday}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{TIMELINE.nextOpens.replace("{when}", nextDayLabel)}</p>
                  </div>
                  <button onClick={advanceDayForDemo} className="w-full py-2 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors">
                    {TIMELINE.demoAdvance}
                  </button>
                </div>
              )}
            </motion.div>

          ) : step === "mood" ? (
            <motion.div key="mood" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center space-y-8">
              <div className="flex justify-center"><Baebdal state="idle" size="sm" /></div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 text-center">
                <p className="text-lg text-foreground leading-relaxed">{MOOD.ask}</p>
                {dayIdx === 1 && <p className="text-xs text-muted-foreground mt-1">{MOOD.hint}</p>}
              </div>
              <div className="flex justify-between gap-1">
                {MOOD_OPTIONS.map((o) => (
                  <button key={o.value} onClick={() => { draft.current.mood = o.value; next(); }} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-secondary transition-colors">
                    <span className="text-2xl">{o.emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{o.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

          ) : step === "learn" ? (
            deck("learn", {
              cards: D1_2_BA, header: D1_2_BA_TITLE, onDone: next, lastCta: "다음",
              visuals: [
                <LearnFaceSvg key="f1" face="frown" />,
                <div key="f2" className="space-y-4"><LearnFaceSvg face="wink" /><CycleDiagram /></div>,
                <div key="f3" className="space-y-4"><LearnFaceSvg face="smile" /><ArrowDiagram /></div>,
                <LearnFaceSvg key="f4" face="joy" />,
                <LoopDiagram key="f5" />,
              ],
            })
          ) : step === "why15" ? (
            deck("why15", { cards: D1_3_WHY15, onDone: next, lastCta: "알겠어", mascot: "idle" })

          ) : step === "survey15" ? (
            <motion.div key={`ss-${ssPhase}-${ssIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center space-y-6">
              {ssPhase === "intro" ? (
                <>
                  <div className="flex justify-center"><Baebdal state="idle" size="lg" /></div>
                  <p className="text-center text-lg text-foreground leading-relaxed max-w-xs mx-auto">{D1_4_SURVEY.intro}</p>
                  <div className="space-y-3">
                    <Button size="lg" className="w-full rounded-2xl h-14" onClick={() => { setSsIndex(0); setSsResponses({}); setSsPhase("items"); }}>{CHALLENGE.start}</Button>
                    <Button size="lg" variant="ghost" className="w-full rounded-2xl h-12 text-muted-foreground" onClick={next}>{D1_4_SURVEY.skip}</Button>
                  </div>
                </>
              ) : ssPhase === "items" ? (
                <>
                  <div className="h-1.5 bg-secondary/60 rounded-full overflow-hidden" aria-hidden="true">
                    <div className="h-full bg-primary/50 rounded-full transition-all" style={{ width: `${Math.round(((ssIndex + 1) / ssItems.length) * 100)}%` }} />
                  </div>
                  <div className="flex justify-center"><Baebdal state="idle" size="sm" /></div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 text-foreground text-lg leading-relaxed">{ssItems[ssIndex]?.q}</div>
                  <div className="space-y-3">
                    {(ssItems[ssIndex]?.options ?? []).map((o) => (
                      <Button key={`${ssItems[ssIndex]!.id}-${o.v}`} variant="outline" className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30 whitespace-normal"
                        onClick={() => {
                          const r = { ...ssResponses, [ssItems[ssIndex]!.id]: o.v };
                          setSsResponses(r);
                          if (ssIndex < ssItems.length - 1) setSsIndex(ssIndex + 1); else finishSurvey(r);
                        }}>
                        {o.label}
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center"><Baebdal state="happy" size="lg" /></div>
                  <p className="text-center text-lg text-foreground leading-relaxed max-w-xs mx-auto">{D1_4_SURVEY.done}</p>
                  <Button size="lg" className="w-full rounded-2xl h-14" onClick={next}>다음</Button>
                </>
              )}
            </motion.div>

          ) : step === "fixed" ? (
            challengeCard("fixed", next)

          ) : step === "journey" ? (
            deck("journey", { cards: D2_2_JOURNEY, onDone: next, lastCta: "좋아", mascot: "idle", visuals: [null, <SpacesVisual key="sp" lit={1} />] })
          ) : step === "levelup" ? (
            deck("levelup", { cards: D2_3_LEVELUP, onDone: next, lastCta: "알겠어", mascot: "happy", visuals: [null, <SpacesVisual key="sp2" lit={2} />] })

          ) : step === "chapter" ? (
            <motion.div key={`chapter-${stepIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
              <KnowYourselfChapter onDone={next} onExit={backToTimeline} showDone={nextStep !== "chapter"} />
            </motion.div>

          ) : step === "mixed" ? (
            mixedSlot === 0
              ? challengeCard("fixed", () => setMixedSlot(1))
              : challengeCard("extra", () => { setMixedSlot(0); next(); })

          ) : step === "deco" ? (
            deck("deco", { cards: D3_4_DECO, onDone: next, lastCta: "알겠어", mascot: "idle", visuals: [<SpacesVisual key="sp3" lit={1} />] })
          ) : step === "interestWhy" ? (
            deck("interestWhy", { cards: D4_4_INTEREST_WHY, onDone: next, lastCta: "좋아", mascot: "idle" })

          ) : step === "interests" ? (
            <motion.div key="interests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center space-y-6">
              <p className="text-center text-lg text-foreground leading-relaxed max-w-xs mx-auto">{D4_5_INTERESTS.ask}</p>
              <div className="grid grid-cols-2 gap-2.5">
                {D4_5_INTERESTS.options.map((i) => (
                  <button key={i} onClick={() => setSelectedInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])}
                    className={`py-3 px-4 rounded-2xl text-sm border transition-colors ${selectedInterests.includes(i) ? "bg-primary text-white border-primary" : "bg-white border-border/50 hover:bg-secondary/50"}`}>
                    {i}
                  </button>
                ))}
              </div>
              <Button size="lg" className="w-full rounded-2xl h-14" onClick={next}>
                {selectedInterests.length > 0 ? D4_5_INTERESTS.ok : D4_5_INTERESTS.skip}
              </Button>
            </motion.div>

          ) : (
            // D4-6 졸업 2장 → 본 사이클
            deck("graduate", {
              cards: [{ body: D4_6_GRADUATE.first }, { body: D4_6_GRADUATE.second.replace("{name}", user.nickname || "너") }],
              onDone: () => finishOnboarding(selectedInterests), lastCta: D4_6_GRADUATE.cta, mascot: "celebrate",
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

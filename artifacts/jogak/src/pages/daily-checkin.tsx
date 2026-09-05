import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check, Plus } from "lucide-react";
import { Area } from "@/lib/classifier";
import {
  MOOD_OPTIONS,
  GATE_RECHECK_QUESTION,
  DaySlot,
  SLOT_BADGE,
  TimeOfDay,
  TIME_LABEL,
  Toggle,
  TOGGLE_LABEL,
  planTodaySlots,
  summarizeOnboardingWeek,
  readinessCandidateArea,
  readinessOpenAreas,
  READINESS_OPTIONS,
  READINESS_ACK,
  READINESS_ASK_INTERVAL,
  ReadinessAnswer,
  validateSelfProposal,
  buildSelfSlot,
} from "@/lib/ba";

const INTERESTS = [
  "게임", "음악", "동물", "식물", "요리·먹는 것", "책·글", "스포츠", "그림·만들기",
];

// 의향 문항에서 영역을 부를 때의 소망형 라벨(카테고리 어휘 비노출).
const READINESS_AREA_LABEL: Record<Area, string> = {
  rhythm: "하루의 리듬",
  selfcare: "나를 돌보는",
  relationship: "누군가와 잇는",
  social: "바깥 세상으로 향하는",
};

// 활동 카드 이모지: 라벨 키워드 우선, 없으면 영역 기본.
const AREA_EMOJI: Record<Area, string> = {
  rhythm: "🕰️",
  selfcare: "🌿",
  relationship: "💬",
  social: "🌱",
};
const KEYWORD_EMOJI: [RegExp, string][] = [
  [/잠|수면|일어나|기상/, "🌅"],
  [/밥|먹|요리|식사/, "🍚"],
  [/씻|샤워|양치|목욕/, "🫧"],
  [/청소|정리|치우/, "🧹"],
  [/걷|산책|밖|외출/, "🚶"],
  [/몸|운동|스트레칭|움직/, "🤸"],
  [/연락|메시지|대화|이야기/, "💬"],
  [/책|글|읽|쓰/, "📖"],
  [/음악|노래/, "🎵"],
  [/마음|기분|감정/, "🫶"],
];
function activityEmoji(label: string, area: Area): string {
  for (const [re, e] of KEYWORD_EMOJI) if (re.test(label)) return e;
  return AREA_EMOJI[area];
}

const MAX_PLAN = 3; // 계획량 상한(과잉 약속 차단) — 근거: 계획량 연구(1개 시작, 최대 3)

// 데일리 체크인 v3: ① 기분 ② 오늘의 계획(미리 담긴 1개 + 추가·제거, 시간대·강도)
// 영역 선택 단계는 제거 — 영역 대신 구체적 행동을 바로 제안한다(팀 피드백).
// 시스템 판단(밴드·게이트·P/M·회피·diversity)은 후보 구성에서 그대로 유지된다.
// ③ 미시도 영역 의향 문항은 주 1~2회 별도 카드로 회전(관심사 카드와 같은 날 중복 노출 금지).
export function DailyCheckin() {
  const { updateUser, setView, user } = useAppStore();
  const [opened, setOpened] = useState(false);

  // 자율성 레벨(A0~A4)에 따른 권한 개방 — 숫자·단계명은 UI에 절대 비노출.
  const canModifyPlan = user.autonomyLevel >= 1; // 교체·추가·시간대·강도
  const canOpenAreas = user.autonomyLevel >= 2; // 의향 카드(새 영역 관문)
  const canSelfPropose = user.autonomyLevel >= 3; // 나만의 조각 직접 만들기

  const needGateRecheck = !!user.gateRecheckPending;
  const needInterestCard =
    user.interestAskedDay === null || user.dayCount - user.interestAskedDay >= 7;
  // 의향 카드: 레벨 개방 + 주기 도래 + 물어볼 영역 존재 + 오늘 관심사 카드가 없을 때만.
  // 후보 선정은 부담도 랭킹(D): 문턱 낮고 부담 신호 작은 영역부터.
  const readinessArea = useMemo(
    () =>
      readinessCandidateArea(
        user.stage, user.forbidden, user.areaReadiness, user.dayCount, user.areaSeeds,
      ),
    [user.stage, user.forbidden, user.areaReadiness, user.dayCount, user.areaSeeds],
  );
  const readinessDue =
    user.readinessAskedDay === null ||
    user.dayCount - user.readinessAskedDay >= READINESS_ASK_INTERVAL;
  const needReadinessCard =
    canOpenAreas && !needInterestCard && readinessDue && readinessArea !== null;

  // step: 'gate' | 'interest' | 'readiness' | 'main'
  const [step, setStep] = useState<'gate' | 'interest' | 'readiness' | 'main'>(
    needGateRecheck ? 'gate' : needInterestCard ? 'interest' : needReadinessCard ? 'readiness' : 'main',
  );
  const [mood, setMood] = useState<number | null>(null);
  const [readinessAck, setReadinessAck] = useState<string | null>(null);

  // ② 오늘의 계획 후보 — 기존 슬롯 엔진 그대로(게이트·허용영역·한 활동 규칙 준수).
  // 기분이 정해지면 후보를 만들고, 첫 타깃 슬롯을 기본값으로 미리 담는다.
  const candidates = useMemo<DaySlot[]>(() => {
    if (mood === null || !user.stage || user.phase !== "cycle") return [];
    const earlyAvoidance = user.onboardingWeek
      ? summarizeOnboardingWeek(user.onboardingWeek).earlyAvoidance
      : false;
    return planTodaySlots({
      dayCount: user.dayCount,
      stage: user.stage,
      forbidden: user.forbidden,
      bandLow: user.currentBandLow,
      bandHigh: user.currentBandHigh,
      mood,
      desiredArea: "unknown", // 영역 선택 문항 제거 — 영역 판단은 시드·엔진 몫
      areaSeeds: user.areaSeeds,
      interests: user.interests,
      areaPM: user.areaPM,
      skipLog: user.skipLog,
      cycleStartDay: user.cycleStartDay ?? user.dayCount,
      nudgeDefaultNormal: user.nudgeDefaultNormal,
      earlyAvoidance,
      pleasureBoostArea: user.pleasureBoostArea,
      readinessOpenAreas: readinessOpenAreas(user.areaReadiness),
      autonomyLevel: user.autonomyLevel,
    });
  }, [mood, user.stage, user.phase, user.forbidden, user.areaReadiness]);

  // 선택 상태: 미리 담긴 기본값 = 첫 타깃 슬롯(없으면 첫 후보).
  const [selected, setSelected] = useState<string[]>([]);
  const [edits, setEdits] = useState<Record<string, { timeOfDay?: TimeOfDay | null; toggle?: Toggle }>>({});
  useEffect(() => {
    if (candidates.length === 0) { setSelected([]); return; }
    const def = candidates.find((s) => s.kind === "target") ?? candidates[0]!;
    setSelected([def.id]);
    setEdits({});
  }, [candidates]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PLAN) return prev; // 상한: 조용히 무시(아래 안내문이 설명)
      return [...prev, id];
    });
  };

  const patchEdit = (id: string, patch: { timeOfDay?: TimeOfDay | null; toggle?: Toggle }) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  // 게이트 재확인: "괜찮아졌어요" → 해당 금지 플래그 해제(단계·밴드 불변). 아니면 유지.
  const handleGateRecheck = (better: boolean) => {
    const tag = user.gateRecheckPending!;
    updateUser({
      gateRecheckPending: null,
      gateRecheckDay: user.dayCount,
      forbidden: better ? user.forbidden.filter((f) => f !== tag) : user.forbidden,
    });
    setStep(needInterestCard ? 'interest' : needReadinessCard ? 'readiness' : 'main');
  };

  // 주 1회 관심사 카드: 선택 시 관심사 풀 갱신 + 3일 부스트, 건너뛰기 가능.
  const handleInterest = (interest: string | null) => {
    if (interest) {
      const rest = user.interests.filter((i) => i !== interest);
      updateUser({
        interests: [interest, ...rest],
        interestAskedDay: user.dayCount,
        interestBoostUntil: user.dayCount + 3,
      });
    } else {
      updateUser({ interestAskedDay: user.dayCount });
    }
    setStep('main');
  };

  // 의향 문항: 답이 무엇이든 벌점·재촉 없음. '해보고 싶어요'만 오늘 계획 후보에 L1 조각 추가.
  const handleReadiness = (answer: ReadinessAnswer) => {
    if (!readinessArea) { setStep('main'); return; }
    updateUser({
      areaReadiness: {
        ...user.areaReadiness,
        [readinessArea]: { day: user.dayCount, answer },
      },
      readinessAskedDay: user.dayCount,
      ...(answer === 'yes' && {
        autonomySignals: {
          ...user.autonomySignals,
          readinessYes: user.autonomySignals.readinessYes + 1,
        },
      }),
    });
    setReadinessAck(READINESS_ACK[answer]);
    setStep('main');
  };

  // 나만의 조각(A3+): 결정적 가드만 통과하면 계획에 담김. 정식 버전은 LLM 다듬기.
  const [selfInput, setSelfInput] = useState("");
  const [selfError, setSelfError] = useState<string | null>(null);
  const [selfSlots, setSelfSlots] = useState<DaySlot[]>([]);
  const totalPlanned = selected.length + selfSlots.length;

  const handleSelfPropose = () => {
    const check = validateSelfProposal(selfInput);
    if (!check.ok) { setSelfError(check.reason ?? null); return; }
    if (totalPlanned >= MAX_PLAN) return;
    setSelfSlots((prev) => [
      ...prev,
      buildSelfSlot(user.dayCount, prev.length, selfInput),
    ]);
    setSelfInput("");
    setSelfError(null);
  };

  // 계획 확정: 담은 조각 = accepted, 나머지 후보 = proposed(홈의 "더 하고 싶다면"으로).
  // 자율성 신호 집계: 기본값 수락 / 교체 / 추가 / 자기 제안 — 레벨 판정(E)의 원천.
  const handleConfirm = (ids: string[], useEdits: boolean) => {
    if (mood === null || (ids.length === 0 && selfSlots.length === 0)) return;
    const defaultId = defaultSlot?.id;
    const finalSlots = candidates.map((s) => {
      if (!ids.includes(s.id)) return s;
      const e = useEdits ? (edits[s.id] ?? {}) : {};
      return {
        ...s,
        toggle: e.toggle ?? s.toggle,
        timeOfDay: e.timeOfDay !== undefined ? e.timeOfDay : s.timeOfDay,
        status: "accepted" as const,
      };
    });
    const acceptedDefault = defaultId !== undefined && ids.includes(defaultId);
    const extraPicks = ids.filter((id) => id !== defaultId).length;
    const s = user.autonomySignals;
    updateUser({
      daily: { mood, area: 'unknown' },
      todaySlots: [...finalSlots, ...selfSlots],
      autonomySignals: {
        ...s,
        defaultAccepts: s.defaultAccepts + (acceptedDefault && extraPicks === 0 ? 1 : 0),
        swaps: s.swaps + (!acceptedDefault && extraPicks > 0 ? 1 : 0),
        adds: s.adds + (acceptedDefault ? extraPicks : Math.max(0, extraPicks - 1)),
        selfProposals: s.selfProposals + selfSlots.length,
      },
    });
    setView("home");
  };

  const defaultSlot = candidates.find((s) => s.kind === "target") ?? candidates[0] ?? null;

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
              <div className="relative w-full h-40 bg-[#FFFDF8] rounded-2xl shadow-md border border-border/60 overflow-hidden">
                <div
                  className="absolute inset-x-0 top-0 h-20 bg-[#FFF6E9] border-b border-border/50"
                  style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
                ></div>
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
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="max-w-sm mx-auto w-full p-6">
        <div className="h-10 flex items-center">
          <button
            onClick={() => setOpened(false)}
            aria-label="뒤로 가기"
            className="p-2 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'gate' ? (
            <motion.div
              key="gate"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 pt-6"
            >
              <div className="flex justify-center mb-6"><Character size="sm" /></div>
              <div className="bg-[#FFFDF8] p-6 rounded-3xl shadow-sm border border-border/60 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-primary/30"></div>
                <p className="text-xs text-muted-foreground mb-3">잠깐, 하나만요</p>
                <p className="text-foreground text-lg leading-relaxed">
                  {GATE_RECHECK_QUESTION[user.gateRecheckPending!] ?? "요즘 마음의 문턱은 어때요?"}
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30"
                  onClick={() => handleGateRecheck(true)}
                >
                  예전보다 조금 괜찮아졌어요
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30"
                  onClick={() => handleGateRecheck(false)}
                >
                  아직은 비슷해요
                </Button>
              </div>
            </motion.div>
          ) : step === 'interest' ? (
            <motion.div
              key="interest"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 pt-6"
            >
              <div className="flex justify-center mb-6"><Character size="sm" /></div>
              <div className="bg-[#FFFDF8] p-6 rounded-3xl shadow-sm border border-border/60 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-primary/30"></div>
                <p className="text-xs text-muted-foreground mb-3">이번 주 안부</p>
                <p className="text-foreground text-lg leading-relaxed">요즘 빠져있는 게 있나요?</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {INTERESTS.map((i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className={`justify-center text-center h-auto py-3 px-4 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30 ${user.interests[0] === i ? 'border-primary/50 bg-primary/5' : ''}`}
                    onClick={() => handleInterest(i)}
                  >
                    {i}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="col-span-2 justify-center text-center h-auto py-3 px-4 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 text-muted-foreground"
                  onClick={() => handleInterest(null)}
                >
                  이번 주는 건너뛸게요
                </Button>
              </div>
            </motion.div>
          ) : step === 'readiness' ? (
            <motion.div
              key="readiness"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 pt-6"
            >
              <div className="flex justify-center mb-6"><Character size="sm" /></div>
              <div className="bg-[#FFFDF8] p-6 rounded-3xl shadow-sm border border-border/60 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-primary/30"></div>
                <p className="text-xs text-muted-foreground mb-3">문득 궁금해서요</p>
                <p className="text-foreground text-lg leading-relaxed">
                  {readinessArea ? READINESS_AREA_LABEL[readinessArea] : ""} 조각, 요즘은 어때요?
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  어떤 답이든 괜찮아요. 지금 마음 그대로면 돼요.
                </p>
              </div>
              <div className="space-y-3">
                {READINESS_OPTIONS.map((o) => (
                  <Button
                    key={o.value}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30"
                    onClick={() => handleReadiness(o.value)}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-8 pb-10"
            >
              {/* 헤더 */}
              <div className="text-center space-y-3 pt-2">
                <div className="flex justify-center"><Character size="sm" /></div>
                <h1 className="text-2xl font-semibold text-foreground">오늘 하루는 어떤가요?</h1>
                {readinessAck ? (
                  <p className="text-sm text-primary">{readinessAck}</p>
                ) : user.lastMessage ? (
                  <p className="text-sm text-primary">{user.lastMessage}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">솔직한 지금 그대로면 충분해요.</p>
                )}
              </div>

              {/* ① 기분 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold flex items-center justify-center">1</span>
                  <p className="text-sm font-medium text-foreground">오늘의 기분</p>
                </div>
                <div className="flex justify-between gap-1.5">
                  {MOOD_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setMood(o.value)}
                      aria-pressed={mood === o.value}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-colors ${
                        mood === o.value
                          ? "bg-primary/10 border-primary/60"
                          : "bg-white border-border/50 hover:bg-secondary/50 hover:border-primary/30"
                      }`}
                    >
                      <span className="text-2xl">{o.emoji}</span>
                      <span className={`text-[10px] ${mood === o.value ? "text-primary font-medium" : "text-muted-foreground"}`}>
                        {o.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* ② 오늘의 계획 — 미리 담긴 1개 + 원하면 추가·교체 */}
              <AnimatePresence>
                {mood !== null && candidates.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold flex items-center justify-center">2</span>
                        <p className="text-sm font-medium text-foreground">오늘의 조각, 미리 담아뒀어요</p>
                      </div>
                      {canModifyPlan && (
                        <span className="text-[11px] text-muted-foreground">{totalPlanned} / {MAX_PLAN}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground -mt-2">
                      {canModifyPlan
                        ? "이대로도 충분해요. 원하면 바꾸거나 더 담아도 돼요."
                        : "오늘은 이거 하나면 충분해요."}
                    </p>

                    <div className="space-y-2.5">
                      {candidates.map((slot) => {
                        const isSelected = selected.includes(slot.id);
                        const e = edits[slot.id] ?? {};
                        const timeOfDay = e.timeOfDay !== undefined ? e.timeOfDay : slot.timeOfDay;
                        const toggle = e.toggle ?? slot.toggle;
                        return (
                          <div
                            key={slot.id}
                            className={`rounded-2xl border transition-colors ${
                              isSelected ? "bg-primary/5 border-primary/50" : "bg-white border-border/50"
                            }`}
                          >
                            <button
                              onClick={() => canModifyPlan && toggleSelect(slot.id)}
                              className="w-full flex items-start gap-3 p-4 text-left"
                              aria-pressed={isSelected}
                              disabled={!canModifyPlan}
                            >
                              <span className="text-2xl leading-none pt-0.5">{activityEmoji(slot.title, slot.area)}</span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-medium text-foreground leading-snug">{slot.title}</span>
                                <span className="block text-[11px] text-muted-foreground mt-1">
                                  {SLOT_BADGE[slot.kind]} · 약 {slot.minutes}분
                                </span>
                              </span>
                              {canModifyPlan && (
                                <span
                                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "bg-primary border-primary text-white"
                                      : "border-border/70 text-muted-foreground"
                                  }`}
                                  aria-hidden="true"
                                >
                                  {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                </span>
                              )}
                            </button>

                            {isSelected && canModifyPlan && (
                              <div className="px-4 pb-4 space-y-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-muted-foreground w-8 shrink-0">언제</span>
                                  {(Object.keys(TIME_LABEL) as TimeOfDay[]).map((t) => (
                                    <button
                                      key={t}
                                      onClick={() => patchEdit(slot.id, { timeOfDay: timeOfDay === t ? null : t })}
                                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                                        timeOfDay === t
                                          ? "bg-primary/10 border-primary/60 text-primary font-medium"
                                          : "bg-white border-border/50 text-muted-foreground hover:border-primary/30"
                                      }`}
                                    >
                                      {TIME_LABEL[t]}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-muted-foreground w-8 shrink-0">강도</span>
                                  {(Object.keys(TOGGLE_LABEL) as Toggle[]).map((t) => (
                                    <button
                                      key={t}
                                      onClick={() => patchEdit(slot.id, { toggle: t })}
                                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                                        toggle === t
                                          ? "bg-primary/10 border-primary/60 text-primary font-medium"
                                          : "bg-white border-border/50 text-muted-foreground hover:border-primary/30"
                                      }`}
                                    >
                                      {TOGGLE_LABEL[t]}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* 나만의 조각 (A3+ 권한 개방 시에만 노출) */}
                    {canSelfPropose && (
                      <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/[0.03] p-4 space-y-2.5">
                        <p className="text-sm font-medium text-foreground">나만의 조각 만들기</p>
                        <p className="text-[11px] text-muted-foreground -mt-1">
                          해보고 싶은 게 있다면 뭐든 적어보세요. 아주 작아도 좋아요.
                        </p>
                        {selfSlots.map((s, i) => (
                          <div key={s.id} className="flex items-center justify-between rounded-xl bg-white border border-primary/30 px-3 py-2.5">
                            <span className="text-sm text-foreground">{s.title}</span>
                            <button
                              onClick={() => setSelfSlots((prev) => prev.filter((_, j) => j !== i))}
                              className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1"
                            >
                              빼기
                            </button>
                          </div>
                        ))}
                        {totalPlanned < MAX_PLAN && (
                          <div className="flex gap-2">
                            <input
                              value={selfInput}
                              onChange={(e) => { setSelfInput(e.target.value); setSelfError(null); }}
                              onKeyDown={(e) => e.key === 'Enter' && handleSelfPropose()}
                              placeholder="예: 베란다에서 커피 한 잔"
                              className="flex-1 rounded-xl border border-border/60 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                              aria-label="나만의 조각 입력"
                            />
                            <Button variant="outline" className="rounded-xl shrink-0" onClick={handleSelfPropose}>
                              담기
                            </Button>
                          </div>
                        )}
                        {selfError && <p className="text-[11px] text-primary">{selfError}</p>}
                      </div>
                    )}

                    {totalPlanned >= MAX_PLAN && (
                      <p className="text-[11px] text-muted-foreground text-center">
                        오늘은 이만하면 충분해요. 작게 시작하는 게 오래 가요.
                      </p>
                    )}

                    <div className="space-y-2 pt-1">
                      <Button
                        size="lg"
                        className="w-full rounded-2xl h-14"
                        disabled={totalPlanned === 0}
                        onClick={() => handleConfirm(selected, true)}
                      >
                        이대로 좋아요
                      </Button>
                      {canModifyPlan && defaultSlot && (
                        <button
                          onClick={() => handleConfirm([defaultSlot.id], false)}
                          className="w-full text-center text-xs text-muted-foreground py-1.5 hover:text-foreground transition-colors"
                        >
                          잘 모르겠어요 — 담아둔 대로 할게요
                        </button>
                      )}
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Camera, Check } from "lucide-react";
import { useVerifyChallengePhoto } from "@workspace/api-client-react";
import { Area, AREAS } from "@/lib/classifier";
import { knowYourselfCardCopy, getChapters } from "@/lib/survey";
import { fileToDataUrl } from "@/lib/image";
import {
  DaySlot,
  SLOT_BADGE,
  SLOT_REASON,
  SKIP_REASONS,
  TIME_LABEL,
  TOGGLE_LABEL,
  Toggle,
  TimeOfDay,
  effectiveLevel,
  defaultMinutesForLevel,
  toggleDefaultReason,
  planTodaySlots,
  planDepth,
  nextStage,
  summarizeOnboardingWeek,
} from "@/lib/ba";

const COMPLETION_PRAISES = [
  "오늘 이만큼 해낸 것, 정말 멋져요.",
  "작은 한 걸음이 모여 큰 변화가 돼요. 잘했어요.",
  "천천히, 그리고 확실하게 해냈네요. 대단해요.",
  "오늘 하루에 이 순간을 만들어낸 게 참 좋아요.",
  "스스로 해낸 오늘의 조각, 참 소중해요.",
];

function pickPraise(nickname?: string) {
  const base = COMPLETION_PRAISES[Math.floor(Math.random() * COMPLETION_PRAISES.length)];
  return nickname ? `${nickname}님, ${base}` : base;
}

const areaLabels: Record<string, string> = {
  [AREAS.rhythm]: "생활 리듬",
  [AREAS.selfcare]: "나 돌보기",
  [AREAS.relationship]: "사람 관계",
  [AREAS.social]: "사회 활동",
};

const PLACE_OPTIONS = ["내 방", "거실", "집 밖"];
const WITH_OPTIONS = ["혼자", "가족과", "다른 사람과"];

const TOGGLES: Toggle[] = ["light", "normal", "challenge"];
const TIMES: TimeOfDay[] = ["morning", "noon", "evening"];
const TIME_EMOJI: Record<TimeOfDay, string> = { morning: "🌅", noon: "☀️", evening: "🌙" };

// 슬롯 선택 카드: 태그(영역 + 추천 이유) + 미션 + (선택 시) 계획 입력 펼침
function SelectableSlotCard({
  slot,
  selected,
  onSelect,
  onUpdate,
  showPlace,
  showWith,
  places,
  mood,
  nudgeDefaultNormal,
  stage,
}: {
  slot: DaySlot;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, patch: Partial<DaySlot>) => void;
  showPlace: boolean;
  showWith: boolean;
  places: string[];
  mood: number;
  nudgeDefaultNormal: boolean;
  stage: NonNullable<ReturnType<typeof useAppStore>["user"]["stage"]>;
}) {
  const level = effectiveLevel(slot.level, slot.toggle, stage, slot.area);
  const minutes = defaultMinutesForLevel(level);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className={`bg-white p-5 rounded-3xl border cursor-pointer transition-colors space-y-3 ${
        selected ? "border-primary shadow-[0_2px_16px_rgba(245,158,11,0.18)]" : "border-border/50 hover:border-primary/40 shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 bg-secondary text-foreground text-[11px] rounded-full font-medium">
            {areaLabels[slot.area]}
          </span>
          <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] rounded-full font-medium">
            {SLOT_BADGE[slot.kind]}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">약 {minutes}분</span>
          <span
            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
              selected ? "bg-primary border-primary" : "border-border"
            }`}
          >
            {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </span>
        </div>
      </div>

      <h3 className="text-base font-medium text-foreground leading-relaxed">{slot.title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{SLOT_REASON[slot.kind]}</p>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-2 border-t border-border/40 space-y-2">
              <p className="text-sm font-medium text-foreground">난이도를 조절할까요?</p>
              <div className="flex gap-1.5">
                {TOGGLES.map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate(slot.id, { toggle: t })}
                    className={`flex-1 py-2.5 rounded-xl text-xs border transition-colors ${
                      slot.toggle === t
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-border/50 text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {TOGGLE_LABEL[t]}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">{toggleDefaultReason(mood, nudgeDefaultNormal)}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">오늘 언제 하실래요?</p>
              <div className="flex gap-1.5">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate(slot.id, { timeOfDay: slot.timeOfDay === t ? null : t })}
                    className={`flex-1 py-2.5 rounded-xl text-xs border transition-colors ${
                      slot.timeOfDay === t
                        ? "bg-secondary border-primary/50 text-foreground font-medium"
                        : "bg-white border-border/50 text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {TIME_EMOJI[t]} {TIME_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>

            {showPlace && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">어디서 해볼까요?</p>
                <div className="flex gap-1.5">
                  {places.map((p) => (
                    <button
                      key={p}
                      onClick={() => onUpdate(slot.id, { place: slot.place === p ? undefined : p })}
                      className={`flex-1 py-2.5 rounded-xl text-xs border transition-colors ${
                        slot.place === p
                          ? "bg-secondary border-primary/50 text-foreground font-medium"
                          : "bg-white border-border/50 text-muted-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showWith && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">누구와 함께할까요?</p>
                <div className="flex gap-1.5">
                  {WITH_OPTIONS.map((w) => (
                    <button
                      key={w}
                      onClick={() => onUpdate(slot.id, { withWhom: slot.withWhom === w ? undefined : w })}
                      className={`flex-1 py-2.5 rounded-xl text-xs border transition-colors ${
                        slot.withWhom === w
                          ? "bg-secondary border-primary/50 text-foreground font-medium"
                          : "bg-white border-border/50 text-muted-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// 결정된 조각의 실행 카드: 사진 인증 / 했어요 / 건너뛰기
function AcceptedSlotCard({
  slot,
  onComplete,
  onPhoto,
  onSkip,
  verifying,
}: {
  slot: DaySlot;
  onComplete: (slot: DaySlot) => void;
  onPhoto: (slot: DaySlot) => void;
  onSkip: (slot: DaySlot, reason: string) => void;
  verifying: boolean;
}) {
  const { user } = useAppStore();
  const [skipOpen, setSkipOpen] = useState(false);
  const stage = user.stage!;
  const level = effectiveLevel(slot.level, slot.toggle, stage, slot.area);
  const minutes = defaultMinutesForLevel(level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-primary/40 space-y-4"
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 bg-secondary text-foreground text-[11px] rounded-full font-medium">
            {areaLabels[slot.area]}
          </span>
          <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] rounded-full font-medium">
            오늘의 조각
          </span>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">약 {minutes}분</span>
      </div>

      <h3 className="text-lg font-medium text-foreground leading-relaxed">{slot.title}</h3>
      <p className="text-xs text-muted-foreground">
        {[
          `${TOGGLE_LABEL[slot.toggle]}로`,
          slot.timeOfDay ? `${TIME_LABEL[slot.timeOfDay]}에` : null,
          slot.place ? `${slot.place}에서` : null,
          slot.withWhom ?? null,
        ]
          .filter(Boolean)
          .join(" · ")}{" "}
        해보기로 했어요.
      </p>

      {verifying ? (
        <div className="flex items-center justify-center gap-3 py-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-4 border-secondary border-t-primary rounded-full"
          />
          <p className="text-muted-foreground text-sm animate-pulse">사진을 살펴보고 있어요...</p>
        </div>
      ) : skipOpen ? (
        <div className="space-y-2">
          <p className="text-sm text-foreground">어떤 게 발목을 잡았나요?</p>
          <div className="flex flex-wrap gap-1.5">
            {SKIP_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => onSkip(slot, r)}
                className="px-3 py-1.5 rounded-full text-xs border bg-white border-border/50 text-muted-foreground hover:bg-secondary/50 transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
          <button onClick={() => setSkipOpen(false)} className="text-xs text-muted-foreground underline">
            아니에요, 다시 볼래요
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-primary/40 text-primary hover:bg-primary hover:text-white transition-colors"
              onClick={() => onPhoto(slot)}
            >
              <Camera className="w-4 h-4 mr-1.5" />
              사진 인증
            </Button>
            <Button className="flex-1 rounded-xl" onClick={() => onComplete(slot)}>
              했어요
            </Button>
          </div>
          <button
            onClick={() => setSkipOpen(true)}
            className="w-full text-center text-xs text-muted-foreground py-1 hover:text-foreground transition-colors"
          >
            오늘은 건너뛸래요
          </button>
        </div>
      )}
    </motion.div>
  );
}

export function Home() {
  const { user, updateUser, setView, nextDay, signOut } = useAppStore();
  const verifyMut = useVerifyChallengePhoto();
  const [verifyingSlotId, setVerifyingSlotId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoSlotRef = useRef<DaySlot | null>(null);

  // 오늘의 슬롯 생성(로컬 시드뱅크 · 게이트·허용영역·한 활동 규칙 준수)
  useEffect(() => {
    if (user.todaySlots || !user.stage || !user.daily || user.phase !== "cycle") return;
    const earlyAvoidance = user.onboardingWeek
      ? summarizeOnboardingWeek(user.onboardingWeek).earlyAvoidance
      : false;
    const slots = planTodaySlots({
      dayCount: user.dayCount,
      stage: user.stage,
      forbidden: user.forbidden,
      bandLow: user.currentBandLow,
      bandHigh: user.currentBandHigh,
      mood: user.daily.mood,
      desiredArea: user.daily.area,
      activityId: user.daily.activityId,
      areaSeeds: user.areaSeeds,
      interests: user.interests,
      areaPM: user.areaPM,
      skipLog: user.skipLog,
      cycleStartDay: user.cycleStartDay ?? user.dayCount,
      nudgeDefaultNormal: user.nudgeDefaultNormal,
      earlyAvoidance,
      pleasureBoostArea: user.pleasureBoostArea,
    });
    updateUser({ todaySlots: slots });
  }, [user.todaySlots, user.stage, user.daily, user.phase]);

  const patchSlot = (id: string, patch: Partial<DaySlot>) => {
    updateUser({
      todaySlots: (user.todaySlots ?? []).map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const completeSlot = (slot: DaySlot) => {
    updateUser({
      reflectSlotId: slot.id,
      pendingPraise: pickPraise(user.nickname || undefined),
    });
    setView("reflection");
  };

  const skipSlot = (slot: DaySlot, reason: string) => {
    updateUser({
      todaySlots: (user.todaySlots ?? []).map((s) =>
        s.id === slot.id ? { ...s, status: "skipped" as const, skipReason: reason } : s,
      ),
      skipLog: [
        ...user.skipLog,
        { day: user.dayCount, area: slot.area, title: slot.title, level: slot.level, reason },
      ],
    });
  };

  const requestPhoto = (slot: DaySlot) => {
    photoSlotRef.current = slot;
    fileInputRef.current?.click();
  };

  const onPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const slot = photoSlotRef.current;
    if (!file || !slot) return;
    setVerifyingSlotId(slot.id);
    try {
      const imageDataUrl = await fileToDataUrl(file);
      const res = await verifyMut.mutateAsync({
        data: { imageDataUrl, title: slot.title, nickname: user.nickname || undefined },
      });
      updateUser({ pendingPraise: res.praise, reflectSlotId: slot.id });
    } catch {
      // 분석이 안 되어도 완료는 그대로 인정 (실패 처벌 없음)
      updateUser({ pendingPraise: pickPraise(user.nickname || undefined), reflectSlotId: slot.id });
    }
    setVerifyingSlotId(null);
    setView("reflection");
  };

  // 진급 제안 카드: 동의 시 다음 단계로(게이트는 그대로 유지 — 절대 완화 없음). 거절 시 2주 뒤.
  const acceptPromotion = () => {
    const ns = user.stage ? nextStage(user.stage) : null;
    if (!ns) return;
    updateUser({
      stage: ns,
      promotionOffer: false,
      promotionDeclinedDay: null,
      lastMessage: "새로운 조각이 열렸어요. 서두르지 않아도 괜찮아요.",
    });
  };
  const declinePromotion = () => {
    updateUser({ promotionOffer: false, promotionDeclinedDay: user.dayCount });
  };

  // '나 알아가기' 카드 — 5챕터를 모두 마치기 전까지 하루 1장 노출.
  const ky = user.knowYourself;
  const showKnowCard =
    !!user.stage && !(ky?.finalized) && (ky?.lastChapterDay ?? null) !== user.dayCount;

  const knowCard = showKnowCard ? (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 hover:border-primary/30 transition-colors"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="px-3 py-1 bg-secondary text-foreground text-xs rounded-full font-medium">
          나 알아가기
        </span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">약 1분</span>
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2 leading-relaxed">{knowYourselfCardCopy}</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {getChapters()[ky?.chapterIndex ?? 0]?.area_label ?? ""} 이야기를 들려줄래요?
      </p>
      <Button
        variant="outline"
        className="w-full rounded-xl hover:bg-primary hover:text-white transition-colors"
        onClick={() => setView("know_yourself")}
      >
        좋아요, 해볼래요
      </Button>
    </motion.div>
  ) : null;

  const slots = user.todaySlots ?? [];
  const depth = planDepth(user.stage);
  // 외출 게이트가 있으면 '집 밖'은 권하지 않는다
  const places = user.forbidden.includes("외출")
    ? PLACE_OPTIONS.filter((p) => p !== "집 밖")
    : PLACE_OPTIONS;
  const proposed = slots.filter((s) => s.status === "proposed");
  const active = slots.filter((s) => s.status !== "proposed");
  const doneCount = slots.filter((s) => s.status === "completed").length;
  // 아직 아무 조각도 결정하지 않았다면 = 선택 모드
  const selectionMode = proposed.length > 0 && active.length === 0;
  const mood = user.daily?.mood ?? 3;

  const decideSlot = () => {
    if (!selectedId) return;
    patchSlot(selectedId, { status: "accepted" });
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-6 pt-8 pb-4 flex justify-between items-center bg-white/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-20">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">
            Day {user.dayCount} · {user.nickname || "조각이 친구"}님
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("growth")}
            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-border/50 hover:bg-secondary/50 transition-colors"
          >
            <Character size="sm" className="scale-[0.4] -mx-4" />
            <span className="text-sm font-medium text-primary">{user.points} pt</span>
          </button>
          <button
            onClick={signOut}
            aria-label="로그아웃"
            title="로그아웃"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto pb-24">
        <div className="space-y-6">
          <div className="mb-8 pl-2 border-l-4 border-primary">
            <h2 className="text-xl font-medium text-foreground">
              {selectionMode ? (
                <>오늘 하루를 채울<br />작은 조각을 골라주세요.</>
              ) : doneCount > 0 ? (
                <>오늘 {doneCount}조각을 맞췄어요.<br />더 해도, 여기까지여도 좋아요.</>
              ) : (
                <>오늘의 조각이에요.<br />천천히, 지금의 속도면 충분해요.</>
              )}
            </h2>
            {selectionMode && (
              <p className="text-sm text-muted-foreground mt-1.5">
                지금의 나에게 맞는 것 하나면 충분해요.
              </p>
            )}
          </div>

          {user.promotionOffer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 p-6 rounded-3xl border border-primary/30 space-y-4"
            >
              <p className="text-lg font-medium text-foreground">다음 조각으로 넘어가볼까요?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                요즘 꾸준히 조각을 맞춰왔더라고요. 준비가 됐다면 조금 더 넓은 세상의 조각들을 보여드릴게요.
                지금 이대로도 충분히 좋아요.
              </p>
              <div className="flex gap-2">
                <Button className="flex-1 rounded-xl" onClick={acceptPromotion}>
                  좋아요, 가볼래요
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={declinePromotion}>
                  아직은 여기가 좋아요
                </Button>
              </div>
            </motion.div>
          )}

          {knowCard}

          {selectionMode ? (
            <>
              <AnimatePresence>
                {proposed.map((slot) => (
                  <SelectableSlotCard
                    key={slot.id}
                    slot={slot}
                    selected={selectedId === slot.id}
                    onSelect={() => setSelectedId(slot.id)}
                    onUpdate={patchSlot}
                    showPlace={depth.place}
                    showWith={depth.withWhom}
                    places={places}
                    mood={mood}
                    nudgeDefaultNormal={user.nudgeDefaultNormal}
                    stage={user.stage!}
                  />
                ))}
              </AnimatePresence>
              <Button
                size="lg"
                className="w-full rounded-2xl h-14"
                disabled={!selectedId}
                onClick={decideSlot}
              >
                이 조각으로 결정했어요
              </Button>
            </>
          ) : (
            <>
              <AnimatePresence>
                {active.map((slot) =>
                  slot.status === "accepted" ? (
                    <AcceptedSlotCard
                      key={slot.id}
                      slot={slot}
                      onComplete={completeSlot}
                      onPhoto={requestPhoto}
                      onSkip={skipSlot}
                      verifying={verifyingSlotId === slot.id}
                    />
                  ) : (
                    <div
                      key={slot.id}
                      className={`p-5 rounded-3xl border ${slot.status === "completed" ? "bg-primary/5 border-primary/20" : "bg-white/60 border-border/40"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{slot.status === "completed" ? "🧩" : "🌙"}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${slot.status === "completed" ? "text-foreground" : "text-muted-foreground line-through"} truncate`}>
                            {slot.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {slot.status === "completed" ? "오늘의 조각을 맞췄어요" : "오늘은 쉬어가기로 했어요"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </AnimatePresence>

              {proposed.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground px-1">
                    더 하고 싶다면, 이런 조각도 있어요
                  </p>
                  {proposed.map((slot) => (
                    <div
                      key={slot.id}
                      className="bg-white/70 p-4 rounded-2xl border border-border/50 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{slot.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {areaLabels[slot.area]} · {SLOT_BADGE[slot.kind]}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl shrink-0"
                        onClick={() => patchSlot(slot.id, { status: "accepted" })}
                      >
                        이것도 할래요
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <p className="text-xs text-muted-foreground text-center">
            사진은 확인 후 바로 사라져요. 저장되지 않아요.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPhotoSelected}
            aria-label="인증 사진 선택"
          />
        </div>

        <div className="mt-8 pb-4 flex justify-center">
          <Button
            variant="ghost"
            className="rounded-full text-muted-foreground hover:text-foreground bg-white/60 border border-border/50 px-6"
            onClick={nextDay}
          >
            다음 날로 → (데모)
          </Button>
        </div>
      </div>
    </div>
  );
}

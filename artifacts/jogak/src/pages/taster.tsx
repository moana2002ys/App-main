import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import { TASTER_MISSIONS, TasterMission, emptyOnboardingWeek } from "@/lib/ba";
import { todayKey } from "@/lib/day";

// 맛보기 챌린지 — 설문 직후, 온보딩 주간에 들어가기 전.
// 설계 의도: 첫 방문에서 "설문만 잔뜩 하고 끝났다"로 끝나지 않게 한다.
// 5분 안에 작은 성공 하나 + 이 앱이 어떻게 굴러가는지 이해, 두 개만 남기고 보낸다.
type Step = "intro" | "pick" | "doing" | "felt" | "principle" | "done";

// 앱 원리 설명 — 낙인 언어·난이도 숫자·회복단계명 노출 금지(정본 원칙).
const PRINCIPLE_CARDS: {
  title: string;
  body: string;
  visual: "slots" | "resize" | "keep";
}[] = [
  {
    title: "매일 아침,\n조각 몇 개를 놓아둘게요",
    body: "고르는 건 늘 조각이 친구 몫이에요.\n하나만 해도 되고, 오늘은 쉬어도 돼요.",
    visual: "slots",
  },
  {
    title: "버거우면\n알아서 작아져요",
    body: "어제 어땠는지 보고 조각 크기를 조용히 맞춰요.\n못 한 날이 있어도 다시 재촉하지 않아요.",
    visual: "resize",
  },
  {
    title: "모은 조각은\n사라지지 않아요",
    body: "쌓인 만큼 조각이와 방이 조금씩 달라져요.\n한 번 얻은 건 되돌아가지 않아요.",
    visual: "keep",
  },
];

function SlotsVisual() {
  return (
    <div className="flex gap-2 justify-center">
      {["물 한 잔", "환기하기", "노래 듣기"].map((t, i) => (
        <motion.span
          key={t}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 * i }}
          className={`rounded-2xl border px-3 py-2 text-xs ${
            i === 0
              ? "bg-white border-primary text-foreground font-medium shadow-sm"
              : "bg-white/70 border-border/50 text-muted-foreground"
          }`}
        >
          {t}
        </motion.span>
      ))}
    </div>
  );
}

function ResizeVisual() {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="rounded-2xl bg-secondary/70 border border-border/50 px-5 py-4 text-sm text-muted-foreground">
        어려웠던 조각
      </span>
      <span className="text-2xl text-primary">→</span>
      <motion.span
        animate={{ scale: [1, 0.86, 1] }}
        transition={{ repeat: Infinity, duration: 2.4 }}
        className="rounded-2xl bg-white border-2 border-primary px-4 py-2.5 text-sm font-medium text-foreground shadow-sm"
      >
        더 작은 조각
      </motion.span>
    </div>
  );
}

function KeepVisual() {
  return (
    <div className="flex items-end justify-center gap-1.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ height: 8, opacity: 0.3 }}
          animate={{ height: 12 + i * 9, opacity: 1 }}
          transition={{ delay: i * 0.12 }}
          className="w-7 rounded-lg bg-primary/25 border border-primary/40"
        />
      ))}
    </div>
  );
}

const FELT_TAPS = [
  { v: 1, label: "별로였어요" },
  { v: 3, label: "그냥 그랬어요" },
  { v: 5, label: "좋았어요" },
];

export function Taster() {
  const { user, updateUser, setView, signOut } = useAppStore();
  const [step, setStep] = useState<Step>("intro");
  const [picked, setPicked] = useState<TasterMission | null>(null);
  const [cardIndex, setCardIndex] = useState(0);

  // 온보딩 주간으로 넘어가기 — 맛보기를 했든 넘겼든 여정은 똑같이 시작된다.
  const goOnboardingWeek = (taster: {
    missionId: string;
    completed: boolean;
    skipped: boolean;
    p?: number;
  }) => {
    updateUser({
      taster: { ...taster, dateKey: todayKey() },
      onboardingWeek: user.onboardingWeek ?? emptyOnboardingWeek(),
      phase: "onboarding_week",
    });
    setView("onboarding_week");
  };

  const finish = () => {
    goOnboardingWeek(
      user.taster
        ? { ...user.taster }
        : { missionId: picked?.id ?? "", completed: false, skipped: true },
    );
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="flex justify-end px-4 pt-3">
        <button
          onClick={signOut}
          aria-label="로그아웃"
          className="p-2 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full p-6 pt-0">
        <AnimatePresence mode="wait">
          {step === "intro" ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex-1 flex flex-col justify-center items-center text-center space-y-8"
            >
              <Character className="scale-125" />
              <div className="space-y-3">
                <h1 className="text-2xl font-medium text-foreground leading-snug">
                  묻기만 하고 끝내면
                  <br />
                  아쉽잖아요
                </h1>
                <p className="text-muted-foreground leading-relaxed text-[15px]">
                  아주 작은 조각 하나만 지금 맞춰볼래요?
                  <br />
                  1분이면 충분해요.
                </p>
              </div>
              <div className="w-full space-y-3">
                <Button size="lg" className="w-full rounded-2xl h-14" onClick={() => setStep("pick")}>
                  좋아요, 하나 골라볼게요
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full rounded-2xl h-12 text-muted-foreground"
                  onClick={() => {
                    setStep("principle");
                    setCardIndex(0);
                  }}
                >
                  지금은 그냥 둘러볼래요
                </Button>
              </div>
            </motion.div>
          ) : step === "pick" ? (
            <motion.div
              key="pick"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center space-y-6"
            >
              <div className="flex justify-center">
                <Character size="sm" />
              </div>
              <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-border/50 text-foreground text-lg leading-relaxed">
                지금 제일 만만해 보이는 걸로 하나만 골라주세요.
              </div>
              <div className="space-y-3">
                {TASTER_MISSIONS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setPicked(m);
                      setStep("doing");
                    }}
                    className="w-full text-left bg-white rounded-2xl border border-border/50 hover:border-primary/40 hover:bg-secondary/30 transition-colors px-5 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[15px] font-medium text-foreground">{m.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">약 {m.minutes}분</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : step === "doing" && picked ? (
            <motion.div
              key="doing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center space-y-8"
            >
              <div className="text-center space-y-1.5">
                <p className="text-sm text-muted-foreground">첫 번째 조각</p>
                <h2 className="text-xl font-medium text-foreground">천천히 해도 괜찮아요</h2>
              </div>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-border/50 space-y-4 text-center"
              >
                <span className="inline-block px-3 py-1 bg-secondary rounded-full text-xs text-muted-foreground">
                  약 {picked.minutes}분
                </span>
                <p className="text-xl font-medium text-foreground leading-relaxed">{picked.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{picked.hint}</p>
              </motion.div>
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full rounded-2xl h-14 text-lg"
                  onClick={() => setStep("felt")}
                >
                  했어요
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full rounded-2xl h-12 text-muted-foreground"
                  onClick={() => {
                    updateUser({
                      taster: {
                        missionId: picked.id,
                        completed: false,
                        skipped: true,
                        dateKey: todayKey(),
                      },
                    });
                    setStep("principle");
                    setCardIndex(0);
                  }}
                >
                  지금은 어려워요
                </Button>
              </div>
            </motion.div>
          ) : step === "felt" && picked ? (
            <motion.div
              key="felt"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col justify-center space-y-7"
            >
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 16 }}
                  className="flex justify-center"
                >
                  <Character size="lg" />
                </motion.div>
                <h2 className="text-2xl font-medium text-foreground">첫 조각을 맞췄어요</h2>
                <p className="text-sm text-muted-foreground">방금 한 건 어땠는지만 가볍게 알려주세요.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 space-y-3">
                <p className="text-sm text-foreground">해보니 어땠어요?</p>
                <div className="flex gap-2">
                  {FELT_TAPS.map((t) => (
                    <button
                      key={t.v}
                      onClick={() => {
                        updateUser({
                          taster: {
                            missionId: picked.id,
                            completed: true,
                            skipped: false,
                            p: t.v,
                            dateKey: todayKey(),
                          },
                        });
                        setStep("principle");
                        setCardIndex(0);
                      }}
                      className="flex-1 py-3 rounded-xl text-sm border bg-white border-border/50 hover:bg-secondary/50 transition-colors"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : step === "principle" ? (
            <motion.div
              key="principle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center gap-4 pt-4 pb-2">
                <div className="flex-1 h-2 bg-secondary/70 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${((cardIndex + 1) / PRINCIPLE_CARDS.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <button
                  onClick={() => setStep("done")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  건너뛰기
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`principle-${cardIndex}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col items-center justify-center text-center gap-8"
                >
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground leading-snug whitespace-pre-line">
                      {PRINCIPLE_CARDS[cardIndex]!.title}
                    </h2>
                    <p className="text-[15px] text-muted-foreground leading-relaxed whitespace-pre-line">
                      {PRINCIPLE_CARDS[cardIndex]!.body}
                    </p>
                  </div>
                  {PRINCIPLE_CARDS[cardIndex]!.visual === "slots" && <SlotsVisual />}
                  {PRINCIPLE_CARDS[cardIndex]!.visual === "resize" && <ResizeVisual />}
                  {PRINCIPLE_CARDS[cardIndex]!.visual === "keep" && <KeepVisual />}
                </motion.div>
              </AnimatePresence>

              <div className="pb-2">
                <Button
                  size="lg"
                  className="w-full rounded-2xl h-14 text-base"
                  onClick={() => {
                    if (cardIndex < PRINCIPLE_CARDS.length - 1) setCardIndex(cardIndex + 1);
                    else setStep("done");
                  }}
                >
                  {cardIndex < PRINCIPLE_CARDS.length - 1 ? "다음" : "알겠어요"}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col justify-center items-center text-center space-y-8"
            >
              <Character size="lg" />
              <div className="space-y-3">
                <h2 className="text-2xl font-medium text-foreground">준비됐어요</h2>
                <p className="text-muted-foreground text-[15px] leading-relaxed">
                  오늘부터 이레 동안은
                  <br />
                  하루에 딱 하나씩만 놓아둘게요.
                </p>
              </div>
              <Button size="lg" className="w-full rounded-2xl h-14" onClick={finish}>
                시작할게요
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

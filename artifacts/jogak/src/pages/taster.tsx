import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import { TASTER_MISSIONS, TasterMission, emptyOnboardingWeek } from "@/lib/ba";
import { todayKey } from "@/lib/day";
import { Baebdal } from "@/components/onboarding/Baebdal";
import { D0_6_TASTER, PM } from "@/lib/onboarding-copy";

// D0-6 맛보기 챌린지 — Day0 마지막 화면 (v5, 은둔 체크 뒤).
// 설계 의도(결정근거 D-5): 첫 방문이 "묻기만 하고 끝났다"로 끝나지 않게 5분 안에 작은 성공 하나.
// 미션 4종은 전부 실내·혼자·1~4분이라 가장 보수적인 게이트에서도 안전하다(D-6).
// 마침 화면(「내일 또 올게…」)은 건너뛰어도 본다 — Day0를 닫는 역할.
// 사용법 3장은 9.9에 onboarding.tsx D0-4로 옮겨갔다.
type Step = "intro" | "pick" | "doing" | "felt" | "closing";

export function Taster() {
  const { user, updateUser, setView, signOut } = useAppStore();
  const [step, setStep] = useState<Step>("intro");
  const [picked, setPicked] = useState<TasterMission | null>(null);

  const record = (t: { missionId: string; completed: boolean; skipped: boolean; p?: number }) =>
    updateUser({ taster: { ...t, dateKey: todayKey() } });

  // 맛보기를 했든 넘겼든 여정은 똑같이 시작된다.
  const goOnboardingWeek = () => {
    if (!user.taster) record({ missionId: picked?.id ?? "", completed: false, skipped: true });
    updateUser({
      onboardingWeek: user.onboardingWeek ?? emptyOnboardingWeek(),
      phase: "onboarding_week",
    });
    setView("onboarding_week");
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
              <Baebdal state="wave" size="lg" />
              <div className="space-y-3">
                <h1 className="text-2xl font-medium text-foreground leading-snug">{D0_6_TASTER.introTitle}</h1>
                <p className="text-muted-foreground leading-relaxed text-[15px]">{D0_6_TASTER.introBody}</p>
              </div>
              <div className="w-full space-y-3">
                <Button size="lg" className="w-full rounded-2xl h-14" onClick={() => setStep("pick")}>
                  {D0_6_TASTER.pick}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full rounded-2xl h-12 text-muted-foreground"
                  onClick={() => {
                    record({ missionId: "", completed: false, skipped: true });
                    setStep("closing");
                  }}
                >
                  {D0_6_TASTER.skip}
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
              <div className="flex justify-center"><Baebdal state="idle" size="sm" /></div>
              <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-border/50 text-foreground text-lg leading-relaxed">
                {D0_6_TASTER.pickPrompt}
              </div>
              <div className="space-y-3">
                {TASTER_MISSIONS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setPicked(m); setStep("doing"); }}
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
                <p className="text-sm text-muted-foreground">{D0_6_TASTER.doingKicker}</p>
                <h2 className="text-xl font-medium text-foreground">{D0_6_TASTER.doingTitle}</h2>
              </div>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-border/50 space-y-4 text-center"
              >
                <span className="inline-block px-3 py-1 bg-secondary rounded-full text-xs text-muted-foreground">약 {picked.minutes}분</span>
                <p className="text-xl font-medium text-foreground leading-relaxed">{picked.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{picked.hint}</p>
              </motion.div>
              <div className="space-y-3">
                <Button size="lg" className="w-full rounded-2xl h-14 text-lg" onClick={() => setStep("felt")}>
                  {D0_6_TASTER.did}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full rounded-2xl h-12 text-muted-foreground"
                  onClick={() => {
                    record({ missionId: picked.id, completed: false, skipped: true });
                    setStep("closing");
                  }}
                >
                  {D0_6_TASTER.hard}
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
                  <Baebdal state="celebrate" size="lg" />
                </motion.div>
                <h2 className="text-2xl font-medium text-foreground">{D0_6_TASTER.feltTitle}</h2>
                <p className="text-sm text-muted-foreground">{PM.sub}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 space-y-3">
                <p className="text-sm text-foreground">{D0_6_TASTER.feltAsk}</p>
                <div className="flex gap-2">
                  {PM.taps.map((t) => (
                    <button
                      key={t.v}
                      onClick={() => {
                        record({ missionId: picked.id, completed: true, skipped: false, p: t.v });
                        setStep("closing");
                      }}
                      className="flex-1 py-3 rounded-xl text-sm border bg-white border-border/50 hover:bg-secondary/50 transition-colors"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="closing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col justify-center items-center text-center space-y-8"
            >
              {/* Day0 마침 — 옛 '마무리 카드'를 여기에 흡수 (9.9) */}
              <Baebdal state="happy" size="lg" />
              <p className="text-xl font-medium text-foreground leading-relaxed max-w-xs">{D0_6_TASTER.closing}</p>
              <Button size="lg" className="w-full rounded-2xl h-14" onClick={goOnboardingWeek}>
                {D0_6_TASTER.closingCta}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

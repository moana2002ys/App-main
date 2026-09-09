import { motion } from "framer-motion";

// 온보딩 카드에 곁들이는 그림들. 문구는 lib/onboarding-copy.ts, 그림만 여기.
// 금지어(고립·은둔·단계·레벨·점수·우울)는 그림 라벨에도 쓰지 않는다.

// ── Day1 프로그램 원리: 노란 얼굴(표정별) ────────────────────
export type LearnFace = "frown" | "wink" | "smile" | "joy";

export function LearnFaceSvg({ face }: { face: LearnFace }) {
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

// 카드2: 기분 저하 → 더 가라앉음 → 미루기/회피 악순환
export function CycleDiagram() {
  return (
    <div className="relative w-56 h-40 mx-auto">
      <svg viewBox="0 0 224 160" className="absolute inset-0 w-full h-full">
        <circle cx="112" cy="84" r="46" fill="none" stroke="#D6D3CB" strokeWidth="2" strokeDasharray="4 6" />
      </svg>
      <span className="absolute left-1/2 -translate-x-1/2 top-0 bg-white border border-border/50 rounded-full px-4 py-1.5 text-sm text-foreground/80 shadow-sm">
        기분 저하
      </span>
      <span className="absolute left-2 bottom-2 bg-secondary border border-border/50 rounded-full px-4 py-1.5 text-sm text-foreground font-medium shadow-sm">
        더 가라앉음
      </span>
      <span className="absolute right-0 bottom-2 bg-white border border-border/50 rounded-full px-4 py-1.5 text-sm text-foreground/80 shadow-sm">
        미루기/회피
      </span>
    </div>
  );
}

// 카드3: 작은 행동 → 기분이 따라옴!
export function ArrowDiagram() {
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

// 카드5: 세 가지 반복 — ① 작게 ② 섞어 ③ 돌아봐
export function LoopDiagram() {
  const steps = ["작게", "섞어", "돌아봐"];
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <motion.span
          key={s}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 * i }}
          className="rounded-full bg-white border-2 border-primary/60 px-4 py-2 text-sm font-medium text-foreground shadow-sm"
        >
          {s}
        </motion.span>
      ))}
      <span className="text-primary text-xl">↻</span>
    </div>
  );
}

// ── Day0 사용법 3장 ─────────────────────────────────────────
export function SlotsVisual() {
  return (
    <div className="flex gap-2 justify-center">
      {["물 한 잔", "환기하기", "노래 듣기"].map((t, i) => (
        <motion.span
          key={t}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 * i }}
          className={`rounded-2xl border px-3 py-2 text-xs ${
            i === 0 ? "bg-white border-primary text-foreground font-medium shadow-sm" : "bg-white/70 border-border/50 text-muted-foreground"
          }`}
        >
          {t}
        </motion.span>
      ))}
    </div>
  );
}

export function ResizeVisual() {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="rounded-2xl bg-secondary/70 border border-border/50 px-5 py-4 text-sm text-muted-foreground">
        버거운 챌린지
      </span>
      <span className="text-2xl text-primary">→</span>
      <motion.span
        animate={{ scale: [1, 0.86, 1] }}
        transition={{ repeat: Infinity, duration: 2.4 }}
        className="rounded-2xl bg-white border-2 border-primary px-4 py-2.5 text-sm font-medium text-foreground shadow-sm"
      >
        더 작은 챌린지
      </motion.span>
    </div>
  );
}

export function KeepVisual() {
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

// ── Day2 여정·레벨업: 공간 5개 (방 안 → 집 안 → 집 앞 → 동네 → 더 넓은 곳) ──
export function SpacesVisual({ lit = 1 }: { lit?: number }) {
  const spaces = ["방 안", "집 안", "집 앞", "동네", "더 넓은 곳"];
  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap">
      {spaces.map((s, i) => (
        <motion.span
          key={s}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 * i }}
          className={`rounded-xl border px-3 py-1.5 text-xs ${
            i < lit ? "bg-primary/15 border-primary/50 text-foreground font-medium" : "bg-white/60 border-border/50 text-muted-foreground/70"
          }`}
        >
          {s}
        </motion.span>
      ))}
    </div>
  );
}

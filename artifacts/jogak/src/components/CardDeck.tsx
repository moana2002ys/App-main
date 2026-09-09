import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CopyCard } from "@/lib/onboarding-copy";
import { Baebdal } from "@/components/onboarding/Baebdal";
import { MascotState } from "@/components/Mascot";

// 온보딩 설명 카드 묶음 — 한 화면에 카드 하나, 점으로만 진행 표시(숫자 없음).
// 환영 4장 · 설계철학 3장 · 사용법 3장 · 프로그램 원리 5장 · 여정 5장 · 레벨업 3장 · 꾸미기 4장 …
// 전부 이 컴포넌트 하나로 그린다. 문구는 lib/onboarding-copy.ts.
export function CardDeck({
  cards,
  visuals,
  onDone,
  onSkip,
  header,
  lastCta = "알겠어",
  mascot = "idle",
  mascotOnFirstOnly = false,
}: {
  cards: CopyCard[];
  visuals?: (ReactNode | null | undefined)[];
  onDone: () => void;
  onSkip?: () => void;
  header?: string;
  lastCta?: string;
  mascot?: MascotState | null;
  mascotOnFirstOnly?: boolean;
}) {
  const [i, setI] = useState(0);
  const card = cards[i]!;
  const last = i === cards.length - 1;
  const visual = visuals?.[i] ?? null;
  const showMascot = mascot && (!mascotOnFirstOnly || i === 0);

  return (
    <div className="flex-1 flex flex-col">
      {(header || onSkip) && (
        <div className="flex items-center gap-4 pt-4 pb-2">
          {header ? (
            <p className="flex-1 text-sm font-medium text-muted-foreground">{header}</p>
          ) : (
            <div className="flex-1 h-2 bg-secondary/70 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${((i + 1) / cards.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              건너뛰기
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`card-${i}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 flex flex-col items-center justify-center text-center gap-7 py-4"
        >
          {visual ? (
            <div>{visual}</div>
          ) : showMascot ? (
            <Baebdal state={mascot!} size="lg" />
          ) : null}

          <div className="space-y-3 max-w-xs">
            {card.title && (
              <h2 className="text-2xl font-bold text-foreground leading-snug whitespace-pre-line">
                {card.title}
              </h2>
            )}
            <p
              className={`leading-relaxed whitespace-pre-line ${
                card.title ? "text-[15px] text-muted-foreground" : "text-xl font-medium text-foreground"
              }`}
            >
              {card.body}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 진행 점 — 숫자 대신 점 */}
      {cards.length > 1 && (
        <div className="flex gap-1.5 justify-center pb-4" aria-hidden="true">
          {cards.map((_, k) => (
            <span
              key={k}
              className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-primary/60" : "w-1.5 bg-secondary"}`}
            />
          ))}
        </div>
      )}

      <div className="pb-2 flex gap-2">
        {i > 0 && (
          <Button
            size="lg"
            variant="ghost"
            className="rounded-2xl h-14 px-5 text-muted-foreground"
            onClick={() => setI(i - 1)}
            aria-label="이전 카드"
          >
            이전
          </Button>
        )}
        <Button
          size="lg"
          className="flex-1 rounded-2xl h-14 text-base"
          onClick={() => (last ? onDone() : setI(i + 1))}
        >
          {last ? lastCta : "다음"}
        </Button>
      </div>
    </div>
  );
}

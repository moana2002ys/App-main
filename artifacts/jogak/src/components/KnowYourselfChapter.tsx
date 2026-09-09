import { useEffect, useMemo, useState } from "react";
import { useAppStore, emptyKnowYourself, KnowYourselfState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { getChapters, getScale } from "@/lib/survey";
import { scoreKnowYourself, finalStageFrom, stageBands, stageForbidden, applyChapterRouting } from "@/lib/survey-scoring";
import { Baebdal } from "@/components/onboarding/Baebdal";
import { KNOW_YOURSELF } from "@/lib/onboarding-copy";

// '나 알아가기' 챕터 하나를 진행하는 공통 컴포넌트.
//  - 온보딩(Day2 1챕터 · Day3 2챕터 · Day4 2챕터, v5)과 본 사이클(주 1챕터 카드) 둘 다 이걸 쓴다.
//  - 진행 상태(chapterIndex·itemIndex·responses)는 user.knowYourself에 즉시 저장 → 중간에 나가도 이어진다.
//  - 점수·컷오프·라벨은 화면에 절대 노출하지 않는다. 결과는 내부 단계 확정에만.
//  - 분기 챕터(가족·직장)에서 '아니오'면 문항 없이 건너뛰고 바로 onDone({skipped:true}).
export function KnowYourselfChapter({
  onDone,
  onExit,
  showDone = true,
}: {
  // 챕터가 끝났을 때(응답 완료 또는 분기 스킵). finalized = 5챕터 모두 끝나 단계가 확정됨.
  onDone: (r: { finalized: boolean; skipped: boolean }) => void;
  // '오늘은 다음에' / '여기까지' — 진행 상태는 저장된 채로 나간다. 없으면 버튼을 숨긴다.
  onExit?: () => void;
  // 챕터 완료 화면(「오늘 이야기는 여기까지」)을 보여줄지. 같은 날 다음 챕터가 이어지면 false.
  showDone?: boolean;
}) {
  const { user, updateUser } = useAppStore();
  const chapters = useMemo(() => getChapters(), []);
  const ky = user.knowYourself ?? emptyKnowYourself();
  const chapter = chapters[ky.chapterIndex];

  const [itemIndex, setItemIndex] = useState(ky.itemIndex);
  const [phase, setPhase] = useState<"intro" | "branch" | "items" | "done">(
    ky.itemIndex > 0 ? "items" : "intro",
  );
  const [finalized, setFinalized] = useState(false);

  // 이미 다 끝난 상태로 들어오면 아무것도 그리지 않고 바로 넘긴다(렌더 중 setState 방지).
  const alreadyDone = !chapter || ky.finalized;
  useEffect(() => {
    if (alreadyDone) onDone({ finalized: true, skipped: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alreadyDone]);
  if (alreadyDone) return null;

  const currentItem = chapter.items[itemIndex];
  const scale = currentItem ? getScale(currentItem.scale) : [];
  const progress = (itemIndex + (phase === "done" ? 1 : 0)) / chapter.items.length;

  const exit = () => {
    if (phase !== "done") updateUser({ knowYourself: { ...ky, itemIndex } });
    onExit?.();
  };

  // 챕터 하나가 끝났거나(응답 완료) 분기로 건너뛴 뒤
  const completeChapter = (opts: { skipped: boolean; responses: Record<string, number> }) => {
    const nextIndex = ky.chapterIndex + 1;
    const next: KnowYourselfState = {
      ...ky,
      responses: opts.responses,
      chapterIndex: nextIndex,
      itemIndex: 0,
      skippedChapters: opts.skipped ? [...ky.skippedChapters, chapter.id] : ky.skippedChapters,
      completedChapters: opts.skipped ? ky.completedChapters : [...ky.completedChapters, chapter.id],
      lastChapterDay: opts.skipped ? ky.lastChapterDay : user.dayCount,
      finalized: nextIndex >= chapters.length,
    };

    // 챕터별 라우팅: 완료한 챕터의 하위점수를 영역 시드에 더해 우선순위만 갱신. 단계는 여기서 안 바꾼다.
    const areaSeeds = opts.skipped
      ? user.areaSeeds
      : applyChapterRouting(user.areaSeeds ?? {}, chapter.id, opts.responses);

    if (next.finalized) {
      // 5챕터 완료 → 역코딩·비례 환산·컷오프로 단계 확정(은둔 체크 양성은 은둔 우선).
      // 게이트는 절대 완화하지 않는다: 확정 단계 기본 금지조건과 기존 금지조건의 합집합만.
      const score = scoreKnowYourself(next.responses);
      const stage = finalStageFrom(user.secluded, score);
      const bands = stageBands(stage);
      updateUser({
        knowYourself: next,
        areaSeeds,
        stage,
        baseBandLow: bands.low,
        baseBandHigh: bands.high,
        currentBandLow: bands.low,
        currentBandHigh: bands.high,
        forbidden: Array.from(new Set([...user.forbidden, ...stageForbidden(stage)])),
        todaySlots: null,
      });
      setFinalized(true);
      if (showDone) setPhase("done");
      else onDone({ finalized: true, skipped: opts.skipped });
      return;
    }

    updateUser({ knowYourself: next, areaSeeds });
    if (opts.skipped || !showDone) {
      // 분기 '아니오'는 시간이 안 걸렸으니 완료 화면 없이 바로 다음으로
      onDone({ finalized: false, skipped: opts.skipped });
    } else {
      setPhase("done");
    }
  };

  const handleAnswer = (v: number) => {
    if (!currentItem) return;
    const responses = { ...ky.responses, [currentItem.id]: v };
    const nextItem = itemIndex + 1;
    if (nextItem >= chapter.items.length) {
      completeChapter({ skipped: false, responses });
    } else {
      updateUser({ knowYourself: { ...ky, responses, itemIndex: nextItem } });
      setItemIndex(nextItem);
    }
  };

  const bubble = "bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-border/50 text-foreground text-lg leading-relaxed relative";
  const tail = <div className="absolute top-0 -left-3 w-4 h-4 bg-white border-l border-t border-border/50 transform -skew-x-[20deg]" />;
  const opt = "w-full justify-start text-left h-auto py-3.5 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30 whitespace-normal";

  return (
    <div className="flex-1 flex flex-col">
      {phase === "items" && (
        <div className="h-1.5 bg-secondary/60 rounded-full overflow-hidden mt-2 mb-4" aria-hidden="true">
          <motion.div
            className="h-full bg-primary/50 rounded-full"
            initial={false}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {phase === "intro" ? (
            <motion.div
              key={`intro-${chapter.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 flex flex-col items-center text-center"
            >
              <Baebdal state="idle" size="lg" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">나 알아가기 · {chapter.area_label}</p>
                <h2 className="text-xl font-medium text-foreground leading-relaxed">{chapter.intro}</h2>
                <p className="text-sm text-muted-foreground">{KNOW_YOURSELF.hint}</p>
              </div>
              <div className="w-full space-y-3">
                <Button size="lg" className="w-full rounded-2xl h-14" onClick={() => setPhase(chapter.branch ? "branch" : "items")}>
                  {KNOW_YOURSELF.start}
                </Button>
                {onExit && (
                  <Button variant="ghost" className="w-full rounded-2xl text-muted-foreground" onClick={exit}>
                    {KNOW_YOURSELF.later}
                  </Button>
                )}
              </div>
            </motion.div>
          ) : phase === "branch" && chapter.branch ? (
            <motion.div
              key={`branch-${chapter.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-center mb-6"><Baebdal state="idle" size="sm" /></div>
              <div className={bubble}>{chapter.branch.question}{tail}</div>
              <div className="space-y-3 mt-6">
                <Button variant="outline" className={opt} onClick={() => setPhase("items")}>{KNOW_YOURSELF.branchYes}</Button>
                <Button variant="outline" className={opt} onClick={() => completeChapter({ skipped: true, responses: ky.responses })}>
                  {KNOW_YOURSELF.branchNo}
                </Button>
              </div>
            </motion.div>
          ) : phase === "items" && currentItem ? (
            <motion.div
              key={`q-${currentItem.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-center mb-6"><Baebdal state="idle" size="sm" /></div>
              <div className={bubble}>{currentItem.q}{tail}</div>
              <div className="space-y-2.5 mt-6">
                {scale.map((o) => (
                  <Button key={`${currentItem.id}-${o.v}`} variant="outline" className={opt} onClick={() => handleAnswer(o.v)}>
                    {o.label}
                  </Button>
                ))}
              </div>
              {onExit && (
                <Button variant="ghost" className="w-full rounded-2xl text-muted-foreground text-sm" onClick={exit}>
                  {KNOW_YOURSELF.stopHere}
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 flex flex-col items-center text-center"
            >
              <Baebdal state={finalized ? "celebrate" : "happy"} size="lg" />
              <div className="space-y-2">
                <h2 className="text-xl font-medium text-foreground leading-relaxed">
                  {finalized ? KNOW_YOURSELF.finalTitle : KNOW_YOURSELF.doneTitle}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {finalized ? KNOW_YOURSELF.finalSub : KNOW_YOURSELF.doneSub}
                </p>
              </div>
              <Button size="lg" className="w-full rounded-2xl h-14" onClick={() => onDone({ finalized, skipped: false })}>
                {KNOW_YOURSELF.next}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

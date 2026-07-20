import { useEffect, useMemo, useState } from "react";
import { useAppStore, emptyKnowYourself, KnowYourselfState } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { getChapters, getScale } from "@/lib/survey";
import { scoreKnowYourself, finalStageFrom, stageBands, stageForbidden } from "@/lib/survey-scoring";

// '나 알아가기' — 고립 척도 25문항을 5챕터로 나눠 하루 한 챕터씩 진행.
// 점수·컷오프·라벨은 절대 화면에 노출하지 않는다. 결과는 내부 단계 확정에만 사용.
export function KnowYourself() {
  const { user, updateUser, setView } = useAppStore();
  const chapters = useMemo(() => getChapters(), []);

  const ky = user.knowYourself ?? emptyKnowYourself();
  const chapter = chapters[ky.chapterIndex];

  // 오늘 세션의 로컬 진행 상태(응답은 즉시 스토어에 반영)
  const [itemIndex, setItemIndex] = useState(ky.itemIndex);
  const [phase, setPhase] = useState<"intro" | "branch" | "items" | "done">(
    chapter?.branch && ky.itemIndex === 0 ? "intro" : ky.itemIndex > 0 ? "items" : "intro"
  );

  // 이미 완료된 상태로 들어온 경우 홈으로
  const invalidEntry = (!chapter || ky.finalized) && phase !== "done";
  useEffect(() => {
    if (invalidEntry) setView("home");
  }, [invalidEntry, setView]);
  if (invalidEntry) return null;

  const currentItem = chapter.items[itemIndex];
  const scale = currentItem ? getScale(currentItem.scale) : [];
  const progress = (itemIndex + (phase === "done" ? 1 : 0)) / chapter.items.length;

  // 중단 지점 저장 후 홈으로(내일 이어하기)
  // done 화면에서는 이미 completeChapter가 다음 챕터(itemIndex=0)로 저장했으므로
  // 로컬 itemIndex(직전 챕터 값)로 덮어쓰지 않는다.
  const saveAndExit = (partial?: Partial<KnowYourselfState>) => {
    if (phase !== "done") {
      updateUser({ knowYourself: { ...ky, itemIndex, ...partial } });
    }
    setView("home");
  };

  // 챕터 하나가 끝났거나(응답 완료) 분기로 건너뛴 뒤 호출
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

    if (next.finalized) {
      // 5챕터 완료 → 역코딩·비례 환산·컷오프로 단계 확정(은둔 체크 양성은 은둔 우선).
      // 단계가 그대로여도 첫 실행의 임시 제약을 걷어내고 확정 단계 기본값으로
      // 밴드·금지조건을 재설정하고, 오늘 미션 후보를 새 규칙으로 다시 생성한다(수락한 미션은 유지).
      const score = scoreKnowYourself(next.responses);
      const stage = finalStageFrom(user.secluded, score);
      const bands = stageBands(stage);
      updateUser({
        knowYourself: next,
        stage,
        baseBandLow: bands.low,
        baseBandHigh: bands.high,
        currentBandLow: bands.low,
        currentBandHigh: bands.high,
        forbidden: stageForbidden(stage),
        todayChallenges: null,
      });
      setPhase("done");
      return;
    }

    if (opts.skipped) {
      // 분기 '아니오' → 시간이 걸리지 않았으니 같은 세션에서 다음 챕터로 바로 이동
      updateUser({ knowYourself: next });
      setItemIndex(0);
      setPhase("intro");
    } else {
      updateUser({ knowYourself: next });
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

  const handleBranch = (yes: boolean) => {
    if (yes) {
      setPhase("items");
    } else {
      completeChapter({ skipped: true, responses: ky.responses });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="h-10 flex items-center gap-3">
        <button
          onClick={() => saveAndExit()}
          aria-label="홈으로 돌아가기"
          className="p-2 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        {phase === "items" && (
          <div className="flex-1 h-1.5 bg-secondary/60 rounded-full overflow-hidden" aria-hidden="true">
            <motion.div
              className="h-full bg-primary/50 rounded-full"
              initial={false}
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {phase === "intro" ? (
            <motion.div
              key={`intro-${chapter.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 flex flex-col items-center text-center"
            >
              <Character className="scale-110" showItems={false} />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">나 알아가기 · {chapter.area_label}</p>
                <h2 className="text-xl font-medium text-foreground leading-relaxed">{chapter.intro}</h2>
                <p className="text-sm text-muted-foreground">편하게 답해줘. 정답은 없어.</p>
              </div>
              <div className="w-full space-y-3">
                <Button
                  size="lg"
                  className="w-full rounded-2xl h-14"
                  onClick={() => setPhase(chapter.branch ? "branch" : "items")}
                >
                  좋아, 시작할게
                </Button>
                <Button
                  variant="ghost"
                  className="w-full rounded-2xl text-muted-foreground"
                  onClick={() => saveAndExit()}
                >
                  오늘은 다음에 할래
                </Button>
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
              <div className="flex justify-center mb-6">
                <Character size="sm" showItems={false} />
              </div>
              <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-border/50 text-foreground text-lg leading-relaxed relative">
                {chapter.branch.question}
                <div className="absolute top-0 -left-3 w-4 h-4 bg-white border-l border-t border-border/50 transform -skew-x-[20deg]"></div>
              </div>
              <div className="space-y-3 mt-6">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30"
                  onClick={() => handleBranch(true)}
                >
                  응, 있어
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30"
                  onClick={() => handleBranch(false)}
                >
                  아니, 없어
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
              <div className="flex justify-center mb-6">
                <Character size="sm" showItems={false} />
              </div>
              <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-border/50 text-foreground text-lg leading-relaxed relative">
                {currentItem.q}
                <div className="absolute top-0 -left-3 w-4 h-4 bg-white border-l border-t border-border/50 transform -skew-x-[20deg]"></div>
              </div>
              <div className="space-y-2.5 mt-6">
                {scale.map((opt) => (
                  <Button
                    key={`${currentItem.id}-${opt.v}`}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3.5 px-6 rounded-2xl bg-white hover:bg-secondary/50 border-border/50 hover:border-primary/30 whitespace-normal"
                    onClick={() => handleAnswer(opt.v)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full rounded-2xl text-muted-foreground text-sm"
                onClick={() => saveAndExit()}
              >
                오늘은 여기까지 할래
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 flex flex-col items-center text-center"
            >
              <Character className="scale-110" showItems={false} />
              <div className="space-y-2">
                <h2 className="text-xl font-medium text-foreground leading-relaxed">
                  {ky.finalized || user.knowYourself?.finalized
                    ? "고마워. 이제 너를 훨씬 잘 알게 됐어."
                    : "오늘 이야기는 여기까지. 고마워."}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {ky.finalized || user.knowYourself?.finalized
                    ? "앞으로의 조각들을 너에게 더 잘 맞춰볼게."
                    : "내일 또 이어서 이야기하자."}
                </p>
              </div>
              <Button size="lg" className="w-full rounded-2xl h-14" onClick={() => setView("home")}>
                홈으로 돌아가기
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

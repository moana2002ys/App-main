import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { ChevronLeft } from "lucide-react";
import { KnowYourselfChapter } from "@/components/KnowYourselfChapter";

// '나 알아가기' — 본 사이클용 화면(홈 카드에서 진입, 예정일 규칙은 home.tsx).
// 온보딩 Day2~4에서는 같은 챕터 컴포넌트를 onboarding-week.tsx가 직접 그린다.
// 챕터 진행·채점·단계 확정 로직은 전부 components/KnowYourselfChapter.tsx에 있다.
export function KnowYourself() {
  const { user, setView } = useAppStore();
  const finished = !!user.knowYourself?.finalized;

  // 이미 5챕터 끝난 상태로 들어오면 홈으로
  useEffect(() => {
    if (finished) setView("home");
  }, [finished, setView]);
  if (finished) return null;

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="h-10 flex items-center gap-3">
        <button
          onClick={() => setView("home")}
          aria-label="홈으로 돌아가기"
          className="p-2 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
        <KnowYourselfChapter onDone={() => setView("home")} onExit={() => setView("home")} showDone />
      </div>
    </div>
  );
}

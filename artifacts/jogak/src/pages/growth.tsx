import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BACKGROUND_STAGES } from "@/lib/rewards";
import { StatsSection } from "@/components/growth/StatsSection";
import { RetrospectiveSection } from "@/components/growth/RetrospectiveSection";
import { CollectionSection } from "@/components/growth/CollectionSection";

type Tab = "stats" | "reflect" | "collection";

const TABS: { id: Tab; label: string }[] = [
  { id: "stats", label: "통계" },
  { id: "reflect", label: "회고" },
  { id: "collection", label: "보관함" },
];

export function Growth() {
  const { user, setView, nextDay } = useAppStore();
  const [tab, setTab] = useState<Tab>("stats");

  // 배경 확장 단계에 따라 은은하게 변하는 하늘
  const bgClass = [
    "bg-gradient-to-b from-[#FFF8F0] to-[#FFEDD5]", // 방 안
    "bg-gradient-to-b from-[#FFFBEB] to-[#FEF3C7]", // 방 밖
    "bg-gradient-to-b from-[#F0F9FF] to-[#FEF3C7]", // 현관·창밖
    "bg-gradient-to-b from-[#E0F2FE] to-[#F0FDF4]", // 동네
  ][user.backgroundStage] ?? "bg-gradient-to-b from-[#FFF8F0] to-[#FFEDD5]";

  return (
    <div className={`flex flex-col h-full ${bgClass} transition-colors duration-1000`}>
      {/* 헤더 */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between shrink-0">
        <Button variant="ghost" className="rounded-full bg-white/60 backdrop-blur-sm" onClick={() => setView("home")}>
          돌아가기
        </Button>
        <span className="text-xs text-muted-foreground bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
          🌿 {BACKGROUND_STAGES[user.backgroundStage]}
        </span>
      </div>

      {/* 기록 헤더 — 닉네임 + LV + 함께한 날 + 조각이 얼굴 */}
      <div className="px-6 pt-2 pb-4 shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-border/50 shadow-sm p-5 flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {user.nickname || "조각이 친구"}님의 기록
              </h1>
              <span className="text-[11px] font-semibold text-amber-600 bg-amber-100 rounded-full px-2 py-0.5">
                LV.{user.backgroundStage + 1}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              조각이와 함께한 지 {user.dayCount}일째
            </p>
          </div>
          <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center shrink-0">
            <Character size="sm" className="scale-[0.55]" showItems={false} />
          </div>
        </motion.div>
      </div>

      {/* 탭 */}
      <div className="px-6 shrink-0">
        <div className="flex bg-white/50 backdrop-blur-sm rounded-full p-1 border border-white/60">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative flex-1 py-2 text-sm font-medium rounded-full transition-colors"
            >
              {tab === t.id && (
                <motion.div
                  layoutId="growthTab"
                  className="absolute inset-0 bg-white rounded-full shadow-sm"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${tab === t.id ? "text-foreground" : "text-muted-foreground"}`}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 내용 */}
      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6">
        {tab === "stats" && <StatsSection />}
        {tab === "reflect" && <RetrospectiveSection />}
        {tab === "collection" && <CollectionSection />}

        <div className="pt-6">
          <Button
            size="lg"
            className="w-full rounded-2xl h-14 bg-foreground text-background hover:bg-foreground/90 shadow-lg"
            onClick={nextDay}
          >
            다음 날로 → (데모)
          </Button>
        </div>
      </div>
    </div>
  );
}

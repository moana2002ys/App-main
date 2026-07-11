import { useAppStore } from "@/lib/store";
import {
  CATEGORIES_BY_AREA,
  ALL_AREAS,
  ITEMS,
  AREA_LABELS,
  BADGE_THRESHOLD,
  itemIdForCategory,
} from "@/lib/rewards";
import { Character } from "@/components/Character";
import { motion } from "framer-motion";

export function CollectionSection() {
  const { user } = useAppStore();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* 내 캐릭터 */}
      <section className="bg-white/80 rounded-3xl p-6 border border-white/60 shadow-sm flex flex-col items-center gap-3">
        <h3 className="text-sm font-medium text-foreground/70 self-start">내가 키운 조각이</h3>
        <div className="py-2">
          <Character size="lg" />
        </div>
        <p className="text-xs text-muted-foreground">
          획득한 아이템 {user.equippedItems.length}개가 함께하고 있어요
        </p>
      </section>

      {/* 뱃지·아이템 보관함 */}
      <section>
        <h3 className="text-sm font-medium text-foreground/70 mb-3 px-1">뱃지 · 아이템 보관함</h3>
        <div className="space-y-5">
          {ALL_AREAS.map((area) => {
            const cats = CATEGORIES_BY_AREA[area];
            const earnedCount = cats.filter((c) => user.badges.includes(c.id)).length;
            return (
              <div key={area}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-medium text-foreground/70">{AREA_LABELS[area]}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {earnedCount === cats.length ? "모두 모았어요 ✨" : `${earnedCount}/${cats.length} 조각`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {cats.map((cat) => {
                    const earned = user.badges.includes(cat.id);
                    const count = user.categoryCounts[cat.id] || 0;
                    const itemId = itemIdForCategory(cat, user.daily?.interest);
                    const meta = ITEMS[itemId];
                    return (
                      <div
                        key={cat.id}
                        className={`rounded-2xl p-3 border text-center transition-colors ${
                          earned
                            ? "bg-white border-white/70 shadow-sm"
                            : "bg-secondary/40 border-transparent"
                        }`}
                      >
                        <div
                          className={`w-11 h-11 mx-auto rounded-full flex items-center justify-center text-xl mb-1.5 ${
                            earned ? "bg-secondary" : "bg-white/50"
                          }`}
                        >
                          <span className={earned ? "" : "opacity-25 grayscale"}>
                            {earned ? meta?.emoji : "🔒"}
                          </span>
                        </div>
                        <p className={`text-[10px] leading-tight ${earned ? "text-foreground/80" : "text-muted-foreground/60"}`}>
                          {earned ? cat.badgeName : `${Math.min(count, BADGE_THRESHOLD)}/${BADGE_THRESHOLD}회`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}

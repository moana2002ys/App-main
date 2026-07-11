import { useAppStore } from "@/lib/store";
import {
  CATEGORIES_BY_AREA,
  ALL_AREAS,
  AREA_LABELS,
  BADGE_THRESHOLD,
} from "@/lib/rewards";
import { Character } from "@/components/Character";
import { BadgeIcon } from "@/components/BadgeIcon";
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

      {/* 뱃지 보관함 */}
      <section>
        <h3 className="text-sm font-medium text-foreground/70 mb-3 px-1">모은 조각 배지</h3>
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
                <div className="grid grid-cols-2 gap-2.5">
                  {cats.map((cat) => {
                    const earned = user.badges.includes(cat.id);
                    const count = user.categoryCounts[cat.id] || 0;
                    return (
                      <div
                        key={cat.id}
                        className={`rounded-2xl p-3.5 border flex items-center gap-3 transition-colors ${
                          earned
                            ? "bg-white border-white/70 shadow-sm"
                            : "bg-secondary/40 border-transparent"
                        }`}
                      >
                        <BadgeIcon categoryId={cat.id} size={48} earned={earned} className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-[13px] font-semibold leading-tight truncate ${
                              earned ? "text-foreground" : "text-muted-foreground/60"
                            }`}
                          >
                            {cat.title}
                          </p>
                          <p
                            className={`text-[10.5px] leading-tight mt-0.5 ${
                              earned ? "text-muted-foreground" : "text-muted-foreground/50"
                            }`}
                          >
                            {earned
                              ? cat.badgeName
                              : count > 0
                              ? `${Math.min(count, BADGE_THRESHOLD)}/${BADGE_THRESHOLD} 모으는 중`
                              : "아직 만나기 전"}
                          </p>
                        </div>
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

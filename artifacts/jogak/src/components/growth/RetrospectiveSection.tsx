import { useAppStore } from "@/lib/store";
import { AREA_LABELS, ALL_AREAS, BACKGROUND_STAGES, areaTotals } from "@/lib/rewards";
import { Area } from "@/lib/classifier";
import { motion } from "framer-motion";

interface Milestone {
  icon: string;
  title: string;
  desc: string;
}

export function RetrospectiveSection() {
  const { user } = useAppStore();

  const milestones: Milestone[] = [];
  const completes = user.growthLog.filter((e) => e.type === "complete");

  // 첫 미션
  if (completes.length > 0) {
    milestones.push({
      icon: "🌱",
      title: "첫 조각을 놓았어요",
      desc: `Day ${completes[0].day}, 아주 작은 한 걸음이 여기서 시작됐어요.`,
    });
  }

  // 도전해본 영역
  const totals = areaTotals(user.categoryCounts);
  const triedAreas = ALL_AREAS.filter((a) => totals[a] > 0);
  if (triedAreas.length > 0) {
    milestones.push({
      icon: "🧭",
      title: `${triedAreas.length}가지 영역을 만나봤어요`,
      desc: triedAreas.map((a) => AREA_LABELS[a]).join(" · ") + " 를 조금씩 해봤네요.",
    });
  }

  // 뱃지 획득
  const badgeEvents = user.growthLog.filter((e) => e.type === "badge");
  for (const b of badgeEvents) {
    milestones.push({
      icon: "🏅",
      title: b.label,
      desc: `Day ${b.day}, 반복이 쌓여 새로운 조각이 되었어요.`,
    });
  }

  // 배경 확장
  if (user.backgroundStage > 0) {
    milestones.push({
      icon: "🌿",
      title: `세상이 '${BACKGROUND_STAGES[user.backgroundStage]}'까지 넓어졌어요`,
      desc: "안에서 밖으로, 조금씩 세상과 이어지고 있어요.",
    });
  }

  // 연속 참여
  if (user.streakDays >= 3) {
    milestones.push({
      icon: "🔥",
      title: `${user.streakDays}일 연속 함께했어요`,
      desc: "꾸준함이 곧 당신의 힘이 되고 있어요.",
    });
  }

  const encouragement =
    user.totalCompletions === 0
      ? "아직 첫 조각 전이에요. 무리하지 않아도 괜찮아요, 준비되면 하나만 가볍게 해봐요."
      : "여기까지 온 건 전부 당신이 해낸 거예요. 못한 날이 있어도, 지나온 걸음은 사라지지 않아요.";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white/80 rounded-3xl p-6 border border-white/60 shadow-sm text-center space-y-2">
        <p className="text-2xl">💛</p>
        <p className="text-foreground leading-relaxed">{encouragement}</p>
      </div>

      {milestones.length > 0 && (
        <div className="relative pl-6">
          {/* 세로 라인 */}
          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border/60" />
          <div className="space-y-4">
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative"
              >
                <div className="absolute -left-6 top-1 w-[18px] h-[18px] rounded-full bg-white border border-border/60 flex items-center justify-center text-[10px]">
                  {m.icon}
                </div>
                <div className="bg-white/80 rounded-2xl p-4 border border-white/60 shadow-sm">
                  <p className="text-sm font-medium text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

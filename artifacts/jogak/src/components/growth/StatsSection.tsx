import { useAppStore } from "@/lib/store";
import { AREA_LABELS, ALL_AREAS, GrowthEvent, areaTotals } from "@/lib/rewards";
import { Area } from "@/lib/classifier";
import { DayRecord, AreaPMMap } from "@/lib/ba";
import { motion } from "framer-motion";

const AREA_COLORS: Record<Area, string> = {
  rhythm: "#FCD34D",
  selfcare: "#86EFAC",
  relationship: "#F9A8D4",
  social: "#93C5FD",
};

function SummaryCard({
  label,
  value,
  unit,
  emoji,
}: {
  label: string;
  value: number | string;
  unit?: string;
  emoji?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-border/40 shadow-sm text-center">
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      <p className="text-2xl font-bold text-amber-500">
        {value}
        {unit && <span className="text-lg font-bold text-amber-500">{unit}</span>}
        {emoji && <span className="text-xl ml-1">{emoji}</span>}
      </p>
    </div>
  );
}

// 최근 7일 기분 곡선 + 조각 맞춘 날 퍼즐 마커 — 목업 "움직인 날, 기분이 올라갔어요"
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function WeeklyMoodChart({ records }: { records: DayRecord[] }) {
  const recent = records.slice(-7);
  const withMood = recent.filter((r) => r.mood !== null);
  if (withMood.length < 2) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        기분 기록이 이틀 이상 쌓이면 흐름이 보여요.
      </p>
    );
  }

  // 마지막 기록 = 오늘이라고 보고 요일 라벨 계산
  const today = new Date();
  const labels = recent.map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (recent.length - 1 - i));
    return WEEKDAYS[d.getDay()];
  });

  const W = 300;
  const H = 120;
  const padX = 18;
  const padTop = 18;
  const padBottom = 26;
  const stepX = recent.length > 1 ? (W - padX * 2) / (recent.length - 1) : 0;
  const yFor = (mood: number) => H - padBottom - ((mood - 1) / 4) * (H - padTop - padBottom);

  const coords = recent.map((r, i) => ({
    x: padX + i * stepX,
    y: r.mood !== null ? yFor(r.mood) : null,
    done: r.completedTarget + r.completedPleasure + r.completedAvoidance > 0,
    day: r.day,
    label: labels[i],
  }));
  const drawn = coords.filter((c): c is typeof c & { y: number } => c.y !== null);
  const linePath = drawn.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* 옅은 가로 눈금 */}
      {[1, 3, 5].map((m) => (
        <line key={m} x1={padX} x2={W - padX} y1={yFor(m)} y2={yFor(m)} stroke="#F1EFE9" strokeWidth="1" />
      ))}
      <path
        d={linePath}
        fill="none"
        stroke="#FCD34D"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {drawn.map((c) =>
        c.done ? (
          <text key={c.day} x={c.x} y={c.y + 5} textAnchor="middle" fontSize="14">
            🧩
          </text>
        ) : (
          <circle key={c.day} cx={c.x} cy={c.y} r="3.5" fill="#3F3B33" />
        ),
      )}
      {coords.map((c, i) => (
        <text
          key={`l-${i}`}
          x={c.x}
          y={H - 6}
          textAnchor="middle"
          fontSize="10"
          fill="#A8A29E"
        >
          {c.label}
        </text>
      ))}
    </svg>
  );
}

// 목업 "내가 맞춘 조각 영역" — 영역별 완료 개수 막대
function AreaPieceBars({ counts }: { counts: Record<Area, number> }) {
  const max = Math.max(1, ...ALL_AREAS.map((a) => counts[a] || 0));
  return (
    <div className="space-y-4">
      {ALL_AREAS.map((area) => {
        const value = counts[area] || 0;
        return (
          <div key={area} className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground/80">{AREA_LABELS[area]}</span>
              <span className="text-muted-foreground">{value}개</span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary/60 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(value / max) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: value > 0 ? AREA_COLORS[area] : "#D6D3CB" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendChart({ log }: { log: GrowthEvent[] }) {
  const completes = log.filter((e) => e.type === "complete");
  if (completes.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">아직 기록이 쌓이는 중이에요.</p>;
  }

  // 일자별 누적 완료 수
  const byDay = new Map<number, number>();
  for (const e of completes) byDay.set(e.day, (byDay.get(e.day) || 0) + 1);
  const days = Array.from(byDay.keys()).sort((a, b) => a - b);
  let running = 0;
  const points = days.map((d) => {
    running += byDay.get(d)!;
    return { day: d, cum: running };
  });

  const maxCum = points[points.length - 1].cum;
  const W = 280;
  const H = 90;
  const padX = 10;
  const padY = 12;
  const stepX = points.length > 1 ? (W - padX * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = padX + i * stepX;
    const y = H - padY - (maxCum > 0 ? (p.cum / maxCum) * (H - padY * 2) : 0);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${H - padY} L ${coords[0].x} ${H - padY} Z`;

  const milestones = log.filter((e) => e.type === "badge" || e.type === "background");

  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#trendFill)" />
        <path d={linePath} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c) => (
          <circle key={c.day} cx={c.x} cy={c.y} r="3" fill="#F59E0B" />
        ))}
      </svg>

      {milestones.length > 0 && (
        <div className="space-y-2">
          {milestones
            .slice()
            .reverse()
            .map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground w-12 shrink-0">Day {m.day}</span>
                <span className="text-base">{m.type === "badge" ? "🏅" : "🌿"}</span>
                <span className="text-foreground/80 truncate">
                  {m.type === "badge" ? m.label : `세상이 '${m.label}'까지 넓어졌어요`}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// 영역별 즐거움·뿌듯함 평균(1~5) — "무엇이 나에게 즐거움을 주는가"의 발견.
function AreaPMBars({ areaPM }: { areaPM: AreaPMMap }) {
  const rows = ALL_AREAS.map((area) => {
    const pm = areaPM[area];
    if (!pm || pm.pN === 0) return null;
    return {
      area,
      p: pm.pSum / pm.pN,
      m: pm.mN > 0 ? pm.mSum / pm.mN : 0,
    };
  }).filter((r): r is { area: Area; p: number; m: number } => r !== null);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        조각을 완료하면 어떤 활동이 나와 잘 맞는지 보여드릴게요.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.area} className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-foreground/70">{AREA_LABELS[r.area]}</span>
          </div>
          {[
            { label: "즐거움", value: r.p, color: "#F9A8D4" },
            { label: "뿌듯함", value: r.m, color: "#86EFAC" },
          ].map((bar) => (
            <div key={bar.label} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-9 shrink-0">{bar.label}</span>
              <div className="flex-1 h-2 rounded-full bg-secondary/60 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(bar.value / 5) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: bar.color }}
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsSection() {
  const { user } = useAppStore();
  const totals = areaTotals(user.categoryCounts);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* 함께한 날 · 모은 조각 — 스트릭(연속) 표시 금지: 끊겨서 잃는 경험을 만들지 않는다 */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="함께한 날" value={user.dayCount} unit="일" emoji="🌱" />
        <SummaryCard label="모은 조각" value={user.totalCompletions} unit="개" emoji="🧩" />
      </div>

      {/* 최근 7일 기분 × 활동 */}
      <section className="bg-white rounded-3xl p-5 border border-border/40 shadow-sm">
        <h3 className="text-base font-bold text-foreground">움직인 날, 기분이 올라갔어요</h3>
        <p className="text-xs text-muted-foreground mt-0.5 mb-3">최근 7일간의 기분 변화와 활동 기록</p>
        <WeeklyMoodChart records={user.dayRecords} />
      </section>

      {/* 영역별 맞춘 조각 */}
      <section className="bg-white rounded-3xl p-5 border border-border/40 shadow-sm">
        <h3 className="text-base font-bold text-foreground mb-4">내가 맞춘 조각 영역</h3>
        <AreaPieceBars counts={totals} />
      </section>

      {/* 영역별 즐거움·뿌듯함 */}
      <section className="bg-white rounded-3xl p-5 border border-border/40 shadow-sm">
        <h3 className="text-base font-bold text-foreground mb-4">나에게 잘 맞았던 것들</h3>
        <AreaPMBars areaPM={user.areaPM} />
      </section>

      {/* 성장·변화 추이 */}
      <section className="bg-white rounded-3xl p-5 border border-border/40 shadow-sm">
        <h3 className="text-base font-bold text-foreground mb-4">내가 변해온 흐름</h3>
        <TrendChart log={user.growthLog} />
      </section>
    </motion.div>
  );
}

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

function SummaryCard({ label, value, unit }: { label: string; value: number | string; unit?: string }) {
  return (
    <div className="bg-white/80 rounded-2xl p-4 border border-white/60 shadow-sm text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">
        {value}
        {unit && <span className="text-sm font-medium text-muted-foreground ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

function Donut({ counts, total }: { counts: Record<Area, number>; total: number }) {
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="12" />
        {total > 0 &&
          ALL_AREAS.map((area) => {
            const value = counts[area] || 0;
            if (value === 0) return null;
            const len = (value / total) * circ;
            const dash = `${len} ${circ - len}`;
            const el = (
              <circle
                key={area}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={AREA_COLORS[area]}
                strokeWidth="12"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground">{total}</span>
        <span className="text-[10px] text-muted-foreground">완료</span>
      </div>
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

// 기분 곡선 × 완료 표시 오버레이 — BA의 핵심 시각화.
// "조각을 맞춘 날"에 점을 진하게 찍어, 행동과 기분의 연결을 스스로 발견하게 한다.
function MoodChart({ records, baseline }: { records: DayRecord[]; baseline: number | null }) {
  const withMood = records.filter((r) => r.mood !== null).slice(-14);
  if (withMood.length < 2) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        기분 기록이 이틀 이상 쌓이면 흐름이 보여요.
      </p>
    );
  }
  const W = 280;
  const H = 100;
  const padX = 10;
  const padY = 14;
  const stepX = (W - padX * 2) / (withMood.length - 1);
  const yFor = (mood: number) => H - padY - ((mood - 1) / 4) * (H - padY * 2);
  const coords = withMood.map((r, i) => ({
    x: padX + i * stepX,
    y: yFor(r.mood!),
    done: r.completedTarget + r.completedPleasure + r.completedAvoidance > 0,
    day: r.day,
  }));
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {baseline !== null && (
          <line
            x1={padX} x2={W - padX} y1={yFor(baseline)} y2={yFor(baseline)}
            stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4"
          />
        )}
        <path d={linePath} fill="none" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c) => (
          <circle
            key={c.day}
            cx={c.x} cy={c.y}
            r={c.done ? 4.5 : 3}
            fill={c.done ? "#F59E0B" : "#E2E8F0"}
            stroke={c.done ? "#F59E0B" : "#94A3B8"}
            strokeWidth="1"
          />
        ))}
      </svg>
      <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block" /> 조각을 맞춘 날
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0] border border-[#94A3B8] inline-block" /> 쉬어간 날
        </span>
      </div>
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
  const total = ALL_AREAS.reduce((s, a) => s + totals[a], 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* 누적 성장 요약 */}
      <section>
        <h3 className="text-sm font-medium text-foreground/70 mb-3 px-1">지금까지의 걸음</h3>
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard label="함께한 날" value={user.dayCount} unit="일" />
          <SummaryCard label="완료한 조각" value={user.totalCompletions} unit="개" />
          <SummaryCard label="연속 참여" value={user.streakDays} unit="일" />
          <SummaryCard label="모은 포인트" value={user.points} unit="pt" />
        </div>
      </section>

      {/* 영역별 활동 분포 */}
      <section className="bg-white/80 rounded-3xl p-5 border border-white/60 shadow-sm">
        <h3 className="text-sm font-medium text-foreground/70 mb-4">어떤 영역을 해왔나요</h3>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            첫 조각을 완료하면 여기에 나타나요.
          </p>
        ) : (
          <div className="flex items-center gap-5">
            <Donut counts={totals} total={total} />
            <div className="flex-1 space-y-2.5">
              {ALL_AREAS.map((area) => {
                const value = totals[area];
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={area}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-foreground/70">{AREA_LABELS[area]}</span>
                      <span className="text-muted-foreground">{value}회</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: AREA_COLORS[area] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 기분 흐름 × 완료 표시 */}
      <section className="bg-white/80 rounded-3xl p-5 border border-white/60 shadow-sm">
        <h3 className="text-sm font-medium text-foreground/70 mb-4">기분의 흐름</h3>
        <MoodChart records={user.dayRecords} baseline={user.moodBaseline} />
      </section>

      {/* 영역별 즐거움·뿌듯함 */}
      <section className="bg-white/80 rounded-3xl p-5 border border-white/60 shadow-sm">
        <h3 className="text-sm font-medium text-foreground/70 mb-4">나에게 잘 맞았던 것들</h3>
        <AreaPMBars areaPM={user.areaPM} />
      </section>

      {/* 성장·변화 추이 */}
      <section className="bg-white/80 rounded-3xl p-5 border border-white/60 shadow-sm">
        <h3 className="text-sm font-medium text-foreground/70 mb-4">내가 변해온 흐름</h3>
        <TrendChart log={user.growthLog} />
      </section>
    </motion.div>
  );
}

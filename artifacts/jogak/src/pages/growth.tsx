import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BACKGROUND_STAGES, AREA_LABELS, ALL_AREAS, areaTotals } from "@/lib/rewards";
import { MoodEntry, weeklyMoodSummary, MOODS } from "@/lib/cycle";
import { CollectionSection } from "@/components/growth/CollectionSection";
import { RetrospectiveSection } from "@/components/growth/RetrospectiveSection";
import { Area } from "@/lib/classifier";
import { IsoCanvas } from "@/components/IsoCanvas";
import { MascotBadge } from "@/components/MascotBadge";

const AREA_COLORS: Record<Area, string> = {
  rhythm: "#FFD55F",
  selfcare: "#A8DADC",
  relationship: "#FFB5A7",
  social: "#A2D2FF",
};

// 기분(1–5) × 활동 상관 그래프 — 최근 7일. 조각을 맞춘 날엔 🧩 마커.
function MoodActivityChart({ log, today }: { log: MoodEntry[]; today: number }) {
  const entries = log
    .filter((e) => e.day > today - 7 && e.day <= today)
    .sort((a, b) => a.day - b.day);

  if (entries.length < 2) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        기록이 이틀 이상 쌓이면<br />기분과 활동의 관계가 여기에 보여요.
      </p>
    );
  }

  const W = 280;
  const H = 120;
  const padX = 16;
  const padTop = 14;
  const padBottom = 30;
  const stepX = entries.length > 1 ? (W - padX * 2) / (entries.length - 1) : 0;
  const yFor = (mood: number) => padTop + ((5 - mood) / 4) * (H - padTop - padBottom);
  const coords = entries.map((e, i) => ({ x: padX + i * stepX, y: yFor(e.mood), ...e }));
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[1, 3, 5].map((mv) => (
        <line key={mv} x1={padX} x2={W - padX} y1={yFor(mv)} y2={yFor(mv)} stroke="#F5F1E6" strokeWidth="1" />
      ))}
      <path d={linePath} fill="none" stroke="#FFD55F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c) => (
        <g key={c.day}>
          <circle cx={c.x} cy={c.y} r="4" fill={c.completed ? "#F2C33D" : "#E5E0D8"} stroke="white" strokeWidth="1.5" />
          {c.completed && (
            <text x={c.x} y={H - padBottom + 16} fontSize="10" textAnchor="middle">🧩</text>
          )}
          <text x={c.x} y={H - 2} fontSize="8" fill="#898273" textAnchor="middle">D{c.day}</text>
        </g>
      ))}
      <text x={padX - 12} y={yFor(5) + 3} fontSize="9" textAnchor="middle">{MOODS[4]!.emoji}</text>
      <text x={padX - 12} y={yFor(1) + 3} fontSize="9" textAnchor="middle">{MOODS[0]!.emoji}</text>
    </svg>
  );
}

// 마이페이지 (킷 mypage 기준): 판단 없는 '기록' 프레이밍의 단일 스크롤 화면
export function Growth() {
  const { user, setView, nextDay } = useAppStore();
  const totals = areaTotals(user.categoryCounts);
  const total = ALL_AREAS.reduce((s, a) => s + totals[a], 0);
  // 하루 요약 원장(dayRecords)에서 그래프용 기분 로그(1~5)를 파생한다.
  const moodLog: MoodEntry[] = user.dayRecords
    .filter((r) => r.mood != null)
    .map((r) => ({
      day: r.day,
      mood: r.mood as number,
      completed: r.completedTarget + r.completedPleasure + r.completedAvoidance > 0,
    }));
  const summary = weeklyMoodSummary(moodLog, user.dayCount);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 헤더 */}
      <div className="bg-white px-6 pt-8 pb-6 rounded-b-[28px] shadow-sm shrink-0">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" className="rounded-full -ml-2 text-muted-foreground" onClick={() => setView("home")}>
            ← 돌아가기
          </Button>
          <div className="flex items-center gap-2">
            <MascotBadge />
            <Button size="sm" className="rounded-full bg-[#4A7C59] text-white hover:bg-[#3B6447]" onClick={() => setView("recovery_report")}>
              📊 회복 리포트
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Character size="sm" />
          </motion.div>
          <div>
            <h1 className="text-[20px] font-bold text-foreground">{user.nickname || "조각이 친구"}님의 기록</h1>
            <p className="text-[13px] text-muted-foreground">지금까지 모아온 조각들과 픽셀 지도예요</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-8 space-y-5">
        {/* 아이소메트릭 픽셀 지도 */}
        <section className="bg-white rounded-[24px] p-4 border border-card-border shadow-sm">
          <h3 className="text-[15px] font-semibold text-foreground mb-2">🗺️ 내 픽셀 공간 지도</h3>
          <IsoCanvas spaceKey="room" />
        </section>
        {/* 요약 — 스트릭(연속) 표시 금지. 누적값만 보여준다(끊겨도 잃지 않음) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-[20px] p-4 border border-card-border shadow-sm text-center">
            <p className="text-[11px] text-muted-foreground mb-1">함께한 날</p>
            <p className="text-xl font-bold text-foreground">{user.dayCount}<span className="text-xs font-medium text-muted-foreground ml-0.5">일</span></p>
          </div>
          <div className="bg-white rounded-[20px] p-4 border border-card-border shadow-sm text-center">
            <p className="text-[11px] text-muted-foreground mb-1">모은 조각</p>
            <p className="text-xl font-bold text-foreground">{user.totalCompletions}<span className="text-xs font-medium text-muted-foreground ml-0.5">개</span></p>
          </div>
        </div>

        {/* 기분 × 활동 상관 그래프 */}
        <section className="bg-white rounded-[24px] p-5 border border-card-border shadow-sm">
          <h3 className="text-[15px] font-semibold text-foreground mb-1">움직인 날의 기분</h3>
          <p className="text-[12px] text-muted-foreground mb-4">🧩 표시는 조각을 맞춘 날이에요</p>
          <MoodActivityChart log={moodLog} today={user.dayCount} />
          {summary && (
            <div className="mt-3 bg-accent rounded-2xl px-4 py-3 text-[13px] text-accent-foreground font-medium text-center">
              {summary}
            </div>
          )}
        </section>

        {/* 영역별 분포 */}
        <section className="bg-white rounded-[24px] p-5 border border-card-border shadow-sm">
          <h3 className="text-[15px] font-semibold text-foreground mb-4">어떤 조각을 모아왔나요</h3>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">첫 조각을 완료하면 여기에 나타나요.</p>
          ) : (
            <div className="space-y-3">
              {ALL_AREAS.map((area) => {
                const value = totals[area];
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={area}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-foreground/70 font-medium">{AREA_LABELS[area]}</span>
                      <span className="text-muted-foreground">{value}회</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
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
          )}
        </section>

        {/* 보관함 (뱃지·아이템·꾸미기 진입점) */}
        <section>
          <h3 className="text-[15px] font-semibold text-foreground mb-3 px-1">보관함</h3>
          <CollectionSection />
        </section>

        {/* 회고 기록 */}
        <section>
          <h3 className="text-[15px] font-semibold text-foreground mb-3 px-1">지난 기록</h3>
          <RetrospectiveSection />
        </section>

        <div className="pt-2">
          <Button
            size="lg"
            className="w-full rounded-[20px] h-14 font-bold shadow-[0_8px_20px_rgba(255,213,95,0.3)]"
            onClick={nextDay}
          >
            다음 날로 → (데모)
          </Button>
        </div>
      </div>
    </div>
  );
}

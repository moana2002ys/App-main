import { Challenge } from "@workspace/api-client-react";
import { Area, AREAS } from "./classifier";
import { classifyChallenge } from "./rewards";

// ─────────────────────────────────────────────────────────────
// 디자인 킷(2026-07 BA 사이클) 기준 새 추천 모델의 단일 출처.
//  - 기분 체크: 5점 척도 (데이터 수집용, 수행 관문 아님)
//  - P/M: 0–10 슬라이더(초기값 없음) → 내부 5밴드 매핑 (M→난이도, P→즐거움 풀)
//  - 난이도 기본값은 낮게, 숙달 시에만 이유와 함께 상승
//  - 건너뜀은 회피 '신호'로만 집계 → 더 작게 쪼개 재제안
// ─────────────────────────────────────────────────────────────

export interface MoodOption {
  value: number;
  label: string;
  emoji: string;
  bg: string; // 선택 시 원 배경
  text: string; // 선택 시 라벨 색
}

export const MOODS: MoodOption[] = [
  { value: 1, label: "매우 별로", emoji: "😞", bg: "bg-[#FFB5A7]", text: "text-[#D96B5B]" },
  { value: 2, label: "별로", emoji: "🙁", bg: "bg-[#F4A261]", text: "text-[#B86B2F]" },
  { value: 3, label: "보통", emoji: "😐", bg: "bg-[#E5E0D8]", text: "text-[#898273]" },
  { value: 4, label: "좋음", emoji: "🙂", bg: "bg-[#A8DADC]", text: "text-[#458C8F]" },
  { value: 5, label: "매우 좋음", emoji: "😄", bg: "bg-[#A2D2FF]", text: "text-[#4986C2]" },
];

// 기존 게이트(getSurveyCategories 등)가 쓰는 컨디션 문자열로 변환
export function moodToCondition(mood: number): string {
  if (mood <= 2) return "바닥";
  if (mood === 3) return "그저 그럼";
  return "괜찮음";
}

// P/M 0–10 → 내부 5밴드 (노이즈 완화)
export function pmToBand(v: number): number {
  if (v <= 1) return 1;
  if (v <= 3) return 2;
  if (v <= 5) return 3;
  if (v <= 7) return 4;
  return 5;
}

export type DifficultyLabel = "가볍게" | "보통" | "도전";

export const DIFFICULTY_ORDER: DifficultyLabel[] = ["가볍게", "보통", "도전"];

// 난이도 라벨 → 생성 요청 밴드 (기본은 낮게 시작)
export const DIFFICULTY_BAND: Record<DifficultyLabel, { low: number; high: number }> = {
  가볍게: { low: 1, high: 2 },
  보통: { low: 2, high: 3 },
  도전: { low: 3, high: 4 },
};

export interface PmEntry {
  day: number;
  area: Area;
  p: number; // 0–10
  m: number; // 0–10
  mood?: number; // 그날 기분(1–5)
  difficulty: DifficultyLabel;
}

export interface MoodEntry {
  day: number;
  mood: number; // 1–5
  completed: boolean; // 그날 조각을 맞췄는지
}

export interface SkipEntry {
  day: number;
  title: string;
  area: Area;
  reason: string;
}

export const SKIP_REASONS = [
  "너무 피곤했어요",
  "잊어버렸어요",
  "시간이 부족했어요",
  "다른 일이 생겼어요",
  "그냥 하기 싫었어요",
];

// 숙달 시에만 상승: 최근 이틀 연속 같은 난이도에서 M 밴드 4 이상이면 한 단계 위를 기본으로 제안.
// 하향은 내부적으로만 일어나며 사용자에게 '내려갔다'고 말하지 않는다.
export function computeDifficulty(pmLog: PmEntry[], current: DifficultyLabel): { label: DifficultyLabel; reason?: string } {
  const recent = pmLog.slice(-2);
  if (recent.length === 2 && recent.every((e) => e.difficulty === current && pmToBand(e.m) >= 4)) {
    const idx = DIFFICULTY_ORDER.indexOf(current);
    if (idx < DIFFICULTY_ORDER.length - 1) {
      const next = DIFFICULTY_ORDER[idx + 1]!;
      return {
        label: next,
        reason: `'${current}'를 이틀 연속 잘 해내서, 이번엔 '${next}'부터 추천해요`,
      };
    }
  }
  return { label: current };
}

// 즐거움 풀: 최근 P 밴드가 높았던(평균 P≥6) 영역 — 제안 카드 배지에만 표면화
export function pleasureHighlightArea(pmLog: PmEntry[]): Area | null {
  const recent = pmLog.slice(-10);
  const byArea = new Map<Area, number[]>();
  for (const e of recent) {
    const arr = byArea.get(e.area) ?? [];
    arr.push(e.p);
    byArea.set(e.area, arr);
  }
  let best: Area | null = null;
  let bestAvg = 0;
  for (const [area, arr] of byArea) {
    const avg = arr.reduce((s, n) => s + n, 0) / arr.length;
    if (avg >= 6 && avg > bestAvg) {
      best = area;
      bestAvg = avg;
    }
  }
  return best;
}

// 계속 미뤄진 조각은 더 작게 쪼개 재제안 (회피 신호의 유일한 표면화)
export function splitChallenge(c: Challenge): Challenge {
  return {
    ...c,
    level: Math.max(1, (c.level || 1) - 1),
    minutes: Math.min(5, c.minutes || 5),
    title: c.title.includes("5분") ? c.title : `${c.title} — 딱 5분만`,
  };
}

// 킷 표기 영역: 생활 리듬 / 자기 돌봄 / 즐거움 / 작은 용기
export function kitDomainLabel(c: Challenge): string {
  if (classifyChallenge(c) === "self-hobby") return "즐거움";
  switch (c.area as Area) {
    case AREAS.rhythm: return "생활 리듬";
    case AREAS.selfcare: return "자기 돌봄";
    case AREAS.relationship: return "작은 용기";
    case AREAS.social: return "작은 용기";
    default: return "생활 리듬";
  }
}

// 주간 요약 — 따뜻한 문장. 데이터가 부족하면 null.
export function weeklyMoodSummary(moodLog: MoodEntry[], today: number): string | null {
  const week = moodLog.filter((e) => e.day > today - 7);
  const withPiece = week.filter((e) => e.completed).map((e) => e.mood);
  const withoutPiece = week.filter((e) => !e.completed).map((e) => e.mood);
  if (withPiece.length === 0 || withoutPiece.length === 0) return null;
  const avg = (a: number[]) => a.reduce((s, n) => s + n, 0) / a.length;
  const diff = avg(withPiece) - avg(withoutPiece);
  if (diff >= 0.5) {
    const steps = Math.max(1, Math.round(diff));
    return `이번 주, 조각을 맞춘 날 기분이 평균 ${steps === 1 ? "한" : `${steps}`} 칸 높았어요!`;
  }
  return null;
}

// 7일 시작 데이터 쌓기 — 마찰이 거의 없는 초소형 고정 조각
export interface StartPiece {
  day: number;
  title: string;
  minutes: number;
}

export const START_WEEK_PIECES: StartPiece[] = [
  { day: 1, title: "물 한 잔 마시기", minutes: 1 },
  { day: 2, title: "창문 열고 환기하기", minutes: 2 },
  { day: 3, title: "이부자리 정리하기", minutes: 3 },
  { day: 4, title: "5분 동안 스트레칭", minutes: 5 },
  { day: 5, title: "좋아하는 노래 1곡 듣기", minutes: 4 },
  { day: 6, title: "잠깐 밖 공기 마시기", minutes: 5 },
  { day: 7, title: "나만의 조각 하나 고르기", minutes: 5 },
];

export function startPieceToChallenge(piece: StartPiece): Challenge {
  return {
    area: AREAS.rhythm,
    level: 1,
    title: piece.title,
    minutes: piece.minutes,
    reflectQ: "해보니 어땠나요? 아주 짧게라도 좋아요.",
  } as Challenge;
}

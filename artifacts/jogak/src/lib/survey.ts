// 온보딩 설문 데이터 모듈 — src/data/onboarding-survey.json(v1.2)이 단일 출처.
// 문항·선택지·척도·역코딩·분기·채점 파라미터를 전부 JSON에서 읽는다(하드코딩 금지).
import surveyData from "@/data/onboarding-survey.json";

export interface SurveyOption {
  label: string;
  v: number;
}

export interface FirstLaunchItem {
  id: string;
  q: string;
  type?: string;
  options?: SurveyOption[];
  areas?: Record<string, number>;
}

export interface FirstLaunchModule {
  id: string;
  name: string;
  response_scale?: SurveyOption[];
  items: FirstLaunchItem[];
}

export interface ChapterItem {
  id: string;
  reverse: boolean;
  scale: string;
  q: string;
}

export interface Chapter {
  id: string;
  area_label: string;
  intro: string;
  branch: { question: string; if_no: string } | null;
  items: ChapterItem[];
}

interface SurveyJson {
  first_launch: {
    intro_copy: string;
    modules: FirstLaunchModule[];
    scoring: { outing_burden_from_sc_q1: Record<string, string> };
  };
  know_yourself: {
    display: { card_copy: string };
    response_scales: Record<string, SurveyOption[]>;
    reverse_items: string[];
    chapters: Chapter[];
    scoring: { cutoffs: Record<string, string> };
  };
}

const data = surveyData as unknown as SurveyJson;

// ---- 첫 실행 설문 ----

export const firstLaunchIntro = data.first_launch.intro_copy;

// 첫 실행 문항을 순서대로 평탄화: sc_q1, sc_q2, ss1..ss15.
// 각 문항의 선택지는 자체 options 또는 모듈 공통 response_scale.
export interface FlatFirstLaunchItem {
  id: string;
  q: string;
  options: SurveyOption[];
  areas?: Record<string, number>;
  moduleId: string;
}

export function getFirstLaunchItems(): FlatFirstLaunchItem[] {
  const items: FlatFirstLaunchItem[] = [];
  for (const mod of data.first_launch.modules) {
    for (const item of mod.items) {
      const options = item.options ?? mod.response_scale ?? [];
      items.push({ id: item.id, q: item.q, options, areas: item.areas, moduleId: mod.id });
    }
  }
  return items;
}

// ---- '나 알아가기' (고립 척도 25문항 · 5챕터) ----

export const knowYourselfCardCopy = data.know_yourself.display.card_copy;

export function getChapters(): Chapter[] {
  return data.know_yourself.chapters;
}

export function getScale(name: string): SurveyOption[] {
  return data.know_yourself.response_scales[name] ?? [];
}

export function getReverseItems(): Set<string> {
  return new Set(data.know_yourself.reverse_items);
}

// 척도 최대값(역코딩 계산용): likert5/freq 계열 모두 0~4.
export function getScaleMax(name: string): number {
  const scale = getScale(name);
  return scale.reduce((m, o) => Math.max(m, o.v), 0);
}

// 챕터별 문항 id 목록(비례 환산 계산에 사용)
export function getChapterItemIds(chapterId: string): string[] {
  const ch = getChapters().find((c) => c.id === chapterId);
  return ch ? ch.items.map((i) => i.id) : [];
}

// ---- JSON 채점 파라미터 파서 ----

// "1-2" / "5-8" / "0~43" / "60~100" 같은 범위 문자열 → [min, max]
function parseRange(s: string): [number, number] {
  const m = s.match(/(\d+)\s*[-~]\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2])];
  const single = s.match(/(\d+)/);
  const v = single ? Number(single[1]) : 0;
  return [v, v];
}

// 외출부담 매핑(first_launch.scoring.outing_burden_from_sc_q1): sc_q1 값 → 상/중/하
export function getOutingBurdenRules(): { min: number; max: number; label: string }[] {
  const map = data.first_launch.scoring.outing_burden_from_sc_q1;
  return Object.entries(map).map(([range, label]) => {
    const [min, max] = parseRange(range);
    return { min, max, label };
  });
}

// 고립 수준 컷오프(know_yourself.scoring.cutoffs): 라벨 → [min, max]
export function getIsolationCutoffs(): { label: string; min: number; max: number }[] {
  return Object.entries(data.know_yourself.scoring.cutoffs)
    .map(([label, range]) => {
      const [min, max] = parseRange(range);
      return { label, min, max };
    })
    .sort((a, b) => a.min - b.min);
}

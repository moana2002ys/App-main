export type Area = "rhythm" | "selfcare" | "relationship" | "social";

// 변주축 B — 형식: 기록(record) / 탐색(explore) / 행동(action)
export type MissionFormat = "record" | "explore" | "action";

// 오늘 컨디션 (데일리 설문 값과 동일한 문자열)
export type Condition = "바닥" | "그저 그럼" | "괜찮음";

export interface CategoryGate {
  // 사용자 금지조건 배열과 교집합이 있으면 이 카테고리는 후보에서 제외한다.
  forbiddenTags?: string[];
  // 이 컨디션 이상일 때만 후보로 열린다.
  minCondition?: Condition;
}

export interface SeedCategory {
  id: string; // 예: "2-D"
  area: Area;
  name: string; // 예: "바깥과 연결(외출 노출)"
  // 설문 등 사용자 화면에 노출하는 담백·따뜻한 표시 문구(임상 용어 없음).
  label: string; // 예: "바깥과 연결되기"
  levels: { min: number; max: number }; // 적용 난이도 범위
  evidence: string[]; // 근거태그: BA, EXP, SE, EW, IPS, CIRC, KOR
  gate?: CategoryGate;
  seeds: string[]; // 변주용 씨앗(정답 아님)
  variationHint?: string; // LLM 변주 힌트
  reflectQs: string[]; // 회고질문 후보
}

export interface GeneratedMission {
  area: Area;
  level: number;
  title: string;
  minutes: number;
  reflectQ: string;
}

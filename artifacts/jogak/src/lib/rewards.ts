import { Challenge } from "@workspace/api-client-react";
import { Area, AREAS } from "./classifier";

// ─────────────────────────────────────────────────────────────
// 보상 설계서(character_reward_design) 준수:
//  - 카테고리 누적 카운트 기반, 리셋/만료/연속(streak) 조건 없음
//  - 획득한 뱃지·아이템은 회수 없음, 더하기만
//  - 무낙인·무경쟁, 성장 프레이밍 문구
//  - 카테고리 누적 3회 → 해당 카테고리 뱃지 + 아이템 자동 지급·장착 (설계서 3절 표)
//  - 배경은 외출·사회진입 성취에 연동해 은은하게 확장
//
// 미션 생성 엔진은 챌린지에 area만 부여하므로(세부 카테고리 코드 없음),
// 완료된 챌린지를 title 키워드로 세부 카테고리에 분류해 카운트한다.
// (생성 엔진/난이도 사다리는 변경하지 않음 = out of scope)
// ─────────────────────────────────────────────────────────────

export const AREA_LABELS: Record<Area, string> = {
  [AREAS.rhythm]: "생활 리듬",
  [AREAS.selfcare]: "자기 돌봄",
  [AREAS.relationship]: "관계",
  [AREAS.social]: "사회 진입",
};

export const ALL_AREAS: Area[] = [AREAS.rhythm, AREAS.selfcare, AREAS.relationship, AREAS.social];

// 방 안 → 방 밖 → 현관·창밖 → 동네
export const BACKGROUND_STAGES = ["방 안", "방 밖", "현관·창밖", "동네"] as const;

export interface ItemMeta {
  id: string;
  emoji: string;
  label: string;
}

export const ITEMS: Record<string, ItemMeta> = {
  curtain: { id: "curtain", emoji: "🪟", label: "열린 커튼" },
  meal: { id: "meal", emoji: "🍚", label: "따뜻한 밥" },
  clock: { id: "clock", emoji: "⏰", label: "알람시계" },
  mirror: { id: "mirror", emoji: "🪞", label: "거울" },
  diary: { id: "diary", emoji: "📔", label: "일기장" },
  yogamat: { id: "yogamat", emoji: "🧘", label: "요가매트" },
  shoes: { id: "shoes", emoji: "👟", label: "운동화" },
  broom: { id: "broom", emoji: "🧹", label: "정돈된 코너" },
  headphone: { id: "headphone", emoji: "🎧", label: "헤드폰" },
  books: { id: "books", emoji: "📚", label: "책더미" },
  plant: { id: "plant", emoji: "🪴", label: "화분" },
  gamepad: { id: "gamepad", emoji: "🎮", label: "게임패드" },
  easel: { id: "easel", emoji: "🎨", label: "이젤" },
  pet: { id: "pet", emoji: "🐾", label: "반려동물" },
  apron: { id: "apron", emoji: "🍳", label: "앞치마" },
  ball: { id: "ball", emoji: "⚽", label: "공" },
  speech: { id: "speech", emoji: "💬", label: "말풍선" },
  letter: { id: "letter", emoji: "✉️", label: "편지" },
  bag: { id: "bag", emoji: "🎒", label: "가방" },
};

// 취향·몰입 → 아이템 분기 (관심사에 따라 캐릭터가 그 사람다워짐)
const INTEREST_ITEM: Record<string, string> = {
  게임: "gamepad",
  음악: "headphone",
  동물: "pet",
  식물: "plant",
  "요리·먹는 것": "apron",
  "책·글": "books",
  스포츠: "ball",
  "그림·만들기": "easel",
};

export function interestItemId(interest?: string | null): string {
  if (interest && INTEREST_ITEM[interest]) return INTEREST_ITEM[interest];
  return "headphone"; // 취향 미상 시 기본 취향 아이템
}

export interface Category {
  id: string;
  area: Area;
  title: string; // 센스 있는 위트 타이틀 (부드럽고 따뜻한 결)
  badgeName: string; // 성장 프레이밍 한 줄 설명 ("~이 익숙해졌어요")
  itemId?: string;
  itemResolver?: (interest?: string | null) => string;
  backgroundStage?: number; // 이 카테고리 첫 뱃지 달성 시 배경 확장
  keywords: string[];
}

// 설계서 3절 표의 카테고리 → 뱃지 → 아이템 매핑
// title = 툭 던지지만 다정한 위트 타이틀 / badgeName = 따뜻한 성장 한 줄 설명
export const CATEGORIES: Category[] = [
  // 생활 리듬
  { id: "rhythm-anchor", area: AREAS.rhythm, title: "하루를 여는 사람", badgeName: "하루의 시작점이 생겼어요", itemId: "clock",
    keywords: ["기상", "알람", "취침", "일어난", "잠", "계획", "루틴", "스마트폰", "저녁 루틴"] },
  { id: "rhythm-light", area: AREAS.rhythm, title: "볕 들이는 사람", badgeName: "아침이 밝아졌어요", itemId: "curtain",
    keywords: ["빛", "햇빛", "햇살", "커튼", "창문", "창가", "환기", "바람", "공기"] },
  { id: "rhythm-meal", area: AREAS.rhythm, title: "끼니 챙기는 사람", badgeName: "끼니와 친해졌어요", itemId: "meal",
    keywords: ["식사", "밥", "끼니", "먹", "물 한", "물 한 컵", "차 한", "커피", "아침 식사"] },

  // 자기 돌봄
  { id: "self-walk", area: AREAS.selfcare, title: "동네 산책러", badgeName: "산책이 익숙해졌어요", itemId: "shoes", backgroundStage: 1,
    keywords: ["산책", "걷", "걸어", "외출", "나가", "동네", "카페", "나들이"] },
  { id: "self-move", area: AREAS.selfcare, title: "가볍게 움직이는 사람", badgeName: "몸이 가벼워졌어요", itemId: "yogamat",
    keywords: ["스트레칭", "요가", "운동", "몸을 움직", "움직이"] },
  { id: "self-hygiene", area: AREAS.selfcare, title: "산뜻함 담당", badgeName: "산뜻해졌어요", itemId: "mirror",
    keywords: ["세수", "양치", "씻", "거울", "샤워", "머리", "몸단장", "단장"] },
  { id: "self-emotion", area: AREAS.selfcare, title: "마음 관찰자", badgeName: "마음을 들여다보게 됐어요", itemId: "diary",
    keywords: ["감정", "기분", "이모지", "심호흡", "마음", "일기", "칭찬", "명상", "호흡"] },
  { id: "self-space", area: AREAS.selfcare, title: "공간 정돈가", badgeName: "공간이 정돈됐어요", itemId: "broom",
    keywords: ["정리", "정돈", "청소", "치우", "구석"] },
  { id: "self-hobby", area: AREAS.selfcare, title: "취향 탐험가", badgeName: "취향과 가까워졌어요", itemResolver: interestItemId,
    keywords: ["음악", "노래", "듣기", "책", "읽", "글", "식물", "화분", "그림", "게임", "요리", "만들기", "영화", "취미"] },

  // 관계
  { id: "rel-trust", area: AREAS.relationship, title: "안부 전하는 사람", badgeName: "마음을 나눴어요", itemId: "letter", backgroundStage: 2,
    keywords: ["통화", "전화", "가족", "친구", "안부", "문자", "인사", "고마워", "눈인사", "약속", "편지", "지인"] },
  { id: "rel-connect", area: AREAS.relationship, title: "세상과 연결 중", badgeName: "세상과 조금 이어졌어요", itemId: "speech", backgroundStage: 2,
    keywords: ["메시지", "읽음", "댓글", "좋아요", "커뮤니티", "영상", "sns", "프로필", "창밖", "창문 밖", "이모티콘", "유튜", "게시물"] },

  // 사회 진입
  { id: "social-explore", area: AREAS.social, title: "나를 찾는 탐험가", badgeName: "나를 찾아가고 있어요", itemId: "bag", backgroundStage: 3,
    keywords: [] },
];

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

export const CATEGORIES_BY_AREA: Record<Area, Category[]> = ALL_AREAS.reduce((acc, area) => {
  acc[area] = CATEGORIES.filter((c) => c.area === area);
  return acc;
}, {} as Record<Area, Category[]>);

// 미완료를 부정적으로 반영하지 않음: 완료된 챌린지만 분류
const AREA_DEFAULT: Record<Area, string> = {
  [AREAS.rhythm]: "rhythm-light",
  [AREAS.selfcare]: "self-walk", // 미매칭 시 대표(산책) 카테고리로
  [AREAS.relationship]: "rel-connect",
  [AREAS.social]: "social-explore",
};

export function classifyChallenge(challenge: Challenge): string {
  const area = challenge.area as Area;
  const title = (challenge.title || "").toLowerCase();
  for (const cat of CATEGORIES_BY_AREA[area] ?? []) {
    if (cat.keywords.some((k) => title.includes(k.toLowerCase()))) return cat.id;
  }
  return AREA_DEFAULT[area] ?? "self-walk";
}

// 난이도 가중 포인트 (L1=5 … L5=25)
export function pointsForLevel(level: number): number {
  const l = Math.min(5, Math.max(1, level || 1));
  return l * 5;
}

export const BADGE_THRESHOLD = 3;

export function emptyCounts(): Record<string, number> {
  return {};
}

// 영역별 누적 완료 = 그 영역에 속한 카테고리 카운트의 합
export function areaTotals(counts: Record<string, number>): Record<Area, number> {
  const totals: Record<Area, number> = { [AREAS.rhythm]: 0, [AREAS.selfcare]: 0, [AREAS.relationship]: 0, [AREAS.social]: 0 };
  for (const [catId, n] of Object.entries(counts)) {
    const cat = CATEGORY_BY_ID[catId];
    if (cat) totals[cat.area] += n;
  }
  return totals;
}

export function totalCompletionsFromCounts(counts: Record<string, number>): number {
  return Object.values(counts).reduce((s, n) => s + n, 0);
}

export interface GrowthEvent {
  day: number;
  type: "complete" | "badge" | "background";
  area?: Area;
  category?: string;
  label: string;
}

export interface EarnedReward {
  categoryId: string;
  title: string;
  badgeName: string;
  itemId: string;
  itemLabel: string;
  area: Area;
  backgroundLabel?: string;
}

export interface RewardState {
  categoryCounts: Record<string, number>;
  points: number;
  totalCompletions: number;
  badges: string[]; // 획득한 카테고리 id (회수 없음)
  equippedItems: string[];
  backgroundStage: number;
  growthLog: GrowthEvent[];
}

import { FURNITURE_CATALOG, FurnitureItem } from "./decor";

export interface EarnedReward {
  categoryId: string;
  title: string;
  badgeName: string;
  itemId?: string;
  itemLabel?: string;
  area: Area;
  backgroundLabel?: string;
  earnedFurniture?: FurnitureItem;
}

export interface RewardResult extends RewardState {
  earned: EarnedReward[];
  earnedFurnitureItem?: FurnitureItem;
}

export function itemIdForCategory(cat: Category, interest?: string | null): string {
  return cat.itemResolver ? cat.itemResolver(interest) : cat.itemId!;
}

// 완료 처리: 카테고리 분류 → category_counts[cat] += 1
//  → 뱃지 및 대응 가구 소품 해금
export function applyCompletion(
  prev: RewardState & { day: number; interest?: string | null },
  challenge: Challenge
): RewardResult {
  const catId = classifyChallenge(challenge);
  const cat = CATEGORY_BY_ID[catId];
  const area = cat.area;
  const level = challenge.level || 1;

  const counts = { ...prev.categoryCounts };
  counts[catId] = (counts[catId] || 0) + 1;

  const badges = [...prev.badges];
  const equipped = [...prev.equippedItems];
  let bg = prev.backgroundStage;
  const log = [...prev.growthLog];
  const earned: EarnedReward[] = [];

  log.push({ day: prev.day, type: "complete", area, category: catId, label: challenge.title });

  // 챌린지와 매핑된 가구 소품 해금
  const matchedFurniture = FURNITURE_CATALOG.find(f => f.unlockCategoryId === catId) || FURNITURE_CATALOG[0];

  if (counts[catId] >= BADGE_THRESHOLD && !badges.includes(catId)) {
    badges.push(catId);
    const itemId = itemIdForCategory(cat, prev.interest);
    if (itemId && !equipped.includes(itemId)) equipped.push(itemId);

    let backgroundLabel: string | undefined;
    if (cat.backgroundStage != null && cat.backgroundStage > bg) {
      bg = cat.backgroundStage;
      backgroundLabel = BACKGROUND_STAGES[bg];
      log.push({ day: prev.day, type: "background", label: BACKGROUND_STAGES[bg] });
    }

    log.push({ day: prev.day, type: "badge", area, category: catId, label: cat.badgeName });
    earned.push({
      categoryId: catId,
      title: cat.title,
      badgeName: cat.badgeName,
      itemId,
      itemLabel: ITEMS[itemId]?.label ?? "",
      area,
      backgroundLabel,
      earnedFurniture: matchedFurniture,
    });
  }

  return {
    categoryCounts: counts,
    points: prev.points + pointsForLevel(level),
    totalCompletions: prev.totalCompletions + 1,
    badges,
    equippedItems: equipped,
    backgroundStage: bg,
    growthLog: log,
    earned,
    earnedFurnitureItem: matchedFurniture,
  };
}

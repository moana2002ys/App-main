import { CATEGORY_BY_ID } from "./rewards";

// ─────────────────────────────────────────────────────────────
// 꾸미기(deco-lab 프로토타입 통합) 카탈로그 + 뱃지 기반 해금 매핑
//  - 색상은 항상 자유롭게 선택 가능
//  - 아이템/가구는 매핑된 보상 카테고리 뱃지를 획득해야 해금
// ─────────────────────────────────────────────────────────────

export type DecoCategory = 'headwear' | 'eyewear' | 'audio' | 'feet' | 'companion';

export interface DecoItem {
  id: string;
  category: DecoCategory;
  name: string;
  unlockCategoryId: string; // rewards.ts 카테고리 id (뱃지)
}

export const CHARACTER_COLORS = [
  { id: 'yellow', value: '#FBBF24', name: '따뜻한 노랑' },
  { id: 'blue', value: '#60A5FA', name: '차분한 파랑' },
  { id: 'green', value: '#34D399', name: '포근한 초록' },
  { id: 'pink', value: '#F472B6', name: '부드러운 분홍' },
  { id: 'purple', value: '#C084FC', name: '은은한 보라' },
  { id: 'orange', value: '#FB923C', name: '발랄한 주황' },
];

export const DECO_ITEMS: DecoItem[] = [
  { id: 'hat', category: 'headwear', name: '파란 모자', unlockCategoryId: 'rhythm-anchor' },
  { id: 'glasses', category: 'eyewear', name: '동그란 안경', unlockCategoryId: 'self-emotion' },
  { id: 'headphone', category: 'audio', name: '헤드폰', unlockCategoryId: 'self-hobby' },
  { id: 'plant', category: 'companion', name: '반려 화분', unlockCategoryId: 'self-space' },
  { id: 'shoes', category: 'feet', name: '빨간 운동화', unlockCategoryId: 'self-walk' },
];

export type FurnitureCategory = 'bed' | 'rug' | 'lighting' | 'storage' | 'plant' | 'decor' | 'seating' | 'window';

export interface FurnitureItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  size: { w: number; h: number };
  rotatable: boolean;
  type?: 'floor' | 'wall';
  unlockCategoryId: string;
}

export const FURNITURE_CATALOG: FurnitureItem[] = [
  { id: 'bed_1', name: '포근한 침대', category: 'bed', size: { w: 3, h: 4 }, rotatable: true, type: 'floor', unlockCategoryId: 'rhythm-anchor' },
  { id: 'table_1', name: '낮은 테이블', category: 'bed', size: { w: 2, h: 2 }, rotatable: true, type: 'floor', unlockCategoryId: 'rhythm-meal' },
  { id: 'lamp_1', name: '스탠드 조명', category: 'lighting', size: { w: 1, h: 1 }, rotatable: false, type: 'floor', unlockCategoryId: 'rhythm-light' },
  { id: 'window_1', name: '햇살 창문', category: 'window', size: { w: 3, h: 1 }, rotatable: false, type: 'wall', unlockCategoryId: 'rel-connect' },
  { id: 'rug_1', name: '둥근 러그', category: 'rug', size: { w: 4, h: 4 }, rotatable: false, type: 'floor', unlockCategoryId: 'self-move' },
  { id: 'cushion_1', name: '푹신한 쿠션', category: 'seating', size: { w: 1, h: 1 }, rotatable: true, type: 'floor', unlockCategoryId: 'self-emotion' },
  { id: 'bookshelf_1', name: '작은 책장', category: 'storage', size: { w: 2, h: 1 }, rotatable: true, type: 'floor', unlockCategoryId: 'self-hobby' },
  { id: 'plant_1', name: '큰 화분', category: 'plant', size: { w: 1, h: 1 }, rotatable: false, type: 'floor', unlockCategoryId: 'self-space' },
  { id: 'frame_1', name: '추억 액자', category: 'decor', size: { w: 1, h: 1 }, rotatable: false, type: 'wall', unlockCategoryId: 'rel-trust' },
];

// 잠금 안내: 어떤 활동을 하면 열리는지
const UNLOCK_HINTS: Record<string, string> = {
  'rhythm-anchor': '기상·취침 같은 하루 리듬 미션을 해보세요',
  'rhythm-light': '커튼을 열고 빛·환기 미션을 해보세요',
  'rhythm-meal': '끼니 챙기기 미션을 해보세요',
  'self-walk': '가벼운 산책·외출 미션을 해보세요',
  'self-move': '스트레칭·몸 움직이기 미션을 해보세요',
  'self-hygiene': '세수·양치 같은 몸단장 미션을 해보세요',
  'self-emotion': '기분 기록·심호흡 같은 마음 미션을 해보세요',
  'self-space': '공간 정리 미션을 해보세요',
  'self-hobby': '음악·책 같은 취향 미션을 해보세요',
  'rel-trust': '가족·친구에게 안부 전하는 미션을 해보세요',
  'rel-connect': '창밖 보기·메시지 같은 연결 미션을 해보세요',
  'social-explore': '나를 찾아가는 탐색 미션을 해보세요',
};

export function unlockInfo(unlockCategoryId: string): { badgeTitle: string; hint: string } {
  const cat = CATEGORY_BY_ID[unlockCategoryId];
  return {
    badgeTitle: cat?.title ?? '',
    hint: UNLOCK_HINTS[unlockCategoryId] ?? '미션을 완료해 배지를 모아보세요',
  };
}

export function isUnlocked(unlockCategoryId: string, badges: string[]): boolean {
  return badges.includes(unlockCategoryId);
}

export interface PlacedFurniture {
  id: string;
  furnitureId: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
}

// 캐릭터에 착용한 레이어드 아이템 (카테고리별 1개)
export type DecoEquipped = Partial<Record<DecoCategory, string | null>>;

export function equippedDecoIds(equipped: DecoEquipped | undefined): string[] {
  if (!equipped) return [];
  return Object.values(equipped).filter(Boolean) as string[];
}

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

export type FurnitureCategory = 'bed' | 'rug' | 'lighting' | 'storage' | 'plant' | 'decor' | 'seating' | 'window' | 'desk';
export type RoomZone = 'bedroom' | 'living' | 'desk' | 'window' | 'entrance' | 'wall';

export interface FurnitureItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  size: { w: number; h: number };
  rotatable: boolean;
  type?: 'floor' | 'wall';
  unlockCategoryId: string;
  defaultZone?: RoomZone;
  defaultPos?: { x: number; y: number };
  iconEmoji?: string;
  description?: string;
}

export const FURNITURE_CATALOG: FurnitureItem[] = [
  { id: 'bed_1', name: '포근한 침대', category: 'bed', size: { w: 3, h: 4 }, rotatable: true, type: 'floor', unlockCategoryId: 'rhythm-anchor', defaultZone: 'bedroom', defaultPos: { x: 1, y: 3 }, iconEmoji: '🛌', description: '하루의 기상과 수면 리듬을 지켜주는 침대' },
  { id: 'clock_1', name: '아날로그 알람시계', category: 'decor', size: { w: 1, h: 1 }, rotatable: false, type: 'floor', unlockCategoryId: 'rhythm-anchor', defaultZone: 'bedroom', defaultPos: { x: 1, y: 1 }, iconEmoji: '⏰', description: '매일 일정한 아침을 밝히는 시계' },
  { id: 'lamp_1', name: '햇살 무드등', category: 'lighting', size: { w: 1, h: 1 }, rotatable: false, type: 'floor', unlockCategoryId: 'rhythm-light', defaultZone: 'window', defaultPos: { x: 1, y: 2 }, iconEmoji: '💡', description: '창가에서 은은한 빛을 퍼뜨리는 조명' },
  { id: 'curtain_1', name: '햇살 커튼', category: 'window', size: { w: 3, h: 1 }, rotatable: false, type: 'wall', unlockCategoryId: 'rhythm-light', defaultZone: 'window', defaultPos: { x: 0, y: 2 }, iconEmoji: '🪟', description: '아침 햇볕을 방 안으로 들여오는 커튼' },
  { id: 'table_1', name: '낮은 찻상', category: 'seating', size: { w: 2, h: 2 }, rotatable: true, type: 'floor', unlockCategoryId: 'rhythm-meal', defaultZone: 'living', defaultPos: { x: 4, y: 4 }, iconEmoji: '🍵', description: '정갈하게 끼니를 챙겨먹는 찻상' },
  { id: 'mug_1', name: '따뜻한 머그컵', category: 'decor', size: { w: 1, h: 1 }, rotatable: false, type: 'floor', unlockCategoryId: 'rhythm-meal', defaultZone: 'living', defaultPos: { x: 5, y: 4 }, iconEmoji: '🥛', description: '물 한 컵의 온기를 전하는 컵' },
  { id: 'shoes_1', name: '빨간 운동화', category: 'decor', size: { w: 1, h: 1 }, rotatable: false, type: 'floor', unlockCategoryId: 'self-walk', defaultZone: 'entrance', defaultPos: { x: 1, y: 5 }, iconEmoji: '👟', description: '집 밖으로 발걸음을 이끄는 운동화' },
  { id: 'rug_1', name: '둥근 요가 러그', category: 'rug', size: { w: 3, h: 3 }, rotatable: false, type: 'floor', unlockCategoryId: 'self-move', defaultZone: 'living', defaultPos: { x: 3, y: 2 }, iconEmoji: '🧘', description: '가볍게 몸을 스트레칭하는 러그' },
  { id: 'broom_1', name: '정돈 바구니', category: 'storage', size: { w: 1, h: 1 }, rotatable: false, type: 'floor', unlockCategoryId: 'self-space', defaultZone: 'desk', defaultPos: { x: 6, y: 6 }, iconEmoji: '🧺', description: '한 뼘씩 깔끔하게 정돈하는 수납함' },
  { id: 'bookshelf_1', name: '작은 원목 책장', category: 'storage', size: { w: 2, h: 1 }, rotatable: true, type: 'floor', unlockCategoryId: 'self-hobby', defaultZone: 'desk', defaultPos: { x: 4, y: 6 }, iconEmoji: '📚', description: '좋아하는 글과 책이 꽂힌 책장' },
  { id: 'speaker_1', name: '미니 블루투스 스피커', category: 'decor', size: { w: 1, h: 1 }, rotatable: false, type: 'floor', unlockCategoryId: 'self-hobby', defaultZone: 'desk', defaultPos: { x: 5, y: 6 }, iconEmoji: '🎧', description: '취향의 음악이 흐르는 스피커' },
  { id: 'cushion_1', name: '푹신한 마음 쿠션', category: 'seating', size: { w: 1, h: 1 }, rotatable: true, type: 'floor', unlockCategoryId: 'self-emotion', defaultZone: 'living', defaultPos: { x: 3, y: 3 }, iconEmoji: '🛋️', description: '오늘 하루 마음을 기댈 수 있는 쿠션' },
  { id: 'plant_1', name: '반려 식물 화분', category: 'plant', size: { w: 1, h: 1 }, rotatable: false, type: 'floor', unlockCategoryId: 'self-space', defaultZone: 'window', defaultPos: { x: 6, y: 1 }, iconEmoji: '🪴', description: '돌봄의 온기와 함께 자라는 식물' },
  { id: 'frame_1', name: '추억 사진 액자', category: 'decor', size: { w: 1, h: 1 }, rotatable: false, type: 'wall', unlockCategoryId: 'rel-trust', defaultZone: 'wall', defaultPos: { x: 3, y: 0 }, iconEmoji: '🖼️', description: '소중한 사람과의 기억을 담은 액자' },
  { id: 'window_1', name: '창밖 뷰 풍경 창문', category: 'window', size: { w: 3, h: 1 }, rotatable: false, type: 'wall', unlockCategoryId: 'rel-connect', defaultZone: 'window', defaultPos: { x: 2, y: 0 }, iconEmoji: '🌆', description: '세상과 조용히 이어지는 커넥트 창문' },
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

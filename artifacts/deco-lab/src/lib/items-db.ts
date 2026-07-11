import { AvatarItem, FurnitureItem } from './decor-schema';

export const CHARACTER_COLORS = [
  { id: 'yellow', value: '#FBBF24', name: '따뜻한 노랑' },
  { id: 'blue', value: '#60A5FA', name: '차분한 파랑' },
  { id: 'green', value: '#34D399', name: '포근한 초록' },
  { id: 'pink', value: '#F472B6', name: '부드러운 분홍' },
  { id: 'purple', value: '#C084FC', name: '은은한 보라' },
  { id: 'orange', value: '#FB923C', name: '발랄한 주황' },
];

export const CHARACTER_ITEMS: AvatarItem[] = [
  { id: 'headphone', category: 'audio', name: '헤드폰', renderLayer: 10 },
  { id: 'plant', category: 'companion', name: '반려 화분', renderLayer: 5 },
  { id: 'shoes', category: 'feet', name: '빨간 운동화', renderLayer: 1 },
  { id: 'hat', category: 'headwear', name: '파란 모자', renderLayer: 15 },
  { id: 'glasses', category: 'eyewear', name: '동그란 안경', renderLayer: 12 },
];

export const FURNITURE_CATALOG: FurnitureItem[] = [
  { id: 'bed_1', name: '포근한 침대', category: 'bed', size: { w: 3, h: 4 }, rotatable: true, type: 'floor' },
  { id: 'rug_1', name: '둥근 러그', category: 'rug', size: { w: 4, h: 4 }, rotatable: false, type: 'floor' },
  { id: 'lamp_1', name: '스탠드 조명', category: 'lighting', size: { w: 1, h: 1 }, rotatable: false, type: 'floor' },
  { id: 'bookshelf_1', name: '작은 책장', category: 'storage', size: { w: 2, h: 1 }, rotatable: true, type: 'floor' },
  { id: 'plant_1', name: '큰 화분', category: 'plant', size: { w: 1, h: 1 }, rotatable: false, type: 'floor' },
  { id: 'cushion_1', name: '푹신한 쿠션', category: 'seating', size: { w: 1, h: 1 }, rotatable: true, type: 'floor' },
  { id: 'window_1', name: '햇살 창문', category: 'window', size: { w: 3, h: 1 }, rotatable: false, type: 'wall' },
  { id: 'frame_1', name: '추억 액자', category: 'decor', size: { w: 1, h: 1 }, rotatable: false, type: 'wall' },
  { id: 'table_1', name: '낮은 테이블', category: 'bed', size: { w: 2, h: 2 }, rotatable: true, type: 'floor' },
];

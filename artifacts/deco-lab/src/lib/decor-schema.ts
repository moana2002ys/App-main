export type ItemCategory = 'color' | 'headwear' | 'eyewear' | 'audio' | 'feet' | 'companion' | 'accessory';

export interface AvatarItem {
  id: string;
  category: ItemCategory;
  name: string;
  renderLayer: number;
}

export interface CharacterConfig {
  color: string;
  equippedItems: Partial<Record<ItemCategory, string | null>>;
}

export function exportToJogakFormat(config: CharacterConfig): { characterColor: string; items: string[] } {
  return {
    characterColor: config.color,
    items: Object.values(config.equippedItems).filter(Boolean) as string[]
  };
}

export type FurnitureCategory = 'bed' | 'rug' | 'lighting' | 'storage' | 'plant' | 'decor' | 'seating' | 'window';

export interface FurnitureItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  size: { w: number; h: number };
  rotatable: boolean;
  type?: 'floor' | 'wall';
}

export interface PlacedFurniture {
  id: string;
  furnitureId: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
}

export interface RoomLayout {
  placements: PlacedFurniture[];
}

export interface AppState {
  unlocked: boolean;
  character: CharacterConfig;
  room: RoomLayout;
}

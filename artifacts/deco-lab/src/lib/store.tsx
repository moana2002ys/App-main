import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, CharacterConfig, RoomLayout, PlacedFurniture, ItemCategory } from './decor-schema';

const defaultState: AppState = {
  unlocked: false,
  character: {
    color: '#FBBF24', // Default 따뜻한 노랑
    equippedItems: {}
  },
  room: {
    placements: []
  }
};

interface StoreContextType {
  state: AppState;
  unlockFeatures: () => void;
  updateCharacterColor: (color: string) => void;
  toggleCharacterItem: (category: ItemCategory, itemId: string) => void;
  placeFurniture: (furniture: PlacedFurniture) => void;
  updateFurniture: (id: string, updates: Partial<PlacedFurniture>) => void;
  removeFurniture: (id: string) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('deco_lab_state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load state", e);
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('deco_lab_state', JSON.stringify(state));
  }, [state]);

  const unlockFeatures = () => setState(s => ({ ...s, unlocked: true }));
  
  const updateCharacterColor = (color: string) => setState(s => ({
    ...s,
    character: { ...s.character, color }
  }));

  const toggleCharacterItem = (category: ItemCategory, itemId: string) => setState(s => {
    const isEquipped = s.character.equippedItems[category] === itemId;
    return {
      ...s,
      character: {
        ...s.character,
        equippedItems: {
          ...s.character.equippedItems,
          [category]: isEquipped ? null : itemId
        }
      }
    };
  });

  const placeFurniture = (furniture: PlacedFurniture) => setState(s => ({
    ...s,
    room: {
      ...s.room,
      placements: [...s.room.placements, furniture]
    }
  }));

  const updateFurniture = (id: string, updates: Partial<PlacedFurniture>) => setState(s => ({
    ...s,
    room: {
      ...s.room,
      placements: s.room.placements.map(p => p.id === id ? { ...p, ...updates } : p)
    }
  }));

  const removeFurniture = (id: string) => setState(s => ({
    ...s,
    room: {
      ...s.room,
      placements: s.room.placements.filter(p => p.id !== id)
    }
  }));

  const resetAll = () => {
    setState(defaultState);
  };

  return (
    <StoreContext.Provider value={{
      state,
      unlockFeatures,
      updateCharacterColor,
      toggleCharacterItem,
      placeFurniture,
      updateFurniture,
      removeFurniture,
      resetAll
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

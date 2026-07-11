import { useState } from "react";
import { useStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { CHARACTER_COLORS, CHARACTER_ITEMS } from "@/lib/items-db";
import { ItemCategory, exportToJogakFormat } from "@/lib/decor-schema";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Palette, Crown, Glasses, Headphones, Sprout, Footprints, Ban, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const TAB_CONFIG: { id: ItemCategory | 'color', label: string, icon: React.ElementType }[] = [
  { id: 'color', label: '색상', icon: Palette },
  { id: 'headwear', label: '모자', icon: Crown },
  { id: 'eyewear', label: '안경', icon: Glasses },
  { id: 'audio', label: '오디오', icon: Headphones },
  { id: 'companion', label: '친구', icon: Sprout },
  { id: 'feet', label: '신발', icon: Footprints },
];

export default function CharacterCustomization() {
  const { state, updateCharacterColor, toggleCharacterItem } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ItemCategory | 'color'>('color');

  if (!state.unlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Lock className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">아직 잠겨있어요</h2>
        <p className="text-muted-foreground mb-6 text-sm">미션을 완료하면 조각이를 꾸밀 수 있어요.</p>
        <button onClick={() => setLocation('/')} className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const { items } = exportToJogakFormat(state.character);

  const handleComplete = () => {
    toast({
      title: "저장 완료!",
      description: "조각이의 모습이 멋지게 변경되었어요.",
    });
    // In a real app we might navigate away or just stay
  };

  const renderGridContent = () => {
    if (activeTab === 'color') {
      return (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-6">
          {CHARACTER_COLORS.map(c => {
            const isSelected = state.character.color === c.value;
            return (
              <motion.button
                whileTap={{ scale: 0.92 }}
                key={c.id}
                onClick={() => updateCharacterColor(c.value)}
                className={`relative aspect-square rounded-[2rem] transition-all group ${
                  isSelected ? 'shadow-md scale-105 z-10' : 'shadow-sm hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
              >
                {/* Thick ring for selection */}
                {isSelected && (
                  <>
                    <div className="absolute inset-0 rounded-[2rem] border-4 border-primary pointer-events-none scale-110"></div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-sm z-20">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  </>
                )}
              </motion.button>
            )
          })}
        </div>
      );
    }

    const categoryItems = CHARACTER_ITEMS.filter(i => i.category === activeTab);

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-6">
        {/* Unequip Option */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const currentItem = state.character.equippedItems[activeTab];
            if (currentItem) {
              toggleCharacterItem(activeTab, currentItem);
            }
          }}
          className={`relative aspect-square rounded-3xl bg-gray-50 border-2 flex flex-col items-center justify-center p-2 transition-all ${
            !state.character.equippedItems[activeTab] 
              ? 'border-primary shadow-md bg-orange-50/50' 
              : 'border-transparent shadow-sm hover:border-gray-200'
          }`}
        >
          <Ban className="w-8 h-8 text-gray-300 mb-1" />
          <span className="text-[10px] font-medium text-gray-500">없음/해제</span>
          
          {!state.character.equippedItems[activeTab] && (
            <>
              <div className="absolute inset-0 rounded-3xl border-4 border-primary pointer-events-none"></div>
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-[3px] border-white shadow-sm z-20">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            </>
          )}
        </motion.button>

        {/* Item Options */}
        {categoryItems.map(item => {
          const isEquipped = state.character.equippedItems[item.category] === item.id;
          return (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={item.id}
              onClick={() => toggleCharacterItem(item.category, item.id)}
              className={`relative aspect-square rounded-3xl bg-white flex flex-col items-center justify-center p-2 transition-all group ${
                isEquipped ? 'shadow-md z-10' : 'shadow-sm border border-gray-100 hover:shadow-md'
              }`}
            >
              {/* Using a placeholder visual for items since we don't have individual image assets */}
              <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center ${isEquipped ? 'bg-orange-100 text-primary' : 'bg-gray-50 text-gray-400'}`}>
                {(() => {
                  const Icon = TAB_CONFIG.find(t => t.id === activeTab)?.icon || Crown;
                  return <Icon className="w-6 h-6" />;
                })()}
              </div>
              <span className="text-[11px] font-bold text-foreground/80 leading-tight">{item.name}</span>
              
              {isEquipped && (
                <>
                  <div className="absolute inset-0 rounded-3xl border-4 border-primary pointer-events-none"></div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-[3px] border-white shadow-sm z-20">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                </>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden bg-background font-sans pb-safe">
      
      {/* LEFT PANE - Character Preview */}
      <div className="h-[40dvh] md:h-full md:w-[45%] lg:w-1/2 relative bg-[#FFFDF8] blob-pattern flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-orange-100 z-10 shrink-0">
        <button 
          onClick={() => setLocation('/')}
          className="absolute top-6 left-6 z-20 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm border border-orange-50 hover:bg-white text-foreground transition-colors"
        >
          <Home className="w-5 h-5" />
        </button>
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-5 py-2 rounded-full shadow-sm border border-white">
          <h1 className="text-base font-bold text-foreground">내 조각 꾸미기</h1>
        </div>
        
        {/* The Character Blob */}
        <div className="relative">
          <Character size="xl" color={state.character.color} items={items} />
        </div>
      </div>

      {/* RIGHT PANE - Controls */}
      <div className="flex-1 flex flex-col h-[60dvh] md:h-full bg-[#f8f9fa] relative z-20 overflow-hidden">
        
        {/* Connected Pill Tab Strip */}
        <div className="flex items-center justify-center pt-8 pb-4 relative z-30 shrink-0">
          <div className="bg-white/80 backdrop-blur-md rounded-full p-2 flex items-center justify-center gap-2 shadow-sm border border-gray-100/80 mx-4">
            {TAB_CONFIG.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <div key={tab.id} className="relative">
                  <AnimatePresence>
                    {isActive && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-white text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-md pointer-events-none"
                      >
                        {tab.label}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'w-14 h-14 bg-white rounded-full shadow-md text-primary scale-110 z-10 border-2 border-primary/10' 
                        : 'w-11 h-11 rounded-full text-foreground/40 hover:bg-gray-100 hover:text-foreground/80'
                    }`}
                  >
                    <Icon className={isActive ? "w-6 h-6" : "w-5 h-5"} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="pb-24"
            >
              {renderGridContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Confirm Button */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pt-6 pb-[calc(88px+env(safe-area-inset-bottom))] bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa] to-transparent shrink-0">
          <button 
            onClick={handleComplete}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-lg py-4 rounded-3xl shadow-[0_8px_20px_rgba(251,146,60,0.25)] transition-all active:scale-[0.98] active:shadow-md"
          >
            결정
          </button>
        </div>
        
      </div>
    </div>
  );
}

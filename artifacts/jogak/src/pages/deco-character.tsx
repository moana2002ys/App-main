import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { CHARACTER_COLORS, DECO_ITEMS, DecoCategory, isUnlocked, unlockInfo } from "@/lib/decor";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Palette, Crown, Glasses, Headphones, Sprout, Footprints, Ban, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const TAB_CONFIG: { id: DecoCategory | 'color'; label: string; icon: React.ElementType }[] = [
  { id: 'color', label: '색상', icon: Palette },
  { id: 'headwear', label: '모자', icon: Crown },
  { id: 'eyewear', label: '안경', icon: Glasses },
  { id: 'audio', label: '오디오', icon: Headphones },
  { id: 'companion', label: '친구', icon: Sprout },
  { id: 'feet', label: '신발', icon: Footprints },
];

export function DecoCharacter() {
  const { user, updateUser, setView } = useAppStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<DecoCategory | 'color'>('color');

  const toggleItem = (category: DecoCategory, itemId: string) => {
    const current = user.decoEquipped[category];
    updateUser({
      decoEquipped: { ...user.decoEquipped, [category]: current === itemId ? null : itemId },
    });
  };

  const renderGrid = () => {
    if (activeTab === 'color') {
      return (
        <div className="grid grid-cols-3 gap-3 px-6 pb-6">
          {CHARACTER_COLORS.map((c) => {
            const isSelected = user.characterColor === c.value;
            return (
              <motion.button
                whileTap={{ scale: 0.92 }}
                key={c.id}
                onClick={() => updateUser({ characterColor: c.value })}
                className={`relative aspect-square rounded-3xl transition-all ${
                  isSelected ? 'shadow-md scale-105 z-10 ring-4 ring-primary/60' : 'shadow-sm hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
                aria-label={c.name}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-[3px] border-white shadow-sm z-20">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      );
    }

    const categoryItems = DECO_ITEMS.filter((i) => i.category === activeTab);
    const equippedInTab = user.decoEquipped[activeTab];

    return (
      <div className="grid grid-cols-3 gap-3 px-6 pb-6">
        {/* 해제 옵션 */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (equippedInTab) toggleItem(activeTab, equippedInTab);
          }}
          className={`relative aspect-square rounded-3xl bg-white/70 border-2 flex flex-col items-center justify-center p-2 transition-all ${
            !equippedInTab ? 'border-primary shadow-md' : 'border-transparent shadow-sm'
          }`}
        >
          <Ban className="w-7 h-7 text-gray-300 mb-1" />
          <span className="text-[10px] font-medium text-gray-500">없음</span>
          {!equippedInTab && (
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-[3px] border-white shadow-sm z-20">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          )}
        </motion.button>

        {categoryItems.map((item) => {
          const unlocked = isUnlocked(item.unlockCategoryId, user.badges);
          const isEquipped = equippedInTab === item.id;
          const Icon = TAB_CONFIG.find((t) => t.id === activeTab)?.icon || Crown;
          const info = unlockInfo(item.unlockCategoryId);

          return (
            <motion.button
              whileTap={unlocked ? { scale: 0.95 } : undefined}
              key={item.id}
              onClick={() => {
                if (!unlocked) {
                  toast({
                    title: `'${info.badgeTitle}' 배지가 필요해요`,
                    description: info.hint,
                  });
                  return;
                }
                toggleItem(item.category, item.id);
              }}
              className={`relative aspect-square rounded-3xl flex flex-col items-center justify-center p-2 transition-all ${
                unlocked
                  ? isEquipped
                    ? 'bg-white shadow-md border-2 border-primary z-10'
                    : 'bg-white shadow-sm border border-gray-100'
                  : 'bg-secondary/40 border border-transparent opacity-80'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full mb-1 flex items-center justify-center ${
                  unlocked ? (isEquipped ? 'bg-orange-100 text-primary' : 'bg-gray-50 text-gray-400') : 'bg-gray-100 text-gray-300'
                }`}
              >
                {unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] font-bold leading-tight ${unlocked ? 'text-foreground/80' : 'text-muted-foreground/60'}`}>
                {item.name}
              </span>
              {!unlocked && (
                <span className="text-[8.5px] text-muted-foreground/60 leading-tight mt-0.5 px-1">
                  {info.badgeTitle} 배지로 열려요
                </span>
              )}
              {isEquipped && (
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-[3px] border-white shadow-sm z-20">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#FFF8F0] to-[#FFEDD5]">
      {/* 헤더 */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between shrink-0">
        <Button variant="ghost" className="rounded-full bg-white/60 backdrop-blur-sm gap-1.5" onClick={() => setView('growth')}>
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Button>
        <span className="text-sm font-bold text-foreground bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full">
          내 조각 꾸미기
        </span>
      </div>

      {/* 캐릭터 프리뷰 */}
      <div className="flex flex-col items-center pt-2 pb-3 shrink-0">
        <Character size="lg" showItems={false} />
        <p className="mt-1 text-xs text-muted-foreground">배지를 모으면 새 아이템이 열려요</p>
      </div>

      {/* 탭 */}
      <div className="px-6 pb-3 shrink-0">
        <div className="flex bg-white/50 backdrop-blur-sm rounded-full p-1 border border-white/60">
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 py-2 rounded-full transition-colors flex items-center justify-center"
                aria-label={tab.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="decoTab"
                    className="absolute inset-0 bg-white rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`relative z-10 w-4.5 h-4.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} size={18} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 그리드 */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.15 }}
          >
            {renderGrid()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

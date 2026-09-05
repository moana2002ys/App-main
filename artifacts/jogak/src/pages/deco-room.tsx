import { useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Furniture } from "@/components/Furniture";
import { FURNITURE_CATALOG, FurnitureItem, PlacedFurniture, isUnlocked, unlockInfo } from "@/lib/decor";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, RotateCw, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { MascotBadge } from "@/components/MascotBadge";

import { Mascot, MascotState } from "@/components/Mascot";

const GRID_SIZE = 10;
const CELL_SIZE = 32;

export function DecoRoom() {
  const { user, updateUser, setView } = useAppStore();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>('welcome');
  const roomRef = useRef<HTMLDivElement>(null);

  // 첫 진입 2초 후 welcome -> idle 로 전환
  useEffect(() => {
    const timer = setTimeout(() => {
      setMascotState('idle');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const placements = user.roomPlacements;
  const selected = placements.find((p) => p.id === selectedId) ?? null;

  const setPlacements = (next: PlacedFurniture[]) => updateUser({ roomPlacements: next });

  const handleAdd = (item: FurnitureItem) => {
    if (!isUnlocked(item.unlockCategoryId, user.badges)) {
      const info = unlockInfo(item.unlockCategoryId);
      toast({ title: `'${info.badgeTitle}' 배지가 필요해요`, description: info.hint });
      return;
    }

    const defaultX = item.defaultPos?.x ?? Math.floor(GRID_SIZE / 2) - Math.floor(item.size.w / 2);
    const defaultY = item.defaultPos?.y ?? Math.floor(GRID_SIZE / 2) - Math.floor(item.size.h / 2);

    const newItem: PlacedFurniture = {
      id: Math.random().toString(36).slice(2, 11),
      furnitureId: item.id,
      x: Math.max(0, Math.min(defaultX, GRID_SIZE - item.size.w)),
      y: Math.max(0, Math.min(defaultY, GRID_SIZE - item.size.h)),
      rotation: 0,
    };
    setPlacements([...placements, newItem]);
    setSelectedId(newItem.id);
    setShowCatalog(false);
    setMascotState('happy');
    setTimeout(() => setMascotState('idle'), 2000);
    toast({ title: `'${item.name}'을(를) 방에 배치했어요!`, description: '드래그해서 위치를 자유롭게 바꿀 수 있어요.' });
  };

  const handleRotate = (p: PlacedFurniture) => {
    const nextRot = ((p.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    setPlacements(placements.map((x) => (x.id === p.id ? { ...x, rotation: nextRot } : x)));
  };

  const handleRemove = (id: string) => {
    setPlacements(placements.filter((x) => x.id !== id));
    setSelectedId(null);
  };

  const handleDragEnd = (p: PlacedFurniture, info: { point: { x: number; y: number } }) => {
    if (!roomRef.current) return;
    const rect = roomRef.current.getBoundingClientRect();
    const dropX = info.point.x - rect.left;
    const dropY = info.point.y - rect.top;

    const meta = FURNITURE_CATALOG.find((f) => f.id === p.furnitureId);
    if (!meta) return;
    const w = p.rotation === 90 || p.rotation === 270 ? meta.size.h : meta.size.w;
    const h = p.rotation === 90 || p.rotation === 270 ? meta.size.w : meta.size.h;

    const newX = Math.max(0, Math.min(Math.round(dropX / CELL_SIZE), GRID_SIZE - w));
    const newY = Math.max(0, Math.min(Math.round(dropY / CELL_SIZE), GRID_SIZE - h));
    setPlacements(placements.map((x) => (x.id === p.id ? { ...x, x: newX, y: newY } : x)));
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#FFF8F0] to-[#FFEDD5] relative overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between shrink-0 z-20">
        <Button variant="ghost" className="rounded-full bg-white/60 backdrop-blur-sm gap-1.5" onClick={() => setView('growth')}>
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Button>
        <div className="flex items-center gap-2">
          <MascotBadge />
          <button
            onClick={() => setShowCatalog(true)}
            className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            aria-label="가구 추가"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-center text-base font-extrabold text-foreground shrink-0 z-10">🏡 나의 집 (My Studio Room)</p>

      {/* 방 */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        <div
          ref={roomRef}
          className="relative bg-white border-2 border-orange-100 rounded-lg shadow-sm"
          style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
          onClick={(e) => {
            if (e.target === e.currentTarget || (e.target as Element).classList.contains('back-wall')) {
              setSelectedId(null);
            }
          }}
        >
          {/* 뒷벽 */}
          <div className="absolute top-0 left-0 w-full h-[96px] bg-orange-50/50 border-b-2 border-orange-100 z-0 back-wall"></div>

          {/* 동행자 마스코트 디딤이 (My Home 내부 동주) */}
          <div className="absolute z-30 pointer-events-auto" style={{ left: 4 * CELL_SIZE, top: 4 * CELL_SIZE }}>
            <Mascot
              state={mascotState}
              size="sm"
              speechBubble={mascotState === 'welcome' ? "어서와요! 방에 온 걸 환영해요 🌙" : undefined}
            />
          </div>

          {placements.map((p) => {
            const meta = FURNITURE_CATALOG.find((f) => f.id === p.furnitureId);
            if (!meta) return null;
            const isSelected = selectedId === p.id;
            const w = p.rotation === 90 || p.rotation === 270 ? meta.size.h : meta.size.w;
            const h = p.rotation === 90 || p.rotation === 270 ? meta.size.w : meta.size.h;

            return (
              <motion.div
                key={p.id}
                drag={isSelected}
                dragMomentum={false}
                onDragEnd={(_, info) => handleDragEnd(p, info)}
                className={`absolute cursor-pointer ${isSelected ? 'z-40' : 'z-10'}`}
                style={{ width: w * CELL_SIZE, height: h * CELL_SIZE }}
                initial={false}
                animate={{ left: p.x * CELL_SIZE, top: p.y * CELL_SIZE }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setSelectedId(p.id);
                }}
              >
                <div className={`w-full h-full relative ${isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-sm bg-primary/10' : ''}`}>
                  <Furniture item={meta} rotation={p.rotation} />
                  {isSelected && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-2 bg-white rounded-full shadow-md p-1 border border-gray-100 z-50">
                      {meta.rotatable && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRotate(p); }}
                          className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:text-primary hover:bg-orange-50"
                          aria-label="회전"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemove(p.id); }}
                        className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100"
                        aria-label="제거"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* 캐릭터 */}
          <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
            <Character size="sm" showItems={false} />
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground px-8 pb-4 shrink-0">
        + 버튼으로 가구를 추가하고, 가구를 눌러 이동·회전·제거할 수 있어요
      </p>

      {/* 카탈로그 드로어 */}
      <AnimatePresence>
        {showCatalog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCatalog(false)}
              className="absolute inset-0 bg-black/20 z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 h-[60%] flex flex-col"
            >
              <div className="p-4 flex justify-between items-center border-b border-gray-100">
                <h3 className="font-bold text-foreground px-2">가구 보관함</h3>
                <button onClick={() => setShowCatalog(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500" aria-label="닫기">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 gap-3 pb-8">
                  {FURNITURE_CATALOG.map((item) => {
                    const unlocked = isUnlocked(item.unlockCategoryId, user.badges);
                    const info = unlockInfo(item.unlockCategoryId);
                    return (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        key={item.id}
                        onClick={() => handleAdd(item)}
                        className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 transition-colors relative overflow-hidden ${
                          unlocked
                            ? 'bg-gray-50 border-gray-100 hover:border-primary/50 hover:bg-orange-50/30'
                            : 'bg-secondary/40 border-transparent'
                        }`}
                      >
                        <div className={`w-10 h-10 mb-1 relative flex items-center justify-center ${unlocked ? '' : 'opacity-30 grayscale'}`}>
                          <Furniture item={item} />
                        </div>
                        {!unlocked && (
                          <Lock className="w-4 h-4 text-muted-foreground/70 absolute top-2 right-2" />
                        )}
                        <span className={`text-[10px] font-medium truncate w-full text-center ${unlocked ? 'text-gray-600' : 'text-muted-foreground/60'}`}>
                          {item.name}
                        </span>
                        {!unlocked && (
                          <span className="text-[8.5px] text-muted-foreground/60 leading-tight text-center px-1 mt-0.5">
                            {info.badgeTitle} 배지로 열려요
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

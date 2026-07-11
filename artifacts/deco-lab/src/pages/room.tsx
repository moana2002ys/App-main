import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Furniture } from "@/components/Furniture";
import { FURNITURE_CATALOG } from "@/lib/items-db";
import { PlacedFurniture, FurnitureItem, exportToJogakFormat } from "@/lib/decor-schema";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Plus, X, RotateCw } from "lucide-react";
import { useLocation } from "wouter";

const GRID_SIZE = 10;
const CELL_SIZE = 40; // visual size in pixels

export default function RoomCustomization() {
  const { state, placeFurniture, updateFurniture, removeFurniture } = useStore();
  const [, setLocation] = useLocation();
  const [selectedFurniture, setSelectedFurniture] = useState<PlacedFurniture | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const roomRef = useRef<HTMLDivElement>(null);

  if (!state.unlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Lock className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">아직 잠겨있어요</h2>
        <p className="text-muted-foreground mb-6 text-sm">미션을 완료하면 방을 꾸밀 수 있어요.</p>
        <button onClick={() => setLocation('/')} className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const { items } = exportToJogakFormat(state.character);

  const handleGridClick = (e: React.MouseEvent) => {
    if (!roomRef.current) return;
    if (e.target === roomRef.current || (e.target as Element).classList.contains('room-grid') || (e.target as Element).classList.contains('back-wall')) {
      setSelectedFurniture(null);
    }
  };

  const handleAddFurniture = (item: FurnitureItem) => {
    const newItem: PlacedFurniture = {
      id: Math.random().toString(36).substr(2, 9),
      furnitureId: item.id,
      x: Math.floor(GRID_SIZE / 2) - Math.floor(item.size.w / 2),
      y: Math.floor(GRID_SIZE / 2) - Math.floor(item.size.h / 2),
      rotation: 0
    };
    placeFurniture(newItem);
    setSelectedFurniture(newItem);
    setShowCatalog(false);
  };

  const handleRotate = (p: PlacedFurniture) => {
    const nextRot = ((p.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    updateFurniture(p.id, { rotation: nextRot });
    setSelectedFurniture({ ...p, rotation: nextRot });
  };

  const handleDragEnd = (p: PlacedFurniture, info: any) => {
    if (!roomRef.current) return;
    const rect = roomRef.current.getBoundingClientRect();
    
    // Calculate new position based on drop coordinates relative to grid
    const dropX = info.point.x - rect.left;
    const dropY = info.point.y - rect.top;
    
    let newGridX = Math.round(dropX / CELL_SIZE);
    let newGridY = Math.round(dropY / CELL_SIZE);

    const meta = FURNITURE_CATALOG.find(f => f.id === p.furnitureId);
    if (!meta) return;
    const w = (p.rotation === 90 || p.rotation === 270) ? meta.size.h : meta.size.w;
    const h = (p.rotation === 90 || p.rotation === 270) ? meta.size.w : meta.size.h;

    // Bounds checking
    newGridX = Math.max(0, Math.min(newGridX, GRID_SIZE - w));
    newGridY = Math.max(0, Math.min(newGridY, GRID_SIZE - h));

    updateFurniture(p.id, { x: newGridX, y: newGridY });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#FFFDF8] pt-8 pb-4 px-6 flex justify-between items-center shadow-sm z-20 relative">
        <h1 className="text-lg font-bold text-foreground">내 공간</h1>
        <button 
          onClick={() => setShowCatalog(true)}
          className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Room Area */}
      <div className="flex-1 relative bg-white overflow-hidden flex items-center justify-center p-4">
        
        <div 
          ref={roomRef}
          className="relative room-grid border-2 border-orange-100 rounded-lg shadow-sm"
          style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
          onClick={handleGridClick}
        >
          
          {/* Back Wall representation */}
          <div className="absolute top-0 left-0 w-full h-[120px] bg-orange-50/50 border-b-2 border-orange-100 z-0 back-wall pointer-events-auto"></div>

          {/* Render Furniture */}
          {state.room.placements.map(p => {
            const meta = FURNITURE_CATALOG.find(f => f.id === p.furnitureId);
            if (!meta) return null;
            
            const isSelected = selectedFurniture?.id === p.id;
            
            // Swap w/h if rotated 90 or 270
            const w = (p.rotation === 90 || p.rotation === 270) ? meta.size.h : meta.size.w;
            const h = (p.rotation === 90 || p.rotation === 270) ? meta.size.w : meta.size.h;

            return (
              <motion.div
                key={p.id}
                drag={isSelected}
                dragMomentum={false}
                onDragEnd={(_, info) => handleDragEnd(p, info)}
                className={`absolute cursor-pointer transition-shadow ${isSelected ? 'z-40' : 'z-10'}`}
                style={{
                  width: w * CELL_SIZE,
                  height: h * CELL_SIZE,
                }}
                initial={false}
                animate={{
                  left: p.x * CELL_SIZE,
                  top: p.y * CELL_SIZE,
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setSelectedFurniture(p);
                }}
              >
                <div className={`w-full h-full relative ${isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-sm bg-primary/10' : ''}`}>
                  <Furniture item={meta} rotation={p.rotation} />
                  
                  {/* Controls for selected item */}
                  {isSelected && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-2 bg-white rounded-full shadow-md p-1 border border-gray-100 z-50">
                      {meta.rotatable && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRotate(p); }}
                          className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:text-primary hover:bg-orange-50"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFurniture(p.id); setSelectedFurniture(null); }}
                        className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Character placed in the center roughly */}
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
            <Character size="lg" color={state.character.color} items={items} />
          </div>

        </div>
        
        {/* Simple instructions */}
        <p className="absolute bottom-6 text-center w-full text-xs text-muted-foreground px-8 pointer-events-none">
          우측 상단 + 버튼을 눌러 가구를 추가하세요.<br/>가구를 터치한 뒤 드래그하여 이동할 수 있습니다.
        </p>
      </div>

      {/* Catalog Drawer */}
      <AnimatePresence>
        {showCatalog && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 h-[60vh] flex flex-col"
          >
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <h3 className="font-bold text-foreground px-2">가구 보관함</h3>
              <button onClick={() => setShowCatalog(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-4 pb-20">
                {FURNITURE_CATALOG.map(item => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={item.id}
                    onClick={() => handleAddFurniture(item)}
                    className="aspect-square bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center p-2 hover:border-primary/50 hover:bg-orange-50/30 transition-colors relative overflow-hidden"
                  >
                    <div className="w-12 h-12 mb-2 relative flex items-center justify-center">
                      <Furniture item={item} />
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center px-1">{item.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Backdrop for drawer */}
      <AnimatePresence>
        {showCatalog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCatalog(false)}
            className="absolute inset-0 bg-black/20 z-40"
          />
        )}
      </AnimatePresence>

    </div>
  );
}

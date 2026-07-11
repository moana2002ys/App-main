import { useAppStore } from "@/lib/store";
import { Character } from "@/components/Character";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Growth() {
  const { user, setView, nextDay } = useAppStore();

  const getBackgroundClass = () => {
    if (user.totalCompletions >= 10) return "bg-gradient-to-b from-[#E0F2FE] to-[#F0FDF4]"; // Town
    if (user.totalCompletions >= 5) return "bg-gradient-to-b from-[#FFFBEB] to-[#FEF3C7]"; // Outside room
    return "bg-gradient-to-b from-[#FFF8F0] to-[#FFEDD5]"; // Inside room
  };

  return (
    <div className={`flex flex-col h-full ${getBackgroundClass()} transition-colors duration-1000`}>
      <div className="p-6 pb-2">
        <Button variant="ghost" className="rounded-full bg-white/50 backdrop-blur-sm" onClick={() => setView('home')}>
          돌아가기
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 my-8"
        >
          <Character size="lg" />
        </motion.div>

        <div className="w-full max-w-sm bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white/50 space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center divide-x divide-border/50">
            <div>
              <p className="text-xs text-muted-foreground mb-1">포인트</p>
              <p className="text-lg font-bold text-primary">{user.points}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">완료한 조각</p>
              <p className="text-lg font-bold text-foreground">{user.totalCompletions}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">연속 출석</p>
              <p className="text-lg font-bold text-foreground">{user.streakDays}일</p>
            </div>
          </div>

          <div className="pt-4 border-t border-border/50">
            <Button size="lg" className="w-full rounded-2xl h-14 bg-foreground text-background hover:bg-foreground/90 shadow-lg" onClick={nextDay}>
              다음 날로 → (데모)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

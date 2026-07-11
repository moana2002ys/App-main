import { useState } from "react";
import { Link } from "wouter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Gift, Paintbrush, Sparkles } from "lucide-react";
import { Character } from "@/components/Character";
import { motion, AnimatePresence } from "framer-motion";
import { exportToJogakFormat } from "@/lib/decor-schema";

export default function Home() {
  const { state, unlockFeatures, resetAll } = useStore();
  const [showConfetti, setShowConfetti] = useState(false);

  const handleMissionComplete = () => {
    setShowConfetti(true);
    setTimeout(() => {
      unlockFeatures();
      setShowConfetti(false);
    }, 2000);
  };

  const { items } = exportToJogakFormat(state.character);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6 relative overflow-hidden">
      
      {/* Confetti Overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="absolute top-1/4">
              <Sparkles className="w-24 h-24 text-accent animate-spin" />
            </div>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0 
                }}
                animate={{ 
                  x: (Math.random() - 0.5) * 400, 
                  y: (Math.random() - 0.5) * 400 + 200,
                  scale: Math.random() * 1 + 0.5,
                  rotate: Math.random() * 360
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute w-4 h-4 rounded-full"
                style={{
                  backgroundColor: ['#FBBF24', '#60A5FA', '#34D399', '#F472B6'][Math.floor(Math.random() * 4)]
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md mt-8 flex-1 flex flex-col items-center">
        
        <div className="mb-12 relative">
          <Character size="xl" color={state.character.color} items={items} />
        </div>

        <div className="w-full space-y-6">
          {!state.unlocked ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-orange-100 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
                <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex items-center gap-2">
                  <span className="text-orange-500 font-bold text-sm">오늘의 미션</span>
                </div>
                <CardContent className="p-6 flex flex-col items-center text-center gap-6">
                  <h3 className="text-xl font-bold text-foreground">물 한 잔 마시기</h3>
                  <p className="text-muted-foreground text-sm">
                    작은 실천이 모여 큰 변화를 만듭니다.<br />
                    미션을 완료하고 선물을 받아보세요!
                  </p>
                  
                  <Button 
                    size="lg" 
                    className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                    onClick={handleMissionComplete}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    미션 완료했어요
                  </Button>
                </CardContent>
              </Card>

              <div className="mt-8 flex flex-col items-center gap-3 opacity-50">
                <div className="flex gap-4 w-full">
                  <Card className="flex-1 bg-gray-50 border-gray-100">
                    <CardContent className="p-4 flex flex-col items-center gap-2 text-gray-400">
                      <Gift className="w-6 h-6" />
                      <span className="text-xs font-medium">내 조각 꾸미기</span>
                    </CardContent>
                  </Card>
                  <Card className="flex-1 bg-gray-50 border-gray-100">
                    <CardContent className="p-4 flex flex-col items-center gap-2 text-gray-400">
                      <Paintbrush className="w-6 h-6" />
                      <span className="text-xs font-medium">내 공간 꾸미기</span>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-xs text-gray-400">미션을 완료하면 꾸미기가 잠금 해제됩니다</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">참 잘했어요!</h2>
                <p className="text-muted-foreground text-sm">꾸미기 기능이 열렸어요. 조각이를 예쁘게 단장해주세요.</p>
              </div>

              <Link href="/character">
                <Card className="border-orange-100 bg-white hover:bg-orange-50/50 transition-colors cursor-pointer group shadow-sm hover:shadow-md">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                        <Gift className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">내 조각 꾸미기</h3>
                        <p className="text-xs text-muted-foreground mt-1">색상과 아이템을 골라보세요</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/room">
                <Card className="border-green-100 bg-white hover:bg-green-50/50 transition-colors cursor-pointer group shadow-sm hover:shadow-md">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                        <Paintbrush className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">내 공간 꾸미기</h3>
                        <p className="text-xs text-muted-foreground mt-1">가구를 배치하고 방을 꾸며보세요</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )}
        </div>

        <div className="mt-auto pt-8">
          <Button variant="ghost" size="sm" onClick={resetAll} className="text-muted-foreground hover:text-destructive text-xs">
            데이터 초기화
          </Button>
        </div>
      </div>
    </div>
  );
}

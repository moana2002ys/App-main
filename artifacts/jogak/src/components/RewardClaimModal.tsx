import React from "react";
import { FurnitureItem } from "@/lib/decor";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, Home, ArrowRight } from "lucide-react";
import { Mascot } from "@/components/Mascot";

interface RewardClaimModalProps {
  item: FurnitureItem;
  challengeTitle?: string;
  onPlaceNow: () => void;
  onClose: () => void;
}

export function RewardClaimModal({
  item,
  challengeTitle = "오늘의 행동 시도",
  onPlaceNow,
  onClose,
}: RewardClaimModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl border border-orange-100 text-center space-y-4 relative overflow-hidden"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>새로운 보상 아이템 획득!</span>
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-1">🎉 챌린지 완수!</h3>
          <p className="text-xs text-gray-500">'{challengeTitle}'을(를) 해냈어요</p>
        </div>

        {/* 마스코트 디딤이 축하 인터랙션 */}
        <div className="flex justify-center my-1">
          <Mascot state="celebrate" size="md" speechBubble="새 보상이 생겼어요!" />
        </div>

        <div className="bg-[#FFFDF9] border border-[#E7DDCE] rounded-2xl p-4 my-2 flex flex-col items-center">
          <div className="text-4xl mb-1.5 animate-bounce">
            {item.iconEmoji || "🪵"}
          </div>
          <h4 className="text-base font-bold text-gray-800">{item.name}</h4>
          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
        </div>

        <div className="space-y-2 pt-1">
          <Button
            onClick={onPlaceNow}
            className="w-full rounded-2xl bg-[#E9A63C] hover:bg-[#D8952B] text-white font-bold py-3 flex items-center justify-center gap-2 shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>내 집에 바로 배치하기</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full rounded-2xl text-gray-500 text-xs py-2 hover:bg-gray-100"
          >
            나중에 보관함에서 배치하기
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

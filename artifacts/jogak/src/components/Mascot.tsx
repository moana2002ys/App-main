import React from "react";
import { motion } from "framer-motion";

export type MascotState = 'idle' | 'wave' | 'welcome' | 'happy' | 'jump' | 'sit' | 'rest' | 'sleep' | 'celebrate';
export type MascotSize = 'small' | 'medium' | 'large' | 'hero' | 'sm' | 'md' | 'lg' | 'xl';

export interface MascotProps {
  state?: MascotState;
  size?: MascotSize;
  className?: string;
  speechBubble?: string;
  onClick?: () => void;
}

const SIZE_MAP: Record<string, number> = {
  small: 48,
  sm: 48,
  medium: 80,
  md: 80,
  large: 120,
  lg: 120,
  hero: 180,
  xl: 180,
};

// Exact Palette Constants
const COLOR = {
  darkOutline: "#684735",
  medBrown: "#A97550",
  lightBrown: "#C49369",
  creamBelly: "#F4E2BD",
  lightCream: "#FFF2D5",
  orange: "#E98620",
  darkEye: "#5C3E2E",
  cheek: "#F4A261",
};

export function Mascot({
  state = 'idle',
  size = 'medium',
  className = '',
  speechBubble,
  onClick,
}: MascotProps) {
  const s = SIZE_MAP[size] || 80;
  const isNormalizedState = state === 'welcome' ? 'wave' : state;

  // Reduced motion query fallback
  const animationVariants = {
    idle: {
      y: [0, -3, 0],
      transition: { repeat: Infinity, duration: 2.4, ease: "easeInOut" as const },
    },
    wave: {
      y: [0, -2, 0],
      rotate: [0, -4, 4, 0],
      transition: { repeat: Infinity, duration: 1.6 },
    },
    happy: {
      scale: [1, 1.05, 1],
      y: [0, -5, 0],
      transition: { repeat: Infinity, duration: 1.1 },
    },
    jump: {
      y: [0, -14, 0],
      scaleY: [1, 0.9, 1.05, 1],
      transition: { repeat: Infinity, duration: 0.75 },
    },
    sit: {
      scaleY: [1, 0.98, 1],
      transition: { repeat: Infinity, duration: 2.8 },
    },
    rest: {
      y: [0, -2, 0],
      transition: { repeat: Infinity, duration: 3.2 },
    },
    sleep: {
      scaleY: [1, 0.96, 1],
      transition: { repeat: Infinity, duration: 3.5 },
    },
    celebrate: {
      y: [0, -10, 0],
      rotate: [-6, 6, -6],
      transition: { repeat: Infinity, duration: 0.85 },
    },
  };

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center cursor-pointer pixel-art ${className}`}
      onClick={onClick}
      style={{ width: s, height: s }}
    >
      {/* 말풍선 */}
      {speechBubble && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-10 px-3 py-1 bg-white text-xs font-bold text-[#5C3E2E] rounded-full border border-[#C49369] shadow-md whitespace-nowrap z-20 pointer-events-none"
        >
          {speechBubble}
          <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-[#C49369]" />
        </motion.div>
      )}

      {/* 마스코트 스프라이트 (SVG Rect-based Crisp Pixel Grid) */}
      <motion.div
        animate={animationVariants[isNormalizedState] || animationVariants.idle}
        className="w-full h-full relative"
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ shapeRendering: "crispEdges", imageRendering: "pixelated" }}
        >
          {/* 바닥 그림자 */}
          {isNormalizedState !== 'jump' && (
            <rect x="8" y="29" width="16" height="2" fill="#E5D9C5" opacity="0.6" />
          )}

          {/* 6. rest 상태일 때 나뭇가지 & 잎사귀 3개 */}
          {isNormalizedState === 'rest' && (
            <g>
              <rect x="2" y="27" width="28" height="3" fill="#684735" />
              <rect x="4" y="28" width="24" height="1" fill="#A97550" />
              {/* 잎사귀 3개 */}
              <rect x="1" y="25" width="3" height="2" fill="#7A9A60" />
              <rect x="28" y="25" width="3" height="2" fill="#7A9A60" />
              <rect x="29" y="24" width="2" height="1" fill="#A8C380" />
            </g>
          )}

          {/* 7. sleep 상태일 때 안고 있는 도토리 쿠션 */}
          {isNormalizedState === 'sleep' && (
            <g>
              <rect x="13" y="22" width="6" height="6" fill="#C49369" stroke={COLOR.darkOutline} strokeWidth="1" />
              <rect x="14" y="20" width="4" height="2" fill="#684735" />
            </g>
          )}

          {/* 마스코트 본체 아웃라인 (32x32 바운드 내 둥근 오발 체형) */}
          <rect x="8" y="7" width="16" height="20" fill={COLOR.darkOutline} rx="4" />
          <rect x="7" y="10" width="18" height="15" fill={COLOR.darkOutline} rx="3" />

          {/* 마스코트 머리 & 등 메인 브라운 (#A97550) */}
          <rect x="9" y="8" width="14" height="18" fill={COLOR.medBrown} rx="3" />
          <rect x="8" y="11" width="16" height="13" fill={COLOR.medBrown} />

          {/* 라이트 브라운 하이라이트 (#C49369) */}
          <rect x="10" y="9" width="12" height="3" fill={COLOR.lightBrown} />

          {/* 크림색 배 (Cream Belly #F4E2BD) */}
          {isNormalizedState === 'sit' || isNormalizedState === 'sleep' ? (
            <rect x="10" y="15" width="12" height="10" fill={COLOR.creamBelly} rx="2" />
          ) : (
            <rect x="10" y="14" width="12" height="11" fill={COLOR.creamBelly} rx="2" />
          )}
          <rect x="11" y="15" width="10" height="9" fill={COLOR.lightCream} />

          {/* 날개 (Wings: 상태별 변형) */}
          {isNormalizedState === 'wave' ? (
            <>
              {/* 인사하는 날개 (왼쪽 위로 들림) */}
              <rect x="3" y="10" width="5" height="7" fill={COLOR.medBrown} stroke={COLOR.darkOutline} strokeWidth="1" />
              <rect x="24" y="15" width="4" height="7" fill={COLOR.medBrown} stroke={COLOR.darkOutline} strokeWidth="1" />
            </>
          ) : isNormalizedState === 'happy' || isNormalizedState === 'celebrate' ? (
            <>
              {/* 두 날개 위로 만세 */}
              <rect x="3" y="11" width="5" height="7" fill={COLOR.medBrown} stroke={COLOR.darkOutline} strokeWidth="1" />
              <rect x="24" y="11" width="5" height="7" fill={COLOR.medBrown} stroke={COLOR.darkOutline} strokeWidth="1" />
            </>
          ) : (
            <>
              {/* 기본 휴식 날개 */}
              <rect x="5" y="15" width="4" height="8" fill={COLOR.medBrown} stroke={COLOR.darkOutline} strokeWidth="1" />
              <rect x="23" y="15" width="4" height="8" fill={COLOR.medBrown} stroke={COLOR.darkOutline} strokeWidth="1" />
            </>
          )}

          {/* 부리 (Orange Beak #E98620) */}
          {isNormalizedState === 'celebrate' ? (
            <g>
              <rect x="14" y="14" width="4" height="3" fill={COLOR.orange} stroke={COLOR.darkOutline} strokeWidth="1" />
              <rect x="15" y="16" width="2" height="1" fill="#FFF2D5" />
            </g>
          ) : (
            <rect x="14" y="14" width="4" height="2" fill={COLOR.orange} stroke={COLOR.darkOutline} strokeWidth="1" />
          )}

          {/* 볼터치 (#F4A261) */}
          <rect x="10" y="15" width="2" height="1.5" fill={COLOR.cheek} opacity="0.8" />
          <rect x="20" y="15" width="2" height="1.5" fill={COLOR.cheek} opacity="0.8" />

          {/* 눈 (Eyes: 상태별 표현) */}
          {isNormalizedState === 'sleep' ? (
            <g>
              {/* 감은 눈 & Zzz */}
              <rect x="11" y="13" width="3" height="1" fill={COLOR.darkEye} />
              <rect x="18" y="13" width="3" height="1" fill={COLOR.darkEye} />
              <text x="21" y="7" fill={COLOR.medBrown} fontSize="7" fontWeight="bold">zZ</text>
            </g>
          ) : isNormalizedState === 'happy' || isNormalizedState === 'celebrate' ? (
            <g>
              {/* 웃는 눈 (^.^) */}
              <rect x="11" y="12" width="3" height="1" fill={COLOR.darkEye} />
              <rect x="18" y="12" width="3" height="1" fill={COLOR.darkEye} />
              <rect x="12" y="11" width="1" height="1" fill={COLOR.darkEye} />
              <rect x="19" y="11" width="1" height="1" fill={COLOR.darkEye} />
            </g>
          ) : (
            <g>
              {/* 기본 픽셀 눈 (#5C3E2E) */}
              <rect x="11" y="12" width="2" height="2" fill={COLOR.darkEye} />
              <rect x="19" y="12" width="2" height="2" fill={COLOR.darkEye} />
              {/* 눈 하이라이트 */}
              <rect x="11" y="12" width="1" height="1" fill="#FFFFFF" />
              <rect x="19" y="12" width="1" height="1" fill="#FFFFFF" />
            </g>
          )}

          {/* 4. jump 파티클 (점프 시 아래 바닥 파티클) */}
          {isNormalizedState === 'jump' && (
            <g>
              <rect x="10" y="27" width="2" height="2" fill="#E98620" />
              <rect x="20" y="27" width="2" height="2" fill="#E98620" />
              <rect x="15" y="28" width="2" height="2" fill="#C49369" />
            </g>
          )}

          {/* 8. celebrate 색상 픽셀 폭죽 (Confetti) */}
          {isNormalizedState === 'celebrate' && (
            <g>
              <rect x="5" y="5" width="2" height="2" fill="#F4A261" />
              <rect x="25" y="4" width="2" height="2" fill="#7A9A60" />
              <rect x="4" y="18" width="2" height="2" fill="#E98620" />
              <rect x="26" y="18" width="2" height="2" fill="#60A5FA" />
            </g>
          )}

          {/* 발 (Tiny Orange Feet #E98620) */}
          {isNormalizedState === 'sit' || isNormalizedState === 'sleep' ? (
            <g>
              <rect x="12" y="26" width="2" height="1" fill={COLOR.orange} stroke={COLOR.darkOutline} strokeWidth="0.5" />
              <rect x="18" y="26" width="2" height="1" fill={COLOR.orange} stroke={COLOR.darkOutline} strokeWidth="0.5" />
            </g>
          ) : isNormalizedState === 'jump' ? (
            <g>
              <rect x="12" y="24" width="2" height="2" fill={COLOR.orange} stroke={COLOR.darkOutline} strokeWidth="0.5" />
              <rect x="18" y="24" width="2" height="2" fill={COLOR.orange} stroke={COLOR.darkOutline} strokeWidth="0.5" />
            </g>
          ) : (
            <g>
              <rect x="12" y="26" width="2" height="2" fill={COLOR.orange} stroke={COLOR.darkOutline} strokeWidth="0.5" />
              <rect x="18" y="26" width="2" height="2" fill={COLOR.orange} stroke={COLOR.darkOutline} strokeWidth="0.5" />
            </g>
          )}
        </svg>
      </motion.div>
    </div>
  );
}

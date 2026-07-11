import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";

export function Character({ className, size = "lg", showItems = true }: { className?: string, size?: "sm" | "lg", showItems?: boolean }) {
  const { user } = useAppStore();
  const color = user.characterColor || "#FBBF24";

  const isSmall = size === "sm";
  const s = isSmall ? 60 : 180;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: s, height: s }}>
      <motion.div
        animate={{
          y: [0, -8, 0],
          scaleY: [1, 0.96, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10"
      >
        <svg width={s} height={s} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Base Blob */}
          <path
            d="M50 90C75 90 90 75 90 50C90 25 75 10 50 10C25 10 10 25 10 50C10 75 25 90 50 90Z"
            fill={color}
            opacity="0.9"
          />
          {/* Eyes */}
          <circle cx="35" cy="45" r="4" fill="#4B3E2F" />
          <circle cx="65" cy="45" r="4" fill="#4B3E2F" />
          
          {/* Cheeks */}
          <ellipse cx="25" cy="52" rx="6" ry="3" fill="#FF8A8A" opacity="0.4" />
          <ellipse cx="75" cy="52" rx="6" ry="3" fill="#FF8A8A" opacity="0.4" />
          
          {/* Mouth */}
          <path d="M45 55 Q 50 60 55 55" stroke="#4B3E2F" strokeWidth="2" strokeLinecap="round" fill="none" />
          
          {showItems && user.items.map((item, idx) => {
            if (item === 'headphone') {
              return (
                <g key="headphone">
                  <path d="M20 50 C20 20 80 20 80 50" stroke="#8B5CF6" strokeWidth="6" strokeLinecap="round" fill="none" />
                  <rect x="15" y="40" width="10" height="20" rx="4" fill="#8B5CF6" />
                  <rect x="75" y="40" width="10" height="20" rx="4" fill="#8B5CF6" />
                </g>
              )
            }
            if (item === 'plant') {
              return (
                <g key="plant" transform="translate(60, 60)">
                  <path d="M10 20 Q 5 10 10 0 Q 15 10 10 20" fill="#4ADE80" />
                  <path d="M10 20 Q 15 15 20 5 Q 15 10 10 20" fill="#22C55E" />
                </g>
              )
            }
            if (item === 'shoes') {
              return (
                <g key="shoes" transform="translate(0, 80)">
                  <ellipse cx="35" cy="10" rx="10" ry="5" fill="#EF4444" />
                  <ellipse cx="65" cy="10" rx="10" ry="5" fill="#EF4444" />
                </g>
              )
            }
            return null;
          })}
        </svg>
      </motion.div>
      
      {/* Shadow */}
      <div className="absolute -bottom-4 w-2/3 h-4 bg-black/5 rounded-[100%] blur-sm"></div>
    </div>
  );
}

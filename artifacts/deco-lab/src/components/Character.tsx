import { motion } from "framer-motion";

interface CharacterProps {
  className?: string;
  size?: "sm" | "lg" | "xl";
  color?: string;
  items?: string[];
}

export function Character({ 
  className = "", 
  size = "lg", 
  color = "#FBBF24",
  items = [] 
}: CharacterProps) {
  
  let s = 180;
  if (size === "sm") s = 60;
  if (size === "xl") s = 260;

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
          
          {items.map((item) => {
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
            if (item === 'hat') {
              return (
                <g key="hat" transform="translate(25, 0)">
                  <path d="M10 20 L 40 20 C 40 20 45 5 25 5 C 5 5 10 20 10 20 Z" fill="#3B82F6" />
                  <ellipse cx="25" cy="20" rx="20" ry="4" fill="#2563EB" />
                  <circle cx="25" cy="5" r="4" fill="#60A5FA" />
                </g>
              )
            }
            if (item === 'glasses') {
              return (
                <g key="glasses" transform="translate(20, 40)">
                  <path d="M 5 5 L 25 5" stroke="#1F2937" strokeWidth="2" />
                  <path d="M 35 5 L 55 5" stroke="#1F2937" strokeWidth="2" />
                  <path d="M 25 5 Q 30 0 35 5" stroke="#1F2937" strokeWidth="2" fill="none" />
                  <circle cx="15" cy="5" r="8" stroke="#1F2937" strokeWidth="2" fill="none" />
                  <circle cx="45" cy="5" r="8" stroke="#1F2937" strokeWidth="2" fill="none" />
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

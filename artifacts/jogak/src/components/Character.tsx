import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { ITEMS } from "@/lib/rewards";
import { equippedDecoIds } from "@/lib/decor";

// 레이어드 착용 아이템 (deco-lab 통합): 캐릭터 SVG 안에 직접 그려짐
function DecoLayer({ id }: { id: string }) {
  if (id === 'headphone') {
    return (
      <g>
        <path d="M20 50 C20 20 80 20 80 50" stroke="#8B5CF6" strokeWidth="6" strokeLinecap="round" fill="none" />
        <rect x="15" y="40" width="10" height="20" rx="4" fill="#8B5CF6" />
        <rect x="75" y="40" width="10" height="20" rx="4" fill="#8B5CF6" />
      </g>
    );
  }
  if (id === 'plant') {
    return (
      <g transform="translate(60, 60)">
        <path d="M10 20 Q 5 10 10 0 Q 15 10 10 20" fill="#4ADE80" />
        <path d="M10 20 Q 15 15 20 5 Q 15 10 10 20" fill="#22C55E" />
      </g>
    );
  }
  if (id === 'shoes') {
    return (
      <g transform="translate(0, 80)">
        <ellipse cx="35" cy="10" rx="10" ry="5" fill="#EF4444" />
        <ellipse cx="65" cy="10" rx="10" ry="5" fill="#EF4444" />
      </g>
    );
  }
  if (id === 'hat') {
    return (
      <g transform="translate(25, 0)">
        <path d="M10 20 L 40 20 C 40 20 45 5 25 5 C 5 5 10 20 10 20 Z" fill="#3B82F6" />
        <ellipse cx="25" cy="20" rx="20" ry="4" fill="#2563EB" />
        <circle cx="25" cy="5" r="4" fill="#60A5FA" />
      </g>
    );
  }
  if (id === 'glasses') {
    return (
      <g transform="translate(20, 40)">
        <path d="M 5 5 L 25 5" stroke="#1F2937" strokeWidth="2" />
        <path d="M 35 5 L 55 5" stroke="#1F2937" strokeWidth="2" />
        <path d="M 25 5 Q 30 0 35 5" stroke="#1F2937" strokeWidth="2" fill="none" />
        <circle cx="15" cy="5" r="8" stroke="#1F2937" strokeWidth="2" fill="none" />
        <circle cx="45" cy="5" r="8" stroke="#1F2937" strokeWidth="2" fill="none" />
      </g>
    );
  }
  return null;
}

// 캐릭터 주변에 아이템이 은은하게 붙는 위치 (더하기만, 회수 없음)
const ITEM_SLOTS = [
  { top: "-6%", left: "50%" },
  { top: "8%", left: "88%" },
  { top: "8%", left: "12%" },
  { top: "50%", left: "98%" },
  { top: "50%", left: "2%" },
  { top: "90%", left: "80%" },
  { top: "90%", left: "20%" },
  { top: "100%", left: "50%" },
  { top: "30%", left: "100%" },
  { top: "30%", left: "0%" },
];

export function Character({
  className,
  size = "lg",
  showItems = true,
  colorOverride,
  itemsOverride,
  decoOverride,
}: {
  className?: string;
  size?: "sm" | "lg" | "xl";
  showItems?: boolean;
  colorOverride?: string;
  itemsOverride?: string[];
  decoOverride?: string[];
}) {
  const { user } = useAppStore();
  const color = colorOverride || user.characterColor || "#FBBF24";
  const decoItems = decoOverride ?? equippedDecoIds(user.decoEquipped);
  // 레이어드 아이템으로 착용 중인 것과 같은 이모지 액세서리는 중복 표시하지 않음
  const items = (itemsOverride ?? user.equippedItems).filter((id) => !decoItems.includes(id));

  const isSmall = size === "sm";
  const s = isSmall ? 60 : size === "xl" ? 260 : 180;

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
          ease: "easeInOut",
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

          {/* 레이어드 착용 아이템 */}
          {decoItems.map((id) => (
            <DecoLayer key={id} id={id} />
          ))}
        </svg>
      </motion.div>

      {/* 획득 아이템 (이모지 액세서리) */}
      {showItems &&
        items.map((id, idx) => {
          const meta = ITEMS[id];
          if (!meta) return null;
          const slot = ITEM_SLOTS[idx % ITEM_SLOTS.length];
          return (
            <motion.div
              key={id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14, delay: idx * 0.05 }}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-sm"
              style={{ top: slot.top, left: slot.left, fontSize: isSmall ? s * 0.22 : s * 0.16 }}
              aria-label={meta.label}
            >
              {meta.emoji}
            </motion.div>
          );
        })}

      {/* Shadow */}
      <div className="absolute -bottom-4 w-2/3 h-4 bg-black/5 rounded-[100%] blur-sm"></div>
    </div>
  );
}

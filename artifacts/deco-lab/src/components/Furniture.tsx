import { motion } from "framer-motion";
import { FurnitureItem } from "@/lib/decor-schema";

interface FurnitureRenderProps {
  item: FurnitureItem;
  rotation?: 0 | 90 | 180 | 270;
  className?: string;
  style?: React.CSSProperties;
}

export function Furniture({ item, rotation = 0, className = "", style }: FurnitureRenderProps) {
  const { id } = item;

  let content = null;

  // Simple SVG representations for furniture
  if (id.startsWith('bed')) {
    content = (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="10" y="10" width="80" height="80" rx="8" fill="#FDE68A" />
        <rect x="10" y="10" width="80" height="25" rx="4" fill="#FCD34D" />
        <rect x="20" y="15" width="25" height="15" rx="4" fill="#FFFFFF" opacity="0.8" />
        <rect x="55" y="15" width="25" height="15" rx="4" fill="#FFFFFF" opacity="0.8" />
        <path d="M10 40 L90 40 L90 90 A8 8 0 0 1 82 90 L18 90 A8 8 0 0 1 10 90 Z" fill="#FEF3C7" />
      </svg>
    );
  } else if (id.startsWith('rug')) {
    content = (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <circle cx="50" cy="50" r="45" fill="#F3E8FF" />
        <circle cx="50" cy="50" r="35" stroke="#E9D5FF" strokeWidth="2" strokeDasharray="4 4" fill="none" />
      </svg>
    );
  } else if (id.startsWith('lamp')) {
    content = (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <circle cx="50" cy="80" r="15" fill="#E5E7EB" />
        <rect x="45" y="40" width="10" height="40" fill="#D1D5DB" />
        <path d="M30 40 L70 40 L60 10 L40 10 Z" fill="#FCD34D" />
      </svg>
    );
  } else if (id.startsWith('bookshelf')) {
    content = (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="5" y="5" width="90" height="90" fill="#D97706" rx="2" />
        <rect x="10" y="10" width="80" height="20" fill="#FEF3C7" />
        <rect x="10" y="40" width="80" height="20" fill="#FEF3C7" />
        <rect x="10" y="70" width="80" height="20" fill="#FEF3C7" />
        <rect x="15" y="10" width="10" height="15" fill="#60A5FA" />
        <rect x="30" y="10" width="10" height="18" fill="#F87171" />
        <rect x="60" y="40" width="8" height="16" fill="#34D399" />
      </svg>
    );
  } else if (id.startsWith('plant')) {
    content = (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M30 90 L70 90 L65 60 L35 60 Z" fill="#B45309" />
        <path d="M50 60 Q 20 40 30 10 Q 50 30 50 60" fill="#34D399" />
        <path d="M50 60 Q 80 40 70 10 Q 50 30 50 60" fill="#10B981" />
        <path d="M50 60 Q 20 70 10 40 Q 40 50 50 60" fill="#059669" />
        <path d="M50 60 Q 80 70 90 40 Q 60 50 50 60" fill="#059669" />
      </svg>
    );
  } else if (id.startsWith('cushion')) {
    content = (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="15" y="15" width="70" height="70" rx="15" fill="#FCA5A5" />
        <circle cx="50" cy="50" r="5" fill="#F87171" />
      </svg>
    );
  } else if (id.startsWith('window')) {
    content = (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="5" y="5" width="90" height="90" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="4" />
        <rect x="10" y="10" width="80" height="80" fill="#DBEAFE" />
        <line x1="50" y1="10" x2="50" y2="90" stroke="#FFFFFF" strokeWidth="4" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="#FFFFFF" strokeWidth="4" />
        <circle cx="20" cy="20" r="5" fill="#FEF08A" opacity="0.8" />
      </svg>
    );
  } else if (id.startsWith('frame')) {
    content = (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="10" y="10" width="80" height="80" fill="#F59E0B" rx="4" />
        <rect x="20" y="20" width="60" height="60" fill="#FEF3C7" />
        <circle cx="50" cy="40" r="10" fill="#FCD34D" />
        <path d="M20 80 L40 50 L60 70 L80 40 L80 80 Z" fill="#34D399" opacity="0.6" />
      </svg>
    );
  } else if (id.startsWith('table')) {
    content = (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="10" y="20" width="80" height="60" rx="10" fill="#D97706" />
        <rect x="15" y="25" width="70" height="50" rx="6" fill="#F59E0B" />
      </svg>
    );
  } else {
    content = (
      <div className="w-full h-full bg-gray-200 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center">
        <span className="text-xs text-gray-400">?</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, rotate: rotation }}
      className={`relative origin-center ${className}`}
      style={style}
    >
      {content}
    </motion.div>
  );
}

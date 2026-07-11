import { Link, useLocation } from "wouter";
import { Home, User, LayoutGrid } from "lucide-react";
import { useStore } from "@/lib/store";

export function Navigation() {
  const [location] = useLocation();
  const { state } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 pb-safe z-50">
      <div className="max-w-md mx-auto flex items-center justify-around p-3">
        <Link 
          href="/" 
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors ${
            location === "/" ? "text-orange-500 bg-orange-50" : "text-gray-400 hover:bg-gray-50"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">홈</span>
        </Link>
        
        <Link 
          href="/character" 
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors ${
            !state.unlocked ? "opacity-50 pointer-events-none" : ""
          } ${
            location === "/character" ? "text-orange-500 bg-orange-50" : "text-gray-400 hover:bg-gray-50"
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">내 조각</span>
        </Link>
        
        <Link 
          href="/room" 
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors ${
            !state.unlocked ? "opacity-50 pointer-events-none" : ""
          } ${
            location === "/room" ? "text-orange-500 bg-orange-50" : "text-gray-400 hover:bg-gray-50"
          }`}
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[10px] font-medium">내 공간</span>
        </Link>
      </div>
    </nav>
  );
}

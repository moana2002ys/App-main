import React from 'react';
import '../_group.css';

export function PhoneFrame({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  // Gated capture mode: only active with ?capture=1 in the URL, used for full-length
  // deck screenshots. Default (canvas iframes / normal previews) is unchanged.
  const capture =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("capture");
  const outerClass = capture
    ? "flex items-start justify-center min-h-screen bg-[#E5E0D8] p-4 font-sans"
    : "flex items-center justify-center min-h-screen bg-[#E5E0D8] p-4 font-sans";
  const frameClass = capture
    ? `relative w-[390px] h-auto min-h-[844px] bg-[#FDFBF7] shadow-2xl rounded-[44px] border-[12px] border-white jogak-app flex flex-col ${className}`
    : `relative w-[390px] h-[844px] overflow-hidden bg-[#FDFBF7] shadow-2xl rounded-[44px] border-[12px] border-white jogak-app flex flex-col ${className}`;
  const innerClass = capture
    ? "pt-[44px] flex-1 flex flex-col relative"
    : "pt-[44px] flex-1 flex flex-col h-full overflow-hidden relative";
  return (
    <div className={outerClass}>
      <div className={frameClass}>
        {/* Status Bar Mock */}
        <div className="h-[44px] w-full flex justify-between items-center px-6 text-sm font-semibold text-[#4A443A] z-50 bg-[#FDFBF7]/80 backdrop-blur-md absolute top-0 left-0 right-0">
          <span>9:41</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-4 h-3 bg-[#4A443A] rounded-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 bottom-0 left-1 bg-white"></div>
            </div>
            <div className="w-3 h-3 bg-[#4A443A] rounded-full"></div>
            <div className="w-5 h-2.5 bg-[#4A443A] rounded-sm"></div>
          </div>
        </div>
        <div className={innerClass}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Mascot({ size = 48, expression = "happy", className = "" }: { size?: number, expression?: "happy" | "sad" | "encouraging" | "curious", className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#FFD55F" />
      {expression === "happy" && (
        <>
          <circle cx="33" cy="42" r="6.5" fill="#4A443A" />
          <circle cx="67" cy="42" r="6.5" fill="#4A443A" />
          <path d="M 33 60 Q 50 75 67 60" fill="none" stroke="#4A443A" strokeWidth="6" strokeLinecap="round" />
          <path d="M 20 48 Q 25 52 30 48" fill="none" stroke="#F4A261" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          <path d="M 70 48 Q 75 52 80 48" fill="none" stroke="#F4A261" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        </>
      )}
      {expression === "sad" && (
        <>
          <circle cx="33" cy="48" r="6" fill="#4A443A" />
          <circle cx="67" cy="48" r="6" fill="#4A443A" />
          <path d="M 40 65 Q 50 58 60 65" fill="none" stroke="#4A443A" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 28 38 L 38 42" fill="none" stroke="#4A443A" strokeWidth="4" strokeLinecap="round" />
          <path d="M 72 38 L 62 42" fill="none" stroke="#4A443A" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {expression === "encouraging" && (
        <>
          <path d="M 27 42 Q 33 34 39 42" fill="none" stroke="#4A443A" strokeWidth="6" strokeLinecap="round" />
          <path d="M 61 42 Q 67 34 73 42" fill="none" stroke="#4A443A" strokeWidth="6" strokeLinecap="round" />
          <path d="M 38 60 Q 50 72 62 60" fill="none" stroke="#4A443A" strokeWidth="6" strokeLinecap="round" />
          {/* Sparkles */}
          <path d="M 12 25 L 18 15 L 24 25 L 12 25" fill="#F4A261" />
          <path d="M 76 25 L 82 15 L 88 25 L 76 25" fill="#F4A261" />
        </>
      )}
      {expression === "curious" && (
        <>
          <circle cx="33" cy="45" r="7" fill="#4A443A" />
          <circle cx="67" cy="45" r="5" fill="#4A443A" />
          <path d="M 45 62 Q 50 64 55 62" fill="none" stroke="#4A443A" strokeWidth="5" strokeLinecap="round" />
          <path d="M 60 30 Q 65 20 70 30" fill="none" stroke="#4A443A" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

// Capture helpers: read initial UI state from the URL so static screenshots
// can show any step/state of a flow (e.g. ?step=2, ?mood=4). Returns null when
// the param is absent, so normal previews behave exactly as before.
export function qp(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

export function qpInt(name: string): number | null {
  const v = qp(name);
  if (v === null || v === "") return null;
  const n = Number(v);
  // Integer-only: index-like params (step, interest, reason, sel) crash or
  // misrender on decimals (e.g. stories[2.5] === undefined), so reject them.
  return Number.isInteger(n) ? n : null;
}

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-[#E5E0D8] h-2 rounded-full overflow-hidden">
      <div 
        className="bg-[#FFD55F] h-full transition-all duration-500 ease-out rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

import { ReactNode } from "react";
import { SupportPanel } from "./SupportPanel";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#E5E5E5] dark:bg-black p-0 md:p-8">
      <div className="relative w-full h-[100dvh] md:h-[844px] md:max-h-[100dvh] md:w-[390px] bg-background md:rounded-[40px] md:shadow-2xl overflow-hidden flex flex-col md:border-[8px] border-white/50 ring-1 ring-black/5">
        
        {/* Dynamic Island Mockup (only desktop) */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-3xl z-50"></div>
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col h-full scroll-smooth scrollbar-hide">
          {children}
        </main>

        <SupportPanel />
      </div>
    </div>
  );
}

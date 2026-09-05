import React from "react";
import { Mascot } from "@/components/Mascot";

export function MascotBadge({ state = "idle" }: { state?: "idle" | "wave" | "happy" | "sit" }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B4832] bg-[#F7D08A] px-2.5 py-1 rounded-full border border-[#E9A63C] shadow-sm"
      title="동행자 마스코트 디딤이"
    >
      <Mascot state={state} size="small" className="w-5 h-5 shrink-0" />
      <span>🌙 디딤이</span>
    </span>
  );
}

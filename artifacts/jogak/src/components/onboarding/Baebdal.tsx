import { Mascot, MascotState, MascotSize } from "@/components/Mascot";

// 뱁달이 — 온보딩의 화자(고정 안내자, 9.9 결정).
// 실제 뱁달이 아트워크는 정민 파트. 그때까지 정민님 픽셀 마스코트(Mascot.tsx)를 자리에 세운다.
// 바꿀 때 이 파일만 고치면 온보딩 전 화면이 따라온다.
export function Baebdal({
  state = "idle",
  size = "md",
  className,
}: {
  state?: MascotState;
  size?: MascotSize;
  className?: string;
}) {
  return (
    <div className={className}>
      <Mascot state={state} size={size} />
    </div>
  );
}

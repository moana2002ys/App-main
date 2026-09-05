import React, { useRef, useEffect } from "react";
import { PixelEngine } from "@/lib/pixel-engine";

interface IsoCanvasProps {
  spaceKey: string;
}

export function IsoCanvas({ spaceKey }: IsoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    PixelEngine.renderScene(ctx, spaceKey);
  }, [spaceKey]);

  return (
    <div className="relative flex justify-center items-center p-4 bg-[#EFE7DA] rounded-xl border border-[#E7DDCE]">
      <canvas
        ref={canvasRef}
        width={160}
        height={152}
        className="w-[280px] h-[266px] image-pixelated shadow-md rounded-lg"
      />
    </div>
  );
}

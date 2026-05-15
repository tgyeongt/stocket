"use client";

import { useEffect, useRef } from "react";

interface GaugeChartProps {
  score: number;
}

export default function GaugeChart({ score }: GaugeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = 90, cy = 100, r = 70;
    ctx.clearRect(0, 0, 180, 180);

    const startA = Math.PI * 0.75;
    const fullA = Math.PI * 1.5;

    ctx.beginPath();
    ctx.arc(cx, cy, r, startA, startA + fullA);
    ctx.strokeStyle = "#2A2F42";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.stroke();

    const endA = startA + fullA * (score / 100);
    const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    grad.addColorStop(0, "#16A34A");
    grad.addColorStop(1, "#4ADE80");

    ctx.beginPath();
    ctx.arc(cx, cy, r, startA, endA);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.stroke();
  }, [score]);

  return (
    <div className="relative flex-shrink-0">
      <canvas
        ref={canvasRef}
        width={180}
        height={180}
        role="img"
        aria-label={`성장 가능성 점수 ${score}점`}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] text-center pointer-events-none">
        <div className="text-[38px] font-bold text-[#22C55E] leading-none">{score}</div>
        <div className="text-[11px] text-[#94A3B8] mt-1">/ 100점</div>
      </div>
    </div>
  );
}

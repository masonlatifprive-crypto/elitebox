/**
 * LivingTree — EliteBox signature mark.
 * DadGPT-style 2D canvas fractal: a single centered tree growing upward from
 * a clean baseline, with EliteBox silver/cyan glow and subtle breathing motion.
 */
import { memo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';


interface LivingTreeProps {
  className?: string;
  height?: number;
  loader?: boolean;
}


function drawBranch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  depth: number,
  seed: number,
  isReducedMotion: boolean
) {
  if (depth <= 0 || length < 2) return;


  // Faster, smoother motion for non-reduced motion users
  const speedMult = isReducedMotion ? 0.2 : 1.2;
  const sway = Math.sin((seed * 0.001) + (depth * 0.8)) * (isReducedMotion ? 0.01 : 0.06) * speedMult;
  const currentAngle = angle + sway;


  const x2 = x + Math.cos(currentAngle) * length;
  const y2 = y + Math.sin(currentAngle) * length;


  ctx.save();
  ctx.lineCap = 'round';
export default memo(LivingTree);

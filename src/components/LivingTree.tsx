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
  ctx.lineJoin = 'round';
  
  // Thicker branches for higher visual density
  ctx.lineWidth = Math.max(0.8, depth * 0.55);

  // Polished cyan/silver/purple glow
  if (depth > 8) {
    ctx.strokeStyle = 'rgba(192, 192, 192, 0.4)'; // Silver trunk
    ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
  } else if (depth > 4) {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'; // Cyan middle
    ctx.shadowColor = 'rgba(0, 255, 255, 0.4)';
    ctx.shadowBlur = 4;
  } else {
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)'; // Purple tips
    ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
    ctx.shadowBlur = 6;
  }

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();

  // Branching logic for higher density
  const newDepth = depth - 1;
  const newLength = length * 0.78;
  
  // Always branch at least twice for density
  drawBranch(ctx, x2, y2, currentAngle - 0.35, newLength, newDepth, seed, isReducedMotion);
  drawBranch(ctx, x2, y2, currentAngle + 0.35, newLength, newDepth, seed, isReducedMotion);
  
  // Extra detail branch in middle depths
  if (depth > 3 && depth < 7) {
    drawBranch(ctx, x2, y2, currentAngle, newLength * 0.6, newDepth - 1, seed, isReducedMotion);
  }
}

export const LivingTree = memo(({ className, height = 120, loader = false }: LivingTreeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const startX = canvas.width / 2;
      const startY = canvas.height - 10;
      
      // Increased depth for higher visual density (11-12 levels)
      drawBranch(ctx, startX, startY, -Math.PI / 2, height * 0.28, 11, time, isReduced);
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [height]);

  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        width={300}
        height={height + 20}
        className="opacity-80 pointer-events-none"
      />
      {loader && (
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-1 h-1 bg-cyan-500/40 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
});

LivingTree.displayName = 'LivingTree';

import React, { useRef, useEffect, memo } from 'react';
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
  if (depth === 0) return;

  const time = Date.now() / 1000;
  const motionFactor = isReducedMotion ? 0 : 1;
  const sway = Math.sin(time * 1.5 + seed + depth) * (0.04 * motionFactor);
  const currentAngle = angle + sway;

  const x2 = x + Math.cos(currentAngle) * length;
  const y2 = y + Math.sin(currentAngle) * length;

  // Visual enhancements: Higher density and polished glow
  ctx.lineWidth = depth * 0.85;
  
  if (depth > 6) {
    ctx.strokeStyle = 'rgba(192, 192, 192, 0.9)'; // Silver base for trunk
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)'; // Cyan glow
  } else {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.85)'; // Cyan core for branches
    ctx.shadowColor = 'rgba(147, 51, 234, 0.75)'; // Purple outer glow
  }
  
  ctx.shadowBlur = depth * 1.8;
  
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const nextLength = length * 0.76;
  // Recursive branching
  drawBranch(ctx, x2, y2, currentAngle - 0.35, nextLength, depth - 1, seed, isReducedMotion);
  drawBranch(ctx, x2, y2, currentAngle + 0.35, nextLength, depth - 1, seed, isReducedMotion);
}

const LivingTree = ({
  className,
  height = 180,
  loader = false,
}: LivingTreeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const seed = useRef(Math.random() * 100).current;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const startX = canvas.width / 2;
      const startY = canvas.height - 10;
      const initialLength = height * 0.28;

      ctx.lineCap = 'round';
      drawBranch(ctx, startX, startY, -Math.PI / 2, initialLength, loader ? 11 : 9, seed, isReducedMotion);
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [height, loader, seed]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={height}
      className={cn(
        'pointer-events-none opacity-90 transition-opacity duration-1000',
        loader && 'animate-pulse',
        className
      )}
    />
  );
};

export default memo(LivingTree);

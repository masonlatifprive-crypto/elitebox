import React, { useRef, useEffect, memo } from 'react';

interface LivingTreeProps {
  className?: string;
  height?: number;
  loader?: boolean;
}

const drawBranch = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  depth: number,
  seed: number,
  isReducedMotion: boolean
) => {
  if (depth === 0) return;

  const time = isReducedMotion ? 0 : Date.now() * 0.0015;
  const variance = Math.sin(time + seed + depth) * 0.15;
  const currentAngle = angle + variance;

  const x2 = x + Math.cos(currentAngle) * length;
  const y2 = y + Math.sin(currentAngle) * length;

  ctx.lineWidth = depth * 0.8;
  ctx.lineCap = 'round';

  // Elegant Cyan/Purple/Silver Glow
  const gradient = ctx.createLinearGradient(x, y, x2, y2);
  gradient.addColorStop(0, '#00F5FF'); // Cyan
  gradient.addColorStop(0.5, '#E5E7EB'); // Silver
  gradient.addColorStop(1, '#A855F7'); // Purple

  ctx.strokeStyle = gradient;
  ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const nextLength = length * 0.82;
  const nextDepth = depth - 1;

  drawBranch(ctx, x2, y2, currentAngle - 0.3, nextLength, nextDepth, seed, isReducedMotion);
  drawBranch(ctx, x2, y2, currentAngle + 0.3, nextLength, nextDepth, seed, isReducedMotion);
};

const LivingTree: React.FC<LivingTreeProps> = ({
  className = '',
  height = 400,
  loader = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const seedRef = useRef(Math.random() * 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animate = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, rect.width, rect.height);

      const startX = rect.width / 2;
      const startY = rect.height - 20;
      const initialLength = loader ? 35 : 75;
      const initialDepth = loader ? 9 : 11;

      drawBranch(
        ctx,
        startX,
        startY,
        -Math.PI / 2,
        initialLength,
        initialDepth,
        seedRef.current,
        isReducedMotion
      );

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loader]);

  return (
    <canvas
      ref={canvasRef}
      className={'w-full h-full ' + className}
      style={{ height: height + 'px' }}
    />
  );
};

export default memo(LivingTree);

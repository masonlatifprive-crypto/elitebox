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
) {
  if (depth <= 0 || length < 2.2) return;
  const sway = Math.sin(seed + depth * 0.84) * 0.045;
  const a = angle + sway;
  const x2 = x + Math.cos(a) * length;
  const y2 = y + Math.sin(a) * length;
  const alpha = Math.max(0.09, depth / 9);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(0.7, depth * 0.42);
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(124,217,236,.24)';
  const grad = ctx.createLinearGradient(x, y, x2, y2);
  grad.addColorStop(0, `rgba(255,255,255,${0.26 * alpha})`);
  grad.addColorStop(0.62, `rgba(238,244,250,${0.82 * alpha})`);
  grad.addColorStop(1, `rgba(124,217,236,${0.54 * alpha})`);
  ctx.strokeStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  if (depth <= 2) {
    ctx.fillStyle = 'rgba(255,255,255,.78)';
    ctx.shadowBlur = 14;
    ctx.shadowColor = 'rgba(124,217,236,.28)';
    ctx.beginPath();
    ctx.arc(x2, y2, 1.55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const next = length * (0.66 + Math.sin(seed + depth) * 0.025);
  const spread = 0.43 + (9 - depth) * 0.014;
  drawBranch(ctx, x2, y2, a - spread, next, depth - 1, seed + 1.6);
  drawBranch(ctx, x2, y2, a + spread, next * 0.96, depth - 1, seed + 2.2);
  if (depth > 4) drawBranch(ctx, x2, y2, a + 0.12, next * 0.58, depth - 2, seed + 3.4);
}

const LivingTree = memo(function LivingTree({ className, height = 320, loader = false }: LivingTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(320, rect.width || 760);
      h = Math.max(180, rect.height || height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = (time = 0) => {
      if (!running) return;
      const t = reduced ? 0 : time / 1000;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const baseline = h * 0.78;
      const treeHeight = h * (loader ? 0.60 : 0.68);
      const breath = reduced ? 1 : 1 + Math.sin(t * 1.22) * (loader ? 0.024 : 0.014);

      const aura = ctx.createRadialGradient(cx, baseline - treeHeight * 0.55, 0, cx, baseline - treeHeight * 0.55, Math.min(w, h) * 0.62);
      aura.addColorStop(0, 'rgba(124,217,236,.095)');
      aura.addColorStop(0.48, 'rgba(255,255,255,.024)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalAlpha = loader ? 0.55 : 0.42;
      ctx.strokeStyle = 'rgba(235,242,250,.48)';
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(124,217,236,.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - Math.min(w * 0.36, 440), baseline);
      ctx.lineTo(cx + Math.min(w * 0.36, 440), baseline);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, baseline);
      ctx.scale(breath, breath);
      ctx.translate(-cx, -baseline);
      drawBranch(ctx, cx, baseline, -Math.PI / 2, treeHeight * 0.29, 9, t * (loader ? 1.65 : 0.62));
      ctx.restore();

      ctx.save();
      const r = 3.4 + (reduced ? 0 : Math.sin(t * 2.2) * 0.75);
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      ctx.shadowBlur = 18;
      ctx.shadowColor = 'rgba(124,217,236,.45)';
      ctx.beginPath();
      ctx.arc(cx, baseline, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (!reduced) raf = requestAnimationFrame(render);
    };

    resize();
    const ro = new ResizeObserver(() => { resize(); render(0); });
    ro.observe(canvas);
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [height, loader]);

  return (
    <div className={cn('relative mx-auto w-full max-w-[820px]', className)} style={{ height }} aria-hidden="true" data-testid={loader ? 'elitebox-tree-loader' : 'elitebox-living-tree'}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
});

export function TreeLoader({ label = 'Loading EliteBox', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex min-h-[220px] flex-col items-center justify-center gap-10 text-center', className)} role="status" aria-live="polite">
      <LivingTree height={150} loader className="max-w-[360px]" />
      <span className="text-micro uppercase tracking-[0.24em] text-muted">{label}</span>
    </div>
  );
}

export default LivingTree;

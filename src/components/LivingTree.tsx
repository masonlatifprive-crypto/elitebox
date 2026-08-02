/**
 * LivingTree — EliteBox signature mark.
 * Canvas-based mirrored fractal tree inspired by the approved motion reference:
 * upward branch crown + downward root system around a fine central divider.
 * Original EliteBox palette, lightweight 2D canvas, responsive fixed-ratio draw.
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
  root = false,
) {
  if (depth <= 0 || length < 2) return;
  const sway = Math.sin(seed + depth * 0.73) * 0.035;
  const a = angle + sway;
  const x2 = x + Math.cos(a) * length;
  const y2 = y + Math.sin(a) * length;
  const alpha = Math.max(0.08, depth / 9);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(0.65, depth * 0.34);
  ctx.shadowBlur = root ? 9 : 7;
  ctx.shadowColor = root ? 'rgba(124,217,236,.30)' : 'rgba(255,255,255,.22)';
  const grad = ctx.createLinearGradient(x, y, x2, y2);
  if (root) {
    grad.addColorStop(0, `rgba(255,255,255,${0.16 * alpha})`);
    grad.addColorStop(0.55, `rgba(124,217,236,${0.58 * alpha})`);
    grad.addColorStop(1, `rgba(255,255,255,${0.78 * alpha})`);
  } else {
    grad.addColorStop(0, `rgba(255,255,255,${0.18 * alpha})`);
    grad.addColorStop(0.6, `rgba(230,238,246,${0.68 * alpha})`);
    grad.addColorStop(1, `rgba(124,217,236,${0.36 * alpha})`);
  }
  ctx.strokeStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  if (depth <= 2) {
    ctx.fillStyle = root ? 'rgba(124,217,236,.75)' : 'rgba(255,255,255,.72)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x2, y2, root ? 1.55 : 1.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const split = 0.57 + Math.sin(seed + depth) * 0.035;
  const next = length * split;
  const spread = (root ? 0.46 : 0.41) + (9 - depth) * 0.012;
  drawBranch(ctx, x2, y2, a - spread, next, depth - 1, seed + 1.7, root);
  drawBranch(ctx, x2, y2, a + spread, next * 0.94, depth - 1, seed + 2.3, root);
  if (depth > 4) {
    drawBranch(ctx, x2, y2, a + (root ? -0.16 : 0.16), next * 0.58, depth - 2, seed + 3.1, root);
  }
}

const LivingTree = memo(function LivingTree({ className, height = 260, loader = false }: LivingTreeProps) {
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
    const ratio = 1476 / 520;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(280, rect.width || height * ratio);
      h = Math.max(120, rect.height || height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = (time = 0) => {
      if (!running) return;
      const t = reduced ? 0 : time / 1000;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const mid = h * 0.5;
      const scale = Math.min(w / 1476, h / 520);
      const breath = reduced ? 1 : 1 + Math.sin(t * 1.35) * (loader ? 0.018 : 0.01);
      const drawScale = scale * breath;

      // subtle central aura
      const aura = ctx.createRadialGradient(cx, mid, 0, cx, mid, Math.min(w, h) * 0.45);
      aura.addColorStop(0, 'rgba(124,217,236,.075)');
      aura.addColorStop(0.45, 'rgba(255,255,255,.026)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, w, h);

      // horizontal divider like the reference, now EliteBox-silver/cyan.
      ctx.save();
      ctx.globalAlpha = loader ? 0.55 : 0.38;
      ctx.strokeStyle = 'rgba(235,242,250,.42)';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(124,217,236,.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 390 * scale, mid);
      ctx.lineTo(cx + 390 * scale, mid);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, mid);
      ctx.scale(drawScale, drawScale);
      ctx.translate(-cx / drawScale, -mid / drawScale);
      const baseLen = 82;
      const seed = t * (loader ? 1.6 : 0.55);
      drawBranch(ctx, cx, mid - 2, -Math.PI / 2, baseLen, 8, seed, false);
      drawBranch(ctx, cx, mid + 2, Math.PI / 2, baseLen * 0.92, 8, seed + 4.2, true);
      ctx.restore();

      // center pulse node
      ctx.save();
      const r = 3.2 + (reduced ? 0 : Math.sin(t * 2.2) * 0.8);
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.shadowBlur = 18;
      ctx.shadowColor = 'rgba(124,217,236,.45)';
      ctx.beginPath();
      ctx.arc(cx, mid, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (!reduced) raf = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    const ro = new ResizeObserver(() => { resize(); render(0); });
    ro.observe(canvas);
    raf = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      ro.disconnect();
    };
  }, [height, loader]);

  return (
    <div
      className={cn('relative mx-auto w-full max-w-[760px]', className)}
      style={{ height }}
      aria-hidden="true"
      data-testid={loader ? 'elitebox-tree-loader' : 'elitebox-living-tree'}
    >
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

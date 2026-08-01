/**
 * AmbienceCanvas — DadGPT-style black-canvas atmosphere.
 * A very subtle monochrome wave field, no particles, no nebula, no busy drift.
 * It stays behind every shell and respects reduced-motion / ambience settings.
 */
import { memo, useEffect, useRef } from 'react';
import { useSettings } from '@/lib/store';

const AmbienceCanvas = memo(function AmbienceCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ambienceOn = useSettings((s) => s.settings.appearance.ambience);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ambienceOn) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    let t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h * 0.47;
      const lines = Math.max(11, Math.min(18, Math.floor(h / 58)));
      const maxWidth = Math.min(w * 0.76, 1120);
      const phase = reduced ? 0 : t * 0.006;

      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      for (let i = 0; i < lines; i++) {
        const y = cy + (i - lines / 2) * 22;
        const alpha = 0.035 + (1 - Math.abs(i - lines / 2) / lines) * 0.055;
        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.beginPath();
        for (let x = -maxWidth / 2; x <= maxWidth / 2; x += 18) {
          const nx = x / maxWidth;
          const amp = 18 * Math.cos(nx * Math.PI * 0.75);
          const wave = Math.sin(nx * 10 + phase + i * 0.38) * amp;
          const yy = y + wave + Math.sin(nx * 24 - phase * 0.65) * 4;
          if (x === -maxWidth / 2) ctx.moveTo(cx + x, yy);
          else ctx.lineTo(cx + x, yy);
        }
        ctx.stroke();
      }

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.55);
      gradient.addColorStop(0, 'rgba(124,217,236,0.035)');
      gradient.addColorStop(0.35, 'rgba(124,217,236,0.012)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      if (!reduced) t += 1;
      if (running) raf = requestAnimationFrame(draw);
    };

    const start = () => {
      running = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ambienceOn]);

  if (!ambienceOn) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', background: '#000' }}
    />
  );
});

export default AmbienceCanvas;

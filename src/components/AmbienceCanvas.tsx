/**
 * Ambience layer (design.md §10.11): fixed canvas particle field behind all
 * shells — 80–120 cyan/purple particles, slow drift, connect-lines within
 * 90px, 0.35 opacity. One instance per shell. Paused when the tab is hidden,
 * disabled entirely under prefers-reduced-motion or when the user turns the
 * ambience off in settings.
 */
import { memo, useEffect, useRef } from 'react';
import { useSettings } from '@/lib/store';

const PARTICLE_COUNT = 100;
const LINK_DIST = 90;
const OPACITY = 0.35;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: 'cyan' | 'purple';
}

const AmbienceCanvas = memo(function AmbienceCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ambienceOn = useSettings((s) => s.settings.appearance.ambience);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ambienceOn) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      /* Static constellation — premium is still. No drift, no wrap: the
         field is drawn once per resize and simply holds (owner directive:
         moving background structures read cheap). */
      vx: 0,
      vy: 0,
      r: 0.8 + Math.random() * 1.8,
      hue: Math.random() < 0.6 ? 'cyan' : 'purple',
    }));

    const CYAN = '124,217,236';
    const PURPLE = '139,124,232';

    const frame = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      // drift + wrap
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        else if (p.y > h + 20) p.y = -20;
      }

      // connect-lines within 90px
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * OPACITY * 0.5;
            ctx.strokeStyle = `rgba(${a.hue === 'cyan' ? CYAN : PURPLE},${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // particles
      for (const p of particles) {
        ctx.fillStyle = `rgba(${p.hue === 'cyan' ? CYAN : PURPLE},${(OPACITY * 0.9).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) cancelAnimationFrame(raf);
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onVisibility = () => (document.hidden ? stop() : start());
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
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  );
});

export default AmbienceCanvas;

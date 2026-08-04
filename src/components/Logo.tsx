import { cn } from '../lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export function EngravedE({ size = 40, className, glow = true }: LogoProps) {
  const steelId = 'steel-gradient-' + size;
  const bevelId = 'bevel-gradient-' + size;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn(
        "drop-shadow-2xl transition-all duration-700 hover:scale-105",
        glow && "drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]",
        className
      )}
    >
      <defs>
        <linearGradient id={steelId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="45%" stopColor="#f1f5f9" />
          <stop offset="55%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={bevelId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
        </linearGradient>
        <filter id="engrave-effect">
          <feOffset dx="-1" dy="-1" in="SourceAlpha" result="offset-top" />
          <feGaussianBlur stdDeviation="1" in="offset-top" result="blur-top" />
          <feComposite operator="out" in="SourceGraphic" in2="blur-top" result="engrave-light" />
        </filter>
      </defs>
      {/* Metallic Base */}
      <path
        d="M25 20 H75 V32 H42 V45 H70 V57 H42 V70 H75 V82 H25 Z"
        fill={`url(#${steelId})`}
      />
      {/* Bevel/Engrave Overlay */}
      <path
        d="M25 20 H75 V32 H42 V45 H70 V57 H42 V70 H75 V82 H25 Z"
        fill={`url(#${bevelId})`}
        style={{ mixBlendMode: 'overlay' }}
      />
      {/* Edge Highlight */}
      <path
        d="M25 20 H75 V32 H42 V45 H70 V57 H42 V70 H75 V82 H25 Z"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function Logo({ size = 40, className, glow = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <EngravedE size={size} glow={glow} />
      <span className="font-display font-bold tracking-tighter text-2xl">
        <span className="bg-clip-text text-transparent bg-gradient-to-br from-slate-200 via-white to-slate-400">EliteBox</span>
        <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">Movies</span>
      </span>
    </div>
  );
}

export { Logo as LogoMark };

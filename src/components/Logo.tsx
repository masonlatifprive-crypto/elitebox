import { cn } from '../lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export function EngravedE({ size = 40, className, glow = true }: LogoProps) {
  const steelId = 'steel-gradient-' + size;
  const iceId = 'ice-glow-' + size;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn(
        "drop-shadow-sm transition-all duration-500",
        glow && "drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]",
        className
      )}
    >
      <defs>
        <linearGradient id={steelId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#94a3b8" />
          <stop offset="0.5" stopColor="#f8fafc" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
        <radialGradient id={iceId} cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#0891b2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M30 20 H75 V35 H45 V45 H70 V55 H45 V65 H75 V80 H30 Z"
        fill={`url(#${steelId})`}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function Logo({ size = 40, className, glow = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <EngravedE size={size} glow={glow} />
      <span className="font-bold tracking-tight text-xl text-white">
        EliteBox<span className="text-cyan-400">Movies</span>
      </span>
    </div>
  );
}

export { Logo as LogoMark };

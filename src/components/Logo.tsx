import { cn } from '../lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export function LogoMark({ size = 40, className, glow = true }: LogoProps) {
  const steelId = `steel-gradient-${size}`;

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
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <path
        d="M20 20 L80 20 L80 35 L35 35 L35 45 L70 45 L70 60 L35 60 L35 70 L80 70 L80 85 L20 85 Z"
        fill={`url(#${steelId})`}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function Logo({ size = 40, className, glow = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} glow={glow} />
      <span className="text-xl font-bold tracking-tighter text-white">
        ELITEBOX
      </span>
    </div>
  );
}

export default Logo;

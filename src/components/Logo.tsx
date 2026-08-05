import { cn } from '../lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export function EngravedE({ size = 40, className, glow = true }: LogoProps) {
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
        <linearGradient
          id={steelId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="45%" stopColor="#f1f5f9" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>

      <circle
        cx="50"
        cy="50"
        r="48"
        fill={glow ? "#0f172a" : "transparent"}
        stroke={`url(#${steelId})`}
        strokeWidth="0.5"
        className="opacity-50"
      />

      <path
        d="M30 25h40v10H40v15h25v10H40v15h30v10H30z"
        fill={`url(#${steelId})`}
      />
      <path
        d="M30 25h40v10H40v15h25v10H40v15h30v10H30z"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.5"
        className="pointer-events-none"
      />
    </svg>
  );
}

export default EngravedE;

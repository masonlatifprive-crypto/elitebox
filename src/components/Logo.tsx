import { cn } from '../lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export function EngravedE({ size = 40, className, glow = true }: LogoProps) {
  const steel = 'steel-gradient-' + size;
  const ice = 'ice-glow-' + size;

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
        <linearGradient id={steel} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#94a3b8" />
          <stop offset="0.5" stopColor="#f8fafc" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
        <radialGradient id={ice} cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#0891b2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path 
        d="M30 20 H75 V35 H45 V45 H70 V55 H45 V65 H75 V80 H30 Z" 
        stroke={'url(#' + steel + ')'} 
        strokeWidth="2" 
        strokeLinejoin="round" 
      />
      <path 
        d="M35 25 H70 V30 H40 V50 H65 V55 H40 V75 H70 V80 H35 V25 Z" 
        fill="currentColor" 
        fillOpacity="0.1" 
      />
    </svg>
  );
}

/**
 * Full EliteBox logo with monogram and lunar-ice wordmark.
 */
export function Logo({ size = 32, className, glow = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <EngravedE size={size} glow={glow} />
      <div className="flex flex-col leading-tight">
        <span className="text-xl font-bold tracking-tighter text-white">
          Elite<span className="text-cyan-400">B</span>ox
        </span>
        <div className="h-1 w-1 rounded-full bg-cyan-400 self-center ml-2 shadow-[0_0_8px_#22d3ee]" />
      </div>
    </div>
  );
}

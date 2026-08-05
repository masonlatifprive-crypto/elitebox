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
        <filter id="inner-shadow">
          <feOffset dx="0" dy="2" />
          <feGaussianBlur stdDeviation="1.5" result="offset-blur" />
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
          <feFlood floodColor="black" floodOpacity="0.5" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComponentTransfer in="shadow">
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>




      <rect width="100" height="100" rx="24" fill="#0f172a" />
      <rect width="100" height="100" rx="24" fill={url("#' + bevelId + '")} opacity="0.2" />




      <path
        d="M30 25h45v12H45v13h25v12H45v13h30v12H30V25z"
        fill={url("#' + steelId + '")}
        filter="url(#inner-shadow)"
      />




      <path
        d="M30 25h45v2H32v56h43v2H30V25z"
        fill="white"
        opacity="0.3"
      />
    </svg>
  );
}

export default EngravedE;

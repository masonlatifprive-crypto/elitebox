import { cn } from '../lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export function EngravedE({ size = 40, className, glow = true }: LogoProps) {
  const steelId = 'steel-gradient-' + size;
  
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

        <filter id="bevel" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
          <feOffset in="blur" dx="1" dy="1" result="offsetBlur" />
          <feSpecularLighting
            in="blur"
            surfaceScale="3"
            specularConstant="1.2"
            specularExponent="20"
            lightingColor="#ffffff"
            result="specOut"
          >
            <fePointLight x="-5000" y="-10000" z="20000" />
          </feSpecularLighting>
          <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
          <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litGraphic" />
        </filter>
      </defs>

      <circle cx="50" cy="50" r="45" fill={`url(#${steelId})`} filter="url(#bevel)" />
      
      <path
        d="M35 30 H65 V40 H45 V45 H60 V55 H45 V60 H65 V70 H35 Z"
        fill="#334155"
        className="opacity-80"
      />
      
      <circle cx="50" cy="50" r="45" fill="none" stroke="#cbd5e1" strokeWidth="0.5" className="opacity-50" />
    </svg>
  );
}

export default EngravedE;

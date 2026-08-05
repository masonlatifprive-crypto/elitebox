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

      {/* Main Box Shape with Inset Effect */}
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="18"
        fill={glow ? `url(#${steelId})` : "#1e293b"}
        className="transition-colors duration-500"
      />

      {/* Inner Engraved Detail */}
      <rect
        x="15"
        y="15"
        width="70"
        height="70"
        rx="14"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="0.5"
      />

      {/* Stylized 'E' with Cyberpunk Engraving */}
      <path
        d="M35 30H65M35 50H60M35 70H65M35 30V70"
        stroke="#06b6d4"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="opacity-80"
      />

      {/* Cyan Highlight Accents */}
      <circle cx="75" cy="25" r="3" fill="#22d3ee" className="animate-pulse" />
    </svg>
  );
}

export const Logo = EngravedE;
export default Logo;

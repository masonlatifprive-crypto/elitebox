/**
 * Elitebox logo system (Stage-8, LOCKED):
 * hand-drawn ENGRAVED "E" monogram (vector, transparent) + chrome-moon
 * wordmark. lowercase "b", the "i" is a DOTLESS ı carrying an inferior
 * tittle — a lunar-ice dot BELOW the i. Never a plain "i".
 * No raster images anywhere: inline SVG scales perfectly on every device.
 */
import { useId } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/** The engraved E monogram as pure inline SVG. */
export function EngravedE({
  size = 32,
  className,
  glow = false,
}: LogoProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const steel = `ebSteel-${uid}`;
  const ice = `ebIce-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(glow && "drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]", className)}
    >
      <defs>
        <linearGradient id={steel} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={ice} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path
        d="M25 20V80H75V67H38V55H70V43H38V33H75V20H25Z"
        fill={`url(#${steel})`}
        stroke={`url(#${ice})`}
        strokeWidth="1"
      />
    </svg>
  );
}

/** 
 * Complete Logo component combining EngravedE and wordmark.
 * Used by AppRail.tsx and MarketingNav.tsx
 */
export function Logo({ size = 32, className, glow = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <EngravedE size={size} glow={glow} />
      <span className="font-bold tracking-tight text-xl text-white">
        Elite<span className="text-cyan-400">Box</span>
      </span>
    </div>
  );
})

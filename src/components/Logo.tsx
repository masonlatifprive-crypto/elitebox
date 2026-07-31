/**
 * Elitebox logo system (Stage-8, LOCKED):
 * hand-drawn ENGRAVED "E" monogram (vector, transparent) + chrome-moon
 * wordmark. lowercase "b", the "i" is a DOTLESS ı carrying an inferior
 * tittle — a lunar-ice dot BELOW the i. Never a plain "i".
 * No raster images anywhere: inline SVG scales perfectly on every device.
 */
import { useId } from 'react';
import { cn } from '@/lib/utils';

/** The engraved E monogram as pure inline SVG. */
export function EngravedE({
  size = 96,
  className,
  glow = false,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const steel = `ebSteel-${uid}`;
  const ice = `ebIce-${uid}`;
  const softGlow = `ebGlow-${uid}`;

  const bars = (
    <>
      <rect x="22" y="18" width="13" height="60" rx="5" />
      <rect x="22" y="18" width="54" height="13" rx="5" />
      <rect x="22" y="65" width="54" height="13" rx="5" />
    </>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      role="img"
      aria-label="Elitebox"
      className={className}
      style={glow ? { filter: 'drop-shadow(0 0 18px rgba(196,211,245,.35))' } : undefined}
    >
      <defs>
        <linearGradient id={steel} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B254C" />
          <stop offset="42%" stopColor="#0D1430" />
          <stop offset="100%" stopColor="#05091A" />
        </linearGradient>
        <linearGradient id={ice} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E4F6FC" />
          <stop offset="52%" stopColor="#A8E2F2" />
          <stop offset="100%" stopColor="#7CD9EC" />
        </linearGradient>
        <filter id={softGlow} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>

      {/* rim light (top edge catches moonlight) */}
      <g fill="#F0F6FF" opacity="0.5" transform="translate(0,-1.1)">
        {bars}
      </g>
      {/* groove shadow (recessed carve) */}
      <g fill="#00030A" opacity="0.9" transform="translate(0,1.25)">
        {bars}
      </g>
      {/* engraved steel face */}
      <g fill={`url(#${steel})`} stroke="rgba(240,246,255,.22)" strokeWidth="0.5">
        {bars}
      </g>

      {/* play-glyph middle arm — lunar ice */}
      <path d="M34 42.5 L58 48 L34 53.5 Z" fill="#7CD9EC" opacity="0.45" filter={`url(#${softGlow})`} />
      <path d="M34 43.2 L58 48.7 L34 54.2 Z" fill="#02060F" opacity="0.8" transform="translate(0,-0.8)" />
      <path
        d="M34 42.5 L58 48 L34 53.5 Z"
        fill={`url(#${ice})`}
        stroke="#E4F6FC"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Engraved E only — for tight slots like the app rail / favicon slots. */
export function LogoE({
  height = 30,
  className,
  glow = false,
}: {
  height?: number;
  className?: string;
  glow?: boolean;
}) {
  return <EngravedE size={height} className={className} glow={glow} />;
}

/** Wordmark text — chrome-moon gradient + dotless ı with lunar tittle. */
export default function Logo({
  size = 28,
  className,
}: {
  /** rendered cap-height of the wordmark in px */
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn('font-display inline-flex items-baseline select-none whitespace-nowrap', className)}
      style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}
      aria-label="Elitebox"
      role="img"
    >
      <span className="text-chrome">El</span>
      <span className="logo-tittle text-chrome" style={{ fontWeight: 800 }}>
        <span className="dotless-i">i</span>
      </span>
      <span className="text-chrome">tebox</span>
    </span>
  );
}

/** Full lockup — engraved E + engraved wordmark, perfectly aligned. */
export function LogoMark({
  height = 40,
  className,
  glow = false,
}: {
  height?: number;
  className?: string;
  glow?: boolean;
}) {
  return (
    <span
      className={cn('inline-flex items-center select-none whitespace-nowrap', className)}
      style={{ gap: height * 0.16, lineHeight: 1 }}
      role="img"
      aria-label="Elitebox"
    >
      <EngravedE size={height} glow={glow} />
      <Logo size={height * 0.42} />
    </span>
  );
}

/**
 * Stream source intelligence — parses what a source title tells us
 * (resolution, HDR/DV, codec, size hints) and blends it with the addon's
 * real reliability telemetry into a 0–100 score. The best-scoring source is
 * the default; everything stays sorted and badged so the choice is visible.
 *
 * Weights (legal-source ranking spec): reliability 0.35, quality 0.25,
 * language match 0.15, startup estimate 0.15, provider preference 0.10.
 * Language/provider are neutral until addons declare them — they score 0.5
 * (unknown) rather than guessing.
 */
import type { StreamSource } from '@/lib/types';

export interface SourceIntel {
  score: number; // 0–100
  resolution?: '4K' | '1080p' | '720p' | 'SD';
  hdr?: 'HDR' | 'DV' | 'HDR10';
  codec?: string;
  badges: string[]; // compact chips for the UI
}

export function parseSourceTitle(title: string): Pick<SourceIntel, 'resolution' | 'hdr' | 'codec' | 'badges'> {
  const t = title.toLowerCase();
  const badges: string[] = [];
  let resolution: SourceIntel['resolution'];
  if (/2160p|4k|uhd/.test(t)) {
    resolution = '4K';
  } else if (/1080p|fhd/.test(t)) {
    resolution = '1080p';
  } else if (/720p|hd\b/.test(t)) {
    resolution = '720p';
  } else if (/480p|360p|\bsd\b/.test(t)) {
    resolution = 'SD';
  }
  if (resolution) badges.push(resolution);

  let hdr: SourceIntel['hdr'];
  if (/dolby\s?vision|\bdv\b/.test(t)) hdr = 'DV';
  else if (/hdr10/.test(t)) hdr = 'HDR10';
  else if (/\bhdr\b/.test(t)) hdr = 'HDR';
  if (hdr) badges.push(hdr);

  let codec: string | undefined;
  if (/hevc|h\.?265|x265/.test(t)) codec = 'HEVC';
  else if (/av1/.test(t)) codec = 'AV1';
  else if (/h\.?264|x264|avc/.test(t)) codec = 'H.264';
  if (codec) badges.push(codec);

  if (/hls|m3u8/.test(t)) badges.push('HLS');
  return { resolution, hdr, codec, badges: [...new Set(badges)] };
}

const RESOLUTION_POINTS: Record<NonNullable<SourceIntel['resolution']>, number> = {
  '4K': 100,
  '1080p': 85,
  '720p': 65,
  SD: 35,
};

/**
 * Score a source 0–100.
 * @param source     the stream source
 * @param reliability addon reliability 0–100 from engine telemetry
 * @param startupMs  measured startup estimate when known (lower is better)
 */
export function scoreSource(
  source: StreamSource,
  reliability: number,
  startupMs?: number,
): SourceIntel {
  const parsed = parseSourceTitle(`${source.title} ${source.quality ?? ''}`);

  const qualityPts =
    (parsed.resolution ? RESOLUTION_POINTS[parsed.resolution] : 55) +
    (parsed.hdr ? 8 : 0) +
    (parsed.codec === 'HEVC' || parsed.codec === 'AV1' ? 4 : 0);

  const startupPts =
    startupMs === undefined ? 50 : startupMs <= 800 ? 100 : startupMs <= 2000 ? 70 : 40;

  const score =
    reliability * 0.35 +
    Math.min(qualityPts, 100) * 0.25 +
    50 * 0.15 + // language match — unknown, neutral
    startupPts * 0.15 +
    50 * 0.1; // provider preference — unknown, neutral

  return { score: Math.round(Math.max(0, Math.min(100, score))), ...parsed };
}

/** Sort sources best-first using engine reliability per addon. */
export function rankSources(
  sources: StreamSource[],
  reliabilityOf: (addonId: string) => number,
): Array<{ source: StreamSource; intel: SourceIntel }> {
  return sources
    .map((source) => ({ source, intel: scoreSource(source, reliabilityOf(source.addonId)) }))
    .sort((a, b) => b.intel.score - a.intel.score);
}

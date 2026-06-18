/**
 * Published-page hero visual (PRD Phase 2 — Branded Images).
 *
 * If the page carries a generated image (`heroImageUrl`, set when an image-gen
 * provider is configured) we render that. Otherwise we render a deterministic,
 * on-brand SVG built from the workspace's CONFIRMED site-theme primary color —
 * so every published page gets a branded hero, never generic stock, with zero
 * keys. The shape varies with the title so pages don't all look identical.
 */

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex?: string): Rgb | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
const shade = ({ r, g, b }: Rgb, t: number) => `#${toHex(r * (1 - t))}${toHex(g * (1 - t))}${toHex(b * (1 - t))}`;
const tint = ({ r, g, b }: Rgb, t: number) =>
  `#${toHex(r + (255 - r) * t)}${toHex(g + (255 - g) * t)}${toHex(b + (255 - b) * t)}`;

/** Stable small hash so the composition is deterministic per title. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function BrandHero({
  title,
  primary,
  imageUrl,
  imageAlt,
}: {
  title: string;
  primary?: string;
  imageUrl?: string;
  imageAlt?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- generated brand image may be a data URI / external host, not optimizable by next/image
      <img
        src={imageUrl}
        alt={imageAlt || title}
        className="mb-6 aspect-[16/6] w-full rounded-2xl border border-border object-cover"
      />
    );
  }

  const base = hexToRgb(primary) ?? { r: 108, g: 76, b: 241 }; // GEOSEO violet fallback
  const h = hash(title);
  const c1 = shade(base, 0.08);
  const c2 = shade(base, 0.42);
  const soft = tint(base, 0.7);
  const gid = `bh-${(h % 100000).toString(36)}`;
  const cx = 70 + (h % 30);
  const cy = 20 + ((h >> 3) % 30);

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border">
      <svg viewBox="0 0 1200 380" className="block aspect-[16/6] w-full" role="img" aria-label={imageAlt || title}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c1} />
            <stop offset="1" stopColor={c2} />
          </linearGradient>
        </defs>
        <rect width="1200" height="380" fill={`url(#${gid})`} />
        {/* soft brand orbs — placement varies per page */}
        <circle cx={cx * 12} cy={cy * 3.8} r="180" fill={soft} opacity="0.18" />
        <circle cx={(cx * 12) - 240} cy={300} r="120" fill="#ffffff" opacity="0.08" />
        {/* faint grid for an on-brand "engine" texture */}
        <g opacity="0.5">
          {Array.from({ length: 7 }, (_, i) => (
            <line key={`v${i}`} x1={i * 200} y1="0" x2={i * 200} y2="380" stroke="#ffffff" strokeOpacity="0.05" />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 120} x2="1200" y2={i * 120} stroke="#ffffff" strokeOpacity="0.05" />
          ))}
        </g>
      </svg>
    </div>
  );
}

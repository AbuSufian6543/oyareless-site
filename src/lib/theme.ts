import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings-defaults";

/**
 * Turns the two admin-editable brand colours into the CSS custom properties the
 * Tailwind theme already reads.
 *
 * Tailwind v4 compiles `text-accent-500` to `color: var(--color-accent-500)`,
 * so redefining those variables on `:root` at runtime retints the whole site
 * without a rebuild. Intermediate shades are derived with `color-mix()` rather
 * than stored individually, which keeps the admin form to a single colour
 * picker per ramp.
 */

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Only well-formed hex literals reach the stylesheet. */
function safeHex(value: string, fallback: string): string {
  const trimmed = value.trim();
  return HEX.test(trimmed) ? trimmed : fallback;
}

/**
 * Mix percentages chosen so a mid-tone brand hex lands on a ramp with roughly
 * the same perceptual spacing as the hand-picked navy and brand ramps.
 */
const TINTS: Array<[shade: number, percent: number]> = [
  [50, 12],
  [100, 22],
  [200, 40],
  [300, 62],
  [400, 82],
];

const SHADES: Array<[shade: number, percent: number]> = [
  [600, 82],
  [700, 64],
  [800, 50],
  [900, 40],
  [950, 30],
];

function ramp(name: string, hex: string): string {
  const lines = [`--color-${name}-500:${hex};`];

  for (const [shade, percent] of TINTS) {
    lines.push(
      `--color-${name}-${shade}:color-mix(in oklab,${hex} ${percent}%,white);`,
    );
  }
  for (const [shade, percent] of SHADES) {
    lines.push(
      `--color-${name}-${shade}:color-mix(in oklab,${hex} ${percent}%,black);`,
    );
  }

  return lines.join("");
}

/**
 * Returns a stylesheet body, or an empty string when both colours are still the
 * compiled-in defaults so the common case ships no extra bytes.
 */
export function themeCss(settings: SiteSettings): string {
  const accent = safeHex(settings.themeAccent, DEFAULT_SETTINGS.themeAccent);
  const primary = safeHex(settings.themePrimary, DEFAULT_SETTINGS.themePrimary);

  const accentChanged = accent !== DEFAULT_SETTINGS.themeAccent;
  const primaryChanged = primary !== DEFAULT_SETTINGS.themePrimary;

  if (!accentChanged && !primaryChanged) return "";

  const blocks = [
    accentChanged ? ramp("accent", accent) : "",
    primaryChanged ? ramp("brand", primary) : "",
  ].join("");

  return `:root{${blocks}}`;
}

/** Meta `theme-color`, kept in step with the navy header. */
export const THEME_COLOR = "#0a2a4e";

/** Clamps the hero overlay opacity that admins type as free text. */
export function heroOverlayOpacity(settings: SiteSettings): number {
  const parsed = Number.parseFloat(settings.homeHeroOverlay);
  if (!Number.isFinite(parsed)) return 0.78;
  return Math.min(Math.max(parsed, 0), 1);
}

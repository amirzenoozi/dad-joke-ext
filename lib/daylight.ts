// The "dreamy fluid gradient" engine. The sky the extension paints is a smooth
// function of the clock: eight colour anchors spaced every three hours, linearly
// interpolated by the exact minute, so 07:45 sits three-quarters of the way from
// dawn toward morning. Everything downstream (blob colours, accent, and the ink
// colour chosen for contrast) is derived from the palette this returns.

export type Mode = 'light' | 'dark';

export interface Palette {
  /** Three drifting blob colours, brightest → deepest. */
  g1: string;
  g2: string;
  g3: string;
  /** Saturated highlight used for buttons and active states. */
  accent: string;
  /** Foreground colour that stays legible on this exact sky. */
  ink: string;
  /** Dimmed foreground for secondary text. */
  inkDim: string;
}

interface Anchor {
  h: number;
  colors: [string, string, string];
  accent: string;
}

// Hours run 0 → 21; the final segment wraps 21 → 24 back to the 0 anchor.
const ANCHORS: Anchor[] = [
  { h: 0, colors: ['#0b1026', '#241a52', '#12123a'], accent: '#7c6cff' }, // midnight
  { h: 3, colors: ['#12123a', '#3a1c5a', '#0b1026'], accent: '#7c6cff' }, // deep night
  { h: 6, colors: ['#ff9a8b', '#ff6a88', '#ffb6a3'], accent: '#ffd36e' }, // dawn
  { h: 9, colors: ['#a1c4fd', '#c2e9fb', '#c9f7d4'], accent: '#38bdf8' }, // morning
  { h: 12, colors: ['#7fdbff', '#66a6ff', '#a6c0fe'], accent: '#22d3ee' }, // midday
  { h: 15, colors: ['#fbc687', '#f79797', '#fbd786'], accent: '#fb7185' }, // afternoon
  { h: 18, colors: ['#c471f5', '#fa71cd', '#ff9a44'], accent: '#f472b6' }, // dusk
  { h: 21, colors: ['#4b2c73', '#3a1c5a', '#221046'], accent: '#a78bfa' }, // evening
];

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: Rgb): string {
  const to = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixHex(a: string, b: string, t: number): Rgb {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return [lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t)];
}

/** Perceptual-ish luminance (0 dark → 1 light) used to pick a legible ink. */
function luminance([r, g, b]: Rgb): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function darken(c: Rgb, factor: number): Rgb {
  return [c[0] * factor, c[1] * factor, c[2] * factor];
}

/** Fractional hour in [0, 24), e.g. 14.5 for 14:30. */
function hourOf(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

/**
 * The sky at a given instant. `mode` deepens every colour for dark mode; the ink
 * colour is then chosen from the *resulting* luminance so text stays readable at
 * every hour (a light "mode" at 2am still gets light ink on a dark sky).
 */
export function paletteAt(date: Date, mode: Mode): Palette {
  const h = hourOf(date);

  // Locate the segment [a, b] surrounding the current hour, wrapping past 21.
  let a = ANCHORS[ANCHORS.length - 1]!;
  let b = ANCHORS[0]!;
  let span = 24 - a.h;
  let t = (h - a.h + (h < a.h ? 24 : 0)) / span;
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const cur = ANCHORS[i]!;
    const nxt = ANCHORS[i + 1]!;
    if (h >= cur.h && h < nxt.h) {
      a = cur;
      b = nxt;
      span = nxt.h - cur.h;
      t = (h - cur.h) / span;
      break;
    }
  }

  const factor = mode === 'dark' ? 0.62 : 1;
  const c1 = darken(mixHex(a.colors[0], b.colors[0], t), factor);
  const c2 = darken(mixHex(a.colors[1], b.colors[1], t), factor);
  const c3 = darken(mixHex(a.colors[2], b.colors[2], t), factor);
  const accent = mixHex(a.accent, b.accent, t);

  const avg = (luminance(c1) + luminance(c2) + luminance(c3)) / 3;
  const light = avg > 0.55;
  const ink = light ? '#1b1e2e' : '#f5f6ff';
  const inkDim = light ? 'rgba(27, 30, 46, 0.62)' : 'rgba(245, 246, 255, 0.66)';

  return {
    g1: rgbToHex(c1),
    g2: rgbToHex(c2),
    g3: rgbToHex(c3),
    accent: rgbToHex(accent),
    ink,
    inkDim,
  };
}

/** A time-appropriate greeting for the clock/greeting tiles. */
export function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

/** Short weekday + date, e.g. "Mon, Jul 6". */
export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** 24h-aware HH:MM in the user's locale. */
export function formatClock(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

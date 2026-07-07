// The ways Dad Joke can present a joke. Every theme is a card — same joke, a
// different personality of card. Each id maps to a `data-theme` value on
// <html>; the CSS does the rest. `swatch` is the little gradient shown in the
// theme switcher so the choice reads at a glance.

export type ThemeId = 'basic' | 'terminal' | 'dos' | 'twitter';

export interface Theme {
  id: ThemeId;
  label: string;
  hint: string;
  /** CSS background used for the switcher swatch. */
  swatch: string;
}

export const THEMES: Theme[] = [
  {
    id: 'basic',
    label: 'Basic',
    hint: 'Clean frosted card on a dreamy gradient',
    swatch: 'linear-gradient(135deg, #c471f5, #66a6ff)',
  },
  {
    id: 'terminal',
    label: 'Terminal',
    hint: 'macOS terminal window',
    swatch: 'linear-gradient(135deg, #101418, #1f9c5a)',
  },
  {
    id: 'dos',
    label: 'DOS',
    hint: 'Retro MS-DOS blue screen',
    swatch: 'linear-gradient(135deg, #0000aa 60%, #55ffff)',
  },
  {
    id: 'twitter',
    label: 'Twitter',
    hint: 'Presented as a tweet',
    swatch: 'linear-gradient(135deg, #1d9bf0, #0f1419)',
  },
];

export const DEFAULT_THEME: ThemeId = 'basic';

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === 'string' && THEMES.some((t) => t.id === v);
}

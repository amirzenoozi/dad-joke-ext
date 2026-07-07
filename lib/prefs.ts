import { DEFAULT_THEME, isThemeId, type ThemeId } from './themes';
import type { Mode } from './daylight';

// User preferences live in localStorage (not browser.storage), which keeps the
// extension at zero permissions — the whole New Tab page is same-origin, so
// localStorage is always available and needs no manifest grant.

/** How dark mode is decided: follow the OS, or force a choice. */
export type ModeSetting = 'auto' | 'light' | 'dark';

export interface Prefs {
  theme: ThemeId;
  mode: ModeSetting;
  /** Auto-translate jokes and labels into the browser's language. */
  translate: boolean;
}

const KEY = 'dadjoke:prefs';

export const DEFAULT_PREFS: Prefs = {
  theme: DEFAULT_THEME,
  mode: 'auto',
  translate: true,
};

const MODES: ModeSetting[] = ['auto', 'light', 'dark'];

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      theme: isThemeId(parsed.theme) ? parsed.theme : DEFAULT_PREFS.theme,
      mode: MODES.includes(parsed.mode as ModeSetting)
        ? (parsed.mode as ModeSetting)
        : DEFAULT_PREFS.mode,
      translate: typeof parsed.translate === 'boolean' ? parsed.translate : DEFAULT_PREFS.translate,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Private-mode / storage-disabled: preferences simply won't persist.
  }
}

/** Resolve the `auto` setting against the OS preference into a concrete mode. */
export function resolveMode(setting: ModeSetting): Mode {
  if (setting === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return setting;
}

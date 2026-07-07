import { fetchDadJoke } from '@/lib/joke';
import { THEMES, type ThemeId } from '@/lib/themes';
import { loadPrefs, savePrefs, resolveMode, type ModeSetting, type Prefs } from '@/lib/prefs';
import { paletteAt, formatClock, formatDate } from '@/lib/daylight';
import { targetLanguage, createTranslator, type Translator } from '@/lib/translate';
import { getRecentBookmarks, faviconUrl, monogram, discColor } from '@/lib/bookmarks';
import { toPng } from 'html-to-image';
import './style.css';

const root = document.documentElement;
const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;

const cardEl = $<HTMLElement>('.joke');
const cardFrameEl = $<HTMLElement>('#card-frame');
const jokeEl = $<HTMLParagraphElement>('#joke');
const againEl = $<HTMLButtonElement>('#again');
const againLabel = $<HTMLSpanElement>('.again__label');
const themesEl = $<HTMLDivElement>('#themes');
const modeEl = $<HTMLButtonElement>('#mode');
const langEl = $<HTMLButtonElement>('#lang');
const downloadEl = $<HTMLButtonElement>('#download');
const clockEl = $<HTMLSpanElement>('#clock');
const twTimeEl = $<HTMLTimeElement>('#tw-time');
const bookmarksEl = $<HTMLElement>('#bookmarks');

const UI = {
  again: 'Another one',
  loading: 'Loading a fresh one…',
  error: "Couldn't reach the joke server. Try again?",
};

let prefs: Prefs = loadPrefs();

// ---- Translation --------------------------------------------------------

const target = targetLanguage(); // e.g. 'de', or null when the browser is English
let translator: Translator | null = null;

/** Lazily create the translator; safe to call repeatedly. Returns readiness. */
async function ensureTranslator(): Promise<boolean> {
  if (translator) return true;
  if (!target || !prefs.translate) return false;
  translator = await createTranslator(target);
  return translator !== null;
}

/** Translate to the browser language when enabled; otherwise pass text through. */
async function t(text: string): Promise<string> {
  if (!target || !prefs.translate) return text;
  if (!(await ensureTranslator())) return text;
  return translator!.translate(text);
}

/**
 * Set an element's text to the translation of `english`, remembering the source
 * on the node so a later toggle (or a model that finishes downloading) can
 * re-translate it. The guard drops stale async results.
 */
function setText(el: HTMLElement, english: string): void {
  el.dataset.en = english;
  void t(english).then((out) => {
    if (el.dataset.en === english) el.textContent = out;
  });
}

/** Re-apply the current language to everything already on screen. */
function retranslate(): void {
  for (const el of [jokeEl, againLabel] as HTMLElement[]) {
    if (el.dataset.en) setText(el, el.dataset.en);
  }
}

function applyLang(): void {
  root.lang = target && prefs.translate ? target : 'en';
  if (!target) {
    langEl.hidden = true;
    return;
  }
  langEl.hidden = false;
  langEl.textContent = target.toUpperCase();
  langEl.classList.toggle('lang--off', !prefs.translate);
  langEl.dataset.tip = prefs.translate
    ? `Showing ${target.toUpperCase()} · tap for English`
    : `Show in ${target.toUpperCase()}`;
  langEl.setAttribute('aria-pressed', String(prefs.translate));
}

langEl.addEventListener('click', async () => {
  prefs = { ...prefs, translate: !prefs.translate };
  savePrefs(prefs);
  applyLang();
  await ensureTranslator(); // this click is a user gesture — lets the model download
  retranslate();
});

// ---- Theme --------------------------------------------------------------

function applyTheme(theme: ThemeId) {
  root.dataset.theme = theme;
  themesEl.querySelectorAll<HTMLButtonElement>('.swatch').forEach((btn) => {
    const active = btn.dataset.theme === theme;
    btn.classList.toggle('swatch--active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

for (const theme of THEMES) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'swatch';
  btn.dataset.theme = theme.id;
  btn.style.background = theme.swatch;
  btn.dataset.tip = theme.label;
  btn.setAttribute('aria-label', `${theme.label} theme — ${theme.hint}`);
  btn.addEventListener('click', () => {
    prefs = { ...prefs, theme: theme.id };
    savePrefs(prefs);
    applyTheme(theme.id);
  });
  themesEl.append(btn);
}

// ---- Dark mode ----------------------------------------------------------

const MODE_ICON: Record<ModeSetting, string> = { auto: '◐', light: '☀', dark: '☾' };
const NEXT_MODE: Record<ModeSetting, ModeSetting> = { auto: 'light', light: 'dark', dark: 'auto' };

function applyMode(setting: ModeSetting) {
  const resolved = resolveMode(setting);
  root.dataset.mode = resolved;
  modeEl.textContent = MODE_ICON[setting];
  modeEl.dataset.tip =
    setting === 'auto' ? `Auto · ${resolved}` : `${setting[0]!.toUpperCase()}${setting.slice(1)} mode`;
  paint();
}

modeEl.addEventListener('click', () => {
  prefs = { ...prefs, mode: NEXT_MODE[prefs.mode] };
  savePrefs(prefs);
  applyMode(prefs.mode);
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (prefs.mode === 'auto') applyMode('auto');
});

// ---- Download card as image ---------------------------------------------

const EXPORT_PADDING = 50;

downloadEl.addEventListener('click', async () => {
  downloadEl.disabled = true;
  try {
    // Every card is opaque except Basic, whose frosted surface is translucent.
    // Backdrop blur can't be captured, so give that export a solid sky-tone
    // backdrop; the others stay transparent for a clean rounded cut-out.
    const bg =
      root.dataset.theme === 'basic'
        ? getComputedStyle(root).getPropertyValue('--g2').trim() || undefined
        : undefined;

    // Capture the (normally padding-less) frame, adding 50px around the card for
    // the export only. width/height must grow to match, or the padding is clipped.
    const { width, height } = cardEl.getBoundingClientRect();
    const dataUrl = await toPng(cardFrameEl, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: bg,
      width: width + EXPORT_PADDING * 2,
      height: height + EXPORT_PADDING * 2,
      style: { padding: `${EXPORT_PADDING}px`, boxSizing: 'content-box' },
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `dad-joke-${root.dataset.theme ?? 'card'}.png`;
    a.click();
  } catch {
    // Rendering can fail on exotic content; there's nothing to persist, so ignore.
  } finally {
    downloadEl.disabled = false;
  }
});

// ---- Gradient + clock ---------------------------------------------------

function paint(now = new Date()) {
  const p = paletteAt(now, resolveMode(prefs.mode));
  root.style.setProperty('--g1', p.g1);
  root.style.setProperty('--g2', p.g2);
  root.style.setProperty('--g3', p.g3);
  root.style.setProperty('--accent', p.accent);
  root.style.setProperty('--ink', p.ink);
  root.style.setProperty('--ink-dim', p.inkDim);
}

function tick() {
  const now = new Date();
  const clock = formatClock(now); // locale-aware already
  clockEl.textContent = clock;
  twTimeEl.textContent = `${clock} · ${formatDate(now)}`;
  paint(now);
}

// ---- Joke ---------------------------------------------------------------

let controller: AbortController | undefined;

async function loadJoke() {
  controller?.abort();
  controller = new AbortController();
  againEl.disabled = true;
  jokeEl.classList.add('joke__text--loading');
  setText(jokeEl, UI.loading);
  try {
    const joke = await fetchDadJoke(controller.signal);
    jokeEl.dataset.en = joke;
    jokeEl.textContent = await t(joke); // translate before revealing — no English flash
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return;
    setText(jokeEl, UI.error);
  } finally {
    jokeEl.classList.remove('joke__text--loading');
    againEl.disabled = false;
  }
}

againEl.addEventListener('click', async () => {
  await ensureTranslator(); // a click can grant the model download
  await loadJoke();
});

// ---- Recent bookmarks ---------------------------------------------------

async function renderBookmarks() {
  const items = await getRecentBookmarks(10);
  bookmarksEl.replaceChildren();
  if (items.length === 0) {
    bookmarksEl.hidden = true;
    return;
  }

  for (const bm of items) {
    const link = document.createElement('a');
    link.className = 'bm';
    link.href = bm.url;
    link.dataset.tip = bm.title;
    link.setAttribute('aria-label', bm.title);

    const disc = document.createElement('span');
    disc.className = 'bm__disc';
    disc.style.background = discColor(bm.url);

    const mono = document.createElement('span');
    mono.className = 'bm__mono';
    mono.textContent = monogram(bm.title);
    disc.append(mono);

    // Real favicon on Chrome/Edge; on load it covers the monogram. On Firefox
    // (or a load error) the monogram stays.
    const fav = faviconUrl(bm.url, 64);
    if (fav) {
      const img = document.createElement('img');
      img.className = 'bm__img';
      img.alt = '';
      img.addEventListener('load', () => disc.classList.add('bm__disc--img'));
      img.addEventListener('error', () => img.remove());
      img.src = fav;
      disc.append(img);
    }

    const label = document.createElement('span');
    label.className = 'bm__label';
    label.textContent = bm.title;

    link.append(disc, label);
    bookmarksEl.append(link);
  }
  bookmarksEl.hidden = false;
}

// ---- Boot ---------------------------------------------------------------

applyTheme(prefs.theme);
applyMode(prefs.mode);
applyLang();
setText(againLabel, UI.again);
tick();
setInterval(tick, 1000);
loadJoke();
renderBookmarks();

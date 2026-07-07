// The user's most-recent bookmarks, shown as quick-launch circles under the
// card. Reading them needs the `bookmarks` permission; favicons come from the
// browser's local cache via the `favicon` permission (Chrome/Edge only) — both
// stay on-device, nothing is sent anywhere.

export interface RecentBookmark {
  title: string;
  url: string;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** The `count` most recently added bookmarks (folders excluded). */
export async function getRecentBookmarks(count: number): Promise<RecentBookmark[]> {
  if (!browser.bookmarks) return [];
  try {
    const nodes = await browser.bookmarks.getRecent(count);
    return nodes
      .filter((n) => !!n.url)
      .map((n) => ({ title: n.title?.trim() || hostnameOf(n.url!), url: n.url! }));
  } catch {
    // Permission missing or API unavailable — just show nothing.
    return [];
  }
}

/**
 * A URL into the browser's favicon cache for a page, or null on Firefox (which
 * has no favicon API). Reading it makes no network request; unknown pages fall
 * back to the browser's default globe icon.
 */
export function faviconUrl(pageUrl: string, size = 32): string | null {
  if (import.meta.env.BROWSER === 'firefox') return null;
  try {
    // Resolve `/_favicon/` against the extension origin. (getURL is typed to
    // known public paths only, so build the URL from a known one.)
    const u = new URL('/_favicon/', browser.runtime.getURL('/newtab.html'));
    u.searchParams.set('pageUrl', pageUrl);
    u.searchParams.set('size', String(size));
    return u.toString();
  } catch {
    return null;
  }
}

/** First letter of the title, for the monogram fallback disc. */
export function monogram(title: string): string {
  return (title.trim()[0] ?? '?').toUpperCase();
}

/** A stable, pleasant colour derived from the URL, for the monogram disc. */
export function discColor(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 58% 52%)`;
}

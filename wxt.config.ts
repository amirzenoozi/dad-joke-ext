import { defineConfig } from 'wxt';

// WXT generates one manifest per browser from this config + the files in
// entrypoints/. The `newtab` entrypoint (entrypoints/newtab/) is auto-detected
// and wired up as `chrome_url_overrides.newtab`. The manifest is a function so
// the Chrome/Edge-only `favicon` permission is omitted on Firefox (which has no
// favicon API). See https://wxt.dev/guide/essentials/config/manifest.html
export default defineConfig({
  manifest: ({ browser }) => {
    // `bookmarks` (both browsers): read the user's recent bookmarks.
    // `favicon` (Chromium only): read site icons from the local favicon cache —
    // no network request. Firefox falls back to monogram discs.
    const permissions = ['bookmarks'];
    if (browser !== 'firefox' && browser !== 'safari') permissions.push('favicon');

    return {
      name: 'Dad Joke',
      description: 'A Simple New Tab To Laugh At Dad Jokes!',
      permissions,
      // Extension icon (management page, store listing).
      icons: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        128: 'icon/128.png',
      },
      // The New Tab page fetches https://icanhazdadjoke.com/, which returns
      // `Access-Control-Allow-Origin: *`, so no host permission is required.
      browser_specific_settings: {
        gecko: {
          // Required by AMO. Change to your own id before publishing.
          id: 'dad-joke@amirzenoozi.dev',
          // We don't collect or transmit any user data — declare so for AMO.
          // (Firefox-only key; WXT strips browser_specific_settings for Chrome.)
          data_collection_permissions: {
            required: ['none'],
          },
        },
      },
    };
  },
});

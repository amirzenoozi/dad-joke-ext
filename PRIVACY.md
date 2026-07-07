# Privacy Policy — Dad Joke

**Effective date:** July 7, 2026

Dad Joke is a browser extension that replaces your New Tab page with a random
dad joke. This policy explains exactly what the extension does and does not do
with your data.

## Summary

**Dad Joke does not collect, store, sell, or transmit any personal data.** There
are no accounts, no analytics, no advertising, and no third-party trackers.

## What data the extension handles

Your preferences (theme, dark-mode, translation toggle) are saved in
`localStorage` on your device. Everything else the extension touches — your
recent bookmarks and site icons — is read locally and shown only in your New Tab.
None of it is ever collected or transmitted.

### Network requests

Each time you open a New Tab, the extension makes a single request to the
public **icanhazdadjoke.com** API to fetch one random joke. This request
contains no identifier of you — just a standard request for a joke. Your use of
icanhazdadjoke.com is subject to their own privacy policy.

The extension makes no other network requests, and sends no browsing history,
identity, bookmarks, or personal information to anyone.

## Permissions

Dad Joke requests two permissions, both used entirely on your device:

- **`bookmarks`** — to read your five most recently added bookmarks and show them
  as quick-launch shortcuts under the joke card. Your bookmarks are read locally
  and displayed only in your own New Tab; they are never sent anywhere.
- **`favicon`** (Chrome/Edge only) — to display each bookmark's site icon from the
  browser's local favicon cache. This makes **no network request**; on Firefox,
  which has no favicon API, the extension shows a coloured letter instead.

Dad Joke requests **no host permissions**. The joke API returns a permissive CORS
header (`Access-Control-Allow-Origin: *`), so the New Tab page fetches a joke
without any host access. Translation runs on-device via the browser's built-in
Translator API, and image export renders locally in your browser — neither needs a
permission or a network call.

## Children's privacy

Dad Joke is a general-purpose novelty extension and is not directed at children.
It collects no personal information from anyone.

## Changes to this policy

If this policy changes, the updated version will be published in the project
repository with a new effective date.

## Contact

Questions or concerns: please open an issue at
<https://github.com/amirzenoozi/dad-joke-ext/issues>.

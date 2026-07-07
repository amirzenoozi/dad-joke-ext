/**
 * icanhazdadjoke.com asks API clients to identify themselves with a descriptive
 * User-Agent that includes a contact URL, so they can reach out before rate
 * limiting. The endpoint returns `Access-Control-Allow-Origin: *`, so the New
 * Tab page can call it directly without any host permission.
 * https://icanhazdadjoke.com/api
 */
export const DAD_JOKE_API = 'https://icanhazdadjoke.com/';

export const USER_AGENT =
  'Dad Joke New Tab (https://github.com/amirzenoozi/dad-joke-ext)';

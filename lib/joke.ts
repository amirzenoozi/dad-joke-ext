import { DAD_JOKE_API, USER_AGENT } from './config';

interface DadJokeResponse {
  id: string;
  joke: string;
  status: number;
}

/**
 * Fetch a single random dad joke. Returns the joke text, or throws if the
 * network request fails or the response is malformed.
 */
export async function fetchDadJoke(signal?: AbortSignal): Promise<string> {
  const res = await fetch(DAD_JOKE_API, {
    headers: {
      Accept: 'application/json',
      // Chrome forbids overriding User-Agent from fetch(); it's ignored there
      // but honoured by Firefox, keeping us in good standing with the API.
      'User-Agent': USER_AGENT,
    },
    signal,
  });

  if (!res.ok) {
    throw new Error(`icanhazdadjoke responded with ${res.status}`);
  }

  const data = (await res.json()) as DadJokeResponse;
  if (!data.joke) {
    throw new Error('No joke in response');
  }
  return data.joke;
}

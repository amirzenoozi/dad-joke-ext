// On-device translation via Chrome's built-in Translator API (Chrome 138+):
// no network, no API key, no manifest permission. The model runs locally, so
// this keeps the extension's zero-permission promise intact. Where the API is
// missing (e.g. Firefox) or a language pair is unsupported, every call falls
// back to the original English text — nothing breaks.

type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

interface TranslatorInstance {
  translate(input: string): Promise<string>;
}

interface TranslatorFactory {
  availability(opts: { sourceLanguage: string; targetLanguage: string }): Promise<Availability>;
  create(opts: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorInstance>;
}

function factory(): TranslatorFactory | null {
  return (globalThis as unknown as { Translator?: TranslatorFactory }).Translator ?? null;
}

/** Whether on-device translation exists in this browser at all. */
export function translationSupported(): boolean {
  return factory() !== null;
}

/**
 * The user's primary UI language as a base code (e.g. 'de' from 'de-DE'), or
 * null when it's already English — in which case there's nothing to translate.
 */
export function targetLanguage(): string | null {
  const first = (navigator.languages?.[0] ?? navigator.language ?? 'en').toLowerCase();
  const base = first.split('-')[0];
  return base && base !== 'en' ? base : null;
}

export interface Translator {
  translate(text: string): Promise<string>;
}

/**
 * Build an English→`target` translator, or null if the API is missing, the
 * pair is unsupported, or the model still needs a download that hasn't been
 * granted. Downloads require a user gesture, so a null here isn't fatal:
 * retry from inside a click (the "Another one" or language button) and it
 * will start downloading and succeed.
 */
export async function createTranslator(target: string): Promise<Translator | null> {
  const api = factory();
  if (!api) return null;

  let status: Availability;
  try {
    status = await api.availability({ sourceLanguage: 'en', targetLanguage: target });
  } catch {
    return null;
  }
  if (status === 'unavailable') return null;

  let instance: TranslatorInstance;
  try {
    instance = await api.create({ sourceLanguage: 'en', targetLanguage: target });
  } catch {
    return null; // typically: needs a user gesture to download the model
  }

  // Jokes and labels repeat, so cache by source text to avoid re-running the model.
  const cache = new Map<string, string>();
  return {
    async translate(text: string): Promise<string> {
      if (!text.trim()) return text;
      const cached = cache.get(text);
      if (cached !== undefined) return cached;
      try {
        const out = await instance.translate(text);
        cache.set(text, out);
        return out;
      } catch {
        return text;
      }
    },
  };
}

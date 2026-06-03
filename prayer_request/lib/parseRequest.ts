import { normalizeBibleVersion, type BibleVersionAbbrev } from './bibleVersions.js';

const MAX_USER_TEXT = Number(process.env.OPENAI_MAX_USER_TEXT_CHARS ?? '1500');

export type ParsedRequest =
  | { text: string; bible_version: BibleVersionAbbrev }
  | { error: string };

function truncateText(text: string): string {
  if (text.length <= MAX_USER_TEXT) return text;
  return text.slice(0, MAX_USER_TEXT);
}

export function parseRequest(part: { text?: string; [key: string]: unknown } | undefined): ParsedRequest {
  if (!part) {
    return { error: 'Missing request part.' };
  }

  const obj: Record<string, unknown> = {};
  if (typeof part.text === 'string' && part.text.trim() !== '') {
    try {
      const parsed = JSON.parse(part.text) as unknown;
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        Object.assign(obj, parsed as Record<string, unknown>);
      } else {
        return { error: 'Invalid JSON in request part.' };
      }
    } catch {
      return { error: 'Invalid JSON in request part.' };
    }
  }

  const textRaw = typeof obj.text === 'string' ? obj.text : '';
  const text = truncateText(textRaw.trim());
  if (!text) {
    return { error: 'text is required' };
  }

  const bible_version = normalizeBibleVersion(obj.bible_version);
  return { text, bible_version };
}

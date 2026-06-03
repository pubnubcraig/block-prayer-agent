export const ALLOWED_BIBLE_VERSIONS = ['ASV'] as const;

export type BibleVersionAbbrev = (typeof ALLOWED_BIBLE_VERSIONS)[number];

export const DEFAULT_BIBLE_VERSION: BibleVersionAbbrev = 'ASV';

export function normalizeBibleVersion(input: unknown): BibleVersionAbbrev {
  const raw = typeof input === 'string' ? input.trim().toUpperCase() : '';
  if (ALLOWED_BIBLE_VERSIONS.includes(raw as BibleVersionAbbrev)) {
    return raw as BibleVersionAbbrev;
  }
  return DEFAULT_BIBLE_VERSION;
}

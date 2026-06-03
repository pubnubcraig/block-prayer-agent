export const ALLOWED_BIBLE_VERSIONS = [
  'ESV',
  'NIV',
  'KJV',
  'NKJV',
  'NLT',
  'NASB',
  'CSB',
  'NRSV',
  'MSG',
  'AMP',
] as const;

export type BibleVersionAbbrev = (typeof ALLOWED_BIBLE_VERSIONS)[number];

export const DEFAULT_BIBLE_VERSION: BibleVersionAbbrev = 'ESV';

export function normalizeBibleVersion(input: unknown): BibleVersionAbbrev {
  const raw = typeof input === 'string' ? input.trim().toUpperCase() : '';
  if (ALLOWED_BIBLE_VERSIONS.includes(raw as BibleVersionAbbrev)) {
    return raw as BibleVersionAbbrev;
  }
  return DEFAULT_BIBLE_VERSION;
}

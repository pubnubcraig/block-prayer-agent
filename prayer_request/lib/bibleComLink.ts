import type { BibleVersionAbbrev } from './bibleVersions.js';

/**
 * bible.com reader path IDs (may differ from YouVersion API version id).
 * Suffix is the abbreviation appended to the passage segment.
 */
const BIBLE_COM_READER: Partial<
  Record<BibleVersionAbbrev, { readerPathId: number; suffix: string }>
> = {
  ASV: { readerPathId: 12, suffix: 'ASV' },
};

export function buildVerseLink(
  abbrev: BibleVersionAbbrev,
  usfm: string,
  youversionDeepLink?: string,
): string {
  const reader = BIBLE_COM_READER[abbrev];
  if (reader) {
    const passage = usfm.replace(/\./g, '.');
    return `https://www.bible.com/bible/${reader.readerPathId}/${passage}.${reader.suffix}`;
  }
  if (youversionDeepLink) {
    return youversionDeepLink;
  }
  return 'https://www.bible.com/';
}

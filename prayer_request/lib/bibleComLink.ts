import type { BibleVersionAbbrev } from './bibleVersions.js';

/**
 * bible.com reader path IDs (may differ from YouVersion API version id).
 * Suffix is the abbreviation appended to the passage segment.
 */
const BIBLE_COM_READER: Partial<
  Record<BibleVersionAbbrev, { readerPathId: number; suffix: string }>
> = {
  ESV: { readerPathId: 59, suffix: 'ESV' },
  NIV: { readerPathId: 111, suffix: 'NIV' },
  KJV: { readerPathId: 1, suffix: 'KJV' },
  NKJV: { readerPathId: 114, suffix: 'NKJV' },
  NLT: { readerPathId: 116, suffix: 'NLT' },
  NASB: { readerPathId: 100, suffix: 'NASB' },
  CSB: { readerPathId: 1713, suffix: 'CSB' },
  NRSV: { readerPathId: 2016, suffix: 'NRSV' },
  MSG: { readerPathId: 97, suffix: 'MSG' },
  AMP: { readerPathId: 1588, suffix: 'AMP' },
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

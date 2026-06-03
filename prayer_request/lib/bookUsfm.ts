/** Map common book names (and variants) to USFM 3-letter codes. */
const BOOK_TO_USFM: Record<string, string> = {
  genesis: 'GEN',
  exodus: 'EXO',
  leviticus: 'LEV',
  numbers: 'NUM',
  deuteronomy: 'DEU',
  joshua: 'JOS',
  judges: 'JDG',
  ruth: 'RUT',
  '1 samuel': '1SA',
  '2 samuel': '2SA',
  '1 kings': '1KI',
  '2 kings': '2KI',
  '1 chronicles': '1CH',
  '2 chronicles': '2CH',
  ezra: 'EZR',
  nehemiah: 'NEH',
  esther: 'EST',
  job: 'JOB',
  psalm: 'PSA',
  psalms: 'PSA',
  proverbs: 'PRO',
  ecclesiastes: 'ECC',
  'song of solomon': 'SNG',
  isaiah: 'ISA',
  jeremiah: 'JER',
  lamentations: 'LAM',
  ezekiel: 'EZK',
  daniel: 'DAN',
  hosea: 'HOS',
  joel: 'JOL',
  amos: 'AMO',
  obadiah: 'OBA',
  jonah: 'JON',
  micah: 'MIC',
  nahum: 'NAM',
  habakkuk: 'HAB',
  zephaniah: 'ZEP',
  haggai: 'HAG',
  zechariah: 'ZEC',
  malachi: 'MAL',
  matthew: 'MAT',
  mark: 'MRK',
  luke: 'LUK',
  john: 'JHN',
  acts: 'ACT',
  romans: 'ROM',
  '1 corinthians': '1CO',
  '2 corinthians': '2CO',
  galatians: 'GAL',
  ephesians: 'EPH',
  philippians: 'PHP',
  colossians: 'COL',
  '1 thessalonians': '1TH',
  '2 thessalonians': '2TH',
  '1 timothy': '1TI',
  '2 timothy': '2TI',
  titus: 'TIT',
  philemon: 'PHM',
  hebrews: 'HEB',
  james: 'JAS',
  '1 peter': '1PE',
  '2 peter': '2PE',
  '1 john': '1JN',
  '2 john': '2JN',
  '3 john': '3JN',
  jude: 'JUD',
  revelation: 'REV',
};

/**
 * Normalize USFM from model output: uppercase book, fix spacing.
 * Accepts "PHP.4.6-7", "Philippians 4:6-7" (parsed), etc.
 */
export function normalizeUsfm(raw: string, bibleVerse?: string): string {
  const trimmed = raw.trim();
  const usfmMatch = trimmed.match(/^([1-3]?[A-Z]{2,3})\.(\d+)\.(\d+)(?:-(\d+))?$/i);
  if (usfmMatch) {
    const book = usfmMatch[1].toUpperCase();
    const chapter = usfmMatch[2];
    const start = usfmMatch[3];
    const end = usfmMatch[4];
    return end && end !== start ? `${book}.${chapter}.${start}-${end}` : `${book}.${chapter}.${start}`;
  }

  const ref = (bibleVerse ?? trimmed).trim();
  const parsed = parseHumanReference(ref);
  if (parsed) {
    const { book, chapter, start, end } = parsed;
    const usfmBook = BOOK_TO_USFM[book.toLowerCase()] ?? book.slice(0, 3).toUpperCase();
    return end && end !== start
      ? `${usfmBook}.${chapter}.${start}-${end}`
      : `${usfmBook}.${chapter}.${start}`;
  }

  return trimmed.replace(/\s+/g, '').toUpperCase();
}

function parseHumanReference(ref: string): {
  book: string;
  chapter: string;
  start: string;
  end?: string;
} | null {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)(?:\s*-\s*(\d+))?$/i);
  if (!m) return null;
  return {
    book: m[1].trim(),
    chapter: m[2],
    start: m[3],
    end: m[4],
  };
}

import { parseRequest } from './parseRequest.js';
import { selectVerse, generatePastoral } from './openaiPrayer.js';
import { fetchPassageWithFallback } from './youversionBible.js';
import { buildVerseLink } from './bibleComLink.js';
import { normalizeBibleVersion } from './bibleVersions.js';

export type PrayerRequestInput = {
  text: string;
  bible_version?: string;
};

export type PrayerRequestResult = {
  bible_verse: string;
  verse_link: string;
  verse_content: string;
  verse_interpretation: string;
  advice: string;
  prayer: string;
  verse_copyright?: string;
};

export type PrayerRequestError = { error: string };

function parsePart(input: PrayerRequestInput) {
  return parseRequest({
    partId: 'request',
    text: JSON.stringify({
      text: input.text,
      bible_version: input.bible_version,
    }),
  });
}

export async function runPrayerCore(
  input: PrayerRequestInput,
  onStatus?: (message: string) => void,
): Promise<PrayerRequestResult | PrayerRequestError> {
  const parsed = parsePart(input);
  if ('error' in parsed) {
    return { error: parsed.error };
  }

  const { text, bible_version: requestedVersion } = parsed;
  const bible_version = normalizeBibleVersion(requestedVersion);

  try {
    onStatus?.('Selecting verse…');
    const selection = await selectVerse(text, bible_version);

    onStatus?.('Fetching Scripture…');
    const { passage, version } = await fetchPassageWithFallback(
      bible_version,
      selection.usfm,
    );

    const bible_verse = selection.bible_verse || passage.reference;
    const verse_content = passage.content;
    const verse_link = buildVerseLink(
      version.abbrev,
      selection.usfm,
      version.youversionDeepLink,
    );

    if (version.usedFallback) {
      onStatus?.(
        `Requested ${bible_version}; verse text from ${version.abbreviation} (id ${version.id}) due to YouVersion license availability.`,
      );
    }
    if (version.copyright) {
      onStatus?.(
        JSON.stringify({ copyright: version.copyright.slice(0, 200) }),
      );
    }

    onStatus?.('Preparing response…');
    const pastoral = await generatePastoral({
      text,
      bible_version: version.abbrev,
      bible_verse,
      verse_content,
    });

    const result: PrayerRequestResult = {
      bible_verse,
      verse_link,
      verse_content,
      verse_interpretation: pastoral.verse_interpretation,
      advice: pastoral.advice,
      prayer: pastoral.prayer,
      ...(version.copyright ? { verse_copyright: version.copyright } : {}),
    };

    for (const key of [
      'bible_verse',
      'verse_link',
      'verse_content',
      'verse_interpretation',
      'advice',
      'prayer',
    ] as const) {
      if (!result[key]?.trim()) {
        return { error: `Missing or empty field: ${key}` };
      }
    }

    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: message };
  }
}

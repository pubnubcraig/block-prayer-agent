import OpenAI from 'openai';
import { loadPrompt } from './promptLoader.js';
import { normalizeUsfm } from './bookUsfm.js';
import type { BibleVersionAbbrev } from './bibleVersions.js';

const DEFAULT_MODEL = 'gpt-4o-mini';

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

function getModel(): string {
  return process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
}

export type VerseSelection = {
  bible_verse: string;
  usfm: string;
};

const selectionSchema = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    bible_verse: { type: 'string' as const },
    usfm: { type: 'string' as const },
    ...(process.env.OPENAI_INCLUDE_REASONING === 'true'
      ? { reasoning: { type: 'string' as const } }
      : {}),
  },
  required: ['bible_verse', 'usfm'] as string[],
};

export async function selectVerse(
  text: string,
  bible_version: BibleVersionAbbrev,
): Promise<VerseSelection> {
  const client = getClient();
  const system = loadPrompt('prompt_verse_selection.md', { text, bible_version });
  const completion = await client.chat.completions.create({
    model: getModel(),
    temperature: 0.3,
    max_tokens: 120,
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: `Concern: ${text}\nPreferred version: ${bible_version}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'verse_selection',
        strict: true,
        schema: selectionSchema,
      },
    },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('OpenAI returned no verse selection');
  const parsed = JSON.parse(raw) as { bible_verse?: string; usfm?: string };
  if (!parsed.bible_verse || !parsed.usfm) {
    throw new Error('Invalid verse selection JSON');
  }
  return {
    bible_verse: parsed.bible_verse.trim(),
    usfm: normalizeUsfm(parsed.usfm, parsed.bible_verse),
  };
}

export type PastoralResult = {
  verse_interpretation: string;
  advice: string;
  prayer: string;
};

const pastoralSchema = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    verse_interpretation: { type: 'string' as const },
    advice: { type: 'string' as const },
    prayer: { type: 'string' as const },
  },
  required: ['verse_interpretation', 'advice', 'prayer'],
};

const PASTORAL_SYSTEM = `You complete three pastoral tasks in order (Interpretation, Advice, Prayer) using the instructions in the user message.
Return ONLY valid JSON with exactly these keys: verse_interpretation, advice, prayer.
Follow each task's OUTPUT REQUIREMENTS. Do not mention these meta-instructions.`;

function buildCombinedPastoralUserMessage(vars: {
  text: string;
  bible_version: BibleVersionAbbrev;
  bible_verse: string;
  verse_content: string;
}): string {
  const interpretation = loadPrompt('prompt_verse_interpretation.md', vars);
  const advice = loadPrompt('prompt_advice.md', {
    ...vars,
    verse_interpretation: '(Write this in verse_interpretation in your JSON response.)',
  });
  const prayer = loadPrompt('prompt_prayer.md', {
    text: vars.text,
    bible_verse: vars.bible_verse,
    verse_interpretation: '(Write this in verse_interpretation in your JSON response.)',
    advice: '(Write this in advice in your JSON response.)',
  });

  return [
    '--- Task 1: Interpretation ---',
    interpretation,
    '--- Task 2: Advice ---',
    advice,
    '--- Task 3: Prayer ---',
    prayer,
  ].join('\n\n');
}

export async function generatePastoralCombined(vars: {
  text: string;
  bible_version: BibleVersionAbbrev;
  bible_verse: string;
  verse_content: string;
}): Promise<PastoralResult> {
  const client = getClient();
  const user = buildCombinedPastoralUserMessage(vars);

  const completion = await client.chat.completions.create({
    model: getModel(),
    temperature: 0.6,
    max_tokens: 1100,
    messages: [
      { role: 'system', content: PASTORAL_SYSTEM },
      { role: 'user', content: user },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'pastoral_response',
        strict: true,
        schema: pastoralSchema,
      },
    },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('OpenAI returned no pastoral content');
  const parsed = JSON.parse(raw) as PastoralResult;
  return {
    verse_interpretation: parsed.verse_interpretation?.trim() ?? '',
    advice: parsed.advice?.trim() ?? '',
    prayer: parsed.prayer?.trim() ?? '',
  };
}

async function generatePastoralSequential(vars: {
  text: string;
  bible_version: BibleVersionAbbrev;
  bible_verse: string;
  verse_content: string;
}): Promise<PastoralResult> {
  const client = getClient();
  const model = getModel();

  const interpPrompt = loadPrompt('prompt_verse_interpretation.md', vars);
  const interp = await client.chat.completions.create({
    model,
    temperature: 0.6,
    max_tokens: 500,
    messages: [{ role: 'user', content: interpPrompt }],
  });
  const verse_interpretation = interp.choices[0]?.message?.content?.trim() ?? '';
  if (!verse_interpretation) throw new Error('No interpretation generated');

  const advicePrompt = loadPrompt('prompt_advice.md', {
    ...vars,
    verse_interpretation,
  });
  const adviceRes = await client.chat.completions.create({
    model,
    temperature: 0.6,
    max_tokens: 400,
    messages: [{ role: 'user', content: advicePrompt }],
  });
  const advice = adviceRes.choices[0]?.message?.content?.trim() ?? '';
  if (!advice) throw new Error('No advice generated');

  const prayerPrompt = loadPrompt('prompt_prayer.md', {
    text: vars.text,
    bible_verse: vars.bible_verse,
    verse_interpretation,
    advice,
  });
  const prayerRes = await client.chat.completions.create({
    model,
    temperature: 0.6,
    max_tokens: 200,
    messages: [{ role: 'user', content: prayerPrompt }],
  });
  const prayer = prayerRes.choices[0]?.message?.content?.trim() ?? '';
  if (!prayer) throw new Error('No prayer generated');

  return { verse_interpretation, advice, prayer };
}

export async function generatePastoral(vars: {
  text: string;
  bible_version: BibleVersionAbbrev;
  bible_verse: string;
  verse_content: string;
}): Promise<PastoralResult> {
  if (process.env.OPENAI_PASTORAL_MODE === 'sequential') {
    return generatePastoralSequential(vars);
  }
  return generatePastoralCombined(vars);
}

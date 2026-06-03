import 'dotenv/config';
import { TaskClient, textPart, decodeInlineArtifact } from '@blocks-network/sdk';
import type { ProgressEvent, ArtifactEvent, TerminalEvent } from '@blocks-network/sdk';

const SCENARIOS: Record<
  string,
  { label: string; body: Record<string, string>; expectError?: boolean }
> = {
  anxiety: {
    label: 'Anxiety / fear',
    body: {
      text: 'I feel overwhelmed with worry about the future and cannot sleep.',
      bible_version: 'ESV',
    },
  },
  grief: {
    label: 'Grief',
    body: {
      text: 'My mother passed away last week and I feel deep sadness and loneliness.',
      bible_version: 'ESV',
    },
  },
  decision: {
    label: 'Decision-making',
    body: {
      text: 'I need wisdom about whether to accept a new job in another city.',
      bible_version: 'ESV',
    },
  },
  gratitude: {
    label: 'Gratitude',
    body: {
      text: 'I am thankful for healing in my family and want to express gratitude to God.',
      bible_version: 'ESV',
    },
  },
  forgiveness: {
    label: 'Forgiveness',
    body: {
      text: 'Someone hurt me deeply and I am struggling to forgive them.',
      bible_version: 'ESV',
    },
  },
  kjv: {
    label: 'User-selected KJV',
    body: {
      text: 'I feel anxious about the future and need peace.',
      bible_version: 'KJV',
    },
  },
  empty: {
    label: 'Empty input',
    body: { text: '', bible_version: 'ESV' },
    expectError: true,
  },
};

const OUTPUT_KEYS = [
  'bible_verse',
  'verse_link',
  'verse_content',
  'verse_interpretation',
  'advice',
  'prayer',
] as const;

function assertResult(
  name: string,
  raw: string,
  expectError?: boolean,
): void {
  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(raw) as Record<string, string>;
  } catch {
    throw new Error(`[${name}] Artifact is not valid JSON`);
  }

  if (expectError) {
    if (!parsed.error) {
      throw new Error(`[${name}] Expected error field, got: ${raw.slice(0, 200)}`);
    }
    console.log(`[${name}] OK — error as expected: ${parsed.error}`);
    return;
  }

  if (parsed.error) {
    throw new Error(`[${name}] Unexpected error: ${parsed.error}`);
  }

  for (const key of OUTPUT_KEYS) {
    if (!parsed[key]?.trim()) {
      throw new Error(`[${name}] Missing or empty: ${key}`);
    }
  }
  if (!parsed.verse_link?.startsWith('http')) {
    throw new Error(`[${name}] verse_link is not a valid URL`);
  }
  console.log(`[${name}] OK — ${parsed.bible_verse}`);
  console.log(`  link: ${parsed.verse_link}`);
  console.log(`  content preview: ${parsed.verse_content.slice(0, 80)}…`);
}

async function runScenario(
  client: TaskClient,
  name: string,
  scenario: (typeof SCENARIOS)[string],
): Promise<void> {
  console.log(`\n=== ${scenario.label} (${name}) ===`);

  const session = await client.sendMessage({
    agentName: 'prayer_request',
    billingMode: 'free',
    requestParts: [textPart(JSON.stringify(scenario.body), 'request')],
  });

  console.log('Task created:', session.taskId);

  await new Promise<void>((resolve, reject) => {
    session.onProgress((event: ProgressEvent) => {
      const msg = event.message ?? event.progress ?? '';
      if (msg) console.log('[progress]', msg);
    });

    session.onArtifact(async (event: ArtifactEvent) => {
      try {
        const ref = event.artifactRef;
        let raw: string;
        if (ref.kind === 'inline' && ref.data) {
          raw = new TextDecoder().decode(decodeInlineArtifact(ref));
        } else {
          const downloaded = await session.downloadArtifact(ref);
          raw = new TextDecoder().decode(downloaded.data);
        }
        console.log('[artifact]', raw.slice(0, 500) + (raw.length > 500 ? '…' : ''));
        assertResult(name, raw, scenario.expectError);
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    session.onTerminal((event: TerminalEvent) => {
      if (event.type === 'failed' || event.type === 'cancelled') {
        reject(new Error(`Task ${event.type}`));
        return;
      }
      session.close();
    });
  });
}

async function main() {
  const arg = process.argv[2]?.toLowerCase();
  const names = arg
    ? arg === 'all'
      ? Object.keys(SCENARIOS)
      : [arg]
    : Object.keys(SCENARIOS);

  for (const name of names) {
    if (!SCENARIOS[name]) {
      console.error(`Unknown scenario: ${name}. Use: ${Object.keys(SCENARIOS).join(', ')}`);
      process.exit(1);
    }
  }

  const client = await TaskClient.create({
    billingMode: 'free',
    apiKey: process.env.BLOCKS_API_KEY!,
  });

  try {
    for (const name of names) {
      await runScenario(client, name, SCENARIOS[name]);
    }
    console.log('\nAll scenarios passed.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    client.destroy();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

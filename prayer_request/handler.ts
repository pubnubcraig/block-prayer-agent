import type { StartTaskMessage, TaskContext, HandlerResult } from '@blocks-network/sdk';
import { runPrayerCore } from './lib/runPrayerCore.js';

function jsonArtifact(payload: Record<string, unknown>): HandlerResult {
  return {
    artifacts: [
      {
        data: JSON.stringify(payload),
        mimeType: 'application/json',
        outputId: 'result',
      },
    ],
  };
}

export default async function handler(
  task: StartTaskMessage,
  ctx?: TaskContext,
): Promise<HandlerResult> {
  const part = ctx?.requestParts?.[0] ?? task.requestParts?.[0];
  const text =
    typeof part === 'object' && part !== null && typeof part.text === 'string'
      ? part.text
      : '';

  let input: { text?: string; bible_version?: string };
  try {
    input = JSON.parse(text) as { text?: string; bible_version?: string };
  } catch {
    return jsonArtifact({ error: 'Invalid JSON in request part.' });
  }

  if (!input.text?.trim()) {
    return jsonArtifact({ error: 'text is required' });
  }

  const result = await runPrayerCore(
    { text: input.text, bible_version: input.bible_version },
    (message) => ctx?.reportStatus(message),
  );

  if ('error' in result) {
    return jsonArtifact({ error: result.error });
  }

  return jsonArtifact(result);
}

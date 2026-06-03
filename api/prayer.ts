import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 180,
};

type RequestBody = {
  text?: unknown;
  bible_version?: unknown;
};

type PrayerRunner = typeof import('../prayer_request/lib/runPrayerCore.js');

let runnerPromise: Promise<PrayerRunner> | undefined;

function loadRunner(): Promise<PrayerRunner> {
  if (!runnerPromise) {
    runnerPromise = import('../prayer_request/lib/runPrayerCore.js');
  }
  return runnerPromise;
}

function readBody(req: VercelRequest): RequestBody {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as RequestBody;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body) as RequestBody;
  }
  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'prayer_request',
      usage: 'POST JSON { "text": "...", "bible_version": "ESV" }',
      blocks: 'Provider must run blocks run on an always-on host (see render.yaml).',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body: RequestBody;
  try {
    body = readBody(req);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  const bible_version =
    typeof body.bible_version === 'string' ? body.bible_version : undefined;

  try {
    const { runPrayerCore } = await loadRunner();
    const result = await runPrayerCore({ text, bible_version });

    if ('error' in result) {
      const status =
        result.error === 'text is required' ||
        result.error.startsWith('Missing or empty field:') ||
        result.error === 'Invalid JSON in request part.'
          ? 400
          : 500;
      return res.status(status).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}

import 'dotenv/config';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runPrayerCore } from './lib/runPrayerCore.js';

const PORT = Number(process.env.PORT) || 8080;
const PUBLIC_DIR = process.env.PUBLIC_DIR || join(process.cwd(), 'public');
const MAX_BODY_BYTES = 1024 * 64;

type RequestBody = { text?: unknown; bible_version?: unknown };

function setCors(res: import('node:http').ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(
  res: import('node:http').ServerResponse,
  status: number,
  payload: unknown,
): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handlePrayer(
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
): Promise<void> {
  let raw: string;
  try {
    raw = await readBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Invalid request body' });
  }

  let body: RequestBody;
  try {
    body = raw.trim() ? (JSON.parse(raw) as RequestBody) : {};
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON body' });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return sendJson(res, 400, { error: 'text is required' });
  }
  const bible_version =
    typeof body.bible_version === 'string' ? body.bible_version : undefined;

  try {
    const result = await runPrayerCore({ text, bible_version });
    if ('error' in result) {
      const status =
        result.error === 'text is required' ||
        result.error.startsWith('Missing or empty field:') ||
        result.error === 'Invalid JSON in request part.'
          ? 400
          : 500;
      return sendJson(res, status, result);
    }
    return sendJson(res, 200, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return sendJson(res, 500, { error: message });
  }
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

async function serveStatic(
  pathname: string,
  res: import('node:http').ServerResponse,
): Promise<void> {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  if (relative.includes('..')) {
    return sendJson(res, 400, { error: 'Bad path' });
  }
  const ext = relative.slice(relative.lastIndexOf('.'));
  try {
    const file = await readFile(join(PUBLIC_DIR, relative));
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
    });
    res.end(file);
  } catch {
    sendJson(res, 404, { error: 'Not found' });
  }
}

const server = createServer((req, res) => {
  setCors(res);
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (url.pathname === '/api/prayer') {
    if (req.method === 'GET') {
      return sendJson(res, 200, {
        ok: true,
        service: 'prayer_request',
        usage: 'POST JSON { "text": "...", "bible_version": "ESV" }',
      });
    }
    if (req.method === 'POST') {
      void handlePrayer(req, res);
      return;
    }
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (url.pathname === '/healthz') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'GET') {
    void serveStatic(url.pathname, res);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
  console.log(`prayer-request web listening on :${PORT}`);
});

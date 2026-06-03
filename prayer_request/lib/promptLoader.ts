import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const fileCache = new Map<string, string>();

export function getPromptsDir(): string {
  if (process.env.PROMPTS_DIR && existsSync(process.env.PROMPTS_DIR)) {
    return process.env.PROMPTS_DIR;
  }
  const candidates = [
    join(__dirname, '..', 'prompts'),
    join(__dirname, '..', '..', 'prompts'),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'prompt_verse_selection.md'))) {
      return dir;
    }
  }
  return candidates[1];
}

export function loadPromptFile(name: string): string {
  const cached = fileCache.get(name);
  if (cached !== undefined) return cached;
  const path = join(getPromptsDir(), name);
  const content = readFileSync(path, 'utf8');
  fileCache.set(name, content);
  return content;
}

export function substitute(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  const leftover = out.match(/\{\{[^}]+\}\}/g);
  if (leftover?.length) {
    throw new Error(`Unresolved prompt placeholders: ${leftover.join(', ')}`);
  }
  return out;
}

export function loadPrompt(name: string, vars: Record<string, string>): string {
  return substitute(loadPromptFile(name), vars);
}

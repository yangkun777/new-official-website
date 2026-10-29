import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REVALIDATION_COLLECTIONS } from '../collections.js';

const COLLECTIONS = new Set(REVALIDATION_COLLECTIONS);
const statusFile = join(dirname(fileURLToPath(import.meta.url)), '../../../.revalidate-last.json');

function previewOrigin(env) {
  const raw = String(env.WEB_PREVIEW_ORIGIN || process.env.WEB_PREVIEW_ORIGIN || 'http://localhost:3000');
  let origin;
  try {
    origin = new URL(raw);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || origin.search || origin.hash) {
    return null;
  }
  return origin;
}

function writeStatus(payload) {
  try {
    writeFileSync(statusFile, `${JSON.stringify({ ...payload, at: new Date().toISOString() })}\n`);
  } catch {
    // Status is only for local verification; never fail a save because of it.
  }
}

async function notify(collection, env, logger) {
  const secret = String(env.REVALIDATE_SECRET || process.env.REVALIDATE_SECRET || '');
  if (secret.length < 32) {
    writeStatus({ collection, ok: false, error: 'secret-missing' });
    logger.warn('[revalidate-hook] REVALIDATE_SECRET missing or too short');
    return;
  }
  const origin = previewOrigin(env);
  if (!origin) {
    writeStatus({ collection, ok: false, error: 'origin-invalid' });
    logger.warn('[revalidate-hook] WEB_PREVIEW_ORIGIN must be a plain HTTP(S) origin');
    return;
  }
  try {
    const response = await fetch(new URL('/api/revalidate', origin), {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection }),
      signal: AbortSignal.timeout(4000),
    });
    writeStatus({ collection, ok: response.status === 200, http: response.status });
    if (response.status !== 200) logger.warn(`[revalidate-hook] ${collection} HTTP ${response.status}`);
  } catch (error) {
    const message = String(error?.message || error).slice(0, 200);
    writeStatus({ collection, ok: false, error: message });
    logger.warn(`[revalidate-hook] ${collection} ${message}`);
  }
}

export default ({ action }, { env, logger }) => {
  const timers = new Map();
  const schedule = (collection) => {
    if (!COLLECTIONS.has(collection)) return;
    const previous = timers.get(collection);
    if (previous) clearTimeout(previous);
    timers.set(
      collection,
      setTimeout(() => {
        timers.delete(collection);
        void notify(collection, env, logger);
      }, 75),
    );
  };
  for (const event of ['items.create', 'items.update', 'items.delete']) {
    action(event, ({ collection }) => {
      schedule(collection);
    });
  }
};

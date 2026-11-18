import { ensureTables, handleOptions, jsonResponse } from '../_lib/db';
import type { PagesFunction } from '../_lib/types';

export const onRequest: PagesFunction = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return handleOptions();
  let dbReady = false;
  if (env.DB) {
    try {
      await ensureTables(env.DB);
      dbReady = true;
    } catch {
      dbReady = false;
    }
  }
  return jsonResponse({
    ok: true,
    service: 'NepTok Cloudflare Pages API',
    currency: 'USD',
    d1Bound: Boolean(env.DB) && dbReady,
    r2Bound: Boolean(env.MEDIA_BUCKET),
  });
};

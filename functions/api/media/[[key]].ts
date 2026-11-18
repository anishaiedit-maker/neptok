import { parseByteRange } from '../../../src/utils/streamHelpers';
import { CORS_HEADERS, errorResponse, handleOptions } from '../../_lib/db';
import type { PagesFunction } from '../../_lib/types';

export const onRequest: PagesFunction<{ key?: string | string[] }> = async ({
  request,
  env,
  params,
}) => {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return errorResponse('Method not allowed', 405);
  }
  if (!env.MEDIA_BUCKET) {
    return errorResponse('Cloudflare R2 binding (MEDIA_BUCKET) is not configured.', 503);
  }

  const rawParam = params.key;
  const rawPath = Array.isArray(rawParam) ? rawParam.join('/') : rawParam || '';
  const key = decodeURIComponent(rawPath).replace(/^\/+/, '');
  if (!key) return errorResponse('Missing R2 media key.', 400);

  const head = await env.MEDIA_BUCKET.head(key);
  if (!head) return errorResponse('Media object not found in R2.', 404);

  const contentType = head.httpMetadata?.contentType || 'application/octet-stream';
  const rangeHeader = request.headers.get('Range');
  const parsedRange = parseByteRange(rangeHeader, head.size);

  if (parsedRange.kind === 'invalid') {
    return new Response('Requested Range Not Satisfiable', {
      status: 416,
      headers: {
        ...CORS_HEADERS,
        'Content-Range': `bytes */${head.size}`,
      },
    });
  }

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': contentType,
        'Content-Length': String(head.size),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  }

  if (parsedRange.kind === 'range') {
    const object = await env.MEDIA_BUCKET.get(key, {
      range: { offset: parsedRange.start, length: parsedRange.length },
    });
    if (!object) return errorResponse('Media object not found in R2.', 404);

    return new Response(object.body, {
      status: 206,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': contentType,
        'Content-Range': `bytes ${parsedRange.start}-${parsedRange.end}/${head.size}`,
        'Content-Length': String(parsedRange.length),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  }

  const fullObject = await env.MEDIA_BUCKET.get(key);
  if (!fullObject) return errorResponse('Media object not found in R2.', 404);

  return new Response(fullObject.body, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': contentType,
      'Content-Length': String(head.size),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
};

import { buildR2ObjectKey, formatR2MediaUrl } from '../../src/utils/streamHelpers';
import { errorResponse, handleOptions, jsonResponse } from '../_lib/db';
import type { PagesFunction } from '../_lib/types';

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; mime: string } | null {
  const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1];
  const bin = atob(match[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return { bytes, mime };
}

export const onRequest: PagesFunction = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);
  if (!env.MEDIA_BUCKET) {
    return errorResponse('Cloudflare R2 binding (MEDIA_BUCKET) is not configured.', 503);
  }

  const contentTypeHeader = request.headers.get('Content-Type') || '';
  let kind = 'media';
  let filename = 'upload.bin';
  let contentType = 'application/octet-stream';
  let bodyData: ArrayBuffer | Uint8Array;
  let size = 0;

  if (contentTypeHeader.includes('multipart/form-data')) {
    const formData = await request.formData();
    const fileEntry = formData.get('file');
    const kindEntry = formData.get('kind');
    if (typeof kindEntry === 'string' && kindEntry.trim()) {
      kind = kindEntry.trim();
    }
    if (!fileEntry || typeof fileEntry === 'string') {
      return errorResponse('Missing multipart file field.', 400);
    }
    const file = fileEntry as File;
    filename = file.name || `${kind}.bin`;
    contentType = file.type || 'application/octet-stream';
    const buf = await file.arrayBuffer();
    bodyData = buf;
    size = buf.byteLength;
  } else if (contentTypeHeader.includes('application/json')) {
    const json = (await request.json().catch(() => ({}))) as {
      dataUrl?: string;
      kind?: string;
      filename?: string;
      contentType?: string;
    };
    if (!json.dataUrl) return errorResponse('Missing dataUrl or multipart file.', 400);
    const decoded = decodeDataUrl(json.dataUrl);
    if (!decoded) return errorResponse('Invalid base64 dataUrl.', 400);
    kind = json.kind || 'media';
    contentType = json.contentType || decoded.mime;
    const ext = contentType.split('/')[1]?.split(';')[0] || 'bin';
    filename = json.filename || `${kind}.${ext}`;
    bodyData = decoded.bytes;
    size = decoded.bytes.byteLength;
  } else {
    kind = new URL(request.url).searchParams.get('kind') || 'media';
    filename = request.headers.get('X-Filename') || `${kind}.bin`;
    contentType = contentTypeHeader || 'application/octet-stream';
    const buf = await request.arrayBuffer();
    if (buf.byteLength === 0) return errorResponse('Empty request body.', 400);
    bodyData = buf;
    size = buf.byteLength;
  }

  const key = buildR2ObjectKey(kind, filename);
  await env.MEDIA_BUCKET.put(key, bodyData, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000',
    },
    customMetadata: {
      kind,
      originalFilename: filename,
    },
  });

  const url = formatR2MediaUrl(key);
  return jsonResponse({
    ok: true,
    key,
    url,
    contentType,
    size,
  });
};

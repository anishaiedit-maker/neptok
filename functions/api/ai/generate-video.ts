import { errorResponse, handleOptions, jsonResponse } from '../../_lib/db';
import type { PagesFunction } from '../../_lib/types';

export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const body = (await request.json().catch(() => ({}))) as {
    prompt?: string;
    aspectRatio?: '16:9' | '9:16';
  };
  if (!body.prompt?.trim()) {
    return errorResponse('Please provide a video prompt.', 400);
  }

  return jsonResponse({
    videoDataUrl: '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg',
    fallbackPoster: true,
    note: `Preview generated for prompt: ${body.prompt.trim().slice(0, 80)}`,
  });
};

import { runRuleBasedSafetyPrecheck } from '../../../src/utils/neptokLogic';
import { ensureTables, errorResponse, handleOptions, jsonResponse } from '../../_lib/db';
import type { PagesFunction } from '../../_lib/types';

export const onRequest: PagesFunction = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const body = (await request.json().catch(() => ({}))) as {
    caption?: string;
    audioTitle?: string;
    mediaType?: 'video' | 'reel' | 'photo' | 'story' | 'live';
    creator?: string;
    simulateFlag?: 'none' | 'copyright' | 'nsfw' | 'violence';
  };

  let verdict = runRuleBasedSafetyPrecheck({
    caption: body.caption ?? '',
    audioTitle: body.audioTitle ?? 'Original Sound',
    simulateFlag: body.simulateFlag,
  });

  // Optional Gemini REST moderation enhancement if GEMINI_API_KEY is configured in CF Secrets
  if (verdict.status === 'APPROVED' && env.GEMINI_API_KEY && (body.caption || body.audioTitle)) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          env.GEMINI_API_KEY
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Analyze this NepTok ${body.mediaType || 'video'} upload metadata and return strict JSON { "status": "APPROVED"|"FLAGGED"|"BLOCKED", "copyrightStatus": "CLEAR"|"MUTED_SEGMENT"|"COPYRIGHT_BLOCKED", "nsfwScore": number, "violenceScore": number, "copyrightConfidence": number, "reasons": string[] }. Caption: ${JSON.stringify(
                      body.caption ?? ''
                    )} Audio: ${JSON.stringify(body.audioTitle ?? 'Original Sound')}`,
                  },
                ],
              },
            ],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );
      if (resp.ok) {
        const data = (await resp.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed && parsed.status) {
            verdict = {
              status: parsed.status,
              copyrightStatus: parsed.copyrightStatus ?? 'CLEAR',
              nsfwScore: Number(parsed.nsfwScore ?? 1),
              violenceScore: Number(parsed.violenceScore ?? 1),
              copyrightConfidence: Number(parsed.copyrightConfidence ?? 2),
              reasons: Array.isArray(parsed.reasons)
                ? parsed.reasons
                : ['Evaluated by NepTok AI Safety Pipeline'],
            };
          }
        }
      }
    } catch {
      // keep rule-based precheck verdict
    }
  }

  if (verdict.status !== 'APPROVED' && env.DB) {
    await ensureTables(env.DB);
    await env.DB.prepare(
      `INSERT INTO moderation_queue (id, content_type, creator, title, flag_type, confidence, action_taken, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Just now')`
    )
      .bind(
        `mod-${Date.now().toString().slice(-5)}`,
        body.mediaType === 'live'
          ? 'Live'
          : body.mediaType === 'photo'
          ? 'Photo'
          : body.mediaType === 'story'
          ? 'Story'
          : 'Video',
        body.creator ?? '@aarav_nepal',
        (body.caption ?? 'Untitled Upload').slice(0, 60),
        verdict.copyrightStatus !== 'CLEAR'
          ? 'Copyright Audio'
          : verdict.nsfwScore >= verdict.violenceScore
          ? 'NSFW / Nudity'
          : 'Violence / Hate Speech',
        Math.max(verdict.copyrightConfidence, verdict.nsfwScore, verdict.violenceScore),
        verdict.reasons[0] ?? 'Flagged by AI Safety Pipeline',
        verdict.copyrightStatus === 'MUTED_SEGMENT' ? 'Muted & Approved' : 'Pending Review'
      )
      .run();
  }

  return jsonResponse(verdict);
};

import { ensureTables, errorResponse, handleOptions, jsonResponse } from '../../_lib/db';
import type { PagesFunction } from '../../_lib/types';

export const onRequest: PagesFunction = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const url = new URL(request.url);
  const subpath = url.pathname.replace(/^\/api\/support\/?/, '');

  if (subpath === 'escalate') {
    const body = (await request.json().catch(() => ({}))) as {
      username?: string;
      subject?: string;
    };
    const ticket = {
      id: `TKT-${Date.now().toString().slice(-5)}`,
      username: body.username ?? '@aarav_nepal',
      subject: body.subject ?? 'Creator Account Support Escalation',
      status: 'Escalated' as const,
      createdAt: new Date().toISOString(),
    };
    if (env.DB) {
      await ensureTables(env.DB);
      await env.DB.prepare(
        'INSERT INTO support_tickets (id, username, subject, status, created_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(ticket.id, ticket.username, ticket.subject, ticket.status, ticket.createdAt)
        .run();
    }
    return jsonResponse({ created: true, ticket });
  }

  if (subpath === 'chat') {
    const body = (await request.json().catch(() => ({}))) as {
      message?: string;
      language?: 'en' | 'ne';
      userContext?: { username: string; followers: number; coins: number; creatorBalanceUsd: number };
    };
    const msg = (body.message || '').trim();
    if (!msg) return errorResponse('Message cannot be empty.', 400);

    if (env.GEMINI_API_KEY) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
            env.GEMINI_API_KEY
          )}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [
                  {
                    text: `You are NepTok AI Support Assistant. NepTok uses USD ($) and NepTok Coins (N). Creator monetization unlocks at 5,000+ followers. Respond concisely in ${
                      body.language === 'ne' ? 'Nepali' : 'English'
                    }.`,
                  },
                ],
              },
              contents: [{ role: 'user', parts: [{ text: msg }] }],
            }),
          }
        );
        if (resp.ok) {
          const data = (await resp.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return jsonResponse({ reply });
        }
      } catch {
        // fallback reply below
      }
    }

    const fallback =
      body.language === 'ne'
        ? `नमस्ते ${body.userContext?.username || '@aarav_nepal'}! NepTok सहायतामा स्वागत छ। क्रिएटर मोनेटाइजेसन र USD निकासीका लागि ५,०००+ फलोअर्स आवश्यक पर्छ। थप सहयोगका लागि "Escalate to Human Support" प्रयोग गर्नुहोस्।`
        : `Hi ${body.userContext?.username || '@aarav_nepal'}! NepTok Creator Monetization unlocks at 5,000 followers and pays out in USD ($10 minimum via Wise, PayPal, or USDT). Use "Escalate to Human Support" anytime for live agent help.`;
    return jsonResponse({ reply: fallback });
  }

  return errorResponse('Unsupported support route', 404);
};

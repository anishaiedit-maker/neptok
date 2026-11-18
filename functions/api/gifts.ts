import { GIFTS_48, coinsToUsd } from '../../src/utils/neptokLogic';
import {
  ensureTables,
  errorResponse,
  handleOptions,
  jsonResponse,
  resolveActorUserId,
} from '../_lib/db';
import type { PagesFunction } from '../_lib/types';

export const onRequest: PagesFunction = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return handleOptions();
  const url = new URL(request.url);
  const subpath = url.pathname.replace(/^\/api\/gifts\/?/, '');

  if (request.method === 'GET' && !subpath) {
    return jsonResponse({ gifts: GIFTS_48, total: GIFTS_48.length });
  }

  if (!env.DB) return errorResponse('Cloudflare D1 binding (DB) is not configured.', 503);
  await ensureTables(env.DB);
  const actorUserId = await resolveActorUserId(request, env);

  if (request.method === 'POST' && (subpath === 'send' || !subpath)) {
    const body = (await request.json().catch(() => ({}))) as {
      giftId?: number;
      recipient?: string;
      postId?: string;
      roomId?: string;
      multiplier?: number;
    };
    const gift = GIFTS_48.find((g) => g.id === Number(body.giftId));
    if (!gift) return errorResponse('Gift not found in catalog.', 404);

    const userRow = await env.DB.prepare('SELECT id, name, handle, coins FROM users WHERE id = ?')
      .bind(actorUserId)
      .first<{ id: string; name: string; handle: string; coins: number }>();
    if (!userRow) return errorResponse('User not found', 404);

    const deductRes = await env.DB.prepare(
      'UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?'
    )
      .bind(gift.coins, userRow.id, gift.coins)
      .run();

    if (!deductRes.meta?.changes || deductRes.meta.changes === 0) {
      return errorResponse('Insufficient Coins! Recharge your wallet to continue sending gifts.', 402);
    }

    const recipientHandle = (body.recipient || '@sita_kathmandu').replace(/^@/, '');
    const usdValue = coinsToUsd(gift.coins);
    const mult = Math.max(1, Math.min(4, Math.floor(Number(body.multiplier ?? 1))));
    const txId = `gift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    await env.DB.prepare(
      `INSERT INTO gift_transactions (
        id, room_id, post_id, sender_id, sender_name, sender_handle, recipient_handle,
        gift_id, gift_name, gift_emoji, coins, usd_value, multiplier, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        txId,
        body.roomId || null,
        body.postId || null,
        userRow.id,
        userRow.name,
        userRow.handle,
        recipientHandle,
        gift.id,
        gift.name,
        gift.emoji,
        gift.coins,
        usdValue,
        mult,
        Date.now()
      )
      .run();

    await env.DB.prepare(
      `INSERT INTO wallet_transactions (id, user_id, title, type, coins_delta, usd_amount, time_label, method, created_at)
       VALUES (?, ?, ?, 'Gift Sent', ?, ?, 'Just now', 'Coin Balance', ?)`
    )
      .bind(
        `wtx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userRow.id,
        `Sent ${gift.name} to @${recipientHandle}`,
        -gift.coins,
        usdValue,
        Date.now()
      )
      .run();

    if (body.postId) {
      await env.DB.prepare(
        'UPDATE videos SET gifts_received_coins = gifts_received_coins + ? WHERE id = ?'
      )
        .bind(gift.coins, body.postId)
        .run();
    }

    const updatedUser = await env.DB.prepare('SELECT coins FROM users WHERE id = ?')
      .bind(userRow.id)
      .first<{ coins: number }>();

    return jsonResponse({
      sent: true,
      gift,
      recipient: `@${recipientHandle}`,
      usdValue,
      coins: updatedUser?.coins ?? Math.max(0, userRow.coins - gift.coins),
      timestamp: Date.now(),
    });
  }

  return errorResponse('Unsupported gifts route or method', 405);
};

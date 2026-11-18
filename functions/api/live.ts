import { GIFTS_48, coinsToUsd, updateBattleStreak } from '../../src/utils/neptokLogic';
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
  if (!env.DB) return errorResponse('Cloudflare D1 binding (DB) is not configured.', 503);

  await ensureTables(env.DB);
  const actorUserId = await resolveActorUserId(request, env);
  const url = new URL(request.url);

  // GET /api/live -> Fetch active live rooms, host streak, and Top Gifter rankings
  if (request.method === 'GET') {
    const roomId = url.searchParams.get('roomId');
    const roomsRes = await env.DB.prepare(
      'SELECT * FROM live_rooms ORDER BY started_at DESC LIMIT 20'
    ).all<Record<string, unknown>>();

    const giftsQuery = roomId
      ? env.DB.prepare(
          `SELECT sender_id, sender_name, sender_handle, recipient_handle, SUM(coins) AS total_coins
           FROM gift_transactions WHERE room_id = ?
           GROUP BY sender_handle, recipient_handle
           ORDER BY total_coins DESC LIMIT 50`
        ).bind(roomId)
      : env.DB.prepare(
          `SELECT sender_id, sender_name, sender_handle, recipient_handle, SUM(coins) AS total_coins
           FROM gift_transactions
           GROUP BY sender_handle, recipient_handle
           ORDER BY total_coins DESC LIMIT 50`
        );

    const topGiftersRes = await giftsQuery.all<Record<string, unknown>>();
    return jsonResponse({
      rooms: roomsRes.results,
      topGifters: topGiftersRes.results,
    });
  }

  // POST /api/live -> start, end, join_guest, start_battle, finish_battle, gift
  if (request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      roomId?: string;
      title?: string;
      mode?: string;
      thumbnailUrl?: string;
      coinsGoal?: number;
      heartsGoal?: number;
      participants?: number;
      guests?: unknown[];
      opponentHandle?: string;
      myScore?: number;
      oppScore?: number;
      giftId?: number;
      recipientHandle?: string;
      multiplier?: number;
    };

    const action = body.action || 'start';
    const userRow = await env.DB.prepare(
      'SELECT id, name, handle, coins FROM users WHERE id = ?'
    )
      .bind(actorUserId)
      .first<{ id: string; name: string; handle: string; coins: number }>();
    if (!userRow) return errorResponse('User not found', 404);

    if (action === 'start') {
      const roomId = body.roomId || `live-${actorUserId}-${Date.now()}`;
      await env.DB.prepare(
        `INSERT OR REPLACE INTO live_rooms (
          id, host_id, host_handle, host_name, title, mode, thumbnail_url,
          coins_goal, hearts_goal, viewers, like_count, gifts_received_coins,
          participants, max_capacity, guests_json, battle_active, win_streak, status, started_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, COALESCE((SELECT win_streak FROM live_rooms WHERE host_id = ? ORDER BY started_at DESC LIMIT 1), 2), 'Active', ?)`
      )
        .bind(
          roomId,
          userRow.id,
          userRow.handle,
          userRow.name,
          body.title?.trim() || `${userRow.name}'s NEP Live`,
          body.mode || 'camera',
          body.thumbnailUrl || '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg',
          Number(body.coinsGoal ?? 1000),
          Number(body.heartsGoal ?? 2500),
          1420,
          1240,
          0,
          1,
          body.mode === 'audio' ? 30 : 8,
          '[]',
          userRow.id,
          Date.now()
        )
        .run();

      const room = await env.DB.prepare('SELECT * FROM live_rooms WHERE id = ?')
        .bind(roomId)
        .first<Record<string, unknown>>();
      return jsonResponse({ ok: true, room }, 201);
    }

    if (action === 'end' && body.roomId) {
      await env.DB.prepare(
        "UPDATE live_rooms SET status = 'Ended', battle_active = 0, ended_at = ? WHERE id = ?"
      )
        .bind(Date.now(), body.roomId)
        .run();
      return jsonResponse({ ok: true, roomId: body.roomId });
    }

    if (action === 'sync_guests' && body.roomId) {
      const guests = Array.isArray(body.guests) ? body.guests : [];
      await env.DB.prepare(
        'UPDATE live_rooms SET participants = ?, guests_json = ? WHERE id = ?'
      )
        .bind(Math.min(8, 1 + guests.length), JSON.stringify(guests), body.roomId)
        .run();
      return jsonResponse({ ok: true, participants: 1 + guests.length });
    }

    if (action === 'start_battle' && body.roomId) {
      await env.DB.prepare(
        `UPDATE live_rooms SET battle_active = 1, battle_opponent_handle = ?, battle_my_score = 0, battle_opp_score = 0
         WHERE id = ?`
      )
        .bind(body.opponentHandle || 'sita_kathmandu', body.roomId)
        .run();
      return jsonResponse({ ok: true, battleActive: true });
    }

    if (action === 'finish_battle' && body.roomId) {
      const myScore = Number(body.myScore ?? 0);
      const oppScore = Number(body.oppScore ?? 0);
      const won = myScore >= oppScore;

      const room = await env.DB.prepare('SELECT win_streak FROM live_rooms WHERE id = ?')
        .bind(body.roomId)
        .first<{ win_streak: number }>();

      const nextStreak = updateBattleStreak(Number(room?.win_streak ?? 0), won);
      await env.DB.prepare(
        `UPDATE live_rooms
         SET battle_active = 0, battle_my_score = ?, battle_opp_score = ?, win_streak = ?
         WHERE id = ?`
      )
        .bind(myScore, oppScore, nextStreak, body.roomId)
        .run();

      return jsonResponse({
        ok: true,
        won,
        hostWinStreak: nextStreak,
        myScore,
        oppScore,
      });
    }

    if (action === 'gift') {
      const gift = GIFTS_48.find((g) => g.id === Number(body.giftId));
      if (!gift) return errorResponse('Gift not found in catalog.', 404);

      const deductRes = await env.DB.prepare(
        'UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?'
      )
        .bind(gift.coins, userRow.id, gift.coins)
        .run();

      if (!deductRes.meta?.changes || deductRes.meta.changes === 0) {
        return errorResponse('Insufficient Coins! Recharge your wallet to continue sending gifts.', 402);
      }

      const mult = Math.max(1, Math.min(4, Math.floor(Number(body.multiplier ?? 1))));
      const recipientHandle = (body.recipientHandle || userRow.handle).replace(/^@/, '');
      const txId = `gift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const usdValue = coinsToUsd(gift.coins);

      await env.DB.prepare(
        `INSERT INTO gift_transactions (
          id, room_id, sender_id, sender_name, sender_handle, recipient_handle,
          gift_id, gift_name, gift_emoji, coins, usd_value, multiplier, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          txId,
          body.roomId || null,
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
         VALUES (?, ?, ?, 'Gift Sent', ?, ?, 'Just now', 'NEP Live Balance', ?)`
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

      if (body.roomId) {
        await env.DB.prepare(
          'UPDATE live_rooms SET gifts_received_coins = gifts_received_coins + ? WHERE id = ?'
        )
          .bind(gift.coins, body.roomId)
          .run();
      }

      const updatedUser = await env.DB.prepare('SELECT coins FROM users WHERE id = ?')
        .bind(userRow.id)
        .first<{ coins: number }>();

      return jsonResponse({
        ok: true,
        sent: true,
        gift,
        coins: updatedUser?.coins ?? Math.max(0, userRow.coins - gift.coins),
        pointsAdded: gift.coins * mult,
        usdValue,
        transactionId: txId,
      });
    }

    return errorResponse('Unsupported live action.', 400);
  }

  return errorResponse('Method not allowed', 405);
};

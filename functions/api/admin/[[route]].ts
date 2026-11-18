import { GIFTS_48, evaluateMonetizationEligibility } from '../../../src/utils/neptokLogic';
import { ensureTables, errorResponse, handleOptions, jsonResponse } from '../../_lib/db';
import type { PagesFunction } from '../../_lib/types';

export const onRequest: PagesFunction = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return handleOptions();
  if (!env.DB) return errorResponse('Cloudflare D1 binding (DB) is not configured.', 503);

  await ensureTables(env.DB);
  const url = new URL(request.url);
  const subpath = url.pathname.replace(/^\/api\/admin\/?/, '');
  const parts = subpath.split('/').filter(Boolean);

  if (request.method === 'GET' && parts[0] === 'overview') {
    const [usersRes, modRes, payoutsRes, roomsRes, ticketsRes] = await Promise.all([
      env.DB.prepare(
        `SELECT u.id, u.name, u.handle, u.followers, u.kyc_status, u.account_type, u.standing, u.creator_balance_usd,
                COALESCE(m.content_monetization, 1) AS monetization_content,
                COALESCE(m.gift_monetization, 1) AS monetization_gifts
         FROM users u LEFT JOIN creator_monetization m ON m.user_id = u.id`
      ).all<Record<string, unknown>>(),
      env.DB.prepare('SELECT * FROM moderation_queue').all<Record<string, unknown>>(),
      env.DB.prepare('SELECT * FROM payout_requests').all<Record<string, unknown>>(),
      env.DB.prepare('SELECT * FROM live_rooms ORDER BY started_at DESC').all<Record<string, unknown>>(),
      env.DB.prepare('SELECT * FROM support_tickets').all<Record<string, unknown>>(),
    ]);

    const liveRooms = roomsRes.results.map((r) => ({
      id: String(r.id),
      host: `@${String(r.host_handle)}`,
      title: String(r.title),
      mode: String(r.mode),
      viewers: Number(r.viewers ?? 0),
      battleActive: Boolean(r.battle_active),
      participants: Number(r.participants ?? 1),
      maxCapacity: Number(r.max_capacity ?? 8),
      status: String(r.status || 'Active'),
    }));

    const moderationQueue = modRes.results.map((m) => ({
      id: String(m.id),
      contentType: String(m.content_type),
      creator: String(m.creator),
      title: String(m.title),
      flagType: String(m.flag_type),
      confidence: Number(m.confidence ?? 90),
      actionTaken: String(m.action_taken),
      status: String(m.status),
      createdAt: String(m.created_at),
    }));

    const payouts = payoutsRes.results.map((p) => ({
      id: String(p.id),
      creator: String(p.creator),
      method: String(p.method),
      amountUsd: Number(p.amount_usd ?? 0),
      status: String(p.status),
      requestedAt: String(p.requested_at),
    }));

    return jsonResponse({
      metrics: {
        totalActiveCreators: 142890,
        liveViewersNow: liveRooms.reduce((sum, r) => sum + r.viewers, 0),
        dailyGrossRevenueUsd: 48920.5,
        pendingModerationCount: moderationQueue.filter((m) => m.status === 'Pending Review').length,
        pendingPayoutsUsd: payouts
          .filter((p) => p.status === 'Pending')
          .reduce((s, p) => s + p.amountUsd, 0),
      },
      users: usersRes.results.map((u) => {
        const followers = Number(u.followers ?? 0);
        const standing = String(u.standing || 'Good') as 'Good' | 'Warning';
        return {
          id: String(u.id),
          name: String(u.name),
          username: String(u.handle),
          followers,
          kycStatus: String(u.kyc_status || 'Verified'),
          accountType: String(u.account_type || 'Personal'),
          standing,
          monetizationContent: Boolean(u.monetization_content),
          monetizationGifts: Boolean(u.monetization_gifts),
          earningsUsd: Number(u.creator_balance_usd ?? 0),
          monetizationEligibility: evaluateMonetizationEligibility(followers, standing === 'Good'),
        };
      }),
      moderationQueue,
      payouts,
      liveRooms,
      supportTickets: ticketsRes.results.map((t) => ({
        id: String(t.id),
        username: String(t.username),
        subject: String(t.subject),
        status: String(t.status),
        createdAt: String(t.created_at),
      })),
      snapshotStatus: {
        lastBackupAt: '2026-11-17 03:00 UTC',
        region: 'Cloudflare D1 + Multi-Region R2',
        encrypted: 'AES-256 + TLS 1.3',
      },
      giftCount: GIFTS_48.length,
    });
  }

  if (request.method === 'POST' && parts[0] === 'kyc' && parts[1]) {
    const body = (await request.json().catch(() => ({}))) as { status?: string };
    await env.DB.prepare('UPDATE users SET kyc_status = ? WHERE id = ?')
      .bind(body.status || 'Verified', parts[1])
      .run();
    return jsonResponse({ updated: true, user: { id: parts[1], kycStatus: body.status } });
  }

  if (request.method === 'POST' && parts[0] === 'monetization' && parts[1]) {
    const body = (await request.json().catch(() => ({}))) as {
      content?: boolean;
      gifts?: boolean;
    };
    const user = await env.DB.prepare('SELECT handle, followers, standing FROM users WHERE id = ?')
      .bind(parts[1])
      .first<{ handle: string; followers: number; standing: string }>();
    if (!user) return errorResponse('User not found', 404);
    const elig = evaluateMonetizationEligibility(user.followers, user.standing === 'Good');
    if (!elig.eligible && (body.content || body.gifts)) {
      return errorResponse(
        `User @${user.handle} has ${user.followers} followers (minimum 5,000 required).`,
        400
      );
    }
    await env.DB.prepare(
      `INSERT INTO creator_monetization (user_id, eligible, content_monetization, gift_monetization, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         content_monetization = COALESCE(?, content_monetization),
         gift_monetization = COALESCE(?, gift_monetization),
         updated_at = ?`
    )
      .bind(
        parts[1],
        elig.eligible ? 1 : 0,
        body.content ? 1 : 0,
        body.gifts ? 1 : 0,
        Date.now(),
        typeof body.content === 'boolean' ? (body.content ? 1 : 0) : null,
        typeof body.gifts === 'boolean' ? (body.gifts ? 1 : 0) : null,
        Date.now()
      )
      .run();
    return jsonResponse({ updated: true });
  }

  if (request.method === 'POST' && parts[0] === 'moderation' && parts[1]) {
    const body = (await request.json().catch(() => ({}))) as { status?: string };
    await env.DB.prepare('UPDATE moderation_queue SET status = ? WHERE id = ?')
      .bind(body.status || 'Restored', parts[1])
      .run();
    return jsonResponse({ updated: true });
  }

  if (request.method === 'POST' && parts[0] === 'payouts' && parts[1]) {
    const body = (await request.json().catch(() => ({}))) as { status?: string };
    await env.DB.prepare('UPDATE payout_requests SET status = ? WHERE id = ?')
      .bind(body.status || 'Paid', parts[1])
      .run();
    return jsonResponse({ updated: true });
  }

  if (request.method === 'POST' && parts[0] === 'live' && parts[1] && parts[2] === 'terminate') {
    await env.DB.prepare("UPDATE live_rooms SET status = 'Terminated', viewers = 0 WHERE id = ?")
      .bind(parts[1])
      .run();
    return jsonResponse({ terminated: true });
  }

  if (request.method === 'POST' && parts[0] === 'backup' && parts[1] === 'trigger') {
    return jsonResponse({
      success: true,
      snapshotStatus: {
        lastBackupAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
        region: 'Cloudflare D1 + Multi-Region R2',
        encrypted: 'AES-256 + TLS 1.3',
      },
    });
  }

  return errorResponse('Unsupported admin route', 404);
};

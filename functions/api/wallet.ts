import { COIN_PACKAGES, calculatePackageTotalCoins } from '../../src/utils/neptokLogic';
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
  const subpath = url.pathname.replace(/^\/api\/wallet\/?/, '');

  if (request.method === 'GET') {
    const userRow = await env.DB.prepare(
      'SELECT coins, creator_balance_usd FROM users WHERE id = ?'
    )
      .bind(actorUserId)
      .first<{ coins: number; creator_balance_usd: number }>();

    const txRes = await env.DB.prepare(
      'SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    )
      .bind(actorUserId)
      .all<Record<string, unknown>>();

    return jsonResponse({
      coins: Number(userRow?.coins ?? 0),
      creatorBalanceUsd: Number(userRow?.creator_balance_usd ?? 0),
      transactions: txRes.results.map((t) => ({
        id: String(t.id),
        title: String(t.title),
        type: String(t.type),
        coinsDelta: Number(t.coins_delta ?? 0),
        usdAmount: Number(t.usd_amount ?? 0),
        time: String(t.time_label || 'Just now'),
        method: String(t.method || 'Coin Balance'),
      })),
    });
  }

  if (request.method === 'POST' && subpath === 'recharge') {
    const body = (await request.json().catch(() => ({}))) as {
      packageId?: string;
      method?: string;
    };
    const pkg = COIN_PACKAGES.find((p) => p.id === body.packageId);
    if (!pkg) return errorResponse('Invalid coin package selected.', 400);

    const creditedCoins = calculatePackageTotalCoins(pkg);
    const method = body.method ?? 'Visa •••• 4242';
    const ref = `NT-USD-${Date.now().toString().slice(-6)}`;

    await env.DB.prepare('UPDATE users SET coins = coins + ? WHERE id = ?')
      .bind(creditedCoins, actorUserId)
      .run();

    await env.DB.prepare(
      `INSERT INTO wallet_transactions (id, user_id, title, type, coins_delta, usd_amount, time_label, method, created_at)
       VALUES (?, ?, ?, 'Recharge', ?, ?, 'Just now', ?, ?)`
    )
      .bind(
        `wtx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorUserId,
        `Recharge ${pkg.coins.toLocaleString()} Coins${pkg.bonusPct ? ` (+${pkg.bonusPct}% Bonus)` : ''}`,
        creditedCoins,
        pkg.priceUsd,
        method,
        Date.now()
      )
      .run();

    const updated = await env.DB.prepare('SELECT coins FROM users WHERE id = ?')
      .bind(actorUserId)
      .first<{ coins: number }>();

    return jsonResponse({
      success: true,
      packageId: pkg.id,
      chargedUsd: pkg.priceUsd,
      creditedCoins,
      coins: updated?.coins ?? creditedCoins,
      method,
      reference: ref,
    });
  }

  if (request.method === 'POST' && subpath === 'withdraw') {
    const body = (await request.json().catch(() => ({}))) as {
      amountUsd?: number;
      method?: string;
      creator?: string;
    };
    const amt = Number(body.amountUsd ?? 0);
    if (!Number.isFinite(amt) || amt < 10) {
      return errorResponse('Minimum USD withdrawal is $10.00.', 400);
    }

    const userRow = await env.DB.prepare(
      'SELECT handle, creator_balance_usd FROM users WHERE id = ?'
    )
      .bind(actorUserId)
      .first<{ handle: string; creator_balance_usd: number }>();
    if (!userRow) return errorResponse('User not found.', 404);
    if (Number(userRow.creator_balance_usd ?? 0) < amt) {
      return errorResponse('Insufficient USD creator balance.', 400);
    }

    const method = body.method ?? 'Wise (USD)';
    const payout = {
      id: `pay-${Date.now().toString().slice(-4)}`,
      creator: body.creator ?? `@${userRow.handle}`,
      method,
      amountUsd: Number(amt.toFixed(2)),
      status: 'Pending' as const,
      requestedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    };

    await env.DB.prepare(
      'UPDATE users SET creator_balance_usd = MAX(0, creator_balance_usd - ?) WHERE id = ?'
    )
      .bind(payout.amountUsd, actorUserId)
      .run();

    await env.DB.prepare(
      `INSERT INTO payout_requests (id, user_id, creator, method, amount_usd, status, requested_at)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?)`
    )
      .bind(payout.id, actorUserId, payout.creator, method, payout.amountUsd, payout.requestedAt)
      .run();

    await env.DB.prepare(
      `INSERT INTO wallet_transactions (id, user_id, title, type, coins_delta, usd_amount, time_label, method, created_at)
       VALUES (?, ?, 'Creator USD Withdrawal', 'Withdraw', 0, ?, 'Just now', ?, ?)`
    )
      .bind(
        `wtx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorUserId,
        payout.amountUsd,
        method,
        Date.now()
      )
      .run();

    const updated = await env.DB.prepare('SELECT creator_balance_usd FROM users WHERE id = ?')
      .bind(actorUserId)
      .first<{ creator_balance_usd: number }>();

    return jsonResponse({
      success: true,
      payout,
      creatorBalanceUsd: updated?.creator_balance_usd ?? 0,
    });
  }

  return errorResponse('Unsupported wallet route or method', 405);
};

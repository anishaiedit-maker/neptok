import { hashPassword, sha256Hex, signSessionToken } from '../_lib/crypto';
import {
  ensureTables,
  errorResponse,
  handleOptions,
  jsonResponse,
  mapDbUserToProfile,
  resolveActorUserId,
} from '../_lib/db';
import type { PagesFunction } from '../_lib/types';

export const onRequest: PagesFunction = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return handleOptions();
  if (!env.DB) return errorResponse('Cloudflare D1 binding (DB) is not configured.', 503);

  await ensureTables(env.DB);
  const url = new URL(request.url);
  const subpath = url.pathname.replace(/^\/api\/auth\/?/, '');
  const actorUserId = await resolveActorUserId(request, env);

  // GET /api/auth or /api/auth/profile -> fetch current user + monetization status
  if (request.method === 'GET') {
    const userRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(actorUserId)
      .first<Record<string, unknown>>();
    if (!userRow) return errorResponse('User not found', 404);

    const monetization = await env.DB.prepare(
      'SELECT * FROM creator_monetization WHERE user_id = ?'
    )
      .bind(actorUserId)
      .first<Record<string, unknown>>();

    return jsonResponse({
      user: mapDbUserToProfile(userRow),
      monetization: monetization ?? {
        user_id: actorUserId,
        eligible: Number(userRow.followers ?? 0) >= 5000 ? 1 : 0,
        content_monetization: 1,
        gift_monetization: 1,
        total_earnings_usd: Number(userRow.creator_balance_usd ?? 0),
        pending_payout_usd: 0,
      },
    });
  }

  // POST /api/auth/otp/send
  if (request.method === 'POST' && subpath === 'otp/send') {
    const body = (await request.json().catch(() => ({}))) as { phone?: string };
    const phone = body.phone?.trim() || '';
    if (phone.length < 7) return errorResponse('Please enter a valid mobile number.', 400);
    return jsonResponse({
      sent: true,
      phone,
      demoHint: '482910',
      message: `Verification OTP sent via SMS to ${phone}.`,
    });
  }

  // POST /api/auth/otp/verify
  if (request.method === 'POST' && subpath === 'otp/verify') {
    const body = (await request.json().catch(() => ({}))) as {
      phone?: string;
      code?: string;
      password?: string;
      mode?: 'login' | 'signup';
      name?: string;
      handle?: string;
    };
    const phone = body.phone?.trim() || '';
    const code = body.code?.trim() || '';
    if (!phone || !code) return errorResponse('Phone and 6-digit OTP code are required.', 400);
    if (code !== '482910') return errorResponse('Invalid OTP code. Try 482910.', 401);

    let userRow = await env.DB.prepare('SELECT * FROM users WHERE phone = ?')
      .bind(phone)
      .first<Record<string, unknown>>();

    if (!userRow && body.mode === 'signup') {
      const id = `u_${Date.now()}`;
      const cleanHandle = (body.handle || `neptok_${Date.now().toString().slice(-5)}`)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');
      const passHash = body.password ? await hashPassword(body.password) : null;
      await env.DB.prepare(
        `INSERT INTO users (id, name, handle, phone, password_hash, bio, followers, following, likes, coins, creator_balance_usd)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          body.name?.trim() || 'NepTok Creator',
          cleanHandle,
          phone,
          passHash,
          'NepTok Creator 🇳🇵',
          0,
          0,
          0,
          1000,
          0
        )
        .run();
      await env.DB.prepare(
        `INSERT OR IGNORE INTO creator_monetization (user_id, eligible, content_monetization, gift_monetization, total_earnings_usd, pending_payout_usd)
         VALUES (?, 0, 0, 0, 0, 0)`
      )
        .bind(id)
        .run();
      userRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
        .bind(id)
        .first<Record<string, unknown>>();
    } else if (!userRow) {
      userRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
        .bind('u_me')
        .first<Record<string, unknown>>();
    }

    const user = userRow ? mapDbUserToProfile(userRow) : null;
    if (!user) return errorResponse('Unable to load user profile', 500);

    const token = await signSessionToken({ userId: user.id, handle: user.handle }, env.AUTH_SECRET);
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare(
      'INSERT OR REPLACE INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'
    )
      .bind(tokenHash, user.id, Date.now() + 30 * 24 * 60 * 60 * 1000)
      .run();

    return jsonResponse(
      { verified: true, token, user },
      200,
      {
        'Set-Cookie': `neptok_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
      }
    );
  }

  // POST /api/auth/login or /api/auth/register
  if (request.method === 'POST' && (subpath === 'login' || subpath === 'register' || subpath === '')) {
    const body = (await request.json().catch(() => ({}))) as {
      phone?: string;
      email?: string;
      handle?: string;
      name?: string;
      password?: string;
      action?: string;
    };
    if (body.action === 'logout') {
      return jsonResponse(
        { ok: true },
        200,
        { 'Set-Cookie': 'neptok_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' }
      );
    }

    const identifier = body.phone?.trim() || body.email?.trim() || body.handle?.trim() || '';
    const existing = identifier
      ? await env.DB.prepare(
          'SELECT * FROM users WHERE phone = ? OR email = ? OR handle = ?'
        )
          .bind(identifier, identifier, identifier.replace(/^@/, ''))
          .first<Record<string, unknown>>()
      : await env.DB.prepare('SELECT * FROM users WHERE id = ?')
          .bind(actorUserId)
          .first<Record<string, unknown>>();

    if (existing) {
      const user = mapDbUserToProfile(existing);
      const token = await signSessionToken({ userId: user.id, handle: user.handle }, env.AUTH_SECRET);
      return jsonResponse({ ok: true, token, user });
    }

    const id = `u_${Date.now()}`;
    const handle = (body.handle || `creator_${Date.now().toString().slice(-5)}`)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
    const passwordHash = body.password ? await hashPassword(body.password) : null;
    await env.DB.prepare(
      `INSERT INTO users (id, name, handle, phone, email, password_hash, bio, coins)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.name?.trim() || 'NepTok Creator',
        handle,
        body.phone?.trim() || null,
        body.email?.trim() || null,
        passwordHash,
        'NepTok Creator 🇳🇵',
        1000
      )
      .run();

    const created = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<Record<string, unknown>>();
    const user = mapDbUserToProfile(created!);
    const token = await signSessionToken({ userId: user.id, handle: user.handle }, env.AUTH_SECRET);
    return jsonResponse({ ok: true, token, user }, 201);
  }

  // PATCH /api/auth or /api/auth/profile -> Persist Edit Profile, Cover Banner, Social Links & Privacy/Security toggles
  if (request.method === 'PATCH' || request.method === 'PUT') {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      bio?: string;
      avatarUrl?: string;
      coverBannerUrl?: string;
      accountType?: 'Personal' | 'Business';
      isPrivateAccount?: boolean;
      twoFactorEnabled?: boolean;
      language?: 'en' | 'ne';
      allowCommentsGlobal?: boolean;
      allowDuetGlobal?: boolean;
      allowDownloadGlobal?: boolean;
      allowOriginalAudioReuse?: boolean;
      socialLinks?: Record<string, string>;
    };

    const existing = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(actorUserId)
      .first<Record<string, unknown>>();
    if (!existing) return errorResponse('User not found', 404);

    let prevLinks: Record<string, string> = {};
    try {
      prevLinks = JSON.parse(String(existing.social_links_json || '{}'));
    } catch {
      prevLinks = {};
    }
    const mergedLinks = body.socialLinks ? { ...prevLinks, ...body.socialLinks } : prevLinks;

    await env.DB.prepare(
      `UPDATE users SET
        name = ?,
        bio = ?,
        avatar_url = ?,
        cover_banner_url = ?,
        account_type = ?,
        is_private_account = ?,
        two_factor_enabled = ?,
        language = ?,
        allow_comments_global = ?,
        allow_duet_global = ?,
        allow_download_global = ?,
        allow_original_audio_reuse = ?,
        social_links_json = ?
       WHERE id = ?`
    )
      .bind(
        body.name !== undefined ? body.name : existing.name,
        body.bio !== undefined ? body.bio : existing.bio,
        body.avatarUrl !== undefined ? body.avatarUrl : existing.avatar_url,
        body.coverBannerUrl !== undefined ? body.coverBannerUrl : existing.cover_banner_url,
        body.accountType !== undefined ? body.accountType : existing.account_type,
        body.isPrivateAccount !== undefined
          ? body.isPrivateAccount
            ? 1
            : 0
          : existing.is_private_account,
        body.twoFactorEnabled !== undefined
          ? body.twoFactorEnabled
            ? 1
            : 0
          : existing.two_factor_enabled,
        body.language !== undefined ? body.language : existing.language,
        body.allowCommentsGlobal !== undefined
          ? body.allowCommentsGlobal
            ? 1
            : 0
          : existing.allow_comments_global,
        body.allowDuetGlobal !== undefined
          ? body.allowDuetGlobal
            ? 1
            : 0
          : existing.allow_duet_global,
        body.allowDownloadGlobal !== undefined
          ? body.allowDownloadGlobal
            ? 1
            : 0
          : existing.allow_download_global,
        body.allowOriginalAudioReuse !== undefined
          ? body.allowOriginalAudioReuse
            ? 1
            : 0
          : existing.allow_original_audio_reuse,
        JSON.stringify(mergedLinks),
        actorUserId
      )
      .run();

    const updated = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(actorUserId)
      .first<Record<string, unknown>>();
    return jsonResponse({ ok: true, user: mapDbUserToProfile(updated!) });
  }

  return errorResponse('Unsupported auth route or method', 405);
};

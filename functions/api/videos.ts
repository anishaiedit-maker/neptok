import {
  ensureTables,
  errorResponse,
  handleOptions,
  jsonResponse,
  resolveActorUserId,
} from '../_lib/db';
import type { PagesFunction } from '../_lib/types';

function mapVideoRow(
  row: Record<string, unknown>,
  comments: Array<Record<string, unknown>>,
  viewerFlags: { liked: boolean; saved: boolean; reposted: boolean }
) {
  let hashtags: string[] = [];
  let tags: string[] = [];
  let sound: Record<string, unknown> = {
    id: 'snd-default',
    title: 'Original Sound',
    originalUploaderHandle: String(row.author_handle || 'aarav_nepal'),
    originalUploaderName: String(row.author_name || 'NepTok Creator'),
    usesCount: 1,
    durationSec: 30,
    saved: false,
  };
  try {
    hashtags = JSON.parse(String(row.hashtags_json || '[]'));
  } catch {
    hashtags = [];
  }
  try {
    tags = JSON.parse(String(row.tags_json || '[]'));
  } catch {
    tags = [];
  }
  try {
    const parsedSound = JSON.parse(String(row.sound_json || '{}'));
    if (parsedSound && parsedSound.title) sound = parsedSound;
  } catch {
    // fallback sound
  }

  return {
    id: String(row.id),
    type: (row.type === 'photo' ? 'photo' : row.type === 'reel' ? 'reel' : 'video') as
      | 'video'
      | 'reel'
      | 'photo',
    authorId: String(row.author_id),
    authorName: String(row.author_name),
    authorHandle: String(row.author_handle),
    authorVerified: Boolean(row.author_verified),
    authorAvatarColor: String(row.author_avatar_color || '#FF0080'),
    mediaUrl: String(row.media_url),
    mediaMime: row.media_mime ? String(row.media_mime) : undefined,
    r2Key: row.r2_key ? String(row.r2_key) : undefined,
    thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : undefined,
    caption: String(row.caption || ''),
    hashtags,
    tags,
    sound,
    likes: Number(row.likes ?? 0),
    likedByMe: viewerFlags.liked,
    comments: comments.map((c) => ({
      id: String(c.id),
      authorName: String(c.user_name || 'Creator'),
      authorHandle: String(c.user_handle || 'neptok_user'),
      text: String(c.comment_text || ''),
      createdAt: 'Just now',
      likes: Number(c.likes_count ?? 0),
    })),
    reposts: Number(row.reposts ?? 0),
    repostedByMe: viewerFlags.reposted,
    giftsReceivedCoins: Number(row.gifts_received_coins ?? 0),
    savedByMe: viewerFlags.saved,
    visibility: String(row.visibility || 'Everyone'),
    allowDuet: Boolean(row.allow_duet),
    allowDownload: Boolean(row.allow_download),
    allowComments: Boolean(row.allow_comments),
    allowSharing: Boolean(row.allow_sharing),
    adSettingsEnabled: Boolean(row.ad_settings_enabled),
    isDraft: Boolean(row.is_draft),
    cssFilter: String(row.css_filter || 'none'),
    views: Number(row.views ?? 0),
    estimatedEarningsUsd: Number(row.estimated_earnings_usd ?? 0),
  };
}

export const onRequest: PagesFunction = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return handleOptions();
  if (!env.DB) return errorResponse('Cloudflare D1 binding (DB) is not configured.', 503);

  await ensureTables(env.DB);
  const actorUserId = await resolveActorUserId(request, env);
  const url = new URL(request.url);
  const subpath = url.pathname.replace(/^\/api\/videos\/?/, '');
  const segments = subpath ? subpath.split('/').filter(Boolean) : [];
  const pathId = segments[0] ? decodeURIComponent(segments[0]) : null;
  const subAction = segments[1] || null;

  // GET /api/videos
  if (request.method === 'GET') {
    const tab = (url.searchParams.get('tab') || 'all').toLowerCase();
    const blockedRes = await env.DB.prepare(
      'SELECT blocked_id FROM blocked_users WHERE blocker_id = ?'
    )
      .bind(actorUserId)
      .all<{ blocked_id: string }>();
    const blockedSet = new Set(blockedRes.results.map((r) => r.blocked_id));

    const videosRes = await env.DB.prepare(
      'SELECT * FROM videos ORDER BY created_at DESC'
    ).all<Record<string, unknown>>();

    const interactionsRes = await env.DB.prepare(
      'SELECT * FROM video_interactions ORDER BY created_at ASC'
    ).all<Record<string, unknown>>();

    const commentsByVideo = new Map<string, Array<Record<string, unknown>>>();
    const flagsByVideo = new Map<string, { liked: boolean; saved: boolean; reposted: boolean }>();

    for (const row of interactionsRes.results) {
      const vid = String(row.video_id);
      const t = String(row.interaction_type);
      const uid = String(row.user_id);
      if (t === 'comment') {
        const list = commentsByVideo.get(vid) || [];
        list.push(row);
        commentsByVideo.set(vid, list);
      } else if (uid === actorUserId) {
        const cur = flagsByVideo.get(vid) || { liked: false, saved: false, reposted: false };
        if (t === 'like') cur.liked = true;
        if (t === 'save') cur.saved = true;
        if (t === 'repost') cur.reposted = true;
        flagsByVideo.set(vid, cur);
      }
    }

    let mapped = videosRes.results
      .filter((row) => {
        const authorId = String(row.author_id);
        const isDraft = Boolean(row.is_draft);
        const vis = String(row.visibility || 'Everyone');
        if (blockedSet.has(authorId) && authorId !== actorUserId) return false;
        if (isDraft && authorId !== actorUserId) return false;
        if (vis === 'Private' && authorId !== actorUserId) return false;
        return true;
      })
      .map((row) =>
        mapVideoRow(
          row,
          commentsByVideo.get(String(row.id)) || [],
          flagsByVideo.get(String(row.id)) || { liked: false, saved: false, reposted: false }
        )
      );

    if (tab === 'drafts') {
      mapped = mapped.filter((v) => v.isDraft && v.authorId === actorUserId);
    } else if (tab === 'liked') {
      mapped = mapped.filter((v) => !v.isDraft && v.likedByMe);
    } else if (tab === 'saved') {
      mapped = mapped.filter((v) => !v.isDraft && v.savedByMe);
    } else if (tab === 'private') {
      mapped = mapped.filter((v) => !v.isDraft && v.authorId === actorUserId && v.visibility === 'Private');
    }

    return jsonResponse({ videos: mapped });
  }

  // POST /api/videos/:id/interact
  if (request.method === 'POST' && pathId && subAction === 'interact') {
    const body = (await request.json().catch(() => ({}))) as {
      action?: 'like' | 'save' | 'repost' | 'comment' | 'share';
      text?: string;
    };
    const action = body.action;
    if (!action) return errorResponse('Missing interaction action.', 400);

    const videoRow = await env.DB.prepare('SELECT * FROM videos WHERE id = ?')
      .bind(pathId)
      .first<Record<string, unknown>>();
    if (!videoRow) return errorResponse('Video not found.', 404);

    const actorRow = await env.DB.prepare('SELECT name, handle FROM users WHERE id = ?')
      .bind(actorUserId)
      .first<{ name: string; handle: string }>();

    if (action === 'comment') {
      const text = (body.text || '').trim();
      if (!text) return errorResponse('Comment cannot be empty.', 400);
      const commentId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await env.DB.prepare(
        `INSERT INTO video_interactions (id, video_id, user_id, user_name, user_handle, interaction_type, comment_text, likes_count, created_at)
         VALUES (?, ?, ?, ?, ?, 'comment', ?, 0, ?)`
      )
        .bind(
          commentId,
          pathId,
          actorUserId,
          actorRow?.name || 'NepTok Creator',
          actorRow?.handle || 'aarav_nepal',
          text,
          Date.now()
        )
        .run();

      return jsonResponse({
        ok: true,
        comment: {
          id: commentId,
          authorName: actorRow?.name || 'NepTok Creator',
          authorHandle: actorRow?.handle || 'aarav_nepal',
          text,
          createdAt: 'Just now',
          likes: 0,
        },
      });
    }

    if (action === 'share') {
      await env.DB.prepare(
        `INSERT INTO video_interactions (id, video_id, user_id, user_name, user_handle, interaction_type, created_at)
         VALUES (?, ?, ?, ?, ?, 'share', ?)`
      )
        .bind(
          `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          pathId,
          actorUserId,
          actorRow?.name || '',
          actorRow?.handle || '',
          Date.now()
        )
        .run();
      return jsonResponse({ ok: true });
    }

    // Toggle like / save / repost
    const existing = await env.DB.prepare(
      'SELECT id FROM video_interactions WHERE video_id = ? AND user_id = ? AND interaction_type = ?'
    )
      .bind(pathId, actorUserId, action)
      .first<{ id: string }>();

    let active = false;
    if (existing) {
      await env.DB.prepare('DELETE FROM video_interactions WHERE id = ?').bind(existing.id).run();
      if (action === 'like') {
        await env.DB.prepare('UPDATE videos SET likes = MAX(0, likes - 1) WHERE id = ?')
          .bind(pathId)
          .run();
      } else if (action === 'repost') {
        await env.DB.prepare('UPDATE videos SET reposts = MAX(0, reposts - 1) WHERE id = ?')
          .bind(pathId)
          .run();
      }
      active = false;
    } else {
      await env.DB.prepare(
        `INSERT INTO video_interactions (id, video_id, user_id, user_name, user_handle, interaction_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          `${action}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          pathId,
          actorUserId,
          actorRow?.name || '',
          actorRow?.handle || '',
          action,
          Date.now()
        )
        .run();
      if (action === 'like') {
        await env.DB.prepare('UPDATE videos SET likes = likes + 1 WHERE id = ?').bind(pathId).run();
      } else if (action === 'repost') {
        await env.DB.prepare('UPDATE videos SET reposts = reposts + 1 WHERE id = ?')
          .bind(pathId)
          .run();
      }
      active = true;
    }

    const refreshed = await env.DB.prepare('SELECT likes, reposts FROM videos WHERE id = ?')
      .bind(pathId)
      .first<{ likes: number; reposts: number }>();

    return jsonResponse({
      ok: true,
      action,
      active,
      likes: refreshed?.likes ?? 0,
      reposts: refreshed?.reposts ?? 0,
    });
  }

  // POST /api/videos -> Create new video / save draft
  if (request.method === 'POST' && !pathId) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const id = String(body.id || `post-${Date.now()}`);
    const existing = await env.DB.prepare('SELECT author_id FROM videos WHERE id = ?')
      .bind(id)
      .first<{ author_id: string }>();

    if (existing && existing.author_id !== actorUserId) {
      return errorResponse('Forbidden: only the creator can overwrite this post.', 403);
    }

    const authorRow = await env.DB.prepare('SELECT name, handle, verified FROM users WHERE id = ?')
      .bind(actorUserId)
      .first<{ name: string; handle: string; verified: number }>();

    const isDraft = body.isDraft ? 1 : 0;
    const mediaUrl = String(body.mediaUrl || '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg');
    const r2KeyMatch = /\/api\/media\/(.+)$/.exec(mediaUrl);
    const r2Key = body.r2Key ? String(body.r2Key) : r2KeyMatch ? decodeURIComponent(r2KeyMatch[1]) : null;

    await env.DB.prepare(
      `INSERT OR REPLACE INTO videos (
        id, type, author_id, author_name, author_handle, author_verified, author_avatar_color,
        media_url, r2_key, media_mime, thumbnail_url, caption, hashtags_json, tags_json, sound_json,
        likes, reposts, gifts_received_coins, visibility, allow_duet, allow_download, allow_comments,
        allow_sharing, ad_settings_enabled, is_draft, css_filter, views, estimated_earnings_usd, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        String(body.type || 'video'),
        actorUserId,
        String(body.authorName || authorRow?.name || 'NepTok Creator'),
        String(body.authorHandle || authorRow?.handle || 'aarav_nepal'),
        authorRow?.verified ?? 1,
        String(body.authorAvatarColor || '#FF0080'),
        mediaUrl,
        r2Key,
        body.mediaMime ? String(body.mediaMime) : null,
        body.thumbnailUrl ? String(body.thumbnailUrl) : mediaUrl,
        String(body.caption || ''),
        JSON.stringify(Array.isArray(body.hashtags) ? body.hashtags : ['#NepTok']),
        JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
        JSON.stringify(body.sound || {}),
        Number(body.likes ?? (isDraft ? 0 : 1)),
        Number(body.reposts ?? 0),
        Number(body.giftsReceivedCoins ?? 0),
        String(body.visibility || 'Everyone'),
        body.allowDuet === false ? 0 : 1,
        body.allowDownload === false ? 0 : 1,
        body.allowComments === false ? 0 : 1,
        body.allowSharing === false ? 0 : 1,
        body.adSettingsEnabled === false ? 0 : 1,
        isDraft,
        String(body.cssFilter || 'none'),
        Number(body.views ?? (isDraft ? 0 : 12)),
        Number(body.estimatedEarningsUsd ?? 0),
        Date.now()
      )
      .run();

    return jsonResponse({ ok: true, id, isDraft: Boolean(isDraft) }, 201);
  }

  // PATCH /api/videos/:id or PATCH /api/videos
  if (request.method === 'PATCH' || request.method === 'PUT') {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const targetId = pathId || (body.id ? String(body.id) : null);
    if (!targetId) return errorResponse('Missing video ID.', 400);

    const existing = await env.DB.prepare('SELECT * FROM videos WHERE id = ?')
      .bind(targetId)
      .first<Record<string, unknown>>();
    if (!existing) return errorResponse('Video not found.', 404);
    if (String(existing.author_id) !== actorUserId) {
      return errorResponse('Forbidden: only the owner can edit this post.', 403);
    }

    await env.DB.prepare(
      `UPDATE videos SET
        caption = ?,
        hashtags_json = ?,
        tags_json = ?,
        visibility = ?,
        media_url = ?,
        thumbnail_url = ?,
        allow_duet = ?,
        allow_download = ?,
        allow_comments = ?,
        allow_sharing = ?,
        ad_settings_enabled = ?,
        is_draft = ?,
        css_filter = ?
       WHERE id = ?`
    )
      .bind(
        body.caption !== undefined ? String(body.caption) : existing.caption,
        body.hashtags !== undefined ? JSON.stringify(body.hashtags) : existing.hashtags_json,
        body.tags !== undefined ? JSON.stringify(body.tags) : existing.tags_json,
        body.visibility !== undefined ? String(body.visibility) : existing.visibility,
        body.mediaUrl !== undefined ? String(body.mediaUrl) : existing.media_url,
        body.thumbnailUrl !== undefined ? String(body.thumbnailUrl) : existing.thumbnail_url,
        body.allowDuet !== undefined ? (body.allowDuet ? 1 : 0) : existing.allow_duet,
        body.allowDownload !== undefined ? (body.allowDownload ? 1 : 0) : existing.allow_download,
        body.allowComments !== undefined ? (body.allowComments ? 1 : 0) : existing.allow_comments,
        body.allowSharing !== undefined ? (body.allowSharing ? 1 : 0) : existing.allow_sharing,
        body.adSettingsEnabled !== undefined
          ? body.adSettingsEnabled
            ? 1
            : 0
          : existing.ad_settings_enabled,
        body.isDraft !== undefined ? (body.isDraft ? 1 : 0) : existing.is_draft,
        body.cssFilter !== undefined ? String(body.cssFilter) : existing.css_filter,
        targetId
      )
      .run();

    return jsonResponse({ ok: true, id: targetId });
  }

  // DELETE /api/videos/:id
  if (request.method === 'DELETE') {
    const targetId = pathId || url.searchParams.get('id');
    if (!targetId) return errorResponse('Missing video ID.', 400);

    const existing = await env.DB.prepare('SELECT author_id, r2_key FROM videos WHERE id = ?')
      .bind(targetId)
      .first<{ author_id: string; r2_key: string | null }>();
    if (!existing) return errorResponse('Video not found.', 404);
    if (existing.author_id !== actorUserId) {
      return errorResponse('Forbidden: only the owner can delete this post.', 403);
    }

    await env.DB.batch([
      env.DB.prepare('DELETE FROM video_interactions WHERE video_id = ?').bind(targetId),
      env.DB.prepare('DELETE FROM videos WHERE id = ?').bind(targetId),
    ]);

    if (existing.r2_key && env.MEDIA_BUCKET) {
      await env.MEDIA_BUCKET.delete(existing.r2_key).catch(() => {});
    }

    return jsonResponse({ ok: true, deletedId: targetId });
  }

  return errorResponse('Unsupported videos route or method', 405);
};

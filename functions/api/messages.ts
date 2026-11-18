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

  // GET /api/messages -> Fetch user's chat threads, messages, and blocked users
  if (request.method === 'GET') {
    const threadsRes = await env.DB.prepare(
      'SELECT * FROM chat_threads WHERE owner_id = ? ORDER BY updated_at DESC'
    )
      .bind(actorUserId)
      .all<Record<string, unknown>>();

    const msgsRes = await env.DB.prepare(
      'SELECT * FROM messages WHERE deleted_by_sender = 0 ORDER BY created_at ASC'
    ).all<Record<string, unknown>>();

    const blockedRes = await env.DB.prepare(
      'SELECT blocked_id AS id, blocked_handle AS handle, blocked_name AS name FROM blocked_users WHERE blocker_id = ?'
    )
      .bind(actorUserId)
      .all<{ id: string; handle: string; name: string }>();

    const msgsByChat = new Map<string, Array<Record<string, unknown>>>();
    for (const m of msgsRes.results) {
      const cid = String(m.chat_id);
      const list = msgsByChat.get(cid) || [];
      list.push({
        id: String(m.id),
        sender: String(m.sender_id) === actorUserId ? 'me' : 'them',
        text: String(m.text),
        time: String(m.time_label || 'Just now'),
        sharedPostTitle: m.shared_post_title ? String(m.shared_post_title) : undefined,
        voiceDuration: m.voice_duration ? String(m.voice_duration) : undefined,
      });
      msgsByChat.set(cid, list);
    }

    const chats = threadsRes.results.map((t) => ({
      id: String(t.id),
      userId: String(t.peer_user_id),
      name: String(t.name),
      handle: String(t.handle),
      isGroup: Boolean(t.is_group),
      isRequest: Boolean(t.is_request),
      isArchived: Boolean(t.is_archived),
      online: Boolean(t.online),
      unread: Number(t.unread ?? 0),
      lastMessage: String(t.last_message || ''),
      lastTime: String(t.last_time || 'Just now'),
      messages: msgsByChat.get(String(t.id)) || [],
    }));

    return jsonResponse({
      chats,
      blockedUsers: blockedRes.results,
    });
  }

  // POST /api/messages -> send message (enforces blocked_users) or block/unblock user
  if (request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as {
      action?: 'send' | 'block' | 'unblock';
      chatId?: string;
      text?: string;
      sharedPostTitle?: string;
      userId?: string;
      handle?: string;
      name?: string;
    };

    const action = body.action || 'send';

    if (action === 'block') {
      if (!body.userId) return errorResponse('Missing userId to block.', 400);
      await env.DB.prepare(
        `INSERT OR REPLACE INTO blocked_users (blocker_id, blocked_id, blocked_handle, blocked_name, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
        .bind(
          actorUserId,
          body.userId,
          (body.handle || body.userId).replace(/^@/, ''),
          body.name || body.handle || body.userId,
          Date.now()
        )
        .run();
      return jsonResponse({ ok: true, blocked: true, userId: body.userId });
    }

    if (action === 'unblock') {
      if (!body.userId) return errorResponse('Missing userId to unblock.', 400);
      await env.DB.prepare('DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?')
        .bind(actorUserId, body.userId)
        .run();
      return jsonResponse({ ok: true, blocked: false, userId: body.userId });
    }

    const chatId = body.chatId;
    const text = (body.text || '').trim();
    if (!chatId || !text) return errorResponse('chatId and text are required.', 400);

    const thread = await env.DB.prepare(
      'SELECT * FROM chat_threads WHERE id = ? AND owner_id = ?'
    )
      .bind(chatId, actorUserId)
      .first<Record<string, unknown>>();
    if (!thread) return errorResponse('Chat thread not found.', 404);

    const peerId = String(thread.peer_user_id);
    const blockedRow = await env.DB.prepare(
      `SELECT blocker_id FROM blocked_users
       WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`
    )
      .bind(actorUserId, peerId, peerId, actorUserId)
      .first<{ blocker_id: string }>();

    if (blockedRow) {
      return errorResponse('Messaging disabled: user is blocked.', 403);
    }

    const msgId = `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await env.DB.prepare(
      `INSERT INTO messages (id, chat_id, sender_id, recipient_id, text, shared_post_title, time_label, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'Just now', ?)`
    )
      .bind(msgId, chatId, actorUserId, peerId, text, body.sharedPostTitle || null, Date.now())
      .run();

    await env.DB.prepare(
      `UPDATE chat_threads SET last_message = ?, last_time = 'Just now', updated_at = ? WHERE id = ?`
    )
      .bind(body.sharedPostTitle ? `Shared post: ${body.sharedPostTitle}` : text, Date.now(), chatId)
      .run();

    return jsonResponse({
      ok: true,
      message: {
        id: msgId,
        sender: 'me',
        text,
        sharedPostTitle: body.sharedPostTitle,
        time: 'Just now',
      },
    });
  }

  // PATCH /api/messages -> Archive / Unarchive chat thread
  if (request.method === 'PATCH') {
    const body = (await request.json().catch(() => ({}))) as {
      chatId?: string;
      isArchived?: boolean;
    };
    if (!body.chatId) return errorResponse('Missing chatId.', 400);

    await env.DB.prepare(
      'UPDATE chat_threads SET is_archived = ?, updated_at = ? WHERE id = ? AND owner_id = ?'
    )
      .bind(body.isArchived ? 1 : 0, Date.now(), body.chatId, actorUserId)
      .run();

    return jsonResponse({ ok: true, chatId: body.chatId, isArchived: Boolean(body.isArchived) });
  }

  // DELETE /api/messages -> Delete a message or entire conversation
  if (request.method === 'DELETE') {
    const body = (await request.json().catch(() => ({}))) as {
      chatId?: string;
      messageId?: string;
    };
    const url = new URL(request.url);
    const messageId = body.messageId || url.searchParams.get('messageId');
    const chatId = body.chatId || url.searchParams.get('chatId');

    if (messageId) {
      await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(messageId).run();
      return jsonResponse({ ok: true, deletedMessageId: messageId });
    }
    if (chatId) {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM messages WHERE chat_id = ?').bind(chatId),
        env.DB.prepare('DELETE FROM chat_threads WHERE id = ? AND owner_id = ?').bind(
          chatId,
          actorUserId
        ),
      ]);
      return jsonResponse({ ok: true, deletedChatId: chatId });
    }
    return errorResponse('Provide messageId or chatId to delete.', 400);
  }

  return errorResponse('Method not allowed', 405);
};

import type { ChatThread, FeedComment, FeedPost, UserProfile } from '../types/neptok';

const TOKEN_STORAGE_KEY = 'neptok_auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(url, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export interface UploadedMediaResult {
  ok: boolean;
  key: string;
  url: string;
  contentType: string;
  size: number;
}

export async function uploadMediaFile(
  input: File | Blob | string,
  kind: 'video' | 'image' | 'audio' | 'avatar' | 'cover' | 'thumbnail' | 'media' = 'media',
  filename?: string
): Promise<UploadedMediaResult> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (typeof input === 'string') {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataUrl: input,
        kind,
        filename: filename || `${kind}.png`,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as UploadedMediaResult & { error?: string };
    if (!res.ok) throw new Error(data.error || 'Media upload failed');
    return data;
  }

  const form = new FormData();
  const fileObj =
    input instanceof File
      ? input
      : new File([input], filename || `${kind}.${input.type.split('/')[1] || 'bin'}`, {
          type: input.type || 'application/octet-stream',
        });
  form.append('file', fileObj);
  form.append('kind', kind);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as UploadedMediaResult & { error?: string };
  if (!res.ok) throw new Error(data.error || 'Media upload failed');
  return data;
}

export async function fetchAuthProfile(): Promise<{ user: UserProfile }> {
  return apiFetch('/api/auth');
}

export async function updateAuthProfile(patch: Partial<UserProfile>): Promise<{ user: UserProfile }> {
  return apiFetch('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function logoutAuthApi(): Promise<void> {
  await apiFetch('/api/auth', {
    method: 'POST',
    body: JSON.stringify({ action: 'logout' }),
  }).catch(() => {});
  setAuthToken(null);
}

export async function fetchVideosApi(tab = 'all'): Promise<{ videos: FeedPost[] }> {
  return apiFetch(`/api/videos?tab=${encodeURIComponent(tab)}`);
}

export async function saveOrPublishVideoApi(post: FeedPost): Promise<{ ok: boolean; id: string }> {
  return apiFetch('/api/videos', {
    method: 'POST',
    body: JSON.stringify(post),
  });
}

export async function patchVideoApi(id: string, patch: Partial<FeedPost>): Promise<{ ok: boolean }> {
  return apiFetch(`/api/videos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteVideoApi(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/videos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function interactVideoApi(
  id: string,
  action: 'like' | 'save' | 'repost' | 'comment' | 'share',
  text?: string
): Promise<{
  ok: boolean;
  active?: boolean;
  likes?: number;
  reposts?: number;
  comment?: FeedComment;
}> {
  return apiFetch(`/api/videos/${encodeURIComponent(id)}/interact`, {
    method: 'POST',
    body: JSON.stringify({ action, text }),
  });
}

export async function fetchMessagesApi(): Promise<{
  chats: ChatThread[];
  blockedUsers: Array<{ id: string; handle: string; name: string }>;
}> {
  return apiFetch('/api/messages');
}

export async function sendMessageApi(
  chatId: string,
  text: string,
  sharedPostTitle?: string
): Promise<{ ok: boolean; message: ChatThread['messages'][number] }> {
  return apiFetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ action: 'send', chatId, text, sharedPostTitle }),
  });
}

export async function archiveChatApi(chatId: string, isArchived: boolean): Promise<{ ok: boolean }> {
  return apiFetch('/api/messages', {
    method: 'PATCH',
    body: JSON.stringify({ chatId, isArchived }),
  });
}

export async function deleteMessageOrChatApi(params: {
  chatId?: string;
  messageId?: string;
}): Promise<{ ok: boolean }> {
  return apiFetch('/api/messages', {
    method: 'DELETE',
    body: JSON.stringify(params),
  });
}

export async function toggleBlockApi(
  userId: string,
  handle: string,
  name: string,
  block: boolean
): Promise<{ ok: boolean }> {
  return apiFetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify({
      action: block ? 'block' : 'unblock',
      userId,
      handle,
      name,
    }),
  });
}

export async function fetchLiveStateApi(roomId?: string): Promise<{
  rooms: Array<Record<string, unknown>>;
  topGifters: Array<{
    sender_id: string;
    sender_name: string;
    sender_handle: string;
    recipient_handle: string;
    total_coins: number;
  }>;
}> {
  return apiFetch(roomId ? `/api/live?roomId=${encodeURIComponent(roomId)}` : '/api/live');
}

export async function liveActionApi(payload: {
  action: 'start' | 'end' | 'sync_guests' | 'start_battle' | 'finish_battle' | 'gift';
  roomId?: string;
  title?: string;
  mode?: string;
  thumbnailUrl?: string;
  coinsGoal?: number;
  heartsGoal?: number;
  guests?: unknown[];
  opponentHandle?: string;
  myScore?: number;
  oppScore?: number;
  giftId?: number;
  recipientHandle?: string;
  multiplier?: number;
}): Promise<{
  ok: boolean;
  room?: Record<string, unknown>;
  coins?: number;
  pointsAdded?: number;
  hostWinStreak?: number;
  won?: boolean;
}> {
  return apiFetch('/api/live', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

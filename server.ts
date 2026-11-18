import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { askNepTokSupportAI, generateNepTokVideo, runAICensorshipScan } from './server/ai';
import {
  INITIAL_USER,
  SEED_CHATS,
  SEED_POSTS,
  SEED_TRANSACTIONS,
  type ChatThread,
  type FeedPost,
  type UserProfile,
  type WalletTransaction,
} from './src/types/neptok';
import {
  GIFTS_48,
  COIN_PACKAGES,
  calculatePackageTotalCoins,
  coinsToUsd,
  evaluateMonetizationEligibility,
  updateBattleStreak,
} from './src/utils/neptokLogic';
import { buildR2ObjectKey, formatR2MediaUrl, parseByteRange } from './src/utils/streamHelpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AdminUserRecord {
  id: string;
  name: string;
  username: string;
  followers: number;
  kycStatus: 'Verified' | 'Pending' | 'Not Submitted';
  accountType: 'Personal' | 'Creator' | 'Business';
  standing: 'Good' | 'Warning';
  monetizationContent: boolean;
  monetizationGifts: boolean;
  earningsUsd: number;
}

export interface ModerationQueueItem {
  id: string;
  contentType: 'Video' | 'Photo' | 'Story' | 'Live' | 'Comment';
  creator: string;
  title: string;
  flagType: 'Copyright Audio' | 'NSFW / Nudity' | 'Violence / Hate Speech';
  confidence: number;
  actionTaken: string;
  status: 'Pending Review' | 'Muted & Approved' | 'Removed' | 'Restored';
  createdAt: string;
}

export interface PayoutRequestItem {
  id: string;
  creator: string;
  method: string;
  amountUsd: number;
  status: 'Pending' | 'Processing' | 'Paid' | 'Rejected';
  requestedAt: string;
}

export interface SupportTicketItem {
  id: string;
  username: string;
  subject: string;
  status: 'Open' | 'Escalated' | 'Resolved';
  createdAt: string;
}

interface StoredMediaObject {
  buffer: Buffer;
  contentType: string;
  size: number;
}

function decodeBase64DataUrl(dataUrl: string): { buffer: Buffer; mime: string } | null {
  const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

// Authoritative stateful server store (emulates Cloudflare D1 + R2 in local Express preview)
const db = {
  currentUser: {
    ...INITIAL_USER,
    socialLinks: { ...INITIAL_USER.socialLinks },
  } as UserProfile,
  posts: SEED_POSTS.map((p) => ({
    ...p,
    hashtags: [...p.hashtags],
    comments: p.comments.map((c) => ({ ...c })),
    sound: { ...p.sound },
  })) as FeedPost[],
  chats: SEED_CHATS.map((c) => ({
    ...c,
    isArchived: false,
    messages: c.messages.map((m) => ({ ...m })),
  })) as ChatThread[],
  blockedUsers: [] as Array<{ id: string; handle: string; name: string }>,
  walletTransactions: SEED_TRANSACTIONS.map((t) => ({ ...t })) as WalletTransaction[],
  giftTransactions: [] as Array<{
    id: string;
    room_id: string | null;
    post_id: string | null;
    sender_id: string;
    sender_name: string;
    sender_handle: string;
    recipient_handle: string;
    gift_id: number;
    gift_name: string;
    gift_emoji: string;
    coins: number;
    usd_value: number;
    multiplier: number;
    created_at: number;
  }>,
  mediaStore: new Map<string, StoredMediaObject>(),
  users: [
    {
      id: 'u_me',
      name: 'Aarav Gurung',
      username: 'aarav_nepal',
      followers: 6420,
      kycStatus: 'Verified',
      accountType: 'Creator',
      standing: 'Good',
      monetizationContent: true,
      monetizationGifts: true,
      earningsUsd: 350.0,
    },
    {
      id: 'u_sita',
      name: 'Sita Tamang',
      username: 'sita_kathmandu',
      followers: 48200,
      kycStatus: 'Verified',
      accountType: 'Creator',
      standing: 'Good',
      monetizationContent: true,
      monetizationGifts: true,
      earningsUsd: 1842.5,
    },
    {
      id: 'u_binod',
      name: 'Binod Sherpa',
      username: 'everest_binod',
      followers: 4150,
      kycStatus: 'Pending',
      accountType: 'Personal',
      standing: 'Good',
      monetizationContent: false,
      monetizationGifts: false,
      earningsUsd: 0,
    },
    {
      id: 'u_maya',
      name: 'Maya Pun',
      username: 'pokhara_maya',
      followers: 19840,
      kycStatus: 'Verified',
      accountType: 'Business',
      standing: 'Good',
      monetizationContent: true,
      monetizationGifts: true,
      earningsUsd: 714.2,
    },
  ] as AdminUserRecord[],
  moderationQueue: [
    {
      id: 'mod-101',
      contentType: 'Video',
      creator: '@rohan_beats',
      title: 'Kathmandu Rooftop Remix',
      flagType: 'Copyright Audio',
      confidence: 94,
      actionTaken: 'Copyrighted audio track muted automatically (0:12 - 0:28)',
      status: 'Muted & Approved',
      createdAt: '12 mins ago',
    },
    {
      id: 'mod-102',
      contentType: 'Live',
      creator: '@nightclub_ktm99',
      title: 'Late Night Party Stream',
      flagType: 'NSFW / Nudity',
      confidence: 97,
      actionTaken: 'Live stream auto-terminated in 1.2s by Vision AI',
      status: 'Pending Review',
      createdAt: '27 mins ago',
    },
    {
      id: 'mod-103',
      contentType: 'Comment',
      creator: '@spammer_acct04',
      title: 'Harassment threat comment on @sita_kathmandu',
      flagType: 'Violence / Hate Speech',
      confidence: 92,
      actionTaken: 'Quarantined before public display',
      status: 'Pending Review',
      createdAt: '1 hour ago',
    },
  ] as ModerationQueueItem[],
  payouts: [
    {
      id: 'pay-501',
      creator: '@sita_kathmandu',
      method: 'Wise (USD)',
      amountUsd: 420.0,
      status: 'Pending',
      requestedAt: '2026-11-17 05:12 UTC',
    },
    {
      id: 'pay-502',
      creator: '@pokhara_maya',
      method: 'PayPal (USD)',
      amountUsd: 185.5,
      status: 'Pending',
      requestedAt: '2026-11-17 04:40 UTC',
    },
    {
      id: 'pay-503',
      creator: '@aarav_nepal',
      method: 'USDT (TRC20)',
      amountUsd: 120.0,
      status: 'Paid',
      requestedAt: '2026-11-16 18:22 UTC',
    },
  ] as PayoutRequestItem[],
  liveRooms: [
    {
      id: 'live-1',
      host_id: 'u_sita',
      host: '@sita_kathmandu',
      host_handle: 'sita_kathmandu',
      host_name: 'Sita Tamang',
      title: 'Kathmandu Cultural Music & NEP Battle!',
      mode: 'NEP Battle',
      thumbnail_url: '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg',
      viewers: 25600,
      gifts_received_coins: 128560,
      battleActive: true,
      battle_active: 1,
      participants: 2,
      maxCapacity: 2,
      win_streak: 2,
      guests_json: '[]',
      status: 'Active',
      started_at: Date.now() - 900_000,
    },
    {
      id: 'live-2',
      host_id: 'u_binod',
      host: '@everest_binod',
      host_handle: 'everest_binod',
      host_name: 'Binod Sherpa',
      title: 'Everest Base Camp Audio Hangout',
      mode: 'Audio Live Room',
      thumbnail_url: '/src/assets/images/creator_everest_trek_1794926294520.jpg',
      viewers: 1840,
      gifts_received_coins: 4200,
      battleActive: false,
      battle_active: 0,
      participants: 14,
      maxCapacity: 30,
      win_streak: 0,
      guests_json: '[]',
      status: 'Active',
      started_at: Date.now() - 1800_000,
    },
    {
      id: 'live-3',
      host_id: 'u_maya',
      host: '@pokhara_maya',
      host_handle: 'pokhara_maya',
      host_name: 'Maya Pun',
      title: 'Pokhara Lakeside Creators Multi-Cam',
      mode: 'Video Multi-Guest',
      thumbnail_url: '/src/assets/images/creator_pokhara_lake_1794926294810.jpg',
      viewers: 4320,
      gifts_received_coins: 9600,
      battleActive: false,
      battle_active: 0,
      participants: 6,
      maxCapacity: 8,
      win_streak: 1,
      guests_json: '[]',
      status: 'Active',
      started_at: Date.now() - 2400_000,
    },
  ] as Array<Record<string, unknown>>,
  supportTickets: [] as SupportTicketItem[],
  otpSessions: new Map<string, string>(),
  snapshotStatus: {
    lastBackupAt: '2026-11-17 03:00 UTC',
    region: 'ap-south-1 / multi-region R2',
    encrypted: 'AES-256 + TLS 1.3',
  },
};

export function createApp() {
  const app = express();

  // R2 Upload emulation (must be registered BEFORE express.json so multipart & raw streams stay intact)
  app.post('/api/upload', express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
    try {
      const contentTypeHeader = String(req.headers['content-type'] || '');
      const rawBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');

      let kind = String(req.query.kind || 'media');
      let filename = 'upload.bin';
      let contentType = 'application/octet-stream';
      let storedBuffer: Buffer;

      if (contentTypeHeader.includes('multipart/form-data')) {
        const webReq = new Request('http://localhost/api/upload', {
          method: 'POST',
          headers: { 'content-type': contentTypeHeader },
          body: new Uint8Array(rawBuf),
        });
        const formData = await webReq.formData();
        const fileEntry = formData.get('file');
        const kindEntry = formData.get('kind');
        if (typeof kindEntry === 'string' && kindEntry.trim()) {
          kind = kindEntry.trim();
        }
        if (!fileEntry || typeof fileEntry === 'string') {
          res.status(400).json({ error: 'Missing multipart file field.' });
          return;
        }
        const file = fileEntry as File;
        filename = file.name || `${kind}.bin`;
        contentType = file.type || 'application/octet-stream';
        storedBuffer = Buffer.from(await file.arrayBuffer());
      } else if (contentTypeHeader.includes('application/json')) {
        const json = JSON.parse(rawBuf.toString('utf8') || '{}') as {
          dataUrl?: string;
          kind?: string;
          filename?: string;
          contentType?: string;
        };
        if (!json.dataUrl) {
          res.status(400).json({ error: 'Missing dataUrl or multipart file.' });
          return;
        }
        const decoded = decodeBase64DataUrl(json.dataUrl);
        if (!decoded) {
          res.status(400).json({ error: 'Invalid base64 dataUrl.' });
          return;
        }
        kind = json.kind || kind;
        contentType = json.contentType || decoded.mime;
        const ext = contentType.split('/')[1]?.split(';')[0] || 'bin';
        filename = json.filename || `${kind}.${ext}`;
        storedBuffer = decoded.buffer;
      } else {
        if (rawBuf.byteLength === 0) {
          res.status(400).json({ error: 'Empty request body.' });
          return;
        }
        filename = String(req.headers['x-filename'] || `${kind}.bin`);
        contentType = contentTypeHeader || 'application/octet-stream';
        storedBuffer = rawBuf;
      }

      const key = buildR2ObjectKey(kind, filename);
      db.mediaStore.set(key, {
        buffer: storedBuffer,
        contentType,
        size: storedBuffer.byteLength,
      });

      res.json({
        ok: true,
        key,
        url: formatR2MediaUrl(key),
        contentType,
        size: storedBuffer.byteLength,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  });

  // R2 Byte-Range Media Streaming Emulation
  const handleMediaServe = (req: express.Request, res: express.Response) => {
    const rawKey = decodeURIComponent(String(req.params[0] || '')).replace(/^\/+/, '');
    if (!rawKey) {
      res.status(400).json({ error: 'Missing media key.' });
      return;
    }
    const item = db.mediaStore.get(rawKey);
    if (!item) {
      res.status(404).json({ error: 'Media object not found.' });
      return;
    }

    res.setHeader('Content-Type', item.contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    const rangeHeader = req.headers.range;
    const parsed = parseByteRange(rangeHeader, item.size);

    if (parsed.kind === 'invalid') {
      res.status(416);
      res.setHeader('Content-Range', `bytes */${item.size}`);
      res.end();
      return;
    }

    if (parsed.kind === 'range') {
      res.status(206);
      res.setHeader('Content-Range', `bytes ${parsed.start}-${parsed.end}/${item.size}`);
      res.setHeader('Content-Length', String(parsed.length));
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      res.end(item.buffer.subarray(parsed.start, parsed.end + 1));
      return;
    }

    res.status(200);
    res.setHeader('Content-Length', String(item.size));
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.end(item.buffer);
  };

  app.get('/api/media/*', handleMediaServe);
  app.head('/api/media/*', handleMediaServe);

  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'NepTok API',
      currency: 'USD',
      bindings: { db: true, mediaBucket: true },
    });
  });

  // 1. Auth & User Profile Persistence
  const handleAuthGet = (_req: express.Request, res: express.Response) => {
    res.json({
      user: db.currentUser,
      monetization: {
        user_id: db.currentUser.id,
        eligible: db.currentUser.followers >= 5000 ? 1 : 0,
        content_monetization: 1,
        gift_monetization: 1,
        total_earnings_usd: db.currentUser.creatorBalanceUsd,
        pending_payout_usd: 0,
      },
    });
  };
  app.get('/api/auth', handleAuthGet);
  app.get('/api/auth/profile', handleAuthGet);

  const handleAuthPatch = (req: express.Request, res: express.Response) => {
    const body = req.body as Partial<UserProfile>;
    db.currentUser = {
      ...db.currentUser,
      ...body,
      socialLinks: body.socialLinks
        ? { ...db.currentUser.socialLinks, ...body.socialLinks }
        : db.currentUser.socialLinks,
    };
    const adminRow = db.users.find((u) => u.id === db.currentUser.id);
    if (adminRow) {
      adminRow.name = db.currentUser.name;
    }
    res.json({ ok: true, user: db.currentUser });
  };
  app.patch('/api/auth', handleAuthPatch);
  app.patch('/api/auth/profile', handleAuthPatch);
  app.put('/api/auth', handleAuthPatch);
  app.put('/api/auth/profile', handleAuthPatch);

  app.post('/api/auth', (req, res) => {
    const { action, name, handle } = req.body as {
      action?: string;
      name?: string;
      handle?: string;
    };
    if (action === 'logout') {
      res.json({ ok: true });
      return;
    }
    if (name) db.currentUser.name = name;
    if (handle) db.currentUser.handle = handle.replace(/^@/, '');
    res.json({ ok: true, token: `neptok-jwt-${Date.now()}`, user: db.currentUser });
  });

  app.post('/api/auth/login', (_req, res) => {
    res.json({ ok: true, token: `neptok-jwt-${Date.now()}`, user: db.currentUser });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, handle } = req.body as { name?: string; handle?: string };
    if (name) db.currentUser.name = name;
    if (handle) db.currentUser.handle = handle.replace(/^@/, '');
    res.status(201).json({ ok: true, token: `neptok-jwt-${Date.now()}`, user: db.currentUser });
  });

  app.post('/api/auth/otp/send', (req, res) => {
    const { phone } = req.body as { phone?: string };
    if (!phone || phone.trim().length < 7) {
      res.status(400).json({ error: 'Please enter a valid mobile number.' });
      return;
    }
    const code = '482910';
    db.otpSessions.set(phone.trim(), code);
    res.json({
      sent: true,
      phone: phone.trim(),
      demoHint: code,
      message: `Verification OTP sent via SMS to ${phone.trim()}.`,
    });
  });

  app.post('/api/auth/otp/verify', (req, res) => {
    const { phone, code } = req.body as { phone?: string; code?: string };
    if (!phone || !code) {
      res.status(400).json({ error: 'Phone and 6-digit OTP code are required.' });
      return;
    }
    const expected = db.otpSessions.get(phone.trim()) ?? '482910';
    if (code.trim() !== expected && code.trim() !== '482910') {
      res.status(401).json({ error: 'Invalid OTP code. Try 482910.' });
      return;
    }
    res.json({
      verified: true,
      token: `neptok-jwt-${Date.now()}`,
      user: db.currentUser,
    });
  });

  // 1b. Videos / Reels / Photos / Drafts CRUD & Interactions
  app.get('/api/videos', (req, res) => {
    const tab = String(req.query.tab || 'all').toLowerCase();
    const blockedSet = new Set(db.blockedUsers.map((b) => b.id));
    let filtered = db.posts.filter((p) => {
      if (blockedSet.has(p.authorId) && p.authorId !== db.currentUser.id) return false;
      if (p.isDraft && p.authorId !== db.currentUser.id) return false;
      if (p.visibility === 'Private' && p.authorId !== db.currentUser.id) return false;
      return true;
    });
    if (tab === 'drafts') {
      filtered = filtered.filter((p) => Boolean(p.isDraft) && p.authorId === db.currentUser.id);
    } else if (tab === 'liked') {
      filtered = filtered.filter((p) => !p.isDraft && p.likedByMe);
    } else if (tab === 'saved') {
      filtered = filtered.filter((p) => !p.isDraft && p.savedByMe);
    } else if (tab === 'private') {
      filtered = filtered.filter(
        (p) => !p.isDraft && p.authorId === db.currentUser.id && p.visibility === 'Private'
      );
    }
    res.json({ videos: filtered });
  });

  app.post('/api/videos', (req, res) => {
    const body = req.body as FeedPost;
    const id = body.id || `post-${Date.now()}`;
    const existingIdx = db.posts.findIndex((p) => p.id === id);
    const nextPost: FeedPost = {
      ...body,
      id,
      authorId: body.authorId || db.currentUser.id,
      authorName: body.authorName || db.currentUser.name,
      authorHandle: body.authorHandle || db.currentUser.handle,
      comments: Array.isArray(body.comments) ? body.comments : [],
    };
    if (existingIdx >= 0) {
      db.posts[existingIdx] = nextPost;
    } else {
      db.posts.unshift(nextPost);
    }
    res.status(201).json({ ok: true, id, isDraft: Boolean(nextPost.isDraft) });
  });

  app.post('/api/videos/:id/interact', (req, res) => {
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Video not found.' });
      return;
    }
    const { action, text } = req.body as {
      action?: 'like' | 'save' | 'repost' | 'comment' | 'share';
      text?: string;
    };
    if (action === 'comment') {
      const clean = (text || '').trim();
      if (!clean) {
        res.status(400).json({ error: 'Comment cannot be empty.' });
        return;
      }
      const comment = {
        id: `c-${Date.now()}`,
        authorName: db.currentUser.name,
        authorHandle: db.currentUser.handle,
        text: clean,
        createdAt: 'Just now',
        likes: 0,
      };
      post.comments = [comment, ...post.comments];
      res.json({ ok: true, comment });
      return;
    }
    if (action === 'like') {
      post.likedByMe = !post.likedByMe;
      post.likes = Math.max(0, post.likes + (post.likedByMe ? 1 : -1));
      res.json({ ok: true, action, active: post.likedByMe, likes: post.likes, reposts: post.reposts });
      return;
    }
    if (action === 'save') {
      post.savedByMe = !post.savedByMe;
      res.json({ ok: true, action, active: post.savedByMe, likes: post.likes, reposts: post.reposts });
      return;
    }
    if (action === 'repost') {
      post.repostedByMe = !post.repostedByMe;
      post.reposts = Math.max(0, post.reposts + (post.repostedByMe ? 1 : -1));
      res.json({ ok: true, action, active: post.repostedByMe, likes: post.likes, reposts: post.reposts });
      return;
    }
    if (action === 'share') {
      res.json({ ok: true });
      return;
    }
    res.status(400).json({ error: 'Invalid interaction action.' });
  });

  const handleVideoPatch = (req: express.Request, res: express.Response) => {
    const targetId = req.params.id || (req.body as { id?: string }).id;
    const idx = db.posts.findIndex((p) => p.id === targetId);
    if (idx === -1) {
      res.status(404).json({ error: 'Video not found.' });
      return;
    }
    if (db.posts[idx].authorId !== db.currentUser.id) {
      res.status(403).json({ error: 'Forbidden: only owner can edit this post.' });
      return;
    }
    db.posts[idx] = { ...db.posts[idx], ...(req.body as Partial<FeedPost>) };
    res.json({ ok: true, id: targetId });
  };
  app.patch('/api/videos/:id', handleVideoPatch);
  app.patch('/api/videos', handleVideoPatch);

  const handleVideoDelete = (req: express.Request, res: express.Response) => {
    const targetId = req.params.id || String(req.query.id || '');
    const idx = db.posts.findIndex((p) => p.id === targetId);
    if (idx === -1) {
      res.status(404).json({ error: 'Video not found.' });
      return;
    }
    if (db.posts[idx].authorId !== db.currentUser.id) {
      res.status(403).json({ error: 'Forbidden: only owner can delete this post.' });
      return;
    }
    const r2Key = db.posts[idx].r2Key;
    if (r2Key) db.mediaStore.delete(r2Key);
    db.posts.splice(idx, 1);
    res.json({ ok: true, deletedId: targetId });
  };
  app.delete('/api/videos/:id', handleVideoDelete);
  app.delete('/api/videos', handleVideoDelete);

  // 1c. Live Rooms, Battle Streak & Top Gifters
  app.get('/api/live', (req, res) => {
    const roomId = typeof req.query.roomId === 'string' ? req.query.roomId : null;
    const agg = new Map<
      string,
      {
        sender_id: string;
        sender_name: string;
        sender_handle: string;
        recipient_handle: string;
        total_coins: number;
      }
    >();
    for (const g of db.giftTransactions) {
      if (roomId && g.room_id !== roomId) continue;
      const key = `${g.sender_handle}:${g.recipient_handle}`;
      const existing = agg.get(key);
      if (existing) {
        existing.total_coins += g.coins;
      } else {
        agg.set(key, {
          sender_id: g.sender_id,
          sender_name: g.sender_name,
          sender_handle: g.sender_handle,
          recipient_handle: g.recipient_handle,
          total_coins: g.coins,
        });
      }
    }
    res.json({
      rooms: db.liveRooms,
      topGifters: Array.from(agg.values()).sort((a, b) => b.total_coins - a.total_coins),
    });
  });

  app.post('/api/live', (req, res) => {
    const body = req.body as {
      action?: string;
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
    };
    const action = body.action || 'start';

    if (action === 'start') {
      const roomId = body.roomId || `live-${db.currentUser.id}-${Date.now()}`;
      const prevHostRoom = db.liveRooms.find((r) => r.host_id === db.currentUser.id);
      const room: Record<string, unknown> = {
        id: roomId,
        host_id: db.currentUser.id,
        host: `@${db.currentUser.handle}`,
        host_handle: db.currentUser.handle,
        host_name: db.currentUser.name,
        title: body.title?.trim() || `${db.currentUser.name}'s NEP Live`,
        mode: body.mode || 'camera',
        thumbnail_url: body.thumbnailUrl || '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg',
        coins_goal: Number(body.coinsGoal ?? 1000),
        hearts_goal: Number(body.heartsGoal ?? 2500),
        viewers: 1420,
        gifts_received_coins: 0,
        participants: 1,
        maxCapacity: body.mode === 'audio' ? 30 : 8,
        battleActive: false,
        battle_active: 0,
        win_streak: Number(prevHostRoom?.win_streak ?? 2),
        guests_json: '[]',
        status: 'Active',
        started_at: Date.now(),
      };
      db.liveRooms.unshift(room);
      res.status(201).json({ ok: true, room });
      return;
    }

    if (action === 'end' && body.roomId) {
      const room = db.liveRooms.find((r) => r.id === body.roomId);
      if (room) {
        room.status = 'Ended';
        room.battleActive = false;
        room.battle_active = 0;
        room.ended_at = Date.now();
      }
      res.json({ ok: true, roomId: body.roomId });
      return;
    }

    if (action === 'sync_guests' && body.roomId) {
      const guests = Array.isArray(body.guests) ? body.guests : [];
      const room = db.liveRooms.find((r) => r.id === body.roomId);
      if (room) {
        room.participants = Math.min(8, 1 + guests.length);
        room.guests_json = JSON.stringify(guests);
      }
      res.json({ ok: true, participants: 1 + guests.length });
      return;
    }

    if (action === 'start_battle' && body.roomId) {
      const room = db.liveRooms.find((r) => r.id === body.roomId);
      if (room) {
        room.battleActive = true;
        room.battle_active = 1;
        room.battle_opponent_handle = body.opponentHandle || 'sita_kathmandu';
      }
      res.json({ ok: true, battleActive: true });
      return;
    }

    if (action === 'finish_battle' && body.roomId) {
      const myScore = Number(body.myScore ?? 0);
      const oppScore = Number(body.oppScore ?? 0);
      const won = myScore >= oppScore;
      const room = db.liveRooms.find((r) => r.id === body.roomId);
      const nextStreak = updateBattleStreak(Number(room?.win_streak ?? 0), won);
      if (room) {
        room.battleActive = false;
        room.battle_active = 0;
        room.win_streak = nextStreak;
      }
      res.json({ ok: true, won, hostWinStreak: nextStreak, myScore, oppScore });
      return;
    }

    if (action === 'gift') {
      const gift = GIFTS_48.find((g) => g.id === Number(body.giftId));
      if (!gift) {
        res.status(404).json({ error: 'Gift not found in catalog.' });
        return;
      }
      if (db.currentUser.coins < gift.coins) {
        res.status(402).json({
          error: 'Insufficient Coins! Recharge your wallet to continue sending gifts.',
        });
        return;
      }
      db.currentUser.coins -= gift.coins;
      const mult = Math.max(1, Math.min(4, Math.floor(Number(body.multiplier ?? 1))));
      const recipientHandle = (body.recipientHandle || db.currentUser.handle).replace(/^@/, '');
      const usdValue = coinsToUsd(gift.coins);
      const txId = `gift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      db.giftTransactions.push({
        id: txId,
        room_id: body.roomId || null,
        post_id: null,
        sender_id: db.currentUser.id,
        sender_name: db.currentUser.name,
        sender_handle: db.currentUser.handle,
        recipient_handle: recipientHandle,
        gift_id: gift.id,
        gift_name: gift.name,
        gift_emoji: gift.emoji,
        coins: gift.coins,
        usd_value: usdValue,
        multiplier: mult,
        created_at: Date.now(),
      });

      db.walletTransactions.unshift({
        id: `wtx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: `Sent ${gift.name} to @${recipientHandle}`,
        type: 'Gift Sent',
        coinsDelta: -gift.coins,
        usdAmount: usdValue,
        time: 'Just now',
        method: 'NEP Live Balance',
      });

      const room = db.liveRooms.find((r) => r.id === body.roomId);
      if (room) {
        room.gifts_received_coins = Number(room.gifts_received_coins ?? 0) + gift.coins;
      }

      res.json({
        ok: true,
        sent: true,
        gift,
        coins: db.currentUser.coins,
        pointsAdded: gift.coins * mult,
        usdValue,
        transactionId: txId,
      });
      return;
    }

    res.status(400).json({ error: 'Unsupported live action.' });
  });

  // 1d. Messages, Threads, Archive, Delete & Blocklist
  app.get('/api/messages', (_req, res) => {
    res.json({
      chats: db.chats,
      blockedUsers: db.blockedUsers,
    });
  });

  app.post('/api/messages', (req, res) => {
    const body = req.body as {
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
      if (!body.userId) {
        res.status(400).json({ error: 'Missing userId to block.' });
        return;
      }
      if (!db.blockedUsers.some((b) => b.id === body.userId)) {
        db.blockedUsers.push({
          id: body.userId,
          handle: (body.handle || body.userId).replace(/^@/, ''),
          name: body.name || body.handle || body.userId,
        });
      }
      res.json({ ok: true, blocked: true, userId: body.userId });
      return;
    }

    if (action === 'unblock') {
      db.blockedUsers = db.blockedUsers.filter((b) => b.id !== body.userId);
      res.json({ ok: true, blocked: false, userId: body.userId });
      return;
    }

    const thread = db.chats.find((c) => c.id === body.chatId);
    const text = (body.text || '').trim();
    if (!thread || !text) {
      res.status(thread ? 400 : 404).json({
        error: thread ? 'Message text is required.' : 'Chat thread not found.',
      });
      return;
    }
    if (db.blockedUsers.some((b) => b.id === thread.userId)) {
      res.status(403).json({ error: 'Messaging disabled: user is blocked.' });
      return;
    }

    const msg = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'me' as const,
      text,
      sharedPostTitle: body.sharedPostTitle,
      time: 'Just now',
    };
    thread.messages.push(msg);
    thread.lastMessage = body.sharedPostTitle ? `Shared post: ${body.sharedPostTitle}` : text;
    thread.lastTime = 'Just now';

    res.json({ ok: true, message: msg });
  });

  app.patch('/api/messages', (req, res) => {
    const { chatId, isArchived } = req.body as { chatId?: string; isArchived?: boolean };
    const thread = db.chats.find((c) => c.id === chatId);
    if (!thread) {
      res.status(404).json({ error: 'Chat thread not found.' });
      return;
    }
    thread.isArchived = Boolean(isArchived);
    res.json({ ok: true, chatId, isArchived: thread.isArchived });
  });

  app.delete('/api/messages', (req, res) => {
    const body = (req.body || {}) as { chatId?: string; messageId?: string };
    const messageId = body.messageId || String(req.query.messageId || '');
    const chatId = body.chatId || String(req.query.chatId || '');

    if (messageId) {
      db.chats.forEach((c) => {
        c.messages = c.messages.filter((m) => m.id !== messageId);
        if (c.messages.length > 0) {
          c.lastMessage = c.messages[c.messages.length - 1].text;
        }
      });
      res.json({ ok: true, deletedMessageId: messageId });
      return;
    }
    if (chatId) {
      db.chats = db.chats.filter((c) => c.id !== chatId);
      res.json({ ok: true, deletedChatId: chatId });
      return;
    }
    res.status(400).json({ error: 'Provide messageId or chatId to delete.' });
  });

  // 2. AI Content Censorship & Copyright Scan
  app.post('/api/moderation/scan', async (req, res) => {
    try {
      const { caption, audioTitle, mediaType, creator, simulateFlag } = req.body as {
        caption?: string;
        audioTitle?: string;
        mediaType?: 'video' | 'reel' | 'photo' | 'story' | 'live';
        creator?: string;
        simulateFlag?: 'none' | 'copyright' | 'nsfw' | 'violence';
      };

      const verdict = await runAICensorshipScan({
        caption: caption ?? '',
        audioTitle: audioTitle ?? 'Original Sound',
        mediaType: mediaType ?? 'video',
        simulateFlag,
      });

      if (verdict.status !== 'APPROVED') {
        db.moderationQueue.unshift({
          id: `mod-${Date.now().toString().slice(-4)}`,
          contentType:
            mediaType === 'live'
              ? 'Live'
              : mediaType === 'photo'
              ? 'Photo'
              : mediaType === 'story'
              ? 'Story'
              : 'Video',
          creator: creator ?? '@aarav_nepal',
          title: caption?.slice(0, 60) || 'Untitled Upload',
          flagType:
            verdict.copyrightStatus !== 'CLEAR'
              ? 'Copyright Audio'
              : verdict.nsfwScore >= verdict.violenceScore
              ? 'NSFW / Nudity'
              : 'Violence / Hate Speech',
          confidence: Math.max(
            verdict.copyrightConfidence,
            verdict.nsfwScore,
            verdict.violenceScore
          ),
          actionTaken: verdict.reasons[0] ?? 'Flagged by AI Safety Pipeline',
          status: verdict.copyrightStatus === 'MUTED_SEGMENT' ? 'Muted & Approved' : 'Pending Review',
          createdAt: 'Just now',
        });
      }

      res.json(verdict);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Moderation scan failed',
      });
    }
  });

  // 3. Chat with AI (Help Center & Settings)
  app.post('/api/support/chat', async (req, res) => {
    try {
      const { message, history, language, userContext } = req.body as {
        message?: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
        language?: 'en' | 'ne';
        userContext?: {
          username: string;
          followers: number;
          coins: number;
          creatorBalanceUsd: number;
        };
      };
      if (!message || !message.trim()) {
        res.status(400).json({ error: 'Message cannot be empty.' });
        return;
      }
      const result = await askNepTokSupportAI({
        message: message.trim(),
        history,
        language,
        userContext,
      });
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI support service unavailable.';
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/support/escalate', (req, res) => {
    const { username, subject } = req.body as { username?: string; subject?: string };
    const ticket: SupportTicketItem = {
      id: `TKT-${Date.now().toString().slice(-5)}`,
      username: username ?? '@aarav_nepal',
      subject: subject ?? 'Creator Account Support Escalation',
      status: 'Escalated',
      createdAt: new Date().toISOString(),
    };
    db.supportTickets.unshift(ticket);
    res.json({ created: true, ticket });
  });

  // 3b. Text-to-Video Generation
  app.post('/api/ai/generate-video', async (req, res) => {
    try {
      const { prompt, aspectRatio } = req.body as {
        prompt?: string;
        aspectRatio?: '16:9' | '9:16';
      };
      if (!prompt || !prompt.trim()) {
        res.status(400).json({ error: 'Please provide a video prompt.' });
        return;
      }
      const result = await generateNepTokVideo({
        prompt: prompt.trim(),
        aspectRatio: aspectRatio === '16:9' ? '16:9' : '9:16',
      });
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI video generation failed.';
      res.status(500).json({ error: msg });
    }
  });

  // 4. Wallet & Gifts (USD & Coins)
  app.get('/api/gifts', (_req, res) => {
    res.json({ gifts: GIFTS_48, total: GIFTS_48.length });
  });

  app.get('/api/wallet', (_req, res) => {
    res.json({
      coins: db.currentUser.coins,
      creatorBalanceUsd: db.currentUser.creatorBalanceUsd,
      transactions: db.walletTransactions,
    });
  });

  app.post('/api/wallet/recharge', (req, res) => {
    const { packageId, method } = req.body as { packageId?: string; method?: string };
    const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      res.status(400).json({ error: 'Invalid coin package selected.' });
      return;
    }
    const creditedCoins = calculatePackageTotalCoins(pkg);
    db.currentUser.coins += creditedCoins;
    db.walletTransactions.unshift({
      id: `wtx-${Date.now()}`,
      title: `Recharge ${pkg.coins.toLocaleString()} Coins${pkg.bonusPct ? ` (+${pkg.bonusPct}% Bonus)` : ''}`,
      type: 'Recharge',
      coinsDelta: creditedCoins,
      usdAmount: pkg.priceUsd,
      time: 'Just now',
      method: method ?? 'Visa •••• 4242',
    });
    res.json({
      success: true,
      packageId: pkg.id,
      chargedUsd: pkg.priceUsd,
      creditedCoins,
      coins: db.currentUser.coins,
      method: method ?? 'Visa •••• 4242',
      reference: `NT-USD-${Date.now().toString().slice(-6)}`,
    });
  });

  app.post('/api/wallet/withdraw', (req, res) => {
    const { amountUsd, method, creator } = req.body as {
      amountUsd?: number;
      method?: string;
      creator?: string;
    };
    const amt = Number(amountUsd ?? 0);
    if (!Number.isFinite(amt) || amt < 10) {
      res.status(400).json({ error: 'Minimum USD withdrawal is $10.00.' });
      return;
    }
    if (amt > db.currentUser.creatorBalanceUsd) {
      res.status(400).json({ error: 'Insufficient USD creator balance.' });
      return;
    }
    db.currentUser.creatorBalanceUsd = Number((db.currentUser.creatorBalanceUsd - amt).toFixed(2));
    const payout: PayoutRequestItem = {
      id: `pay-${Date.now().toString().slice(-4)}`,
      creator: creator ?? `@${db.currentUser.handle}`,
      method: method ?? 'Wise (USD)',
      amountUsd: Number(amt.toFixed(2)),
      status: 'Pending',
      requestedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    };
    db.payouts.unshift(payout);
    db.walletTransactions.unshift({
      id: `wtx-${Date.now()}`,
      title: 'Creator USD Withdrawal',
      type: 'Withdraw',
      coinsDelta: 0,
      usdAmount: payout.amountUsd,
      time: 'Just now',
      method: payout.method,
    });
    res.json({ success: true, payout, creatorBalanceUsd: db.currentUser.creatorBalanceUsd });
  });

  app.post('/api/gifts/send', (req, res) => {
    const { giftId, recipient, postId } = req.body as {
      giftId?: number;
      recipient?: string;
      postId?: string;
    };
    const gift = GIFTS_48.find((g) => g.id === giftId);
    if (!gift) {
      res.status(404).json({ error: 'Gift not found in catalog.' });
      return;
    }
    if (db.currentUser.coins < gift.coins) {
      res.status(402).json({ error: 'Insufficient Coins!' });
      return;
    }
    db.currentUser.coins -= gift.coins;
    if (postId) {
      const targetPost = db.posts.find((p) => p.id === postId);
      if (targetPost) targetPost.giftsReceivedCoins += gift.coins;
    }
    const recipientHandle = (recipient ?? '@sita_kathmandu').replace(/^@/, '');
    const usdValue = coinsToUsd(gift.coins);
    db.giftTransactions.push({
      id: `gift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      room_id: null,
      post_id: postId || null,
      sender_id: db.currentUser.id,
      sender_name: db.currentUser.name,
      sender_handle: db.currentUser.handle,
      recipient_handle: recipientHandle,
      gift_id: gift.id,
      gift_name: gift.name,
      gift_emoji: gift.emoji,
      coins: gift.coins,
      usd_value: usdValue,
      multiplier: 1,
      created_at: Date.now(),
    });
    db.walletTransactions.unshift({
      id: `wtx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `Sent ${gift.name} to @${recipientHandle}`,
      type: 'Gift Sent',
      coinsDelta: -gift.coins,
      usdAmount: usdValue,
      time: 'Just now',
      method: 'Coin Balance',
    });
    res.json({
      sent: true,
      gift,
      recipient: `@${recipientHandle}`,
      usdValue,
      coins: db.currentUser.coins,
      timestamp: Date.now(),
    });
  });

  // 5. Web Admin Dashboard Endpoints
  app.get('/api/admin/overview', (_req, res) => {
    res.json({
      metrics: {
        totalActiveCreators: 142890,
        liveViewersNow: db.liveRooms.reduce((sum, r) => sum + Number(r.viewers ?? 0), 0),
        dailyGrossRevenueUsd: 48920.5,
        pendingModerationCount: db.moderationQueue.filter((m) => m.status === 'Pending Review')
          .length,
        pendingPayoutsUsd: db.payouts
          .filter((p) => p.status === 'Pending')
          .reduce((s, p) => s + p.amountUsd, 0),
      },
      users: db.users.map((u) => ({
        ...u,
        monetizationEligibility: evaluateMonetizationEligibility(
          u.followers,
          u.standing === 'Good'
        ),
      })),
      moderationQueue: db.moderationQueue,
      payouts: db.payouts,
      liveRooms: db.liveRooms,
      supportTickets: db.supportTickets,
      snapshotStatus: db.snapshotStatus,
      giftCount: GIFTS_48.length,
    });
  });

  app.post('/api/admin/kyc/:userId', (req, res) => {
    const { status } = req.body as { status: 'Verified' | 'Pending' | 'Not Submitted' };
    const user = db.users.find((u) => u.id === req.params.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    user.kycStatus = status;
    res.json({ updated: true, user });
  });

  app.post('/api/admin/monetization/:userId', (req, res) => {
    const { content, gifts } = req.body as { content?: boolean; gifts?: boolean };
    const user = db.users.find((u) => u.id === req.params.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const elig = evaluateMonetizationEligibility(user.followers, user.standing === 'Good');
    if (!elig.eligible && (content || gifts)) {
      res.status(400).json({
        error: `User @${user.username} has ${user.followers} followers (minimum 5,000 required).`,
      });
      return;
    }
    if (typeof content === 'boolean') user.monetizationContent = content;
    if (typeof gifts === 'boolean') user.monetizationGifts = gifts;
    res.json({ updated: true, user });
  });

  app.post('/api/admin/moderation/:modId', (req, res) => {
    const { status } = req.body as { status: ModerationQueueItem['status'] };
    const item = db.moderationQueue.find((m) => m.id === req.params.modId);
    if (!item) {
      res.status(404).json({ error: 'Moderation item not found' });
      return;
    }
    item.status = status;
    res.json({ updated: true, item });
  });

  app.post('/api/admin/payouts/:payoutId', (req, res) => {
    const { status } = req.body as { status: PayoutRequestItem['status'] };
    const item = db.payouts.find((p) => p.id === req.params.payoutId);
    if (!item) {
      res.status(404).json({ error: 'Payout request not found' });
      return;
    }
    item.status = status;
    res.json({ updated: true, item });
  });

  app.post('/api/admin/live/:roomId/terminate', (req, res) => {
    const room = db.liveRooms.find((r) => r.id === req.params.roomId);
    if (!room) {
      res.status(404).json({ error: 'Live room not found' });
      return;
    }
    room.status = 'Terminated';
    room.viewers = 0;
    res.json({ terminated: true, room });
  });

  app.post('/api/admin/backup/trigger', (_req, res) => {
    db.snapshotStatus.lastBackupAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    res.json({ success: true, snapshotStatus: db.snapshotStatus });
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vitePromise = createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`NepTok Server running at http://localhost:${port}`);
  });

  server.on('error', (err) => {
    console.error('NepTok Server listen error:', err);
    process.exit(1);
  });
}

startServer();

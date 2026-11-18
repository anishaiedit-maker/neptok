import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { askNepTokSupportAI, generateNepTokVideo, runAICensorshipScan } from './server/ai';
import {
  GIFTS_48,
  COIN_PACKAGES,
  calculatePackageTotalCoins,
  coinsToUsd,
  evaluateMonetizationEligibility,
} from './src/utils/neptokLogic';

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

// Authoritative server state (seeded for immediate production demonstration)
const db = {
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
      host: '@sita_kathmandu',
      title: 'Kathmandu Cultural Music & NEP Battle!',
      mode: 'NEP Battle',
      viewers: 25600,
      battleActive: true,
      participants: 2,
      maxCapacity: 2,
      status: 'Active',
    },
    {
      id: 'live-2',
      host: '@everest_binod',
      title: 'Everest Base Camp Audio Hangout',
      mode: 'Audio Live Room',
      viewers: 1840,
      battleActive: false,
      participants: 14,
      maxCapacity: 30,
      status: 'Active',
    },
    {
      id: 'live-3',
      host: '@pokhara_maya',
      title: 'Pokhara Lakeside Creators Multi-Cam',
      mode: 'Video Multi-Guest',
      viewers: 4320,
      battleActive: false,
      participants: 6,
      maxCapacity: 8,
      status: 'Active',
    },
  ],
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
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'NepTok API', currency: 'USD' });
  });

  // 1. Mobile OTP & Auth
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
    res.json({ verified: true, token: `neptok-jwt-${Date.now()}` });
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

  // 3b. Text-to-Video Generation (gemini-omni-1.2-flash via Interactions API)
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

  app.post('/api/wallet/recharge', (req, res) => {
    const { packageId, method } = req.body as { packageId?: string; method?: string };
    const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      res.status(400).json({ error: 'Invalid coin package selected.' });
      return;
    }
    const creditedCoins = calculatePackageTotalCoins(pkg);
    res.json({
      success: true,
      packageId: pkg.id,
      chargedUsd: pkg.priceUsd,
      creditedCoins,
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
    const payout: PayoutRequestItem = {
      id: `pay-${Date.now().toString().slice(-4)}`,
      creator: creator ?? '@aarav_nepal',
      method: method ?? 'Wise (USD)',
      amountUsd: Number(amt.toFixed(2)),
      status: 'Pending',
      requestedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    };
    db.payouts.unshift(payout);
    res.json({ success: true, payout });
  });

  app.post('/api/gifts/send', (req, res) => {
    const { giftId, recipient } = req.body as { giftId?: number; recipient?: string };
    const gift = GIFTS_48.find((g) => g.id === giftId);
    if (!gift) {
      res.status(404).json({ error: 'Gift not found in catalog.' });
      return;
    }
    res.json({
      sent: true,
      gift,
      recipient: recipient ?? '@sita_kathmandu',
      usdValue: coinsToUsd(gift.coins),
      timestamp: Date.now(),
    });
  });

  // 5. Web Admin Dashboard Endpoints
  app.get('/api/admin/overview', (_req, res) => {
    res.json({
      metrics: {
        totalActiveCreators: 142890,
        liveViewersNow: db.liveRooms.reduce((sum, r) => sum + r.viewers, 0),
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

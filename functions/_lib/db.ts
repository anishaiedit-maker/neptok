import { verifySessionToken } from './crypto';
import type { CFEnv, D1Database } from './types';

let initPromise: Promise<void> | null = null;

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
};

export function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function ensureTables(db: D1Database): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const statements = [
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          handle TEXT NOT NULL UNIQUE,
          phone TEXT,
          email TEXT,
          password_hash TEXT,
          bio TEXT NOT NULL DEFAULT '',
          avatar_url TEXT NOT NULL DEFAULT '',
          cover_banner_url TEXT NOT NULL DEFAULT '/src/assets/images/nepal_profile_banner_1794926293036.jpg',
          verified INTEGER NOT NULL DEFAULT 1,
          followers INTEGER NOT NULL DEFAULT 6420,
          following INTEGER NOT NULL DEFAULT 348,
          likes INTEGER NOT NULL DEFAULT 184200,
          coins INTEGER NOT NULL DEFAULT 12500,
          creator_balance_usd REAL NOT NULL DEFAULT 350.00,
          account_type TEXT NOT NULL DEFAULT 'Personal',
          kyc_status TEXT NOT NULL DEFAULT 'Verified',
          standing TEXT NOT NULL DEFAULT 'Good',
          is_private_account INTEGER NOT NULL DEFAULT 0,
          two_factor_enabled INTEGER NOT NULL DEFAULT 1,
          language TEXT NOT NULL DEFAULT 'en',
          allow_comments_global INTEGER NOT NULL DEFAULT 1,
          allow_duet_global INTEGER NOT NULL DEFAULT 1,
          allow_download_global INTEGER NOT NULL DEFAULT 1,
          allow_original_audio_reuse INTEGER NOT NULL DEFAULT 1,
          social_links_json TEXT NOT NULL DEFAULT '{}',
          created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
        )`,
        `CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
        )`,
        `CREATE TABLE IF NOT EXISTS videos (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL DEFAULT 'video',
          author_id TEXT NOT NULL,
          author_name TEXT NOT NULL,
          author_handle TEXT NOT NULL,
          author_verified INTEGER NOT NULL DEFAULT 1,
          author_avatar_color TEXT NOT NULL DEFAULT '#FF0080',
          media_url TEXT NOT NULL,
          r2_key TEXT,
          media_mime TEXT,
          thumbnail_url TEXT,
          caption TEXT NOT NULL DEFAULT '',
          hashtags_json TEXT NOT NULL DEFAULT '[]',
          tags_json TEXT NOT NULL DEFAULT '[]',
          sound_json TEXT NOT NULL DEFAULT '{}',
          likes INTEGER NOT NULL DEFAULT 0,
          reposts INTEGER NOT NULL DEFAULT 0,
          gifts_received_coins INTEGER NOT NULL DEFAULT 0,
          visibility TEXT NOT NULL DEFAULT 'Everyone',
          allow_duet INTEGER NOT NULL DEFAULT 1,
          allow_download INTEGER NOT NULL DEFAULT 1,
          allow_comments INTEGER NOT NULL DEFAULT 1,
          allow_sharing INTEGER NOT NULL DEFAULT 1,
          ad_settings_enabled INTEGER NOT NULL DEFAULT 1,
          is_draft INTEGER NOT NULL DEFAULT 0,
          css_filter TEXT NOT NULL DEFAULT 'none',
          views INTEGER NOT NULL DEFAULT 0,
          estimated_earnings_usd REAL NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
        )`,
        `CREATE TABLE IF NOT EXISTS video_interactions (
          id TEXT PRIMARY KEY,
          video_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          user_name TEXT NOT NULL DEFAULT '',
          user_handle TEXT NOT NULL DEFAULT '',
          interaction_type TEXT NOT NULL,
          comment_text TEXT,
          likes_count INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
        )`,
        `CREATE TABLE IF NOT EXISTS live_rooms (
          id TEXT PRIMARY KEY,
          host_id TEXT NOT NULL,
          host_handle TEXT NOT NULL,
          host_name TEXT NOT NULL,
          title TEXT NOT NULL,
          mode TEXT NOT NULL DEFAULT 'camera',
          thumbnail_url TEXT NOT NULL DEFAULT '',
          coins_goal INTEGER NOT NULL DEFAULT 1000,
          hearts_goal INTEGER NOT NULL DEFAULT 2500,
          viewers INTEGER NOT NULL DEFAULT 1420,
          like_count INTEGER NOT NULL DEFAULT 1240,
          gifts_received_coins INTEGER NOT NULL DEFAULT 128560,
          participants INTEGER NOT NULL DEFAULT 1,
          max_capacity INTEGER NOT NULL DEFAULT 8,
          guests_json TEXT NOT NULL DEFAULT '[]',
          battle_active INTEGER NOT NULL DEFAULT 0,
          battle_opponent_handle TEXT,
          battle_my_score INTEGER NOT NULL DEFAULT 0,
          battle_opp_score INTEGER NOT NULL DEFAULT 0,
          win_streak INTEGER NOT NULL DEFAULT 2,
          status TEXT NOT NULL DEFAULT 'Active',
          started_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
          ended_at INTEGER
        )`,
        `CREATE TABLE IF NOT EXISTS gift_transactions (
          id TEXT PRIMARY KEY,
          room_id TEXT,
          post_id TEXT,
          sender_id TEXT NOT NULL,
          sender_name TEXT NOT NULL,
          sender_handle TEXT NOT NULL,
          recipient_handle TEXT NOT NULL,
          gift_id INTEGER NOT NULL,
          gift_name TEXT NOT NULL,
          gift_emoji TEXT NOT NULL DEFAULT '🎁',
          coins INTEGER NOT NULL,
          usd_value REAL NOT NULL,
          multiplier INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
        )`,
        `CREATE TABLE IF NOT EXISTS chat_threads (
          id TEXT PRIMARY KEY,
          owner_id TEXT NOT NULL,
          peer_user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          handle TEXT NOT NULL,
          is_group INTEGER NOT NULL DEFAULT 0,
          is_request INTEGER NOT NULL DEFAULT 0,
          is_archived INTEGER NOT NULL DEFAULT 0,
          online INTEGER NOT NULL DEFAULT 1,
          unread INTEGER NOT NULL DEFAULT 0,
          last_message TEXT NOT NULL DEFAULT '',
          last_time TEXT NOT NULL DEFAULT 'Just now',
          updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
        )`,
        `CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL,
          sender_id TEXT NOT NULL,
          recipient_id TEXT NOT NULL,
          text TEXT NOT NULL,
          shared_post_title TEXT,
          voice_duration TEXT,
          time_label TEXT NOT NULL DEFAULT 'Just now',
          deleted_by_sender INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
        )`,
        `CREATE TABLE IF NOT EXISTS blocked_users (
          blocker_id TEXT NOT NULL,
          blocked_id TEXT NOT NULL,
          blocked_handle TEXT NOT NULL,
          blocked_name TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
          PRIMARY KEY (blocker_id, blocked_id)
        )`,
        `CREATE TABLE IF NOT EXISTS creator_monetization (
          user_id TEXT PRIMARY KEY,
          eligible INTEGER NOT NULL DEFAULT 1,
          content_monetization INTEGER NOT NULL DEFAULT 1,
          gift_monetization INTEGER NOT NULL DEFAULT 1,
          total_earnings_usd REAL NOT NULL DEFAULT 350.00,
          pending_payout_usd REAL NOT NULL DEFAULT 0.00,
          updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
        )`,
        `CREATE TABLE IF NOT EXISTS wallet_transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          coins_delta INTEGER NOT NULL DEFAULT 0,
          usd_amount REAL NOT NULL DEFAULT 0,
          time_label TEXT NOT NULL DEFAULT 'Just now',
          method TEXT NOT NULL DEFAULT 'Coin Balance',
          created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
        )`,
        `CREATE TABLE IF NOT EXISTS payout_requests (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          creator TEXT NOT NULL,
          method TEXT NOT NULL,
          amount_usd REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'Pending',
          requested_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS moderation_queue (
          id TEXT PRIMARY KEY,
          content_type TEXT NOT NULL,
          creator TEXT NOT NULL,
          title TEXT NOT NULL,
          flag_type TEXT NOT NULL,
          confidence INTEGER NOT NULL,
          action_taken TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Pending Review',
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS support_tickets (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          subject TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Escalated',
          created_at TEXT NOT NULL
        )`,
      ];

      await db.batch(statements.map((sql) => db.prepare(sql)));
      await seedInitialDataIfEmpty(db);
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
}

async function seedInitialDataIfEmpty(db: D1Database): Promise<void> {
  const userCountRow = await db.prepare('SELECT COUNT(*) AS cnt FROM users').first<{ cnt: number }>();
  if ((userCountRow?.cnt ?? 0) > 0) return;

  const seedStmts = [
    db
      .prepare(
        `INSERT OR IGNORE INTO users (id, name, handle, phone, email, bio, cover_banner_url, verified, followers, following, likes, coins, creator_balance_usd, account_type, kyc_status, standing, social_links_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        'u_me',
        'Aarav Gurung',
        'aarav_nepal',
        '+977 9841234567',
        'aarav@neptok.com',
        'Kathmandu & Pokhara Creator | Himalayan Reels, NEP Live Host & Visual Storyteller 🇳🇵',
        '/src/assets/images/nepal_profile_banner_1794926293036.jpg',
        1,
        6420,
        348,
        184200,
        12500,
        350.0,
        'Personal',
        'Verified',
        'Good',
        JSON.stringify({
          youtube: 'https://youtube.com/@aarav_nepal',
          instagram: 'https://instagram.com/aarav_nepal',
          facebook: 'https://facebook.com/aarav.nepal',
          tiktok: 'https://tiktok.com/@aarav_nepal',
          x: 'https://x.com/aarav_nepal',
          website: 'https://neptok.com/@aarav_nepal',
        })
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO users (id, name, handle, phone, email, bio, cover_banner_url, verified, followers, following, likes, coins, creator_balance_usd, account_type, kyc_status, standing, social_links_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        'u_sita',
        'Sita Tamang',
        'sita_kathmandu',
        '+977 9801122334',
        'sita@neptok.com',
        'Kathmandu Cultural Dancer & NEP Battle Host',
        '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg',
        1,
        48200,
        210,
        512000,
        24000,
        1842.5,
        'Creator',
        'Verified',
        'Good',
        '{}'
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO users (id, name, handle, phone, email, bio, cover_banner_url, verified, followers, following, likes, coins, creator_balance_usd, account_type, kyc_status, standing, social_links_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        'u_binod',
        'Binod Sherpa',
        'everest_binod',
        '+977 9811223344',
        'binod@neptok.com',
        'Himalayan Expedition Filmmaker | 8K Sagarmatha',
        '/src/assets/images/creator_everest_trek_1794926294520.jpg',
        1,
        4150,
        180,
        95400,
        6200,
        0,
        'Personal',
        'Pending',
        'Good',
        '{}'
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO users (id, name, handle, phone, email, bio, cover_banner_url, verified, followers, following, likes, coins, creator_balance_usd, account_type, kyc_status, standing, social_links_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        'u_maya',
        'Maya Pun',
        'pokhara_maya',
        '+977 9822334455',
        'maya@neptok.com',
        'Pokhara Lakeside Creator & Acoustic Sarangi',
        '/src/assets/images/creator_pokhara_lake_1794926294810.jpg',
        1,
        19840,
        310,
        245000,
        15000,
        714.2,
        'Business',
        'Verified',
        'Good',
        '{}'
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO creator_monetization (user_id, eligible, content_monetization, gift_monetization, total_earnings_usd, pending_payout_usd)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind('u_me', 1, 1, 1, 350.0, 0),
    db
      .prepare(
        `INSERT OR IGNORE INTO videos (id, type, author_id, author_name, author_handle, author_verified, author_avatar_color, media_url, thumbnail_url, caption, hashtags_json, tags_json, sound_json, likes, reposts, gifts_received_coins, visibility, is_draft, views, estimated_earnings_usd, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        'post-1',
        'video',
        'u_sita',
        'Sita Tamang',
        'sita_kathmandu',
        1,
        '#FF0080',
        '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg',
        '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg',
        'Twilight dance at Kathmandu Durbar Square! Tag a friend who loves Nepali heritage.',
        JSON.stringify(['#NepTok', '#Kathmandu', '#NepaliDance', '#VisitNepal']),
        JSON.stringify(['Kathmandu', 'Dance']),
        JSON.stringify({
          id: 'snd-1',
          title: 'Original Sound - Madal & Flute Fusion',
          originalUploaderHandle: 'sita_kathmandu',
          originalUploaderName: 'Sita Tamang',
          usesCount: 14200,
          durationSec: 32,
          saved: false,
        }),
        42850,
        1940,
        8450,
        'Everyone',
        0,
        285400,
        264.8,
        Date.now() - 3600_000 * 5
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO videos (id, type, author_id, author_name, author_handle, author_verified, author_avatar_color, media_url, thumbnail_url, caption, hashtags_json, tags_json, sound_json, likes, reposts, gifts_received_coins, visibility, is_draft, views, estimated_earnings_usd, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        'post-2',
        'reel',
        'u_binod',
        'Binod Sherpa',
        'everest_binod',
        1,
        '#38BDF8',
        '/src/assets/images/creator_everest_trek_1794926294520.jpg',
        '/src/assets/images/creator_everest_trek_1794926294520.jpg',
        'Sunrise at 5,364m above Khumbu Glacier. Nothing beats Himalayan air!',
        JSON.stringify(['#Everest', '#Sagarmatha', '#Himalayas', '#Nepal']),
        JSON.stringify(['Everest', 'Himalayas']),
        JSON.stringify({
          id: 'snd-2',
          title: 'Original Sound - Himalayan Wind & Singing Bowl',
          originalUploaderHandle: 'everest_binod',
          originalUploaderName: 'Binod Sherpa',
          usesCount: 8910,
          durationSec: 45,
          saved: true,
        }),
        89320,
        4120,
        15200,
        'Everyone',
        0,
        512000,
        492.4,
        Date.now() - 3600_000 * 4
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO videos (id, type, author_id, author_name, author_handle, author_verified, author_avatar_color, media_url, thumbnail_url, caption, hashtags_json, tags_json, sound_json, likes, reposts, gifts_received_coins, visibility, is_draft, views, estimated_earnings_usd, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        'post-3',
        'photo',
        'u_maya',
        'Maya Pun',
        'pokhara_maya',
        1,
        '#9D00FF',
        '/src/assets/images/creator_pokhara_lake_1794926294810.jpg',
        '/src/assets/images/creator_pokhara_lake_1794926294810.jpg',
        'Golden morning reflection of Machapuchare on Phewa Lake, Pokhara.',
        JSON.stringify(['#Pokhara', '#PhewaLake', '#Machapuchare', '#NepTokPhoto']),
        JSON.stringify(['Pokhara', 'PhewaLake']),
        JSON.stringify({
          id: 'snd-3',
          title: 'Original Sound - Lakeside Sarangi Acoustic',
          originalUploaderHandle: 'pokhara_maya',
          originalUploaderName: 'Maya Pun',
          usesCount: 5340,
          durationSec: 28,
          saved: false,
        }),
        31400,
        890,
        3900,
        'Everyone',
        0,
        194500,
        178.5,
        Date.now() - 3600_000 * 3
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO videos (id, type, author_id, author_name, author_handle, author_verified, author_avatar_color, media_url, thumbnail_url, caption, hashtags_json, tags_json, sound_json, likes, reposts, gifts_received_coins, visibility, is_draft, views, estimated_earnings_usd, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        'post-4',
        'video',
        'u_me',
        'Aarav Gurung',
        'aarav_nepal',
        1,
        '#FF0080',
        '/src/assets/images/nepal_profile_banner_1794926293036.jpg',
        '/src/assets/images/nepal_profile_banner_1794926293036.jpg',
        'My NepTok Creator Showcase — From Boudhanath Stupa to Chitwan & Everest.',
        JSON.stringify(['#NepTokCreator', '#NepalHeritage', '#PrideOfNepal']),
        JSON.stringify(['Kathmandu', 'CreatorStudio']),
        JSON.stringify({
          id: 'snd-4',
          title: 'Original Sound - NepTok Anthem Beat',
          originalUploaderHandle: 'aarav_nepal',
          originalUploaderName: 'Aarav Gurung',
          usesCount: 2450,
          durationSec: 30,
          saved: true,
        }),
        18420,
        520,
        6400,
        'Everyone',
        0,
        142000,
        138.2,
        Date.now() - 3600_000 * 2
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO video_interactions (id, video_id, user_id, user_name, user_handle, interaction_type, comment_text, likes_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('like-seed-1', 'post-2', 'u_me', 'Aarav Gurung', 'aarav_nepal', 'like', null, 0, Date.now() - 3000_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO video_interactions (id, video_id, user_id, user_name, user_handle, interaction_type, comment_text, likes_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('save-seed-1', 'post-2', 'u_me', 'Aarav Gurung', 'aarav_nepal', 'save', null, 0, Date.now() - 3000_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO video_interactions (id, video_id, user_id, user_name, user_handle, interaction_type, comment_text, likes_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('c1', 'post-1', 'u_binod', 'Binod Sherpa', 'everest_binod', 'comment', 'Incredible lighting and traditional moves!', 214, Date.now() - 720_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO video_interactions (id, video_id, user_id, user_name, user_handle, interaction_type, comment_text, likes_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('c2', 'post-1', 'u_maya', 'Maya Pun', 'pokhara_maya', 'comment', 'So proud to see Durbar Square shining on NepTok!', 98, Date.now() - 360_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO video_interactions (id, video_id, user_id, user_name, user_handle, interaction_type, comment_text, likes_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('c3', 'post-2', 'u_me', 'Aarav Gurung', 'aarav_nepal', 'comment', 'Pure 8K sharpness on that ridge!', 342, Date.now() - 1440_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO video_interactions (id, video_id, user_id, user_name, user_handle, interaction_type, comment_text, likes_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('c4', 'post-3', 'u_sita', 'Sita Tamang', 'sita_kathmandu', 'comment', 'HSL color grading looks like cinema!', 125, Date.now() - 2400_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO chat_threads (id, owner_id, peer_user_id, name, handle, is_group, is_request, is_archived, online, unread, last_message, last_time, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('ch-1', 'u_me', 'u_sita', 'Sita Tamang', 'sita_kathmandu', 0, 0, 0, 1, 2, 'Ready for our 8 PM NEP Battle?', '2m', Date.now() - 120_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO chat_threads (id, owner_id, peer_user_id, name, handle, is_group, is_request, is_archived, online, unread, last_message, last_time, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('ch-2', 'u_me', 'u_binod', 'Binod Sherpa', 'everest_binod', 0, 0, 0, 1, 0, 'Sent you the raw 8K Everest clip to edit.', '1h', Date.now() - 3600_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO chat_threads (id, owner_id, peer_user_id, name, handle, is_group, is_request, is_archived, online, unread, last_message, last_time, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('ch-3', 'u_me', 'grp_ktm', 'Nepal Creators Hub', 'ktm_creators', 1, 0, 0, 1, 5, 'Maya: Hosting a 30-seat Audio Live room at 9 PM!', '2h', Date.now() - 7200_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO chat_threads (id, owner_id, peer_user_id, name, handle, is_group, is_request, is_archived, online, unread, last_message, last_time, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('ch-4', 'u_me', 'u_req', 'Rohan Thapa', 'rohan_beats', 0, 1, 0, 0, 1, 'Hey! Want to duet using my Sarangi remix?', 'Yesterday', Date.now() - 86400_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO messages (id, chat_id, sender_id, recipient_id, text, time_label, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('m1', 'ch-1', 'u_sita', 'u_me', 'Namaste Aarav! Loved your Pokhara reel.', '6:12 PM', Date.now() - 900_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO messages (id, chat_id, sender_id, recipient_id, text, time_label, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('m2', 'ch-1', 'u_me', 'u_sita', 'Thank you Sita! Your Durbar Square dance went viral.', '6:14 PM', Date.now() - 600_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO messages (id, chat_id, sender_id, recipient_id, text, time_label, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('m3', 'ch-1', 'u_sita', 'u_me', 'Ready for our 8 PM NEP Battle?', '6:30 PM', Date.now() - 120_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO messages (id, chat_id, sender_id, recipient_id, text, time_label, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('m4', 'ch-2', 'u_binod', 'u_me', 'Sent you the raw 8K Everest clip to edit.', '5:20 PM', Date.now() - 3600_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO messages (id, chat_id, sender_id, recipient_id, text, time_label, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('m5', 'ch-3', 'grp_ktm', 'u_me', 'Maya: Hosting a 30-seat Audio Live room at 9 PM!', '4:15 PM', Date.now() - 7200_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO messages (id, chat_id, sender_id, recipient_id, text, time_label, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('m6', 'ch-4', 'u_req', 'u_me', 'Hey! Want to duet using my Sarangi remix?', 'Yesterday', Date.now() - 86400_000),
    db
      .prepare(
        `INSERT OR IGNORE INTO live_rooms (id, host_id, host_handle, host_name, title, mode, thumbnail_url, viewers, participants, max_capacity, battle_active, win_streak, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('live-1', 'u_sita', 'sita_kathmandu', 'Sita Tamang', 'Kathmandu Cultural Music & NEP Battle!', 'NEP Battle', '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg', 25600, 2, 2, 1, 2, 'Active'),
    db
      .prepare(
        `INSERT OR IGNORE INTO live_rooms (id, host_id, host_handle, host_name, title, mode, thumbnail_url, viewers, participants, max_capacity, battle_active, win_streak, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('live-2', 'u_binod', 'everest_binod', 'Binod Sherpa', 'Everest Base Camp Audio Hangout', 'Audio Live Room', '/src/assets/images/creator_everest_trek_1794926294520.jpg', 1840, 14, 30, 0, 0, 'Active'),
    db
      .prepare(
        `INSERT OR IGNORE INTO live_rooms (id, host_id, host_handle, host_name, title, mode, thumbnail_url, viewers, participants, max_capacity, battle_active, win_streak, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('live-3', 'u_maya', 'pokhara_maya', 'Maya Pun', 'Pokhara Lakeside Creators Multi-Cam', 'Video Multi-Guest', '/src/assets/images/creator_pokhara_lake_1794926294810.jpg', 4320, 6, 8, 0, 1, 'Active'),
    db
      .prepare(
        `INSERT OR IGNORE INTO payout_requests (id, user_id, creator, method, amount_usd, status, requested_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('pay-501', 'u_sita', '@sita_kathmandu', 'Wise (USD)', 420.0, 'Pending', '2026-11-17 05:12 UTC'),
    db
      .prepare(
        `INSERT OR IGNORE INTO payout_requests (id, user_id, creator, method, amount_usd, status, requested_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('pay-502', 'u_maya', '@pokhara_maya', 'PayPal (USD)', 185.5, 'Pending', '2026-11-17 04:40 UTC'),
    db
      .prepare(
        `INSERT OR IGNORE INTO payout_requests (id, user_id, creator, method, amount_usd, status, requested_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('pay-503', 'u_me', '@aarav_nepal', 'USDT (TRC20)', 120.0, 'Paid', '2026-11-16 18:22 UTC'),
    db
      .prepare(
        `INSERT OR IGNORE INTO moderation_queue (id, content_type, creator, title, flag_type, confidence, action_taken, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('mod-101', 'Video', '@rohan_beats', 'Kathmandu Rooftop Remix', 'Copyright Audio', 94, 'Copyrighted audio track muted automatically (0:12 - 0:28)', 'Muted & Approved', '12 mins ago'),
    db
      .prepare(
        `INSERT OR IGNORE INTO moderation_queue (id, content_type, creator, title, flag_type, confidence, action_taken, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('mod-102', 'Live', '@nightclub_ktm99', 'Late Night Party Stream', 'NSFW / Nudity', 97, 'Live stream auto-terminated in 1.2s by Vision AI', 'Pending Review', '27 mins ago'),
    db
      .prepare(
        `INSERT OR IGNORE INTO moderation_queue (id, content_type, creator, title, flag_type, confidence, action_taken, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind('mod-103', 'Comment', '@spammer_acct04', 'Harassment threat comment on @sita_kathmandu', 'Violence / Hate Speech', 92, 'Quarantined before public display', 'Pending Review', '1 hour ago'),
  ];

  await db.batch(seedStmts);
}

export async function resolveActorUserId(request: Request, env: CFEnv): Promise<string> {
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const verified = await verifySessionToken(token, env.AUTH_SECRET);
    if (verified?.userId) return verified.userId;
  }
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = /(?:^|;\s*)neptok_session=([^;]+)/.exec(cookieHeader);
  if (match?.[1]) {
    const verified = await verifySessionToken(decodeURIComponent(match[1]), env.AUTH_SECRET);
    if (verified?.userId) return verified.userId;
  }
  return 'u_me';
}

export function mapDbUserToProfile(row: Record<string, unknown>) {
  let socialLinks = {
    youtube: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    x: '',
    website: '',
  };
  try {
    const parsed = JSON.parse(String(row.social_links_json || '{}'));
    socialLinks = { ...socialLinks, ...parsed };
  } catch {
    // ignore malformed json
  }
  return {
    id: String(row.id),
    name: String(row.name || 'NepTok Creator'),
    handle: String(row.handle || 'neptok_user'),
    bio: String(row.bio || ''),
    avatarUrl: String(row.avatar_url || ''),
    coverBannerUrl: String(
      row.cover_banner_url || '/src/assets/images/nepal_profile_banner_1794926293036.jpg'
    ),
    verified: Boolean(row.verified),
    followers: Number(row.followers ?? 0),
    following: Number(row.following ?? 0),
    likes: Number(row.likes ?? 0),
    coins: Number(row.coins ?? 0),
    creatorBalanceUsd: Number(row.creator_balance_usd ?? 0),
    accountType: (row.account_type === 'Business' ? 'Business' : 'Personal') as 'Personal' | 'Business',
    isPrivateAccount: Boolean(row.is_private_account),
    twoFactorEnabled: Boolean(row.two_factor_enabled),
    language: (row.language === 'ne' ? 'ne' : 'en') as 'en' | 'ne',
    allowCommentsGlobal: row.allow_comments_global === undefined ? true : Boolean(row.allow_comments_global),
    allowDuetGlobal: row.allow_duet_global === undefined ? true : Boolean(row.allow_duet_global),
    allowDownloadGlobal: row.allow_download_global === undefined ? true : Boolean(row.allow_download_global),
    allowOriginalAudioReuse:
      row.allow_original_audio_reuse === undefined ? true : Boolean(row.allow_original_audio_reuse),
    socialLinks,
  };
}

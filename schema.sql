-- NepTok Cloudflare D1 Database Schema
-- Run via: wrangler d1 execute neptok-db --file=./schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
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
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS videos (
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
);

CREATE TABLE IF NOT EXISTS video_interactions (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  user_handle TEXT NOT NULL DEFAULT '',
  interaction_type TEXT NOT NULL, -- 'like' | 'save' | 'repost' | 'comment' | 'share'
  comment_text TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_videos_author ON videos(author_id, is_draft, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_video ON video_interactions(video_id, interaction_type, user_id);

CREATE TABLE IF NOT EXISTS live_rooms (
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
);

CREATE TABLE IF NOT EXISTS gift_transactions (
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
);

CREATE INDEX IF NOT EXISTS idx_gifts_room ON gift_transactions(room_id, recipient_handle, created_at DESC);

CREATE TABLE IF NOT EXISTS chat_threads (
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
);

CREATE TABLE IF NOT EXISTS messages (
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
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at ASC);

CREATE TABLE IF NOT EXISTS blocked_users (
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  blocked_handle TEXT NOT NULL,
  blocked_name TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS creator_monetization (
  user_id TEXT PRIMARY KEY,
  eligible INTEGER NOT NULL DEFAULT 1,
  content_monetization INTEGER NOT NULL DEFAULT 1,
  gift_monetization INTEGER NOT NULL DEFAULT 1,
  total_earnings_usd REAL NOT NULL DEFAULT 350.00,
  pending_payout_usd REAL NOT NULL DEFAULT 0.00,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  coins_delta INTEGER NOT NULL DEFAULT 0,
  usd_amount REAL NOT NULL DEFAULT 0,
  time_label TEXT NOT NULL DEFAULT 'Just now',
  method TEXT NOT NULL DEFAULT 'Coin Balance',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS payout_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  creator TEXT NOT NULL,
  method TEXT NOT NULL,
  amount_usd REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  requested_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS moderation_queue (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  creator TEXT NOT NULL,
  title TEXT NOT NULL,
  flag_type TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  action_taken TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Review',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Escalated',
  created_at TEXT NOT NULL
);

-- Seed Primary & Demo Creator Accounts
INSERT OR IGNORE INTO users (
  id, name, handle, phone, email, bio, cover_banner_url, verified, followers, following, likes, coins, creator_balance_usd, account_type, kyc_status, standing, social_links_json
) VALUES
  (
    'u_me', 'Aarav Gurung', 'aarav_nepal', '+977 9841234567', 'aarav@neptok.com',
    'Kathmandu & Pokhara Creator | Himalayan Reels, NEP Live Host & Visual Storyteller 🇳🇵',
    '/src/assets/images/nepal_profile_banner_1794926293036.jpg', 1, 6420, 348, 184200, 12500, 350.00, 'Personal', 'Verified', 'Good',
    '{"youtube":"https://youtube.com/@aarav_nepal","instagram":"https://instagram.com/aarav_nepal","facebook":"https://facebook.com/aarav.nepal","tiktok":"https://tiktok.com/@aarav_nepal","x":"https://x.com/aarav_nepal","website":"https://neptok.com/@aarav_nepal"}'
  ),
  (
    'u_sita', 'Sita Tamang', 'sita_kathmandu', '+977 9801122334', 'sita@neptok.com',
    'Kathmandu Cultural Dancer & NEP Battle Host',
    '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg', 1, 48200, 210, 512000, 24000, 1842.50, 'Creator', 'Verified', 'Good', '{}'
  ),
  (
    'u_binod', 'Binod Sherpa', 'everest_binod', '+977 9811223344', 'binod@neptok.com',
    'Himalayan Expedition Filmmaker | 8K Sagarmatha',
    '/src/assets/images/creator_everest_trek_1794926294520.jpg', 1, 4150, 180, 95400, 6200, 0.00, 'Personal', 'Pending', 'Good', '{}'
  ),
  (
    'u_maya', 'Maya Pun', 'pokhara_maya', '+977 9822334455', 'maya@neptok.com',
    'Pokhara Lakeside Creator & Acoustic Sarangi',
    '/src/assets/images/creator_pokhara_lake_1794926294810.jpg', 1, 19840, 310, 245000, 15000, 714.20, 'Business', 'Verified', 'Good', '{}'
  );

INSERT OR IGNORE INTO creator_monetization (user_id, eligible, content_monetization, gift_monetization, total_earnings_usd, pending_payout_usd)
VALUES
  ('u_me', 1, 1, 1, 350.00, 0.00),
  ('u_sita', 1, 1, 1, 1842.50, 420.00),
  ('u_binod', 0, 0, 0, 0.00, 0.00),
  ('u_maya', 1, 1, 1, 714.20, 185.50);

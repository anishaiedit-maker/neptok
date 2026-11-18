export type PostVisibility = 'Everyone' | 'Friends' | 'Followers' | 'Private';

export type GiftCategory = 'Floral' | 'Cultural' | 'Love' | 'Luxury' | 'Himalayan';

export interface GiftItem {
  id: number;
  name: string;
  coins: number;
  category: GiftCategory;
  emoji: string;
  accentColor: string;
  secondaryColor: string;
  animationStyle: 'burst' | 'float' | 'vortex' | 'epic3d';
}

// Exact 48 Original Gifts (Double Rose 1 -> Sagarmatha 1,000)
export const GIFTS_48: GiftItem[] = [
  { id: 1, name: 'Double Rose', coins: 1, category: 'Floral', emoji: '🌹', accentColor: '#FF0080', secondaryColor: '#FF70B8', animationStyle: 'float' },
  { id: 2, name: 'Namaste', coins: 1, category: 'Cultural', emoji: '🙏', accentColor: '#FFB800', secondaryColor: '#FF0080', animationStyle: 'float' },
  { id: 3, name: 'Nepali Tea', coins: 2, category: 'Cultural', emoji: '🍵', accentColor: '#34D399', secondaryColor: '#F59E0B', animationStyle: 'float' },
  { id: 4, name: 'Momo Plate', coins: 5, category: 'Cultural', emoji: '🥟', accentColor: '#FBBF24', secondaryColor: '#FF0080', animationStyle: 'burst' },
  { id: 5, name: 'Marigold Garland', coins: 5, category: 'Floral', emoji: '🌼', accentColor: '#F59E0B', secondaryColor: '#FDE047', animationStyle: 'float' },
  { id: 6, name: 'Pink Heart', coins: 10, category: 'Love', emoji: '💖', accentColor: '#FF0080', secondaryColor: '#9D00FF', animationStyle: 'burst' },
  { id: 7, name: 'Rhododendron', coins: 10, category: 'Floral', emoji: '🌺', accentColor: '#E11D48', secondaryColor: '#FB7185', animationStyle: 'float' },
  { id: 8, name: 'Khukuri Charm', coins: 15, category: 'Cultural', emoji: '🗡️', accentColor: '#94A3B8', secondaryColor: '#F59E0B', animationStyle: 'burst' },
  { id: 9, name: 'Prayer Flag', coins: 15, category: 'Cultural', emoji: '🎏', accentColor: '#3B82F6', secondaryColor: '#EF4444', animationStyle: 'float' },
  { id: 10, name: 'Diyo Lamp', coins: 20, category: 'Cultural', emoji: '🪔', accentColor: '#F97316', secondaryColor: '#FACC15', animationStyle: 'float' },
  { id: 11, name: 'Dhaka Topi', coins: 25, category: 'Cultural', emoji: '🎩', accentColor: '#DC2626', secondaryColor: '#FBBF24', animationStyle: 'burst' },
  { id: 12, name: 'Madal Beat', coins: 25, category: 'Cultural', emoji: '🥁', accentColor: '#D97706', secondaryColor: '#FF0080', animationStyle: 'burst' },
  { id: 13, name: 'Sarangi Tune', coins: 30, category: 'Cultural', emoji: '🎻', accentColor: '#B45309', secondaryColor: '#F472B6', animationStyle: 'float' },
  { id: 14, name: 'Neon Butterflies', coins: 35, category: 'Floral', emoji: '🦋', accentColor: '#9D00FF', secondaryColor: '#FF0080', animationStyle: 'float' },
  { id: 15, name: 'Starlight Kiss', coins: 40, category: 'Love', emoji: '😘', accentColor: '#EC4899', secondaryColor: '#F43F5E', animationStyle: 'burst' },
  { id: 16, name: 'Coffee Mug', coins: 45, category: 'Cultural', emoji: '☕', accentColor: '#A16207', secondaryColor: '#FDE68A', animationStyle: 'float' },
  { id: 17, name: 'Fireworks', coins: 50, category: 'Luxury', emoji: '🎆', accentColor: '#FF0080', secondaryColor: '#38BDF8', animationStyle: 'vortex' },
  { id: 18, name: 'Glowing Lotus', coins: 50, category: 'Floral', emoji: '🪷', accentColor: '#F472B6', secondaryColor: '#FDE047', animationStyle: 'float' },
  { id: 19, name: 'Danphe Bird', coins: 60, category: 'Himalayan', emoji: '🦚', accentColor: '#06B6D4', secondaryColor: '#9D00FF', animationStyle: 'vortex' },
  { id: 20, name: 'Sel Roti', coins: 65, category: 'Cultural', emoji: '🍩', accentColor: '#D97706', secondaryColor: '#FBBF24', animationStyle: 'burst' },
  { id: 21, name: 'Singing Bowl', coins: 75, category: 'Cultural', emoji: '🥣', accentColor: '#EAB308', secondaryColor: '#F59E0B', animationStyle: 'vortex' },
  { id: 22, name: 'Love Bouquet', coins: 80, category: 'Love', emoji: '💐', accentColor: '#FF0080', secondaryColor: '#FB7185', animationStyle: 'burst' },
  { id: 23, name: 'Snow Leopard', coins: 99, category: 'Himalayan', emoji: '🐆', accentColor: '#E2E8F0', secondaryColor: '#38BDF8', animationStyle: 'vortex' },
  { id: 24, name: 'One-Horned Rhino', coins: 100, category: 'Himalayan', emoji: '🦏', accentColor: '#94A3B8', secondaryColor: '#10B981', animationStyle: 'vortex' },
  { id: 25, name: 'Neon Mic', coins: 110, category: 'Luxury', emoji: '🎤', accentColor: '#9D00FF', secondaryColor: '#FF0080', animationStyle: 'burst' },
  { id: 26, name: 'Diamond Ring', coins: 120, category: 'Love', emoji: '💍', accentColor: '#38BDF8', secondaryColor: '#F472B6', animationStyle: 'vortex' },
  { id: 27, name: 'Golden Crown', coins: 150, category: 'Luxury', emoji: '👑', accentColor: '#FACC15', secondaryColor: '#F97316', animationStyle: 'vortex' },
  { id: 28, name: 'Phewa Boat', coins: 160, category: 'Himalayan', emoji: '🛶', accentColor: '#0EA5E9', secondaryColor: '#F59E0B', animationStyle: 'vortex' },
  { id: 29, name: 'Red Panda', coins: 180, category: 'Himalayan', emoji: '🦊', accentColor: '#EF4444', secondaryColor: '#FDE047', animationStyle: 'burst' },
  { id: 30, name: 'Disco Party', coins: 200, category: 'Luxury', emoji: '🪩', accentColor: '#9D00FF', secondaryColor: '#38BDF8', animationStyle: 'vortex' },
  { id: 31, name: 'Boudha Stupa', coins: 220, category: 'Cultural', emoji: '🛕', accentColor: '#FBBF24', secondaryColor: '#FF0080', animationStyle: 'epic3d' },
  { id: 32, name: 'Love Teddy', coins: 250, category: 'Love', emoji: '🧸', accentColor: '#F472B6', secondaryColor: '#F59E0B', animationStyle: 'burst' },
  { id: 33, name: 'Neon Dragon', coins: 280, category: 'Luxury', emoji: '🐉', accentColor: '#10B981', secondaryColor: '#9D00FF', animationStyle: 'epic3d' },
  { id: 34, name: 'Golden Pagoda', coins: 300, category: 'Cultural', emoji: '🏯', accentColor: '#F59E0B', secondaryColor: '#EF4444', animationStyle: 'epic3d' },
  { id: 35, name: 'Super Car', coins: 350, category: 'Luxury', emoji: '🏎️', accentColor: '#EF4444', secondaryColor: '#FF0080', animationStyle: 'epic3d' },
  { id: 36, name: 'Yeti Frost', coins: 380, category: 'Himalayan', emoji: '❄️', accentColor: '#38BDF8', secondaryColor: '#818CF8', animationStyle: 'vortex' },
  { id: 37, name: 'Galaxy Heart', coins: 400, category: 'Love', emoji: '💜', accentColor: '#9D00FF', secondaryColor: '#FF0080', animationStyle: 'epic3d' },
  { id: 38, name: 'Royal Palace', coins: 450, category: 'Luxury', emoji: '🏰', accentColor: '#FACC15', secondaryColor: '#9D00FF', animationStyle: 'epic3d' },
  { id: 39, name: 'Private Jet', coins: 500, category: 'Luxury', emoji: '✈️', accentColor: '#38BDF8', secondaryColor: '#F8FAFC', animationStyle: 'epic3d' },
  { id: 40, name: 'Yak Caravan', coins: 550, category: 'Himalayan', emoji: '🐃', accentColor: '#A855F7', secondaryColor: '#FBBF24', animationStyle: 'epic3d' },
  { id: 41, name: 'Helicopter Tour', coins: 600, category: 'Himalayan', emoji: '🚁', accentColor: '#38BDF8', secondaryColor: '#FF0080', animationStyle: 'epic3d' },
  { id: 42, name: 'Nepali Flag Halo', coins: 650, category: 'Cultural', emoji: '🇳🇵', accentColor: '#DC2626', secondaryColor: '#2563EB', animationStyle: 'epic3d' },
  { id: 43, name: 'Diamond Yacht', coins: 700, category: 'Luxury', emoji: '🛥️', accentColor: '#22D3EE', secondaryColor: '#3B82F6', animationStyle: 'epic3d' },
  { id: 44, name: 'Golden Lion', coins: 750, category: 'Luxury', emoji: '🦁', accentColor: '#F59E0B', secondaryColor: '#FDE047', animationStyle: 'epic3d' },
  { id: 45, name: 'Lumbini Peace', coins: 800, category: 'Cultural', emoji: '☸️', accentColor: '#FACC15', secondaryColor: '#FF0080', animationStyle: 'epic3d' },
  { id: 46, name: 'Cosmic Rocket', coins: 888, category: 'Luxury', emoji: '🚀', accentColor: '#FF0080', secondaryColor: '#9D00FF', animationStyle: 'epic3d' },
  { id: 47, name: 'Machapuchare', coins: 950, category: 'Himalayan', emoji: '🏔️', accentColor: '#38BDF8', secondaryColor: '#F472B6', animationStyle: 'epic3d' },
  { id: 48, name: 'Sagarmatha', coins: 1000, category: 'Himalayan', emoji: '🗻', accentColor: '#FACC15', secondaryColor: '#FF0080', animationStyle: 'epic3d' },
];

export interface CoinPackage {
  id: string;
  coins: number;
  priceUsd: number;
  bonusPct: number;
  label: string;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'pkg-100', coins: 100, priceUsd: 1.0, bonusPct: 0, label: 'Starter' },
  { id: 'pkg-500', coins: 500, priceUsd: 5.0, bonusPct: 5, label: 'Popular' },
  { id: 'pkg-1000', coins: 1000, priceUsd: 10.0, bonusPct: 8, label: 'Creator Fan' },
  { id: 'pkg-2500', coins: 2500, priceUsd: 25.0, bonusPct: 12, label: 'Value Pack' },
  { id: 'pkg-5000', coins: 5000, priceUsd: 50.0, bonusPct: 15, label: 'Battle Boost' },
  { id: 'pkg-10000', coins: 10000, priceUsd: 100.0, bonusPct: 20, label: 'VIP Sagarmatha' },
];

export function coinsToUsd(coins: number): number {
  return Number((coins * 0.01).toFixed(2));
}

export function usdToCoins(usd: number): number {
  return Math.round(usd * 100);
}

export function calculatePackageTotalCoins(pkg: CoinPackage): number {
  return Math.round(pkg.coins * (1 + pkg.bonusPct / 100));
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCoins(coins: number): string {
  return `${coins.toLocaleString('en-US')} N`;
}

export const MONETIZATION_FOLLOWER_THRESHOLD = 5000;

export interface MonetizationEligibility {
  eligible: boolean;
  followers: number;
  requiredFollowers: number;
  remainingFollowers: number;
  progressPct: number;
  accountStandingGood: boolean;
}

export function evaluateMonetizationEligibility(
  followers: number,
  accountStandingGood = true
): MonetizationEligibility {
  const safeFollowers = Math.max(0, Math.floor(followers));
  const remaining = Math.max(0, MONETIZATION_FOLLOWER_THRESHOLD - safeFollowers);
  const progressPct = Math.min(
    100,
    Math.round((safeFollowers / MONETIZATION_FOLLOWER_THRESHOLD) * 1000) / 10
  );
  return {
    eligible: safeFollowers >= MONETIZATION_FOLLOWER_THRESHOLD && accountStandingGood,
    followers: safeFollowers,
    requiredFollowers: MONETIZATION_FOLLOWER_THRESHOLD,
    remainingFollowers: remaining,
    progressPct,
    accountStandingGood,
  };
}

export function calculateCreatorContentEarningsUsd(views: number, engagementRatePct = 6.5): number {
  const rpm = 0.85 + Math.min(2.0, engagementRatePct * 0.12);
  return Number(((views / 1000) * rpm).toFixed(2));
}

export function calculateCreatorGiftPayoutUsd(receivedCoins: number, creatorSharePct = 0.7): number {
  return Number((coinsToUsd(receivedCoins) * creatorSharePct).toFixed(2));
}

export interface FeedPostSummary {
  id: string;
  authorId: string;
  visibility: PostVisibility;
}

export function canViewPost(
  post: FeedPostSummary,
  viewerId: string,
  blockedUserIds: string[],
  followingIds: string[],
  friendIds: string[]
): boolean {
  if (blockedUserIds.includes(post.authorId) && post.authorId !== viewerId) {
    return false;
  }
  if (post.authorId === viewerId) {
    return true;
  }
  switch (post.visibility) {
    case 'Everyone':
      return true;
    case 'Friends':
      return friendIds.includes(post.authorId);
    case 'Followers':
      return followingIds.includes(post.authorId) || friendIds.includes(post.authorId);
    case 'Private':
      return false;
    default:
      return false;
  }
}

export function filterVisiblePosts<T extends FeedPostSummary>(
  posts: T[],
  viewerId: string,
  blockedUserIds: string[],
  followingIds: string[],
  friendIds: string[]
): T[] {
  return posts.filter((post) =>
    canViewPost(post, viewerId, blockedUserIds, followingIds, friendIds)
  );
}

export const STORY_DURATION_MS = 48 * 60 * 60 * 1000;

export function isStoryActive(createdAtMs: number, nowMs = Date.now()): boolean {
  return nowMs >= createdAtMs && nowMs - createdAtMs < STORY_DURATION_MS;
}

export function getStoryRemainingHours(createdAtMs: number, nowMs = Date.now()): number {
  const remaining = STORY_DURATION_MS - (nowMs - createdAtMs);
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / (60 * 60 * 1000));
}

export interface TimelineSegment {
  start: number;
  end: number;
}

export function splitAndDeleteMiddleSegment(
  totalDuration: number,
  trimStart: number,
  trimEnd: number,
  cutStart: number,
  cutEnd: number
): { segments: TimelineSegment[]; outputDuration: number } {
  const safeStart = Math.max(0, Math.min(trimStart, totalDuration));
  const safeEnd = Math.max(safeStart, Math.min(trimEnd, totalDuration));
  const cStart = Math.max(safeStart, Math.min(cutStart, safeEnd));
  const cEnd = Math.max(cStart, Math.min(cutEnd, safeEnd));

  const segments: TimelineSegment[] = [];
  if (cStart > safeStart) {
    segments.push({ start: Number(safeStart.toFixed(2)), end: Number(cStart.toFixed(2)) });
  }
  if (safeEnd > cEnd) {
    segments.push({ start: Number(cEnd.toFixed(2)), end: Number(safeEnd.toFixed(2)) });
  }
  const outputDuration = Number(
    segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0).toFixed(2)
  );
  return { segments, outputDuration };
}

export interface CameraEffect {
  id: string;
  name: string;
  group: '8K/4K Ultra-HD' | 'Beauty & Makeup' | 'Cartoon & Stylized' | 'Neon & Moody';
  badge: string;
  cssFilter: string;
  overlayTint?: string;
}

const CAMERA_EFFECT_NAMES: Array<{
  name: string;
  group: CameraEffect['group'];
  badge: string;
  cssFilter: string;
  overlayTint?: string;
}> = [
  // 8K & 4K Ultra-HD (15)
  { name: '8K Crystal Sharp', group: '8K/4K Ultra-HD', badge: '8K', cssFilter: 'contrast(1.16) saturate(1.14) brightness(1.03)' },
  { name: '4K Cinema HDR', group: '8K/4K Ultra-HD', badge: '4K', cssFilter: 'contrast(1.22) saturate(1.18) brightness(0.98)' },
  { name: 'Ultra HD Clarity', group: '8K/4K Ultra-HD', badge: 'UHD', cssFilter: 'contrast(1.14) brightness(1.05) saturate(1.08)' },
  { name: '8K Himalayan Air', group: '8K/4K Ultra-HD', badge: '8K', cssFilter: 'contrast(1.18) saturate(1.12) hue-rotate(-4deg)' },
  { name: '4K Studio Pro', group: '8K/4K Ultra-HD', badge: '4K', cssFilter: 'contrast(1.12) brightness(1.06) saturate(1.05)' },
  { name: '8K Crisp Detail', group: '8K/4K Ultra-HD', badge: '8K', cssFilter: 'contrast(1.2) saturate(1.09)' },
  { name: '4K Golden Dusk', group: '8K/4K Ultra-HD', badge: '4K', cssFilter: 'contrast(1.12) sepia(0.18) saturate(1.28)' },
  { name: '8K True Tone', group: '8K/4K Ultra-HD', badge: '8K', cssFilter: 'contrast(1.08) brightness(1.04) saturate(1.1)' },
  { name: '4K Night Clean', group: '8K/4K Ultra-HD', badge: '4K', cssFilter: 'brightness(1.14) contrast(1.12) saturate(1.06)' },
  { name: 'UHD Documentary', group: '8K/4K Ultra-HD', badge: 'UHD', cssFilter: 'contrast(1.18) saturate(0.95) brightness(1.02)' },
  { name: '8K Vivid Peaks', group: '8K/4K Ultra-HD', badge: '8K', cssFilter: 'saturate(1.34) contrast(1.14)' },
  { name: '4K Leica Raw', group: '8K/4K Ultra-HD', badge: '4K', cssFilter: 'contrast(1.22) sepia(0.08) saturate(0.92)' },
  { name: '8K Portrait Prime', group: '8K/4K Ultra-HD', badge: '8K', cssFilter: 'contrast(1.1) brightness(1.06) saturate(1.12)' },
  { name: '4K Velvet Contrast', group: '8K/4K Ultra-HD', badge: '4K', cssFilter: 'contrast(1.25) brightness(0.97) saturate(1.15)' },
  { name: 'UHD Clear Stream', group: '8K/4K Ultra-HD', badge: 'UHD', cssFilter: 'contrast(1.12) brightness(1.05)' },

  // Beauty, Glow & Makeup (25)
  { name: 'Soft Skin Glow', group: 'Beauty & Makeup', badge: 'GLOW', cssFilter: 'brightness(1.08) contrast(0.96) saturate(1.06)', overlayTint: 'rgba(255,192,220,0.08)' },
  { name: 'Radiant Dewy Glow', group: 'Beauty & Makeup', badge: 'GLOW', cssFilter: 'brightness(1.1) saturate(1.12)', overlayTint: 'rgba(255,220,190,0.09)' },
  { name: 'Beauty Blush/Flush', group: 'Beauty & Makeup', badge: 'BLUSH', cssFilter: 'brightness(1.05) saturate(1.18)', overlayTint: 'rgba(255,105,160,0.1)' },
  { name: 'Full Glam Makeup', group: 'Beauty & Makeup', badge: 'GLAM', cssFilter: 'contrast(1.1) saturate(1.2) brightness(1.04)', overlayTint: 'rgba(255,0,128,0.07)' },
  { name: 'Lip & Cheek Tint', group: 'Beauty & Makeup', badge: 'TINT', cssFilter: 'saturate(1.22) brightness(1.04)', overlayTint: 'rgba(244,63,94,0.08)' },
  { name: 'Lashes & Liner', group: 'Beauty & Makeup', badge: 'EYE', cssFilter: 'contrast(1.14) brightness(1.03)' },
  { name: 'Peach Satin', group: 'Beauty & Makeup', badge: 'SKIN', cssFilter: 'sepia(0.12) brightness(1.07) saturate(1.15)' },
  { name: 'Porcelain Silk', group: 'Beauty & Makeup', badge: 'SKIN', cssFilter: 'brightness(1.12) contrast(0.95) saturate(0.96)' },
  { name: 'Rosewater Mist', group: 'Beauty & Makeup', badge: 'GLOW', cssFilter: 'brightness(1.06) saturate(1.14)', overlayTint: 'rgba(251,113,133,0.1)' },
  { name: 'Kathmandu Bride', group: 'Beauty & Makeup', badge: 'GLAM', cssFilter: 'contrast(1.09) saturate(1.26) brightness(1.05)', overlayTint: 'rgba(251,191,36,0.08)' },
  { name: 'Golden Highlight', group: 'Beauty & Makeup', badge: 'GLOW', cssFilter: 'brightness(1.08) sepia(0.15) saturate(1.2)' },
  { name: 'Honey Bronzer', group: 'Beauty & Makeup', badge: 'GLAM', cssFilter: 'sepia(0.22) contrast(1.06) saturate(1.22)' },
  { name: 'velvet Matte', group: 'Beauty & Makeup', badge: 'SKIN', cssFilter: 'contrast(1.04) saturate(0.98) brightness(1.03)' },
  { name: 'Pearl Luminescence', group: 'Beauty & Makeup', badge: 'GLOW', cssFilter: 'brightness(1.11) contrast(0.97)' },
  { name: 'Cherry Blossom', group: 'Beauty & Makeup', badge: 'TINT', cssFilter: 'hue-rotate(-8deg) saturate(1.18) brightness(1.06)' },
  { name: 'Smoky Kohl', group: 'Beauty & Makeup', badge: 'EYE', cssFilter: 'contrast(1.18) brightness(1.01) saturate(1.05)' },
  { name: 'Glass Skin', group: 'Beauty & Makeup', badge: 'GLOW', cssFilter: 'brightness(1.1) contrast(1.04) saturate(1.08)' },
  { name: 'Sunlight Halo', group: 'Beauty & Makeup', badge: 'GLOW', cssFilter: 'brightness(1.09) sepia(0.14) saturate(1.16)' },
  { name: 'Coral Flush', group: 'Beauty & Makeup', badge: 'BLUSH', cssFilter: 'saturate(1.2) hue-rotate(-5deg) brightness(1.05)' },
  { name: 'Soft Focus Aura', group: 'Beauty & Makeup', badge: 'SKIN', cssFilter: 'brightness(1.07) contrast(0.94)' },
  { name: 'Dewdrop Eyes', group: 'Beauty & Makeup', badge: 'EYE', cssFilter: 'contrast(1.1) brightness(1.07) saturate(1.1)' },
  { name: 'Velvet Berry Lip', group: 'Beauty & Makeup', badge: 'TINT', cssFilter: 'saturate(1.24) contrast(1.06)', overlayTint: 'rgba(157,0,255,0.06)' },
  { name: 'Warm Honey Glow', group: 'Beauty & Makeup', badge: 'GLOW', cssFilter: 'sepia(0.16) brightness(1.06) saturate(1.18)' },
  { name: 'Studio Ring Light', group: 'Beauty & Makeup', badge: 'GLOW', cssFilter: 'brightness(1.13) contrast(1.05)' },
  { name: 'Natural Clean Face', group: 'Beauty & Makeup', badge: 'SKIN', cssFilter: 'brightness(1.05) contrast(1.02) saturate(1.04)' },

  // Cartoon & Stylized (12)
  { name: '3D Cartoon Face', group: 'Cartoon & Stylized', badge: 'TOON', cssFilter: 'saturate(1.55) contrast(1.26) brightness(1.06)', overlayTint: 'rgba(157,0,255,0.09)' },
  { name: 'Anime Toon Filter', group: 'Cartoon & Stylized', badge: 'ANIME', cssFilter: 'saturate(1.48) contrast(1.22) brightness(1.08)', overlayTint: 'rgba(255,0,128,0.08)' },
  { name: 'Comic Sketch', group: 'Cartoon & Stylized', badge: 'COMIC', cssFilter: 'grayscale(0.75) contrast(1.65) brightness(1.08)' },
  { name: 'Neon Pop Art', group: 'Cartoon & Stylized', badge: 'POP', cssFilter: 'saturate(1.85) contrast(1.35) hue-rotate(18deg)' },
  { name: 'Pixar Warm 3D', group: 'Cartoon & Stylized', badge: '3D', cssFilter: 'saturate(1.42) contrast(1.18) brightness(1.07)' },
  { name: 'Manga Ink', group: 'Cartoon & Stylized', badge: 'INK', cssFilter: 'grayscale(1) contrast(1.8) brightness(1.05)' },
  { name: 'Chibi Pastel', group: 'Cartoon & Stylized', badge: 'TOON', cssFilter: 'saturate(1.32) brightness(1.14) contrast(0.95)' },
  { name: 'Watercolor Dream', group: 'Cartoon & Stylized', badge: 'ART', cssFilter: 'saturate(1.28) brightness(1.08) contrast(0.92)' },
  { name: 'Retro Halftone', group: 'Cartoon & Stylized', badge: 'POP', cssFilter: 'sepia(0.35) contrast(1.45) saturate(1.4)' },
  { name: 'Claymation 3D', group: 'Cartoon & Stylized', badge: '3D', cssFilter: 'saturate(1.38) contrast(1.16) sepia(0.1)' },
  { name: 'Cyber Toon', group: 'Cartoon & Stylized', badge: 'TOON', cssFilter: 'hue-rotate(35deg) saturate(1.65) contrast(1.3)' },
  { name: 'Oil Brush Studio', group: 'Cartoon & Stylized', badge: 'ART', cssFilter: 'saturate(1.35) contrast(1.25)' },

  // Neon & Moody (12) -> total 64 live camera effects!
  { name: 'NepTok Neon Pink', group: 'Neon & Moody', badge: 'NEON', cssFilter: 'contrast(1.18) saturate(1.35)', overlayTint: 'rgba(255,0,128,0.14)' },
  { name: 'Cosmic Purple', group: 'Neon & Moody', badge: 'NEON', cssFilter: 'contrast(1.16) saturate(1.25)', overlayTint: 'rgba(157,0,255,0.16)' },
  { name: 'Thamel Nightlife', group: 'Neon & Moody', badge: 'NIGHT', cssFilter: 'contrast(1.24) saturate(1.4) brightness(0.95)', overlayTint: 'rgba(236,72,153,0.12)' },
  { name: 'Cyber Teal & Pink', group: 'Neon & Moody', badge: 'CYBER', cssFilter: 'hue-rotate(-14deg) saturate(1.45) contrast(1.22)' },
  { name: 'Pokhara Mist', group: 'Neon & Moody', badge: 'MOOD', cssFilter: 'brightness(1.04) contrast(0.94) saturate(0.88)' },
  { name: 'Everest Blue Hour', group: 'Neon & Moody', badge: 'MOOD', cssFilter: 'hue-rotate(12deg) contrast(1.15) saturate(1.1)' },
  { name: 'Vintage 90s VHS', group: 'Neon & Moody', badge: 'RETRO', cssFilter: 'sepia(0.28) contrast(1.12) saturate(0.92)' },
  { name: 'Midnight Noir', group: 'Neon & Moody', badge: 'NOIR', cssFilter: 'grayscale(1) contrast(1.38) brightness(0.96)' },
  { name: 'Festival Sparks', group: 'Neon & Moody', badge: 'PARTY', cssFilter: 'saturate(1.5) contrast(1.18) brightness(1.05)' },
  { name: 'Aura Prism', group: 'Neon & Moody', badge: 'PRISM', cssFilter: 'hue-rotate(24deg) saturate(1.35) contrast(1.12)' },
  { name: 'Sunset Boudha', group: 'Neon & Moody', badge: 'WARM', cssFilter: 'sepia(0.22) saturate(1.35) brightness(1.04)' },
  { name: 'Ultraviolet Club', group: 'Neon & Moody', badge: 'UV', cssFilter: 'contrast(1.25) saturate(1.4)', overlayTint: 'rgba(124,58,237,0.18)' },
];

export const CAMERA_EFFECTS_60: CameraEffect[] = CAMERA_EFFECT_NAMES.map((item, idx) => ({
  id: `cam-fx-${idx + 1}`,
  ...item,
}));

// 80+ Post-production filters & trending AR effects
export const POST_FILTERS_80: CameraEffect[] = [
  ...CAMERA_EFFECTS_60,
  ...[
    'AR Crown & Sparkle',
    'AR Floating Hearts',
    'AR Nepal Flag Cheek',
    'AR Butterfly Halo',
    'AR Himalayan Snow',
    'AR Disco Laser',
    'AR Starlight Tears',
    'AR Golden Mandala',
    'Lumetri Fuji Velvia',
    'Lumetri Kodak Portra',
    'Lumetri Cine Teal-Orange',
    'Lumetri Matte Fade',
    'Lumetri High-Key Fashion',
    'Lumetri Moody Monsoon',
    'Lumetri Patan Heritage',
    'Lumetri Mustang Canyon',
    'Lumetri Annapurna Dawn',
    'Lumetri Chroma Pop',
  ].map((name, idx) => ({
    id: `post-fx-${65 + idx}`,
    name,
    group: (name.startsWith('AR') ? 'Beauty & Makeup' : '8K/4K Ultra-HD') as CameraEffect['group'],
    badge: name.startsWith('AR') ? 'AR' : 'PRO',
    cssFilter: name.startsWith('AR')
      ? 'brightness(1.06) saturate(1.22) contrast(1.08)'
      : 'contrast(1.18) saturate(1.2) sepia(0.08)',
    overlayTint: name.startsWith('AR') ? 'rgba(255,0,128,0.08)' : undefined,
  })),
];

export type HslColorKey =
  | 'Red'
  | 'Orange'
  | 'Yellow'
  | 'Green'
  | 'Cyan'
  | 'Blue'
  | 'Purple'
  | 'Magenta';

export interface HslChannelAdjustment {
  hue: number; // -30 to +30
  saturation: number; // -100 to +100
  luminance: number; // -100 to +100
}

export interface LumetriAdjustments {
  temperature: number; // -50 to +50
  tint: number; // -50 to +50
  exposure: number; // -50 to +50
  contrast: number; // -50 to +50
  highlights: number; // -50 to +50
  shadows: number; // -50 to +50
  whites: number; // -50 to +50
  blacks: number; // -50 to +50
  sharpness: number; // 0 to 100
  hsl: Record<HslColorKey, HslChannelAdjustment>;
}

export const DEFAULT_HSL: Record<HslColorKey, HslChannelAdjustment> = {
  Red: { hue: 0, saturation: 0, luminance: 0 },
  Orange: { hue: 0, saturation: 0, luminance: 0 },
  Yellow: { hue: 0, saturation: 0, luminance: 0 },
  Green: { hue: 0, saturation: 0, luminance: 0 },
  Cyan: { hue: 0, saturation: 0, luminance: 0 },
  Blue: { hue: 0, saturation: 0, luminance: 0 },
  Purple: { hue: 0, saturation: 0, luminance: 0 },
  Magenta: { hue: 0, saturation: 0, luminance: 0 },
};

export const DEFAULT_LUMETRI: LumetriAdjustments = {
  temperature: 0,
  tint: 0,
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  sharpness: 15,
  hsl: DEFAULT_HSL,
};

export function buildVideoCssFilter(
  baseFilter: string,
  lumetri: LumetriAdjustments,
  skinSmooth: number
): string {
  const brightness =
    1 +
    lumetri.exposure * 0.008 +
    lumetri.highlights * 0.002 +
    lumetri.shadows * 0.002 +
    lumetri.whites * 0.002;
  const contrast =
    1 +
    lumetri.contrast * 0.01 -
    lumetri.blacks * 0.003 +
    lumetri.sharpness * 0.0015;
  const avgHslSat =
    Object.values(lumetri.hsl).reduce((acc, c) => acc + c.saturation, 0) / 8;
  const avgHslHue =
    Object.values(lumetri.hsl).reduce((acc, c) => acc + c.hue, 0) / 8;
  const saturate = Math.max(0.2, 1 + avgHslSat * 0.006);
  const sepia = lumetri.temperature > 0 ? Math.min(0.45, lumetri.temperature * 0.007) : 0;
  const hueRotate = lumetri.tint * 0.5 + avgHslHue + (lumetri.temperature < 0 ? lumetri.temperature * 0.35 : 0);
  const blur = skinSmooth > 0 ? Math.min(0.9, skinSmooth * 0.006) : 0;

  return `${baseFilter} brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(
    2
  )}) saturate(${saturate.toFixed(2)}) sepia(${sepia.toFixed(2)}) hue-rotate(${hueRotate.toFixed(
    1
  )}deg)${blur > 0.05 ? ` blur(${blur.toFixed(2)}px)` : ''}`;
}

export interface ModerationScanVerdict {
  status: 'APPROVED' | 'FLAGGED' | 'BLOCKED';
  copyrightStatus: 'CLEAR' | 'MUTED_SEGMENT' | 'COPYRIGHT_BLOCKED';
  nsfwScore: number;
  violenceScore: number;
  copyrightConfidence: number;
  reasons: string[];
}

export function runRuleBasedSafetyPrecheck(input: {
  caption?: string;
  audioTitle?: string;
  simulateFlag?: 'none' | 'copyright' | 'nsfw' | 'violence';
}): ModerationScanVerdict {
  const text = `${input.caption ?? ''} ${input.audioTitle ?? ''}`.toLowerCase();
  if (input.simulateFlag === 'nsfw' || /\b(nsfw|nude|nudity|explicit|18\+)\b/.test(text)) {
    return {
      status: 'BLOCKED',
      copyrightStatus: 'CLEAR',
      nsfwScore: 96,
      violenceScore: 2,
      copyrightConfidence: 4,
      reasons: ['Automated Nudity & NSFW Detection triggered: explicit visual/metadata match'],
    };
  }
  if (
    input.simulateFlag === 'violence' ||
    /\b(gore|blood|weapon|self-harm|hate speech|kill)\b/.test(text)
  ) {
    return {
      status: 'BLOCKED',
      copyrightStatus: 'CLEAR',
      nsfwScore: 4,
      violenceScore: 94,
      copyrightConfidence: 5,
      reasons: ['Community Violence & Harm Detection triggered: prohibited violent or harmful content'],
    };
  }
  if (
    input.simulateFlag === 'copyright' ||
    /\b(pirated|full movie|unlicensed track|copyrighted mp3)\b/.test(text)
  ) {
    return {
      status: 'FLAGGED',
      copyrightStatus: 'MUTED_SEGMENT',
      nsfwScore: 1,
      violenceScore: 1,
      copyrightConfidence: 91,
      reasons: ['Automated Copyright Audio/Video Scan: copyrighted segment muted & queued for review'],
    };
  }
  return {
    status: 'APPROVED',
    copyrightStatus: 'CLEAR',
    nsfwScore: 1,
    violenceScore: 1,
    copyrightConfidence: 3,
    reasons: ['Cleared by AI Copyright, NSFW & Community Safety Engine'],
  };
}

// ==========================================
// 1. Live Dynamic Layout & Timer Helpers
// ==========================================

export function formatLiveDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600)
    .toString()
    .padStart(2, '0');
  const mins = Math.floor((safe % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const secs = (safe % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

export function getLiveGridLayout(participantCount: number): {
  cappedCount: number;
  colsClass: string;
  isSingleHostFullScreen: boolean;
  isSplitScreen: boolean;
} {
  const capped = Math.max(1, Math.min(8, Math.floor(participantCount)));
  if (capped === 1) {
    return {
      cappedCount: 1,
      colsClass: 'grid-cols-1',
      isSingleHostFullScreen: true,
      isSplitScreen: false,
    };
  }
  if (capped === 2) {
    return {
      cappedCount: 2,
      colsClass: 'grid-cols-2',
      isSingleHostFullScreen: false,
      isSplitScreen: true,
    };
  }
  if (capped <= 4) {
    return {
      cappedCount: capped,
      colsClass: 'grid-cols-2',
      isSingleHostFullScreen: false,
      isSplitScreen: false,
    };
  }
  if (capped <= 6) {
    return {
      cappedCount: capped,
      colsClass: 'grid-cols-2 sm:grid-cols-3',
      isSingleHostFullScreen: false,
      isSplitScreen: false,
    };
  }
  return {
    cappedCount: capped,
    colsClass: 'grid-cols-2 sm:grid-cols-4',
    isSingleHostFullScreen: false,
    isSplitScreen: false,
  };
}

// ==========================================
// 2. CapCut-Style Timeline Clip Splitting
// ==========================================

export interface TimelineClip {
  id: string;
  label: string;
  start: number;
  end: number;
}

export function splitTimelineClipAtTime(
  clips: TimelineClip[],
  clipId: string,
  splitTime: number
): TimelineClip[] {
  let idx = clips.findIndex((c) => c.id === clipId);
  const minMargin = 0.5;
  if (
    idx === -1 ||
    splitTime <= clips[idx].start + minMargin ||
    splitTime >= clips[idx].end - minMargin
  ) {
    // Fallback: pick whichever clip spans splitTime
    const spanningIdx = clips.findIndex(
      (c) => splitTime > c.start + minMargin && splitTime < c.end - minMargin
    );
    if (spanningIdx === -1) return clips;
    idx = spanningIdx;
  }
  const target = clips[idx];
  const left: TimelineClip = {
    id: `${target.id}-a-${Date.now().toString().slice(-3)}`,
    label: `${target.label} (Part 1)`,
    start: Number(target.start.toFixed(1)),
    end: Number(splitTime.toFixed(1)),
  };
  const right: TimelineClip = {
    id: `${target.id}-b-${Date.now().toString().slice(-3)}`,
    label: `${target.label} (Part 2)`,
    start: Number(splitTime.toFixed(1)),
    end: Number(target.end.toFixed(1)),
  };
  return [...clips.slice(0, idx), left, right, ...clips.slice(idx + 1)];
}

export function trimOrExtendTimelineClip(
  clips: TimelineClip[],
  clipId: string,
  edge: 'start' | 'end',
  deltaSec: number,
  minDuration = 1,
  maxCapSec = 180
): TimelineClip[] {
  return clips.map((c) => {
    if (c.id !== clipId) return c;
    if (edge === 'start') {
      const nextStart = Math.max(0, Math.min(c.end - minDuration, c.start + deltaSec));
      return { ...c, start: Number(nextStart.toFixed(1)) };
    }
    const nextEnd = Math.min(maxCapSec, Math.max(c.start + minDuration, c.end + deltaSec));
    return { ...c, end: Number(nextEnd.toFixed(1)) };
  });
}

export function moveTimelineClip(
  clips: TimelineClip[],
  clipId: string,
  deltaSec: number,
  maxTimelineSec = 180
): TimelineClip[] {
  return clips.map((c) => {
    if (c.id !== clipId) return c;
    const dur = Math.max(1, Number((c.end - c.start).toFixed(1)));
    const safeMax = Math.max(dur, maxTimelineSec);
    const nextStart = Math.max(0, Math.min(safeMax - dur, c.start + deltaSec));
    return {
      ...c,
      start: Number(nextStart.toFixed(1)),
      end: Number((nextStart + dur).toFixed(1)),
    };
  });
}

export function calculateClipsTotalDuration(clips: TimelineClip[]): number {
  return Number(clips.reduce((sum, c) => sum + Math.max(0, c.end - c.start), 0).toFixed(1));
}

export function clampLiveGoalValue(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.max(50, Math.min(10000, Math.round(value)));
}

export function duplicateTimelineClip(
  clips: TimelineClip[],
  clipId: string,
  suffix = Date.now().toString().slice(-3)
): TimelineClip[] {
  const idx = clips.findIndex((c) => c.id === clipId);
  if (idx === -1) return clips;
  const src = clips[idx];
  const dur = Math.max(1, Number((src.end - src.start).toFixed(1)));
  const lastEnd = clips[clips.length - 1]?.end ?? src.end;
  const copy: TimelineClip = {
    id: `${src.id}-copy-${suffix}`,
    label: `${src.label} Copy`,
    start: Number(lastEnd.toFixed(1)),
    end: Number((lastEnd + dur).toFixed(1)),
  };
  return [...clips, copy];
}

export function slipTimelineClip(
  clips: TimelineClip[],
  clipId: string,
  deltaSec: number,
  maxTimelineSec: number
): TimelineClip[] {
  return clips.map((c) => {
    if (c.id !== clipId) return c;
    const dur = Math.max(1, c.end - c.start);
    const nextStart = Math.max(0, Math.min(Math.max(0, maxTimelineSec - dur), c.start + deltaSec));
    return {
      ...c,
      start: Number(nextStart.toFixed(1)),
      end: Number((nextStart + dur).toFixed(1)),
    };
  });
}

export function generateBeatMarkers(durationSec: number, bpm = 120): number[] {
  const safeDur = Math.max(1, durationSec);
  const safeBpm = Math.max(40, Math.min(220, bpm));
  const interval = 60 / safeBpm;
  const beats: number[] = [];
  for (let t = interval; t < safeDur; t += interval) {
    beats.push(Number(t.toFixed(2)));
    if (beats.length >= 64) break;
  }
  return beats;
}

export interface BeautyCameraEffect {
  id: string;
  name: string;
  badge: string;
  cssFilter: string;
  overlayTint?: string;
}

export const BEAUTY_EFFECTS_25: BeautyCameraEffect[] = [
  { id: 'bfx-1', name: 'Natural Glow', badge: 'GLOW', cssFilter: 'brightness(1.06) contrast(0.98) saturate(1.06)' },
  { id: 'bfx-2', name: 'Smooth Skin', badge: 'SKIN', cssFilter: 'brightness(1.05) contrast(0.94) blur(0.25px)' },
  { id: 'bfx-3', name: 'Face Slim', badge: 'SHAPE', cssFilter: 'contrast(1.04) brightness(1.04) saturate(1.03)' },
  { id: 'bfx-4', name: 'Brighten', badge: 'LIGHT', cssFilter: 'brightness(1.14) contrast(1.02) saturate(1.04)' },
  { id: 'bfx-5', name: 'Rosy', badge: 'BLUSH', cssFilter: 'brightness(1.05) saturate(1.16)', overlayTint: 'rgba(255,105,160,0.09)' },
  { id: 'bfx-6', name: 'Soft Focus', badge: 'SOFT', cssFilter: 'brightness(1.07) contrast(0.92) blur(0.35px)' },
  { id: 'bfx-7', name: 'Glam', badge: 'GLAM', cssFilter: 'contrast(1.1) saturate(1.22) brightness(1.05)', overlayTint: 'rgba(255,0,128,0.07)' },
  { id: 'bfx-8', name: 'Studio Light', badge: 'STUDIO', cssFilter: 'brightness(1.12) contrast(1.08) saturate(1.05)' },
  { id: 'bfx-9', name: 'Dewy Glass', badge: 'DEWY', cssFilter: 'brightness(1.1) contrast(1.02) saturate(1.1)', overlayTint: 'rgba(255,225,200,0.08)' },
  { id: 'bfx-10', name: 'Peach Tint', badge: 'TINT', cssFilter: 'sepia(0.12) brightness(1.07) saturate(1.16)' },
  { id: 'bfx-11', name: 'Porcelain Silk', badge: 'SILK', cssFilter: 'brightness(1.12) contrast(0.95) saturate(0.95)' },
  { id: 'bfx-12', name: 'Golden Hour', badge: 'WARM', cssFilter: 'sepia(0.18) brightness(1.08) saturate(1.22)' },
  { id: 'bfx-13', name: 'Rosewater', badge: 'ROSE', cssFilter: 'brightness(1.06) saturate(1.14)', overlayTint: 'rgba(251,113,133,0.1)' },
  { id: 'bfx-14', name: 'Pearl Sheen', badge: 'PEARL', cssFilter: 'brightness(1.11) contrast(0.97) saturate(1.02)' },
  { id: 'bfx-15', name: 'Honey Bronze', badge: 'BRONZE', cssFilter: 'sepia(0.22) contrast(1.06) saturate(1.2)' },
  { id: 'bfx-16', name: 'Velvet Matte', badge: 'MATTE', cssFilter: 'contrast(1.05) saturate(0.96) brightness(1.03)' },
  { id: 'bfx-17', name: 'Coral Flush', badge: 'CORAL', cssFilter: 'saturate(1.2) hue-rotate(-5deg) brightness(1.05)' },
  { id: 'bfx-18', name: 'Eye Bright', badge: 'EYES', cssFilter: 'contrast(1.12) brightness(1.08) saturate(1.08)' },
  { id: 'bfx-19', name: 'Cheek Lift', badge: 'LIFT', cssFilter: 'brightness(1.06) contrast(1.04) saturate(1.12)', overlayTint: 'rgba(244,114,182,0.07)' },
  { id: 'bfx-20', name: 'Warm Sunlight', badge: 'SUN', cssFilter: 'brightness(1.09) sepia(0.14) saturate(1.16)' },
  { id: 'bfx-21', name: 'Clear Tone', badge: 'CLEAR', cssFilter: 'brightness(1.06) contrast(1.06) saturate(1.04)' },
  { id: 'bfx-22', name: 'Soft Aura', badge: 'AURA', cssFilter: 'brightness(1.08) contrast(0.95)', overlayTint: 'rgba(157,0,255,0.06)' },
  { id: 'bfx-23', name: 'Satin Glow', badge: 'SATIN', cssFilter: 'brightness(1.07) contrast(1.01) saturate(1.12)' },
  { id: 'bfx-24', name: 'Bridal Radiance', badge: 'PRO', cssFilter: 'contrast(1.08) saturate(1.24) brightness(1.06)', overlayTint: 'rgba(251,191,36,0.08)' },
];

export function updateBattleStreak(currentStreak: number, didWin: boolean): number {
  const safe = Math.max(0, Math.floor(currentStreak));
  return didWin ? safe + 1 : 0;
}

// ==========================================
// 3. Edit Profile Aspect-Ratio Crop Math
// ==========================================

export function calculateAspectCropRect(
  sourceWidth: number,
  sourceHeight: number,
  targetAspectRatio: number,
  zoom = 1,
  panX = 0, // -1 to +1
  panY = 0 // -1 to +1
): { sx: number; sy: number; sw: number; sh: number } {
  const safeZoom = Math.max(1, Math.min(3, zoom));
  const imgAspect = sourceWidth / Math.max(1, sourceHeight);

  let baseSw: number;
  let baseSh: number;
  if (imgAspect > targetAspectRatio) {
    baseSh = sourceHeight;
    baseSw = sourceHeight * targetAspectRatio;
  } else {
    baseSw = sourceWidth;
    baseSh = sourceWidth / targetAspectRatio;
  }

  const sw = baseSw / safeZoom;
  const sh = baseSh / safeZoom;
  const maxOffsetX = Math.max(0, (sourceWidth - sw) / 2);
  const maxOffsetY = Math.max(0, (sourceHeight - sh) / 2);
  const clampedPanX = Math.max(-1, Math.min(1, panX));
  const clampedPanY = Math.max(-1, Math.min(1, panY));

  const sx = Math.max(0, Math.min(sourceWidth - sw, (sourceWidth - sw) / 2 + clampedPanX * maxOffsetX));
  const sy = Math.max(0, Math.min(sourceHeight - sh, (sourceHeight - sh) / 2 + clampedPanY * maxOffsetY));

  return {
    sx: Math.round(sx),
    sy: Math.round(sy),
    sw: Math.round(sw),
    sh: Math.round(sh),
  };
}

// ==========================================
// 4. Expanded Post-Production Stickers (128 Stickers)
// ==========================================

export const POST_STICKERS_120: Array<{ id: string; symbol: string; label: string }> = [
  '🇳🇵|Nepal Flag', '🏔️|Everest', '🗻|Sagarmatha', '🛕|Stupa', '🏯|Pagoda', '🙏|Namaste', '🪔|Diyo Lamp', '🪷|Lotus',
  '🥟|Momo Plate', '🍵|Nepali Tea', '🌼|Marigold', '🌺|Rhododendron', '🥁|Madal Drum', '🎻|Sarangi', '🦚|Danphe', '🦏|One-Horned Rhino',
  '🐆|Snow Leopard', '🦊|Red Panda', '🐃|Yak', '🛶|Phewa Boat', '🔥|Fire', '💖|Sparkle Heart', '👑|Crown', '✨|Sparkles',
  '🚀|Rocket', '🎆|Fireworks', '🪩|Disco', '🎤|Mic', '🎧|Headphones', '🎬|Clapper', '🎥|Cinema Cam', '📸|Snapshot',
  '🌟|Gold Star', '⚡|Lightning', '💥|Boom', '💫|Dizzy Star', '🌈|Rainbow', '☀️|Sunrise', '🌙|Crescent Moon', '⭐|Star',
  '❄️|Himalayan Snow', '🌊|River Wave', '🌸|Cherry Blossom', '🌹|Red Rose', '💐|Bouquet', '🦋|Butterfly', '🐝|Honeybee', '🕊️|Peace Dove',
  '🦁|Golden Lion', '🐉|Neon Dragon', '🦅|Mountain Eagle', '🐎|Mustang Horse', '🐘|Chitwan Elephant', '🐯|Bengal Tiger', '🦉|Night Owl', '🦩|Flamingo',
  '🎉|Confetti', '🎊|Celebration', '🎈|Balloon', '🎁|Gift Box', '🏆|Trophy', '🥇|Gold Medal', '💎|Diamond', '💍|Ring',
  '😍|Heart Eyes', '🤩|Star Struck', '🥳|Party Face', '😎|Cool Shades', '😂|Laughing', '🥰|Smiling Hearts', '😘|Kiss', '🫶|Heart Hands',
  '🙌|Praise Hands', '👏|Clap', '✌️|Peace', '🤘|Rock On', '🤙|Call Me', '💪|Strong', '🫰|Finger Heart', '👀|Eyes',
  '💯|100%', '✅|Verified Check', '🆕|New Tag', '🔝|Top Badge', '🔔|Bell', '📌|Pin', '💬|Speech Bubble', '💭|Thought',
  '🎵|Music Note', '🎶|Melody', '🎸|Guitar', '🎹|Keyboard', '🎺|Trumpet', '🎷|Saxophone', '🪘|Djembe', '🕺|Dancer Man',
  '💃|Dancer Woman', '🎭|Theater', '🎨|Palette', '🖌️|Paintbrush', '✏️|Pencil', '🎮|Gamepad', '🕹️|Joystick', '🎲|Dice',
  '🍕|Pizza', '🍔|Burger', '🍜|Noodles', '🍩|Sel Roti', '🧁|Cupcake', '🍓|Strawberry', '🥭|Mango', '☕|Coffee',
  '🚗|Road Trip', '🏎️|Super Car', '🏍️|Bike Ride', '✈️|Flight', '🚁|Heli Tour', '🏕️|Camping', '⛺|Tent', '🧭|Compass',
  '❤️‍🔥|Heart on Fire', '💜|Cosmic Heart', '🩷|NepTok Pink', '🩵|Glacier Blue', '🧡|Saffron Heart', '💛|Gold Heart', '💚|Emerald Heart', '🤍|Pure White',
].map((entry, idx) => {
  const [symbol, label] = entry.split('|');
  return { id: `stk-${idx + 1}`, symbol, label };
});

// ==========================================
// 5. Live Battle Rules, Multiplier Challenges & Gifter Ranking
// ==========================================

export function canStartLiveBattle(participantCount: number): boolean {
  return participantCount === 2 || participantCount === 4;
}

export interface GifterRankEntry {
  id: string;
  name: string;
  handle: string;
  img: string;
  coins: number;
}

export function recordParticipantGiftAndRank(
  currentList: GifterRankEntry[],
  sender: Omit<GifterRankEntry, 'coins'>,
  coins: number
): GifterRankEntry[] {
  const safeCoins = Math.max(0, Math.floor(coins));
  if (safeCoins <= 0) return currentList;
  const idx = currentList.findIndex(
    (g) => g.id === sender.id || g.handle.toLowerCase() === sender.handle.toLowerCase()
  );
  const updated =
    idx >= 0
      ? currentList.map((g, i) => (i === idx ? { ...g, coins: g.coins + safeCoins } : g))
      : [...currentList, { ...sender, coins: safeCoins }];
  return [...updated].sort((a, b) => b.coins - a.coins);
}

export interface BattleMultiplierChallenge {
  multiplier: 2 | 3 | 4;
  targetCoins: number;
  targetRoses: number;
  progressCoins: number;
  progressRoses: number;
  remainingSec: number;
  unlocked: boolean;
  label: string;
}

export function createBattleMultiplierChallenge(multiplier: 2 | 3 | 4): BattleMultiplierChallenge {
  if (multiplier === 2) {
    return {
      multiplier: 2,
      targetCoins: 50,
      targetRoses: 5,
      progressCoins: 0,
      progressRoses: 0,
      remainingSec: 20,
      unlocked: false,
      label: 'Send 5 Roses or 50 N in 20s for 2x Points!',
    };
  }
  if (multiplier === 3) {
    return {
      multiplier: 3,
      targetCoins: 150,
      targetRoses: 10,
      progressCoins: 0,
      progressRoses: 0,
      remainingSec: 20,
      unlocked: false,
      label: 'Send 10 Roses or 150 N in 20s for 3x Points!',
    };
  }
  return {
    multiplier: 4,
    targetCoins: 300,
    targetRoses: 15,
    progressCoins: 0,
    progressRoses: 0,
    remainingSec: 20,
    unlocked: false,
    label: 'Send 15 Roses or 300 N in 20s for 4x Points!',
  };
}

export function advanceMultiplierChallenge(
  challenge: BattleMultiplierChallenge,
  giftName: string,
  coins: number
): BattleMultiplierChallenge {
  const safeCoins = Math.max(0, Math.floor(coins));
  const isRose = /rose|heart/i.test(giftName);
  const nextCoins = challenge.progressCoins + safeCoins;
  const nextRoses = challenge.progressRoses + (isRose ? 1 : 0);
  const unlocked =
    challenge.unlocked || nextCoins >= challenge.targetCoins || nextRoses >= challenge.targetRoses;
  return {
    ...challenge,
    progressCoins: nextCoins,
    progressRoses: nextRoses,
    unlocked,
  };
}

export function applyBattleGiftWithMultiplier(
  coins: number,
  activeMultiplier: 1 | 2 | 3 | 4
): number {
  return Math.max(0, Math.floor(coins)) * activeMultiplier;
}

export const PLAYBACK_SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 3] as const;

export function clampPlaybackSpeed(speed: number): number {
  if (!Number.isFinite(speed)) return 1;
  return Math.max(0.25, Math.min(3, Number(speed.toFixed(2))));
}

// ==========================================
// 6. Continuous Rapid Live Gifting & Profile Tabs (Liked / Owner-Only Drafts)
// ==========================================

export function processRapidGiftTap(
  currentCoins: number,
  giftCoins: number
): { ok: boolean; remainingCoins: number; reason?: string } {
  const safeBalance = Math.max(0, Math.floor(currentCoins));
  const cost = Math.max(0, Math.floor(giftCoins));
  if (cost <= 0) {
    return { ok: false, remainingCoins: safeBalance, reason: 'Invalid gift cost' };
  }
  if (safeBalance < cost) {
    return {
      ok: false,
      remainingCoins: safeBalance,
      reason: 'Insufficient Coins / Recharge',
    };
  }
  return {
    ok: true,
    remainingCoins: safeBalance - cost,
  };
}

export type ProfileContentTab = 'Grid' | 'Live' | 'Private' | 'Saved' | 'Liked' | 'Drafts';

export interface ProfilePostFilterable {
  id: string;
  authorId: string;
  type: 'video' | 'reel' | 'photo';
  visibility: PostVisibility;
  savedByMe: boolean;
  likedByMe: boolean;
  isDraft?: boolean;
}

export function filterProfilePostsByTab<T extends ProfilePostFilterable>(
  posts: T[],
  profileOwnerId: string,
  tab: ProfileContentTab,
  isOwnerView = true
): T[] {
  if (tab === 'Drafts') {
    if (!isOwnerView) return [];
    return posts.filter((p) => Boolean(p.isDraft) && p.authorId === profileOwnerId);
  }

  const published = posts.filter((p) => !p.isDraft);
  switch (tab) {
    case 'Liked':
      return published.filter((p) => p.likedByMe);
    case 'Saved':
      return published.filter((p) => p.savedByMe);
    case 'Private':
      return isOwnerView
        ? published.filter((p) => p.authorId === profileOwnerId && p.visibility === 'Private')
        : [];
    case 'Live':
      return published.filter((p) => p.authorId === profileOwnerId && p.type === 'video');
    case 'Grid':
    default:
      return published.filter((p, idx) => p.authorId === profileOwnerId || idx < 3);
  }
}

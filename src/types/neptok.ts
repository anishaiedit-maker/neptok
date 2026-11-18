import type { PostVisibility } from '../utils/neptokLogic';

export type AuthStage = 'splash' | 'onboarding' | 'login' | 'app';

export type NavTab = 'profile' | 'live' | 'chat' | 'create' | 'bell' | 'wallet' | 'home';

export type AppSurfaceMode = 'mobile' | 'admin';

export type CreateOption = 'video' | 'reels' | 'photo' | 'story';

export interface OriginalSound {
  id: string;
  title: string;
  originalUploaderHandle: string;
  originalUploaderName: string;
  usesCount: number;
  durationSec: number;
  saved: boolean;
}

export interface FeedComment {
  id: string;
  authorName: string;
  authorHandle: string;
  text: string;
  createdAt: string;
  likes: number;
}

export interface FeedPost {
  id: string;
  type: 'video' | 'reel' | 'photo';
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorVerified: boolean;
  authorAvatarColor: string;
  mediaUrl: string;
  mediaMime?: string;
  r2Key?: string;
  caption: string;
  hashtags: string[];
  sound: OriginalSound;
  likes: number;
  likedByMe: boolean;
  comments: FeedComment[];
  reposts: number;
  repostedByMe: boolean;
  giftsReceivedCoins: number;
  savedByMe: boolean;
  visibility: PostVisibility;
  allowDuet: boolean;
  allowDownload: boolean;
  allowComments: boolean;
  allowSharing: boolean;
  adSettingsEnabled: boolean;
  isDraft?: boolean;
  cssFilter?: string;
  thumbnailUrl?: string;
  tags?: string[];
  views: number;
  estimatedEarningsUsd: number;
}

export interface StoryItem {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  mediaUrl: string;
  caption: string;
  templateName: string;
  createdAtMs: number;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
  sharedPostTitle?: string;
  voiceDuration?: string;
}

export interface ChatThread {
  id: string;
  userId: string;
  name: string;
  handle: string;
  isGroup?: boolean;
  isRequest?: boolean;
  isArchived?: boolean;
  online: boolean;
  unread: number;
  lastMessage: string;
  lastTime: string;
  messages: ChatMessage[];
}

export interface BellNotificationItem {
  id: string;
  category: 'Likes' | 'Comments' | 'Follows' | 'Gifts' | 'Mentions' | 'Live Invites' | 'Creator Rewards';
  actorName: string;
  actorHandle: string;
  message: string;
  time: string;
  followedBack?: boolean;
  amountText?: string;
}

export interface WalletTransaction {
  id: string;
  title: string;
  type: 'Recharge' | 'Gift Sent' | 'Gift Received' | 'Withdraw' | 'Creator Reward';
  coinsDelta: number;
  usdAmount: number;
  time: string;
  method: string;
}

export interface LinkedAccountItem {
  id: string;
  provider: 'Visa' | 'Mastercard' | 'PayPal' | 'Google Pay' | 'Apple Pay' | 'Wise' | 'USDT (Crypto)' | 'Bank Account';
  label: string;
  primary: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatarUrl?: string;
  coverBannerUrl?: string;
  verified: boolean;
  followers: number;
  following: number;
  likes: number;
  coins: number;
  creatorBalanceUsd: number;
  accountType: 'Personal' | 'Business';
  isPrivateAccount: boolean;
  twoFactorEnabled: boolean;
  language: 'en' | 'ne';
  allowCommentsGlobal: boolean;
  allowDuetGlobal: boolean;
  allowDownloadGlobal: boolean;
  allowOriginalAudioReuse: boolean;
  socialLinks: {
    youtube: string;
    instagram: string;
    facebook: string;
    tiktok: string;
    x: string;
    website: string;
  };
}

export const INITIAL_USER: UserProfile = {
  id: 'u_me',
  name: 'Aarav Gurung',
  handle: 'aarav_nepal',
  bio: 'Kathmandu & Pokhara Creator | Himalayan Reels, NEP Live Host & Visual Storyteller 🇳🇵',
  avatarUrl: '',
  coverBannerUrl: '/src/assets/images/nepal_profile_banner_1794926293036.jpg',
  verified: true,
  followers: 6420,
  following: 348,
  likes: 184200,
  coins: 12500,
  creatorBalanceUsd: 350.0,
  accountType: 'Personal',
  isPrivateAccount: false,
  twoFactorEnabled: true,
  language: 'en',
  allowCommentsGlobal: true,
  allowDuetGlobal: true,
  allowDownloadGlobal: true,
  allowOriginalAudioReuse: true,
  socialLinks: {
    youtube: 'https://youtube.com/@aarav_nepal',
    instagram: 'https://instagram.com/aarav_nepal',
    facebook: 'https://facebook.com/aarav.nepal',
    tiktok: 'https://tiktok.com/@aarav_nepal',
    x: 'https://x.com/aarav_nepal',
    website: 'https://neptok.com/@aarav_nepal',
  },
};

export const SEED_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    type: 'video',
    authorId: 'u_sita',
    authorName: 'Sita Tamang',
    authorHandle: 'sita_kathmandu',
    authorVerified: true,
    authorAvatarColor: '#FF0080',
    mediaUrl: '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg',
    caption: 'Twilight dance at Kathmandu Durbar Square! Tag a friend who loves Nepali heritage.',
    hashtags: ['#NepTok', '#Kathmandu', '#NepaliDance', '#VisitNepal'],
    sound: {
      id: 'snd-1',
      title: 'Original Sound - Madal & Flute Fusion',
      originalUploaderHandle: 'sita_kathmandu',
      originalUploaderName: 'Sita Tamang',
      usesCount: 14200,
      durationSec: 32,
      saved: false,
    },
    likes: 42850,
    likedByMe: false,
    comments: [
      {
        id: 'c1',
        authorName: 'Binod Sherpa',
        authorHandle: 'everest_binod',
        text: 'Incredible lighting and traditional moves!',
        createdAt: '12m ago',
        likes: 214,
      },
      {
        id: 'c2',
        authorName: 'Maya Pun',
        authorHandle: 'pokhara_maya',
        text: 'So proud to see Durbar Square shining on NepTok!',
        createdAt: '6m ago',
        likes: 98,
      },
    ],
    reposts: 1940,
    repostedByMe: false,
    giftsReceivedCoins: 8450,
    savedByMe: false,
    visibility: 'Everyone',
    allowDuet: true,
    allowDownload: true,
    allowComments: true,
    allowSharing: true,
    adSettingsEnabled: true,
    views: 285400,
    estimatedEarningsUsd: 264.8,
  },
  {
    id: 'post-2',
    type: 'reel',
    authorId: 'u_binod',
    authorName: 'Binod Sherpa',
    authorHandle: 'everest_binod',
    authorVerified: true,
    authorAvatarColor: '#38BDF8',
    mediaUrl: '/src/assets/images/creator_everest_trek_1794926294520.jpg',
    caption: 'Sunrise at 5,364m above Khumbu Glacier. Nothing beats Himalayan air!',
    hashtags: ['#Everest', '#Sagarmatha', '#Himalayas', '#Nepal'],
    sound: {
      id: 'snd-2',
      title: 'Original Sound - Himalayan Wind & Singing Bowl',
      originalUploaderHandle: 'everest_binod',
      originalUploaderName: 'Binod Sherpa',
      usesCount: 8910,
      durationSec: 45,
      saved: true,
    },
    likes: 89320,
    likedByMe: true,
    comments: [
      {
        id: 'c3',
        authorName: 'Aarav Gurung',
        authorHandle: 'aarav_nepal',
        text: 'Pure 8K sharpness on that ridge!',
        createdAt: '24m ago',
        likes: 342,
      },
    ],
    reposts: 4120,
    repostedByMe: false,
    giftsReceivedCoins: 15200,
    savedByMe: true,
    visibility: 'Everyone',
    allowDuet: true,
    allowDownload: true,
    allowComments: true,
    allowSharing: true,
    adSettingsEnabled: true,
    views: 512000,
    estimatedEarningsUsd: 492.4,
  },
  {
    id: 'post-3',
    type: 'photo',
    authorId: 'u_maya',
    authorName: 'Maya Pun',
    authorHandle: 'pokhara_maya',
    authorVerified: true,
    authorAvatarColor: '#9D00FF',
    mediaUrl: '/src/assets/images/creator_pokhara_lake_1794926294810.jpg',
    caption: 'Golden morning reflection of Machapuchare on Phewa Lake, Pokhara.',
    hashtags: ['#Pokhara', '#PhewaLake', '#Machapuchare', '#NepTokPhoto'],
    sound: {
      id: 'snd-3',
      title: 'Original Sound - Lakeside Sarangi Acoustic',
      originalUploaderHandle: 'pokhara_maya',
      originalUploaderName: 'Maya Pun',
      usesCount: 5340,
      durationSec: 28,
      saved: false,
    },
    likes: 31400,
    likedByMe: false,
    comments: [
      {
        id: 'c4',
        authorName: 'Sita Tamang',
        authorHandle: 'sita_kathmandu',
        text: 'HSL color grading looks like cinema!',
        createdAt: '40m ago',
        likes: 125,
      },
    ],
    reposts: 890,
    repostedByMe: false,
    giftsReceivedCoins: 3900,
    savedByMe: false,
    visibility: 'Everyone',
    allowDuet: true,
    allowDownload: true,
    allowComments: true,
    allowSharing: true,
    adSettingsEnabled: true,
    views: 194500,
    estimatedEarningsUsd: 178.5,
  },
  {
    id: 'post-4',
    type: 'video',
    authorId: 'u_me',
    authorName: 'Aarav Gurung',
    authorHandle: 'aarav_nepal',
    authorVerified: true,
    authorAvatarColor: '#FF0080',
    mediaUrl: '/src/assets/images/nepal_profile_banner_1794926293036.jpg',
    caption: 'My NepTok Creator Showcase — From Boudhanath Stupa to Chitwan & Everest.',
    hashtags: ['#NepTokCreator', '#NepalHeritage', '#PrideOfNepal'],
    sound: {
      id: 'snd-4',
      title: 'Original Sound - NepTok Anthem Beat',
      originalUploaderHandle: 'aarav_nepal',
      originalUploaderName: 'Aarav Gurung',
      usesCount: 2450,
      durationSec: 30,
      saved: true,
    },
    likes: 18420,
    likedByMe: false,
    comments: [],
    reposts: 520,
    repostedByMe: false,
    giftsReceivedCoins: 6400,
    savedByMe: false,
    visibility: 'Everyone',
    allowDuet: true,
    allowDownload: true,
    allowComments: true,
    allowSharing: true,
    adSettingsEnabled: true,
    views: 142000,
    estimatedEarningsUsd: 138.2,
  },
];

export const SEED_STORIES: StoryItem[] = [
  {
    id: 'st-1',
    authorId: 'u_sita',
    authorName: 'Sita',
    authorHandle: 'sita_kathmandu',
    mediaUrl: '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg',
    caption: 'Backstage before NEP Battle tonight!',
    templateName: 'Neon Kathmandu Frame',
    createdAtMs: Date.now() - 4 * 3600 * 1000,
    online: true,
  },
  {
    id: 'st-2',
    authorId: 'u_binod',
    authorName: 'Binod',
    authorHandle: 'everest_binod',
    mediaUrl: '/src/assets/images/creator_everest_trek_1794926294520.jpg',
    caption: 'Namche Bazaar trail update (48h Story)',
    templateName: 'Himalayan Polaroid',
    createdAtMs: Date.now() - 10 * 3600 * 1000,
    online: true,
  },
  {
    id: 'st-3',
    authorId: 'u_maya',
    authorName: 'Maya',
    authorHandle: 'pokhara_maya',
    mediaUrl: '/src/assets/images/creator_pokhara_lake_1794926294810.jpg',
    caption: 'Morning boat ride on Phewa',
    templateName: 'Golden Dusk Gradient',
    createdAtMs: Date.now() - 18 * 3600 * 1000,
    online: true,
  },
];

export const SEED_CHATS: ChatThread[] = [
  {
    id: 'ch-1',
    userId: 'u_sita',
    name: 'Sita Tamang',
    handle: 'sita_kathmandu',
    online: true,
    unread: 2,
    lastMessage: 'Ready for our 8 PM NEP Battle?',
    lastTime: '2m',
    messages: [
      { id: 'm1', sender: 'them', text: 'Namaste Aarav! Loved your Pokhara reel.', time: '6:12 PM' },
      { id: 'm2', sender: 'me', text: 'Thank you Sita! Your Durbar Square dance went viral.', time: '6:14 PM' },
      { id: 'm3', sender: 'them', text: 'Ready for our 8 PM NEP Battle?', time: '6:30 PM' },
    ],
  },
  {
    id: 'ch-2',
    userId: 'u_binod',
    name: 'Binod Sherpa',
    handle: 'everest_binod',
    online: true,
    unread: 0,
    lastMessage: 'Sent you the raw 8K Everest clip to edit.',
    lastTime: '1h',
    messages: [
      { id: 'm4', sender: 'them', text: 'Sent you the raw 8K Everest clip to edit.', time: '5:20 PM' },
    ],
  },
  {
    id: 'ch-3',
    userId: 'grp_ktm',
    name: 'Nepal Creators Hub',
    handle: 'ktm_creators',
    isGroup: true,
    online: true,
    unread: 5,
    lastMessage: 'Maya: Hosting a 30-seat Audio Live room at 9 PM!',
    lastTime: '2h',
    messages: [
      { id: 'm5', sender: 'them', text: 'Maya: Hosting a 30-seat Audio Live room at 9 PM!', time: '4:15 PM' },
    ],
  },
  {
    id: 'ch-4',
    userId: 'u_req',
    name: 'Rohan Thapa',
    handle: 'rohan_beats',
    isRequest: true,
    online: false,
    unread: 1,
    lastMessage: 'Hey! Want to duet using my Sarangi remix?',
    lastTime: 'Yesterday',
    messages: [
      { id: 'm6', sender: 'them', text: 'Hey! Want to duet using my Sarangi remix?', time: 'Yesterday' },
    ],
  },
];

export const SEED_NOTIFICATIONS: BellNotificationItem[] = [
  {
    id: 'n-1',
    category: 'Gifts',
    actorName: 'Sita Tamang',
    actorHandle: 'sita_kathmandu',
    message: 'sent you Sagarmatha (1,000 N) during NEP Live',
    time: '3m ago',
    amountText: '+1,000 N ($10.00)',
  },
  {
    id: 'n-2',
    category: 'Follows',
    actorName: 'Kiran Rai',
    actorHandle: 'kiran_dharan',
    message: 'started following you',
    time: '14m ago',
    followedBack: false,
  },
  {
    id: 'n-3',
    category: 'Live Invites',
    actorName: 'Maya Pun',
    actorHandle: 'pokhara_maya',
    message: 'invited you to join NEP Battle (Split-Screen VS)',
    time: '28m ago',
  },
  {
    id: 'n-4',
    category: 'Creator Rewards',
    actorName: 'NepTok Monetization',
    actorHandle: 'neptok_studio',
    message: 'Content Monetization RPM payout credited in USD',
    time: '2h ago',
    amountText: '+$42.50',
  },
  {
    id: 'n-5',
    category: 'Likes',
    actorName: 'Binod Sherpa',
    actorHandle: 'everest_binod',
    message: 'liked your Nepal Heritage Showcase video',
    time: '3h ago',
  },
  {
    id: 'n-6',
    category: 'Comments',
    actorName: 'Maya Pun',
    actorHandle: 'pokhara_maya',
    message: 'commented: "HSL color grading looks like cinema!"',
    time: '4h ago',
  },
  {
    id: 'n-7',
    category: 'Mentions',
    actorName: 'Rohan Thapa',
    actorHandle: 'rohan_beats',
    message: 'mentioned you in #KathmanduNightlife',
    time: '5h ago',
  },
];

export const SEED_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-1',
    title: 'Sagarmatha Gift Received',
    type: 'Gift Received',
    coinsDelta: 1000,
    usdAmount: 10.0,
    time: 'Today, 6:20 PM',
    method: 'NEP Live Gift Ledger',
  },
  {
    id: 'tx-2',
    title: 'Content Monetization RPM Payout',
    type: 'Creator Reward',
    coinsDelta: 0,
    usdAmount: 42.5,
    time: 'Today, 4:00 PM',
    method: 'Creator Studio',
  },
  {
    id: 'tx-3',
    title: 'Recharge 2,500 Coins (+12% Bonus)',
    type: 'Recharge',
    coinsDelta: 2800,
    usdAmount: 25.0,
    time: 'Yesterday',
    method: 'Visa •••• 4242',
  },
  {
    id: 'tx-4',
    title: 'Sent Golden Pagoda to @sita_kathmandu',
    type: 'Gift Sent',
    coinsDelta: -300,
    usdAmount: 3.0,
    time: 'Nov 15',
    method: 'Coin Balance',
  },
  {
    id: 'tx-5',
    title: 'Creator USD Withdrawal',
    type: 'Withdraw',
    coinsDelta: 0,
    usdAmount: 120.0,
    time: 'Nov 14',
    method: 'USDT (TRC20)',
  },
];

export const SEED_LINKED_ACCOUNTS: LinkedAccountItem[] = [
  { id: 'la-1', provider: 'Visa', label: 'Visa •••• 4242 (USD)', primary: true },
  { id: 'la-2', provider: 'Mastercard', label: 'Mastercard •••• 8819 (USD)', primary: false },
  { id: 'la-3', provider: 'PayPal', label: 'aarav.gurung@paypal.com', primary: false },
  { id: 'la-4', provider: 'Google Pay', label: 'Google Pay (Android Wallet)', primary: false },
  { id: 'la-5', provider: 'Apple Pay', label: 'Apple Pay (iOS Wallet)', primary: false },
  { id: 'la-6', provider: 'Wise', label: 'Wise USD Account •••• 9012', primary: false },
  { id: 'la-7', provider: 'USDT (Crypto)', label: 'TRC20 TX8k...92mP', primary: false },
  { id: 'la-8', provider: 'Bank Account', label: 'Nabil Bank USD Swift •••• 3104', primary: false },
];

import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Swords,
  Mic,
  MicOff,
  Video,
  VideoOff,
  RefreshCw,
  Zap,
  Gift,
  Heart,
  Crown,
  Users,
  Shield,
  UserPlus,
  LogOut,
  Power,
  Pin,
  Copy,
  Sparkles,
  Send,
  X,
  Gamepad2,
  Monitor,
  Headphones,
  Upload,
  Check,
  Clock,
  Lock,
  Settings,
  Wand2,
  Target,
  Share2,
  Eye,
  MoreHorizontal,
  Coins,
  TrendingUp,
  BadgeCheck,
  BarChart3,
  HeartHandshake,
} from 'lucide-react';
import {
  POST_FILTERS_80,
  BEAUTY_EFFECTS_25,
  updateBattleStreak,
  formatUsd,
  coinsToUsd,
  formatLiveDuration,
  getLiveGridLayout,
  clampLiveGoalValue,
  canStartLiveBattle,
  recordParticipantGiftAndRank,
  createBattleMultiplierChallenge,
  advanceMultiplierChallenge,
  applyBattleGiftWithMultiplier,
  type GifterRankEntry,
  type BattleMultiplierChallenge,
} from '../utils/neptokLogic';

export interface LiveGiftEvent {
  id: number;
  coins: number;
  recipientHandle: string;
  giftName: string;
  senderName: string;
  senderHandle: string;
}

interface LiveHubProps {
  currentUser: { id: string; name: string; handle: string };
  onOpenGiftStore: (recipientLabel: string, recipientHandle?: string) => void;
  lastLiveGiftEvent: LiveGiftEvent | null;
  liveGiftEvents?: LiveGiftEvent[];
  onOpenRecharge?: () => void;
  onNotify: (msg: string) => void;
}

type PreLiveMode = 'camera' | 'audio' | 'studio' | 'gaming';
type PreLivePanel = 'none' | 'beautify' | 'effects' | 'settings';

interface LiveGuest {
  id: string;
  name: string;
  handle: string;
  avatarImage: string;
  micOn: boolean;
  camOn: boolean;
}

interface LiveChatMessage {
  id: string;
  user: string;
  text: string;
  isMod?: boolean;
}

const PRESET_THUMBNAILS = [
  {
    label: 'Kathmandu Stage',
    url: '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg',
  },
  {
    label: 'Everest Summit',
    url: '/src/assets/images/creator_everest_trek_1794926294520.jpg',
  },
  {
    label: 'Phewa Lake Glow',
    url: '/src/assets/images/creator_pokhara_lake_1794926294810.jpg',
  },
];

const AVAILABLE_GUEST_CANDIDATES: Omit<LiveGuest, 'micOn' | 'camOn'>[] = [
  {
    id: 'g-sita',
    name: 'Sita Tamang',
    handle: 'sita_kathmandu',
    avatarImage: '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg',
  },
  {
    id: 'g-binod',
    name: 'Binod Sherpa',
    handle: 'everest_binod',
    avatarImage: '/src/assets/images/creator_everest_trek_1794926294520.jpg',
  },
  {
    id: 'g-maya',
    name: 'Maya Pun',
    handle: 'pokhara_maya',
    avatarImage: '/src/assets/images/creator_pokhara_lake_1794926294810.jpg',
  },
  {
    id: 'g-kiran',
    name: 'Kiran Rai',
    handle: 'kiran_dharan',
    avatarImage: '/src/assets/images/creator_everest_trek_1794926294520.jpg',
  },
  {
    id: 'g-rohan',
    name: 'Rohan Thapa',
    handle: 'rohan_beats',
    avatarImage: '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg',
  },
  {
    id: 'g-anita',
    name: 'Anita Gurung',
    handle: 'anita_lalitpur',
    avatarImage: '/src/assets/images/creator_pokhara_lake_1794926294810.jpg',
  },
  {
    id: 'g-dipak',
    name: 'Dipak Tharu',
    handle: 'dipak_chitwan',
    avatarImage: '/src/assets/images/creator_everest_trek_1794926294520.jpg',
  },
];

const SEED_GIFTER_POOL: GifterRankEntry[] = [
  { id: 'tg1', name: 'Sita Tamang', handle: 'sita_kathmandu', img: '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg', coins: 4820 },
  { id: 'tg2', name: 'Binod Sherpa', handle: 'everest_binod', img: '/src/assets/images/creator_everest_trek_1794926294520.jpg', coins: 3150 },
  { id: 'tg3', name: 'Maya Pun', handle: 'pokhara_maya', img: '/src/assets/images/creator_pokhara_lake_1794926294810.jpg', coins: 2240 },
  { id: 'tg4', name: 'Kiran Rai', handle: 'kiran_dharan', img: '/src/assets/images/creator_everest_trek_1794926294520.jpg', coins: 1480 },
  { id: 'tg5', name: 'Rohan Thapa', handle: 'rohan_beats', img: '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg', coins: 920 },
];

function buildSeedGiftersForParticipant(offset = 0): GifterRankEntry[] {
  return SEED_GIFTER_POOL.map((g, idx) => ({
    ...g,
    id: `${g.id}-p-${offset}-${idx}`,
    coins: Math.max(100, g.coins - offset * 180 + (idx === offset % 5 ? 350 : 0)),
  })).sort((a, b) => b.coins - a.coins);
}

function formatCompactCoins(coins: number): string {
  if (coins >= 1000) {
    const k = coins / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}K`;
  }
  return `${coins}`;
}

export const LiveHub: React.FC<LiveHubProps> = ({
  currentUser,
  onOpenGiftStore,
  lastLiveGiftEvent,
  liveGiftEvents = [],
  onOpenRecharge,
  onNotify,
}) => {
  // Stage & Pre-Live Setup State (never starts broadcasting automatically)
  const [liveStage, setLiveStage] = useState<'pre-live' | 'live'>('pre-live');
  const [selectedMode, setSelectedMode] = useState<PreLiveMode>('camera');
  const [liveTitle, setLiveTitle] = useState('Kathmandu Evening Live & Creators Hangout');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(PRESET_THUMBNAILS[0].url);
  const [guestJoinOpen, setGuestJoinOpen] = useState(true);
  const [coinsGoal, setCoinsGoal] = useState(1000);
  const [heartsGoal, setHeartsGoal] = useState(2500);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [preLivePanel, setPreLivePanel] = useState<PreLivePanel>('none');
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  // Drag-to-scroll ref for Pre-Live horizontal mode selector
  const modeBarRef = useRef<HTMLDivElement | null>(null);
  const modeDragRef = useRef<{ active: boolean; startX: number; scrollLeft: number; moved: boolean }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  // Host Controls (shared between Pre-Live and Live; FX & Beauty menus strictly private to Host)
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [facingFront, setFacingFront] = useState(true);
  const [beautifyOn, setBeautifyOn] = useState(true);
  const [activeBeautyIdx, setActiveBeautyIdx] = useState(0);
  const [beautifyLevel, setBeautifyLevel] = useState(45);
  const [activeEffectIdx, setActiveEffectIdx] = useState(0);
  const [showHostFxDrawer, setShowHostFxDrawer] = useState(false);
  const [showHostBeautyDrawer, setShowHostBeautyDrawer] = useState(false);
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [hostFollowed, setHostFollowed] = useState(false);

  // Continuous Live Stats (only increments while live)
  const [liveDurationSec, setLiveDurationSec] = useState(0);
  const [likeCount, setLikeCount] = useState(1240);
  const [giftsReceivedCoins, setGiftsReceivedCoins] = useState(128560);
  const [viewerCount, setViewerCount] = useState(1420);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);

  // Host-Controlled Multi-Guest State (0 guests initially -> host alone Full Screen; Host invites via Guests button)
  const [acceptedGuests, setAcceptedGuests] = useState<LiveGuest[]>([]);
  const [showGuestSheet, setShowGuestSheet] = useState(false);

  // Real-time Participant Gift Counters, Co-Gifter Leaderboards (#1-#5), Tap-to-Gift Popup & Gifter Sheet
  const [participantStats, setParticipantStats] = useState<
    Record<string, { giftsCount: number; coins: number }>
  >(() => ({
    [currentUser.handle]: { giftsCount: 24, coins: 128560 },
  }));
  const [participantGifters, setParticipantGifters] = useState<Record<string, GifterRankEntry[]>>(
    () => ({
      [currentUser.handle]: buildSeedGiftersForParticipant(0),
      sita_kathmandu: buildSeedGiftersForParticipant(1),
      everest_binod: buildSeedGiftersForParticipant(2),
      pokhara_maya: buildSeedGiftersForParticipant(3),
      kiran_dharan: buildSeedGiftersForParticipant(4),
      rohan_beats: buildSeedGiftersForParticipant(1),
      anita_lalitpur: buildSeedGiftersForParticipant(2),
      dipak_chitwan: buildSeedGiftersForParticipant(3),
    })
  );
  const [selectedParticipantPopup, setSelectedParticipantPopup] = useState<{
    name: string;
    handle: string;
    avatarImage: string;
    isHost: boolean;
    micOn: boolean;
  } | null>(null);
  const [activeGifterDrawer, setActiveGifterDrawer] = useState<{
    title: string;
    participantHandle: string;
  } | null>(null);
  const processedGiftIdsRef = useRef<Set<number>>(new Set());

  // NEP Battle & Dedicated "Invite to Battle" Selector + Consecutive Win Streak (WIN xN) + 2x/3x/4x Challenge
  const [showInviteBattleModal, setShowInviteBattleModal] = useState(false);
  const [battleOpponent, setBattleOpponent] = useState<LiveGuest | null>(null);
  const [battleRequestState, setBattleRequestState] = useState<'idle' | 'waiting-accept' | 'active'>('idle');
  const [battleSeconds, setBattleSeconds] = useState(180); // 03:00 exact
  const [myScore, setMyScore] = useState(128560);
  const [opponentScore, setOpponentScore] = useState(98430);
  const [myBattleGiftsCount, setMyBattleGiftsCount] = useState(24);
  const [oppBattleGiftsCount, setOppBattleGiftsCount] = useState(18);
  const [hostWinStreak, setHostWinStreak] = useState(2);
  const [opponentWinStreak, setOpponentWinStreak] = useState(1);
  const [activeGameBoost, setActiveGameBoost] = useState<'2x-gifts' | 'heart-combo' | 'shield'>('2x-gifts');
  const [activeMultiplier, setActiveMultiplier] = useState<1 | 2 | 3 | 4>(1);
  const [multiplierChallenge, setMultiplierChallenge] = useState<BattleMultiplierChallenge>(() =>
    createBattleMultiplierChallenge(2)
  );
  const [battleResultOverlay, setBattleResultOverlay] = useState<{
    hostWon: boolean;
    myFinalScore: number;
    oppFinalScore: number;
    winnerName: string;
    winnerHandle: string;
  } | null>(null);
  const myScoreRef = useRef(myScore);
  const oppScoreRef = useRef(opponentScore);
  useEffect(() => {
    myScoreRef.current = myScore;
    oppScoreRef.current = opponentScore;
  }, [myScore, opponentScore]);
  const [battleHistory, setBattleHistory] = useState<
    Array<{ id: string; opponent: string; result: 'WIN' | 'LOSS'; score: string }>
  >([
    { id: 'bh-1', opponent: '@pokhara_maya', result: 'WIN', score: '8,420 vs 6,190' },
    { id: 'bh-2', opponent: '@everest_binod', result: 'WIN', score: '12,100 vs 9,850' },
  ]);

  // Moderators, Rankings, OBS Studio & Chat
  const [showRankingsModal, setShowRankingsModal] = useState(false);
  const [showModPanel, setShowModPanel] = useState(false);
  const [showStudioRtmpModal, setShowStudioRtmpModal] = useState(false);
  const [moderators, setModerators] = useState<string[]>(['@kiran_dharan', '@rohan_beats']);
  const [mutedChatUsers, setMutedChatUsers] = useState<string[]>([]);
  const [pinnedComment, setPinnedComment] = useState(
    'Welcome to NEP Live! Tap ❤️ or send gifts to support the creator!'
  );
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([
    { id: 'lc1', user: '@sita_kathmandu', text: 'Namaste everyone! Crystal clear 8K stream!', isMod: true },
    { id: 'lc2', user: '@everest_binod', text: 'Looking great from Namche Bazaar!' },
  ]);

  // Audio Room (Host + up to 30 seats) when Audio Room mode is active
  const [audioSeats, setAudioSeats] = useState(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      seat: i + 1,
      occupied: i === 0,
      name: i === 0 ? currentUser.name : 'Open Seat',
      muted: false,
    }))
  );

  // Continuous Live Duration Timer
  useEffect(() => {
    if (liveStage !== 'live') return;
    const id = setInterval(() => {
      setLiveDurationSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [liveStage]);

  // Reflect live gifts into real-time recipient gift counts, Co-Gifter rankings (#1-#5), 2x/3x/4x Challenges & Battle score
  useEffect(() => {
    if (liveStage !== 'live') return;
    const incoming =
      liveGiftEvents.length > 0
        ? liveGiftEvents
        : lastLiveGiftEvent
        ? [lastLiveGiftEvent]
        : [];
    const pending = incoming.filter((evt) => !processedGiftIdsRef.current.has(evt.id));
    if (pending.length === 0) return;

    for (const evt of pending) {
      processedGiftIdsRef.current.add(evt.id);
    }

    const totalAddedCoins = pending.reduce((sum, evt) => sum + evt.coins, 0);
    setGiftsReceivedCoins((g) => g + totalAddedCoins);

    setParticipantStats((prev) => {
      const nextMap = { ...prev };
      for (const evt of pending) {
        const targetHandle = (evt.recipientHandle || currentUser.handle).replace(/^@/, '');
        const existing = nextMap[targetHandle] ?? { giftsCount: 0, coins: 0 };
        nextMap[targetHandle] = {
          giftsCount: existing.giftsCount + 1,
          coins: existing.coins + evt.coins,
        };
      }
      return nextMap;
    });

    setParticipantGifters((prev) => {
      const nextMap = { ...prev };
      for (const evt of pending) {
        const targetHandle = (evt.recipientHandle || currentUser.handle).replace(/^@/, '');
        const current = nextMap[targetHandle] ?? buildSeedGiftersForParticipant(0);
        nextMap[targetHandle] = recordParticipantGiftAndRank(
          current,
          {
            id: `viewer-${evt.senderHandle}`,
            name: evt.senderName,
            handle: evt.senderHandle,
            img: thumbnailUrl,
          },
          evt.coins
        );
      }
      return nextMap;
    });

    if (battleRequestState === 'active') {
      let runningMult: 1 | 2 | 3 | 4 = activeMultiplier;
      let latestChallenge = multiplierChallenge;
      let hostAddedScore = 0;
      let hostAddedGifts = 0;
      let oppAddedScore = 0;
      let oppAddedGifts = 0;
      let unlockedNow: 2 | 3 | 4 | null = null;

      for (const evt of pending) {
        const nextChallenge = advanceMultiplierChallenge(latestChallenge, evt.giftName, evt.coins);
        if (nextChallenge.unlocked && !latestChallenge.unlocked) {
          runningMult = nextChallenge.multiplier;
          unlockedNow = nextChallenge.multiplier;
        }
        latestChallenge = nextChallenge;
        const effMult: 1 | 2 | 3 | 4 =
          runningMult === 1 && activeGameBoost === '2x-gifts' ? 2 : runningMult;
        const gained = applyBattleGiftWithMultiplier(evt.coins, effMult);
        const targetHandle = (evt.recipientHandle || currentUser.handle).replace(/^@/, '');
        const isHostTeam =
          targetHandle === currentUser.handle ||
          (acceptedGuests.length === 3 && acceptedGuests[0]?.handle === targetHandle);
        if (isHostTeam) {
          hostAddedScore += gained;
          hostAddedGifts += 1;
        } else {
          oppAddedScore += gained;
          oppAddedGifts += 1;
        }
      }

      setMultiplierChallenge(latestChallenge);
      if (unlockedNow) {
        setActiveMultiplier(unlockedNow);
        onNotify(`⚡ ${unlockedNow}x Bonus Multiplier Activated!`);
      }
      if (hostAddedScore > 0) {
        setMyScore((s) => s + hostAddedScore);
        setMyBattleGiftsCount((c) => c + hostAddedGifts);
      }
      if (oppAddedScore > 0) {
        setOpponentScore((s) => s + oppAddedScore);
        setOppBattleGiftsCount((c) => c + oppAddedGifts);
      }
    }
  }, [liveGiftEvents, lastLiveGiftEvent, liveStage, battleRequestState, activeMultiplier, activeGameBoost, acceptedGuests, currentUser.handle, thumbnailUrl, multiplierChallenge, onNotify]);

  // 3-Minute (03:00) Live Battle Countdown Timer + Frame WIN/LOSE + Win Streak Update
  const finishActiveBattle = (finalMyScore: number, finalOppScore: number) => {
    setBattleRequestState('idle');
    const won = finalMyScore >= finalOppScore;
    const opp = battleOpponent ?? acceptedGuests[0] ?? null;
    const oppHandle = opp?.handle ? `@${opp.handle}` : '@sita_kathmandu';
    setHostWinStreak((prev) => updateBattleStreak(prev, won));
    setOpponentWinStreak((prev) => updateBattleStreak(prev, !won));
    setBattleHistory((h) => [
      {
        id: `bh-${Date.now()}`,
        opponent: oppHandle,
        result: won ? 'WIN' : 'LOSS',
        score: `${finalMyScore.toLocaleString()} vs ${finalOppScore.toLocaleString()}`,
      },
      ...h,
    ]);
    setBattleResultOverlay({
      hostWon: won,
      myFinalScore: finalMyScore,
      oppFinalScore: finalOppScore,
      winnerName: won ? currentUser.name : opp?.name || 'Guest',
      winnerHandle: won ? `@${currentUser.handle}` : oppHandle,
    });
    onNotify(won ? 'NEP Battle Winner: Victory!' : 'NEP Battle completed!');
  };

  useEffect(() => {
    if (battleRequestState !== 'active') return;
    const id = setInterval(() => {
      setBattleSeconds((prev) => {
        if (prev <= 1) {
          finishActiveBattle(myScoreRef.current, oppScoreRef.current);
          return 180;
        }
        return prev - 1;
      });
      setMultiplierChallenge((prev) => {
        if (prev.remainingSec <= 1) {
          const nextMult: 2 | 3 | 4 = prev.multiplier === 2 ? 3 : prev.multiplier === 3 ? 4 : 2;
          setActiveMultiplier(1);
          return createBattleMultiplierChallenge(nextMult);
        }
        return { ...prev, remainingSec: prev.remainingSec - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [battleRequestState, battleOpponent, acceptedGuests]);

  const activeEffect = POST_FILTERS_80[activeEffectIdx] ?? POST_FILTERS_80[0];
  const activeBeautyEffect = BEAUTY_EFFECTS_25[activeBeautyIdx] ?? BEAUTY_EFFECTS_25[0];
  const computedHostFilter = `${activeEffect.cssFilter}${
    beautifyOn
      ? ` ${activeBeautyEffect.cssFilter} brightness(${(1 + beautifyLevel * 0.001).toFixed(2)}) saturate(${(
          1 +
          beautifyLevel * 0.0008
        ).toFixed(2)})`
      : ''
  }`;
  const totalParticipants = 1 + acceptedGuests.length; // Host + guests (max 8)
  const layout = getLiveGridLayout(totalParticipants);

  const battleMins = Math.floor(battleSeconds / 60)
    .toString()
    .padStart(2, '0');
  const battleSecs = (battleSeconds % 60).toString().padStart(2, '0');
  const totalBattleScore = Math.max(1, myScore + opponentScore);
  const myPct = Math.round((myScore / totalBattleScore) * 100);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailUrl(URL.createObjectURL(file));
    onNotify(`Live thumbnail updated: ${file.name}`);
  };

  const handleStartLive = () => {
    if (!liveTitle.trim()) {
      setTitleError('Please enter a Live Title before going live.');
      return;
    }
    setTitleError(null);
    setLiveDurationSec(0);
    setAcceptedGuests([]);
    setBattleOpponent(null);
    setBattleRequestState('idle');
    setBattleResultOverlay(null);
    setBattleSeconds(180);
    setShowHostFxDrawer(false);
    setShowHostBeautyDrawer(false);
    setShowMoreDrawer(false);
    setPreLivePanel('none');
    setShowGoalEditor(false);
    setLiveStage('live');
    onNotify(`Now Live (${selectedMode.toUpperCase()}): ${liveTitle.trim()}`);
  };

  const handleEndLive = () => {
    setLiveStage('pre-live');
    setAcceptedGuests([]);
    setBattleOpponent(null);
    setBattleRequestState('idle');
    setBattleResultOverlay(null);
    setShowHostFxDrawer(false);
    setShowHostBeautyDrawer(false);
    setShowMoreDrawer(false);
    setShowInviteBattleModal(false);
    onNotify(`Live ended · Duration ${formatLiveDuration(liveDurationSec)}`);
  };

  const handleHostInviteGuest = (candidate: Omit<LiveGuest, 'micOn' | 'camOn'>) => {
    if (acceptedGuests.some((g) => g.id === candidate.id)) {
      onNotify(`@${candidate.handle} is already on stage`);
      return;
    }
    if (acceptedGuests.length >= 7) {
      onNotify('Maximum room capacity reached (8 participants including Host).');
      return;
    }
    const nextList = [...acceptedGuests, { ...candidate, micOn: true, camOn: true }];
    setAcceptedGuests(nextList);
    if (!canStartLiveBattle(1 + nextList.length)) {
      setBattleRequestState('idle');
      setBattleOpponent(null);
      setBattleResultOverlay(null);
    }
    setViewerCount((v) => v + 42);
    onNotify(
      acceptedGuests.length === 0
        ? `Invited @${candidate.handle} — Split Screen enabled!`
        : `Invited @${candidate.handle} (${acceptedGuests.length + 2}/8 on stage)`
    );
  };

  const handleChallengeGuest = (guest: LiveGuest) => {
    setBattleOpponent(guest);
    setBattleResultOverlay(null);
    setBattleRequestState('waiting-accept');
    setShowInviteBattleModal(false);
    onNotify(`Sent 03:00 Battle request to @${guest.handle}`);
  };

  const handleDoubleTapHeart = () => {
    const id = Date.now() + Math.random();
    setFloatingHearts((prev) => [...prev.slice(-8), id]);
    setLikeCount((l) => l + 1);
    if (battleRequestState === 'active') {
      const pts = activeGameBoost === 'heart-combo' ? 5 : 2;
      setMyScore((s) => s + pts);
    }
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((x) => x !== id));
    }, 1800);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev.slice(-20),
      {
        id: `lc-${Date.now()}`,
        user: `@${currentUser.handle}`,
        text: chatInput.trim(),
        isMod: true,
      },
    ]);
    setChatInput('');
  };

  const handleShareLive = () => {
    const shareUrl = `${window.location.origin}/?live=${encodeURIComponent(currentUser.handle)}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    onNotify('Live invite link copied to clipboard');
  };

  // =========================================================
  // PRE-LIVE SETUP VIEW
  // =========================================================
  if (liveStage === 'pre-live') {
    const modeOptions: Array<{
      id: PreLiveMode;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [
      { id: 'audio', label: 'Audio Chat', icon: Headphones },
      { id: 'camera', label: 'Device Camera', icon: Video },
      { id: 'gaming', label: 'Mobile Gaming', icon: Gamepad2 },
      { id: 'studio', label: 'Studio Live', icon: Monitor },
    ];

    return (
      <div className="relative w-full h-full min-h-0 bg-[#090514] text-white flex flex-col justify-between overflow-hidden">
        <input
          ref={thumbnailInputRef}
          type="file"
          accept="image/*"
          onChange={handleThumbnailUpload}
          className="hidden"
        />

        {/* Full-Screen Camera Preview Backdrop */}
        <div className="absolute inset-0 bg-black">
          {cameraOn ? (
            <img
              src={thumbnailUrl}
              alt="Pre-Live Full-Screen Camera Preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-150"
              style={{
                filter: computedHostFilter,
                transform: facingFront ? 'scaleX(1)' : 'scaleX(-1)',
              }}
            />
          ) : (
            <div className="w-full h-full bg-[#120824] flex flex-col items-center justify-center gap-2">
              <VideoOff className="w-10 h-10 text-purple-300" />
              <p className="text-xs text-purple-200 font-semibold">Camera Paused (Audio Only Setup)</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/15 to-black/85 pointer-events-none" />
        </div>

        {/* TOP SECTION OVER CAMERA PREVIEW: Live Title + Thumbnail Upload */}
        <div className="relative z-10 p-2.5 sm:p-3.5 space-y-1.5 sm:space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 sm:px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#FF0080]" />
              <span>Pre-Live Setup</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
                onClick={() => setCameraOn((c) => !c)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer ${
                  !cameraOn ? 'bg-rose-600/80 border-rose-300' : 'bg-black/60 border-white/20'
                }`}
              >
                {cameraOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                aria-label={micMuted ? 'Unmute Mic' : 'Mute Mic'}
                onClick={() => setMicMuted((m) => !m)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer ${
                  micMuted ? 'bg-rose-600/80 border-rose-300' : 'bg-black/60 border-white/20'
                }`}
              >
                {micMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Translucent Title & Thumbnail Card */}
          <div className="rounded-2xl bg-black/55 backdrop-blur-md border border-white/15 p-2 sm:p-3 space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-white/25 shrink-0 group cursor-pointer"
                aria-label="Upload Thumbnail"
              >
                <img
                  src={thumbnailUrl}
                  alt="Cover Thumbnail"
                  className="w-full h-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/75 py-0.5 text-[9px] font-bold text-center text-white flex items-center justify-center gap-0.5">
                  <Upload className="w-2.5 h-2.5 text-[#FF0080]" /> Cover
                </span>
              </button>

              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-200/80">
                  Live Title
                  <input
                    type="text"
                    value={liveTitle}
                    onChange={(e) => {
                      setLiveTitle(e.target.value);
                      if (titleError) setTitleError(null);
                    }}
                    placeholder="Add a title to go LIVE..."
                    className="mt-1 w-full h-8 sm:h-9 px-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-purple-200/50 focus:outline-none focus:border-[#FF0080]"
                  />
                </label>
              </div>
            </div>

            {titleError && <p className="text-[11px] text-rose-400 font-semibold">{titleError}</p>}

            {/* Quick Thumbnail Presets + Upload Button */}
            <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap pb-0.5 touch-pan-x no-scrollbar">
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="shrink-0 px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3 text-[#FF0080]" />
                <span>Upload Thumbnail</span>
              </button>
              {PRESET_THUMBNAILS.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setThumbnailUrl(t.url)}
                  className={`shrink-0 px-2 py-1 rounded-lg border text-[10px] font-semibold cursor-pointer ${
                    thumbnailUrl === t.url
                      ? 'bg-[#FF0080]/30 border-[#FF0080] text-white'
                      : 'bg-white/10 border-white/10 text-purple-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE-LOWER & BOTTOM SECTION OVER CAMERA PREVIEW (Compact No-Scroll Mobile Fit) */}
        <div className="relative z-10 p-2.5 sm:p-3.5 space-y-2 sm:space-y-2.5 mt-auto shrink-0">
          {/* Host-Private Drawers (Never Visible to Viewers/Guests) */}
          {preLivePanel === 'beautify' && (
            <div
              data-testid="beauty-effects-tray"
              className="rounded-2xl bg-[#140A26]/95 backdrop-blur-md border border-[#FF0080]/50 p-2.5 space-y-2 max-h-[28vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-pink-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Host-Private Beauty Camera ({BEAUTY_EFFECTS_25.length} Effects)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBeautifyOn((b) => !b)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                      beautifyOn ? 'bg-[#FF0080] text-white' : 'bg-white/10 text-purple-200'
                    }`}
                  >
                    {beautifyOn ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreLivePanel('none')}
                    aria-label="Close Beautify Menu"
                    className="cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap pb-1 touch-pan-x no-scrollbar">
                {BEAUTY_EFFECTS_25.map((bfx, i) => (
                  <button
                    key={bfx.id}
                    type="button"
                    onClick={() => {
                      setBeautifyOn(true);
                      setActiveBeautyIdx(i);
                    }}
                    className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border flex flex-col items-start gap-0.5 cursor-pointer ${
                      beautifyOn && activeBeautyIdx === i
                        ? 'bg-[#FF0080] border-white text-white shadow'
                        : 'bg-white/10 border-white/10 text-purple-100 hover:border-[#FF0080]/60'
                    }`}
                  >
                    <span className="text-[9px] font-mono opacity-80">{bfx.badge}</span>
                    <span>{bfx.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-purple-200 shrink-0">Intensity</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={beautifyLevel}
                  onChange={(e) => setBeautifyLevel(Number(e.target.value))}
                  aria-label="Beauty smoothing level"
                  className="flex-1 accent-[#FF0080]"
                />
                <span className="font-mono text-pink-200 w-9 text-right">{beautifyLevel}%</span>
              </div>
            </div>
          )}

          {preLivePanel === 'effects' && (
            <div className="rounded-2xl bg-[#140A26]/95 backdrop-blur-md border border-[#FF0080]/50 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-pink-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Host-Private Effects &amp; Filters (Viewers only see effect)
                </span>
                <button
                  type="button"
                  onClick={() => setPreLivePanel('none')}
                  aria-label="Close Effects Menu"
                  className="cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap pb-1 touch-pan-x">
                {POST_FILTERS_80.slice(0, 32).map((fx, i) => (
                  <button
                    key={fx.id}
                    type="button"
                    onClick={() => setActiveEffectIdx(i)}
                    className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer ${
                      activeEffectIdx === i
                        ? 'bg-[#FF0080] border-white text-white'
                        : 'bg-white/10 border-white/10 text-purple-100'
                    }`}
                  >
                    {fx.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {preLivePanel === 'settings' && (
            <div className="rounded-2xl bg-[#140A26]/95 backdrop-blur-md border border-[#9D00FF]/50 p-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-purple-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Host-Private Broadcast Settings
                </span>
                <button
                  type="button"
                  onClick={() => setPreLivePanel('none')}
                  aria-label="Close Settings Menu"
                  className="cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCameraOn((c) => !c)}
                  className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    cameraOn ? 'bg-white/10 border-white/15' : 'bg-rose-600/35 border-rose-400'
                  }`}
                >
                  {cameraOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  <span>{cameraOn ? 'Camera ON' : 'Camera OFF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMicMuted((m) => !m)}
                  className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    micMuted ? 'bg-rose-600/35 border-rose-400' : 'bg-white/10 border-white/15'
                  }`}
                >
                  {micMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{micMuted ? 'Mic Muted' : 'Mic Ready'}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowStudioRtmpModal(true)}
                className="w-full py-2 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Studio / OBS RTMP Stream Key</span>
              </button>
            </div>
          )}

          {/* Quick-Setup Icons Row: Flip, Beautify, Effects, Settings */}
          <div className="flex items-center justify-around px-2">
            <button
              type="button"
              onClick={() => {
                setFacingFront((f) => !f);
                onNotify('Flipped camera orientation');
              }}
              className="flex flex-col items-center gap-0.5 cursor-pointer group"
            >
              <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/55 backdrop-blur-md border border-white/20 group-hover:border-[#FF0080] flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-white" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-white">Flip</span>
            </button>

            <button
              type="button"
              onClick={() => setPreLivePanel((p) => (p === 'beautify' ? 'none' : 'beautify'))}
              className="flex flex-col items-center gap-0.5 cursor-pointer group"
            >
              <span
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full backdrop-blur-md border flex items-center justify-center ${
                  preLivePanel === 'beautify' || beautifyOn
                    ? 'bg-[#FF0080]/35 border-[#FF0080]'
                    : 'bg-black/55 border-white/20'
                }`}
              >
                <Wand2 className="w-4 h-4 text-white" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-white">Beautify</span>
            </button>

            <button
              type="button"
              onClick={() => setPreLivePanel((p) => (p === 'effects' ? 'none' : 'effects'))}
              className="flex flex-col items-center gap-0.5 cursor-pointer group"
            >
              <span
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full backdrop-blur-md border flex items-center justify-center ${
                  preLivePanel === 'effects'
                    ? 'bg-[#FF0080] border-white'
                    : 'bg-black/55 border-white/20'
                }`}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-white">Effects</span>
            </button>

            <button
              type="button"
              onClick={() => setPreLivePanel((p) => (p === 'settings' ? 'none' : 'settings'))}
              className="flex flex-col items-center gap-0.5 cursor-pointer group"
            >
              <span
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full backdrop-blur-md border flex items-center justify-center ${
                  preLivePanel === 'settings'
                    ? 'bg-[#9D00FF] border-white'
                    : 'bg-black/55 border-white/20'
                }`}
              >
                <Settings className="w-4 h-4 text-white" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-white">Settings</span>
            </button>
          </div>

          {/* Editable LIVE Goal Panel (Slider + Number Input, 50 to 10,000 for Coins & Hearts) */}
          {showGoalEditor && (
            <div
              data-testid="live-goal-editor"
              className="rounded-2xl bg-[#140A26]/95 backdrop-blur-md border border-[#FF0080]/55 p-2.5 space-y-2 text-xs max-h-[28vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#FF0080]" />
                  <span>Edit LIVE Goal (50 – 10,000)</span>
                </span>
                <button
                  type="button"
                  aria-label="Close LIVE Goal Editor"
                  onClick={() => setShowGoalEditor(false)}
                  className="cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Coins Goal */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                    <Coins className="w-3 h-3" /> Target Coins (N)
                  </span>
                  <input
                    type="number"
                    aria-label="Coins Goal Number"
                    min={50}
                    max={10000}
                    step={50}
                    value={coinsGoal}
                    onChange={(e) => setCoinsGoal(clampLiveGoalValue(Number(e.target.value)))}
                    className="w-24 h-7 px-2 rounded-lg bg-[#090514] border border-white/20 text-right font-mono text-[11px] text-amber-300 focus:outline-none focus:border-[#FF0080]"
                  />
                </div>
                <input
                  type="range"
                  aria-label="Coins Goal Slider"
                  min={50}
                  max={10000}
                  step={50}
                  value={coinsGoal}
                  onChange={(e) => setCoinsGoal(clampLiveGoalValue(Number(e.target.value)))}
                  className="w-full accent-amber-400"
                />
              </div>

              {/* Hearts Goal */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-pink-300 flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-[#FF0080] text-[#FF0080]" /> Target Hearts
                  </span>
                  <input
                    type="number"
                    aria-label="Hearts Goal Number"
                    min={50}
                    max={10000}
                    step={50}
                    value={heartsGoal}
                    onChange={(e) => setHeartsGoal(clampLiveGoalValue(Number(e.target.value)))}
                    className="w-24 h-7 px-2 rounded-lg bg-[#090514] border border-white/20 text-right font-mono text-[11px] text-pink-300 focus:outline-none focus:border-[#FF0080]"
                  />
                </div>
                <input
                  type="range"
                  aria-label="Hearts Goal Slider"
                  min={50}
                  max={10000}
                  step={50}
                  value={heartsGoal}
                  onChange={(e) => setHeartsGoal(clampLiveGoalValue(Number(e.target.value)))}
                  className="w-full accent-[#FF0080]"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                {[50, 100, 200, 300, 500, 1000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCoinsGoal(preset)}
                    className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border cursor-pointer ${
                      coinsGoal === preset
                        ? 'bg-[#FF0080] border-white text-white'
                        : 'bg-white/10 border-white/10 text-purple-200'
                    }`}
                  >
                    {preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rounded Semi-Transparent Card: Join & LIVE Goal */}
          <div className="rounded-2xl bg-black/55 backdrop-blur-md border border-white/15 p-2 sm:p-2.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGuestJoinOpen((j) => !j)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-2 text-left cursor-pointer"
            >
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#9D00FF]/35 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white leading-tight">Join</p>
                <p className="text-[10px] text-purple-200/80 truncate">
                  {guestJoinOpen ? 'Host Invite (Max 8)' : 'Solo Only'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowGoalEditor((s) => !s)}
              className={`p-2 rounded-xl border flex items-center gap-2 text-left cursor-pointer ${
                showGoalEditor
                  ? 'bg-[#FF0080]/25 border-[#FF0080]'
                  : 'bg-white/10 hover:bg-white/15 border-white/10'
              }`}
            >
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FF0080]/35 flex items-center justify-center shrink-0">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-200" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white leading-tight">LIVE goal</p>
                <p className="text-[10px] text-amber-300 font-semibold truncate">
                  {coinsGoal.toLocaleString()} N · {heartsGoal.toLocaleString()} ❤️
                </p>
              </div>
            </button>
          </div>

          {/* Prominent Full-Width Pill-Shaped "Go LIVE" Button */}
          <button
            type="button"
            onClick={handleStartLive}
            className="w-full h-10 sm:h-11 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] font-display font-extrabold text-sm sm:text-base text-white shadow-xl shadow-[#FF0080]/40 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            <span>Go LIVE</span>
          </button>

          {/* Bottom Horizontal Mode Selector: Fits cleanly on Mobile & Tablet without clipping */}
          <div
            ref={modeBarRef}
            data-testid="prelive-mode-selector"
            onMouseDown={(e) => {
              const el = modeBarRef.current;
              if (!el) return;
              modeDragRef.current = {
                active: true,
                startX: e.clientX,
                scrollLeft: el.scrollLeft,
                moved: false,
              };
            }}
            onMouseMove={(e) => {
              const el = modeBarRef.current;
              if (!el || !modeDragRef.current.active) return;
              const dx = e.clientX - modeDragRef.current.startX;
              if (Math.abs(dx) > 4) modeDragRef.current.moved = true;
              el.scrollLeft = modeDragRef.current.scrollLeft - dx;
            }}
            onMouseUp={() => {
              modeDragRef.current.active = false;
            }}
            onMouseLeave={() => {
              modeDragRef.current.active = false;
            }}
            className="flex items-center justify-start gap-1.5 overflow-x-auto flex-nowrap px-0.5 py-0.5 touch-pan-x no-scrollbar select-none cursor-grab active:cursor-grabbing"
          >
            {modeOptions.map((m) => {
              const Icon = m.icon;
              const active = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={(e) => {
                    if (modeDragRef.current.moved) {
                      modeDragRef.current.moved = false;
                      return;
                    }
                    setSelectedMode(m.id);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                  className={`shrink-0 px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-[#090514] shadow-md'
                      : 'bg-black/45 text-purple-200 hover:bg-black/65 border border-white/10'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Studio / OBS RTMP Modal accessible from Pre-Live Settings */}
        {showStudioRtmpModal && (
          <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl bg-[#140A26] border border-sky-400/40 p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-base">Studio &amp; Gaming RTMP Ingest</h3>
                <button type="button" onClick={() => setShowStudioRtmpModal(false)} className="cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 rounded-2xl bg-[#090514] border border-white/10 flex items-center justify-between font-mono">
                <span>rtmp://live.neptok.com/live</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText('rtmp://live.neptok.com/live').catch(() => {});
                    onNotify('Copied RTMP URL');
                  }}
                  className="text-[#FF0080] flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
              <div className="p-3 rounded-2xl bg-[#090514] border border-white/10 flex items-center justify-between font-mono">
                <span>nt_live_ktm_9841_secure8k</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText('nt_live_ktm_9841_secure8k').catch(() => {});
                    onNotify('Copied Stream Key');
                  }}
                  className="text-[#FF0080] flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // ACTIVE LIVE VIEW
  // - Single Host Full Screen (overlay HUD cleanly at top/bottom, zero extra tabs)
  // - Multi-Guest & 2-Person Split / 1v1 Battle (bounded top HUD + battle timer -> bounded grid stage -> bottom chat & controls neatly below video boxes!)
  // =========================================================
  const isAudioRoom = selectedMode === 'audio';
  const isSplitOrGrid = !isAudioRoom && totalParticipants >= 2;
  const hostTopGifters = participantGifters[currentUser.handle] ?? SEED_GIFTER_POOL;
  const battleAllowed = canStartLiveBattle(totalParticipants);

  const openParticipantGiftCard = (participant: {
    name: string;
    handle: string;
    avatarImage: string;
    isHost: boolean;
    micOn: boolean;
  }) => {
    setSelectedParticipantPopup(participant);
  };

  const renderCoGifterStrip = (participantHandle: string, participantName: string, accent: 'pink' | 'sky') => {
    const list = (participantGifters[participantHandle] ?? SEED_GIFTER_POOL).slice(0, 5);
    return (
      <button
        type="button"
        data-testid={`co-gifters-strip-${participantHandle}`}
        aria-label={`View Top Gifters for ${participantName}`}
        onClick={(e) => {
          e.stopPropagation();
          setActiveGifterDrawer({
            title: `${participantName}'s Top Gifters & Co-Gifters`,
            participantHandle,
          });
        }}
        className={`w-full px-2 py-1 bg-[#090514] hover:bg-[#140A26] flex items-center justify-between gap-1 cursor-pointer border-t ${
          accent === 'pink' ? 'border-[#FF0080]/25' : 'border-sky-400/25'
        }`}
      >
        <span
          className={`text-[9px] font-bold uppercase shrink-0 ${
            accent === 'pink' ? 'text-pink-300' : 'text-sky-300'
          }`}
        >
          {totalParticipants <= 4 ? 'Co-Gifters' : 'Top'}
        </span>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {list.map((tg, idx) => {
            const rankBadge =
              idx === 0
                ? 'bg-amber-400 text-black'
                : idx === 1
                ? 'bg-slate-200 text-black'
                : idx === 2
                ? 'bg-amber-700 text-white'
                : 'bg-[#1F1238] text-purple-200';
            return (
              <span key={tg.id} className="relative shrink-0 inline-flex items-center">
                <img
                  src={tg.img}
                  alt={`#${idx + 1} ${tg.name}`}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border ${
                    accent === 'pink' ? 'border-[#FF0080]' : 'border-sky-400'
                  }`}
                />
                <span
                  className={`-ml-1.5 px-1 rounded-full text-[8px] font-extrabold leading-tight border border-black ${rankBadge}`}
                >
                  #{idx + 1}
                </span>
              </span>
            );
          })}
        </div>
      </button>
    );
  };

  const topHudContent = (
    <div data-testid="live-top-header" className="space-y-1">
      {/* ROW 1: Host Avatar & Name + Follow + Top 1/2/3 Gifters with Gold/Silver/Bronze Crowns & Coins + Viewer Count + End */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md pl-1 pr-1.5 py-0.5 rounded-full border border-white/15 min-w-0">
          <button
            type="button"
            onClick={() =>
              openParticipantGiftCard({
                name: currentUser.name,
                handle: currentUser.handle,
                avatarImage: thumbnailUrl,
                isHost: true,
                micOn: !micMuted,
              })
            }
            className="flex items-center gap-1 min-w-0 cursor-pointer"
          >
            <img
              src={thumbnailUrl}
              alt={currentUser.name}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-[#FF0080] shrink-0"
            />
            <span className="text-[10px] sm:text-[11px] font-bold text-white truncate max-w-[70px]">
              {currentUser.name}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setHostFollowed((f) => !f);
              onNotify(hostFollowed ? 'Unfollowed host' : `Following ${currentUser.name}`);
            }}
            className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 cursor-pointer ${
              hostFollowed
                ? 'bg-white/15 text-purple-100'
                : 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white'
            }`}
          >
            {hostFollowed ? 'Following' : 'Follow'}
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Top 1, 2, 3 Gifters Avatars with Gold / Silver / Bronze Crowns & Total Gifted Coins */}
          <button
            type="button"
            data-testid="top-3-gifters"
            aria-label="Open Room Top Gifters Leaderboard"
            onClick={() =>
              setActiveGifterDrawer({
                title: 'Top 1–5 Live Room Gifters',
                participantHandle: currentUser.handle,
              })
            }
            className="flex items-center gap-1 bg-black/55 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/15 cursor-pointer"
          >
            {hostTopGifters.slice(0, 3).map((tg, idx) => {
              const rank = idx + 1;
              const crownColor =
                rank === 1
                  ? 'bg-amber-400 text-black'
                  : rank === 2
                  ? 'bg-slate-200 text-black'
                  : 'bg-amber-700 text-white';
              return (
                <div
                  key={tg.id}
                  className="relative flex items-center gap-0.5"
                  title={`Top ${rank} Gifter: ${tg.name} (${tg.coins.toLocaleString()} N)`}
                >
                  <div className="relative">
                    <img
                      src={tg.img}
                      alt={`Top ${rank} Gifter ${tg.name}`}
                      className="w-5 h-5 rounded-full object-cover border border-black"
                    />
                    <span
                      className={`absolute -top-1 -right-0.5 w-3 h-3 rounded-full ${crownColor} flex items-center justify-center border border-black`}
                    >
                      <Crown className="w-2 h-2" />
                    </span>
                  </div>
                  <span className="text-[8px] font-mono font-bold text-amber-200 hidden sm:inline">
                    {formatCompactCoins(tg.coins)}
                  </span>
                </div>
              );
            })}
          </button>

          {/* Live Viewer Count */}
          <span
            aria-label="Live Viewer Count"
            className="px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-bold flex items-center gap-0.5 tabular-nums"
          >
            <Eye className="w-3 h-3 text-purple-200" />
            <span>{viewerCount.toLocaleString()}</span>
          </span>

          <button
            type="button"
            aria-label="End Live"
            onClick={handleEndLive}
            className="px-2 py-0.5 rounded-full bg-rose-600 hover:bg-rose-500 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
          >
            <Power className="w-3 h-3" />
            <span>End</span>
          </button>
        </div>
      </div>

      {/* ROW 2: Membership/VIP Badge + Gift Challenge Progress Pill + Donate for NepTok Badge */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap">
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#9D00FF]/35 border border-[#9D00FF]/60 text-[10px] font-bold text-purple-100 flex items-center gap-1">
          <BadgeCheck className="w-3 h-3 text-amber-300" />
          <span>VIP Club</span>
        </span>
        <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-400/40 text-[10px] font-bold text-amber-300 flex items-center gap-1 tabular-nums">
          <Gift className="w-3 h-3" />
          <span>{giftsReceivedCoins.toLocaleString()} / 250,000</span>
        </span>
        <button
          type="button"
          onClick={() => onOpenGiftStore(`@${currentUser.handle} (Donate for NepTok)`)}
          className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#FF0080]/25 border border-[#FF0080]/60 text-[10px] font-bold text-pink-200 flex items-center gap-1 cursor-pointer"
        >
          <HeartHandshake className="w-3 h-3 text-[#FF0080]" />
          <span>Donate for NepTok</span>
        </button>
      </div>

      {/* ROW 3: LIVE Badge + Continuous Live Duration Timer + Audio/Stats Icon + Weekly Ranking No. 3 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-[#FF0080] text-white text-[10px] font-extrabold flex items-center gap-1 font-mono tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>LIVE</span>
            <span>{formatLiveDuration(liveDurationSec)}</span>
          </span>
          <span
            aria-label="Live Likes and Audio Stats"
            className="px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-[10px] font-bold flex items-center gap-1 tabular-nums"
          >
            <BarChart3 className="w-3 h-3 text-emerald-300" />
            <Heart className="w-2.5 h-2.5 text-[#FF0080] fill-[#FF0080]" />
            <span>{likeCount.toLocaleString()}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowRankingsModal(true)}
          className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-[10px] font-bold text-amber-300 flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <TrendingUp className="w-3 h-3" />
          <span>Weekly Ranking No. 3</span>
        </button>
      </div>

      {/* Battle Request Pending Opponent Acceptance Banner */}
      {battleRequestState === 'waiting-accept' && (
        <div className="p-2 rounded-2xl bg-[#1C0F33]/95 border border-[#FF0080] flex items-center justify-between gap-2 shadow-xl">
          <div className="text-xs min-w-0">
            <p className="font-bold text-white">This vs. That Battle Request Pending</p>
            <p className="text-[11px] text-purple-200/80 truncate">
              Waiting for @{battleOpponent?.handle || acceptedGuests[0]?.handle || 'guest'} to accept 03:00 Battle...
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setBattleRequestState('idle')}
              className="px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setBattleResultOverlay(null);
                setBattleRequestState('active');
                setBattleSeconds(180); // 03:00
                setMyScore(128560);
                setOpponentScore(98430);
                setMyBattleGiftsCount(24);
                setOppBattleGiftsCount(18);
                onNotify(`@${battleOpponent?.handle || acceptedGuests[0]?.handle || 'Guest'} accepted! 03:00 Battle started!`);
              }}
              className="px-3 py-1 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-[11px] font-bold cursor-pointer"
            >
              Accept Battle
            </button>
          </div>
        </div>
      )}

      {/* Active 2-Person "This vs. That" Battle Split Points Bar + 03:00 Countdown + Game Boosts */}
      {battleRequestState === 'active' && (
        <div
          data-testid="live-battle-hud"
          className="bg-black/85 backdrop-blur-md rounded-xl p-2 border border-[#FF0080]/55 space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs font-mono font-bold tabular-nums">
            <span className="text-[#FF0080] flex items-center gap-1">
              <span>{myScore.toLocaleString()} pts</span>
              <span className="text-[10px] text-amber-300">· 🎁 {myBattleGiftsCount}</span>
            </span>
            <span
              data-testid="battle-countdown-timer"
              className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-extrabold"
            >
              {battleMins}:{battleSecs}
            </span>
            <span className="text-sky-400 flex items-center gap-1">
              <span className="text-[10px] text-amber-300">🎁 {oppBattleGiftsCount} ·</span>
              <span>{opponentScore.toLocaleString()} pts</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-sky-500 overflow-hidden flex border border-white/15">
            <div
              className="h-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] transition-all duration-300"
              style={{ width: `${myPct}%` }}
            />
          </div>
          {/* Timed 2x / 3x / 4x Bonus Multiplier Challenge HUD */}
          <div
            data-testid="battle-multiplier-hud"
            className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg bg-[#1A0D33]/90 border border-amber-400/40 text-[10px]"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`shrink-0 px-1.5 py-0.5 rounded font-extrabold ${
                  multiplierChallenge.unlocked || activeMultiplier > 1
                    ? 'bg-amber-400 text-black animate-pulse'
                    : 'bg-[#FF0080]/30 text-amber-200 border border-amber-400/40'
                }`}
              >
                {multiplierChallenge.unlocked || activeMultiplier > 1
                  ? `${Math.max(activeMultiplier, multiplierChallenge.multiplier)}x ACTIVE`
                  : `${multiplierChallenge.multiplier}x CHALLENGE`}
              </span>
              <span className="text-purple-100 truncate font-semibold">
                {multiplierChallenge.unlocked
                  ? `Bonus ${multiplierChallenge.multiplier}x Gift Points!`
                  : `Send ${multiplierChallenge.targetCoins} N (${multiplierChallenge.progressCoins}/${multiplierChallenge.targetCoins})`}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {([2, 3, 4] as const).map((mult) => (
                <button
                  key={mult}
                  type="button"
                  aria-label={`Activate ${mult}x multiplier challenge`}
                  onClick={() => {
                    const nextCh = createBattleMultiplierChallenge(mult);
                    setMultiplierChallenge({ ...nextCh, unlocked: true, progressCoins: nextCh.targetCoins });
                    setActiveMultiplier(mult);
                    onNotify(`⚡ ${mult}x Bonus Multiplier Active!`);
                  }}
                  className={`px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer border ${
                    activeMultiplier === mult
                      ? 'bg-amber-400 text-black border-white'
                      : 'bg-white/10 text-amber-200 border-white/15 hover:bg-white/20'
                  }`}
                >
                  {mult}x
                </button>
              ))}
              <span className="font-mono font-bold text-amber-300 tabular-nums pl-0.5">
                {multiplierChallenge.remainingSec}s
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap no-scrollbar">
            {[
              { id: '2x-gifts' as const, label: '⚡ 2x Gift' },
              { id: 'heart-combo' as const, label: '🔥 Heart +5' },
              { id: 'shield' as const, label: '🛡️ Shield' },
            ].map((gf) => (
              <button
                key={gf.id}
                type="button"
                onClick={() => {
                  setActiveGameBoost(gf.id);
                  onNotify(`Activated Game Boost: ${gf.label}`);
                }}
                className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                  activeGameBoost === gf.id
                    ? 'bg-amber-400 text-black border-white'
                    : 'bg-white/10 text-purple-100 border-white/15'
                }`}
              >
                {gf.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => finishActiveBattle(myScore, opponentScore)}
              className="shrink-0 ml-auto px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold cursor-pointer"
            >
              Finish Battle
            </button>
          </div>
        </div>
      )}

      {/* Battle Result Summary Banner (keeps WIN / LOSE frame overlays visible!) */}
      {battleResultOverlay && battleRequestState === 'idle' && (
        <div
          data-testid="battle-result-banner"
          className="bg-[#1C0F33]/95 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-amber-400/60 flex items-center justify-between gap-2 text-xs"
        >
          <span className="font-bold text-amber-300 truncate">
            🏆 Winner: {battleResultOverlay.winnerName} ({battleResultOverlay.myFinalScore.toLocaleString()} vs{' '}
            {battleResultOverlay.oppFinalScore.toLocaleString()})
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setBattleResultOverlay(null);
                setBattleRequestState('active');
                setBattleSeconds(180);
              }}
              className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-[10px] font-bold cursor-pointer"
            >
              Rematch 03:00
            </button>
            <button
              type="button"
              aria-label="Dismiss battle result"
              onClick={() => setBattleResultOverlay(null)}
              className="p-1 rounded-full bg-white/10 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const bottomControlsContent = (
    <div className="space-y-1.5">
      {/* Host-Private In-Live Beauty Camera Tray (24 Effects, Hidden from Viewers & Guests) */}
      {showHostBeautyDrawer && (
        <div
          data-testid="live-beauty-effects-tray"
          className="rounded-2xl bg-[#140A26]/95 backdrop-blur-md border border-[#FF0080]/50 p-2.5 space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-pink-200">
              <Lock className="w-3.5 h-3.5" /> Host-Private Beauty Camera ({BEAUTY_EFFECTS_25.length} Effects)
            </span>
            <button
              type="button"
              aria-label="Close Host Beauty Drawer"
              onClick={() => setShowHostBeautyDrawer(false)}
              className="cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap pb-1 touch-pan-x no-scrollbar">
            {BEAUTY_EFFECTS_25.map((bfx, i) => (
              <button
                key={bfx.id}
                type="button"
                onClick={() => {
                  setBeautifyOn(true);
                  setActiveBeautyIdx(i);
                }}
                className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-semibold border cursor-pointer ${
                  beautifyOn && activeBeautyIdx === i
                    ? 'bg-[#FF0080] border-white text-white'
                    : 'bg-white/10 border-white/10 text-purple-100'
                }`}
              >
                {bfx.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Host-Private In-Live Filters / FX Bar (Hidden from Viewers & Guests) */}
      {showHostFxDrawer && (
        <div className="rounded-2xl bg-[#140A26]/95 backdrop-blur-md border border-[#FF0080]/50 p-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-pink-200">
              <Lock className="w-3.5 h-3.5" /> Host-Private Live Filters &amp; FX
            </span>
            <button
              type="button"
              aria-label="Close Host FX Drawer"
              onClick={() => setShowHostFxDrawer(false)}
              className="cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto flex-nowrap pb-1 touch-pan-x">
            {POST_FILTERS_80.slice(0, 32).map((fx, i) => (
              <button
                key={fx.id}
                type="button"
                onClick={() => setActiveEffectIdx(i)}
                className={`shrink-0 px-3 py-1 rounded-xl text-[11px] font-semibold border cursor-pointer ${
                  activeEffectIdx === i
                    ? 'bg-[#FF0080] border-white text-white'
                    : 'bg-white/10 border-white/10 text-purple-100'
                }`}
              >
                {fx.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* More Controls Drawer (Mic, Cam, Flip, Flash, Filters, Mods, Rankings, Share, RTMP) */}
      {showMoreDrawer && (
        <div
          data-testid="live-more-drawer"
          className="rounded-2xl bg-[#140A26]/95 backdrop-blur-md border border-white/20 p-2.5 space-y-2"
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-purple-200">Host Tools &amp; Stream Controls</span>
            <button
              type="button"
              aria-label="Close More Controls"
              onClick={() => setShowMoreDrawer(false)}
              className="cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap pb-1 touch-pan-x">
            <button
              type="button"
              onClick={() => setMicMuted((m) => !m)}
              className={`shrink-0 px-2.5 h-8 rounded-full border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                micMuted ? 'bg-rose-500/35 border-rose-400' : 'bg-white/10 border-white/15'
              }`}
            >
              {micMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{micMuted ? 'Unmute' : 'Mic'}</span>
            </button>
            <button
              type="button"
              onClick={() => setCameraOn((c) => !c)}
              className={`shrink-0 px-2.5 h-8 rounded-full border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                !cameraOn ? 'bg-rose-500/35 border-rose-400' : 'bg-white/10 border-white/15'
              }`}
            >
              {cameraOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
              <span>Camera</span>
            </button>
            <button
              type="button"
              onClick={() => setFacingFront((f) => !f)}
              className="shrink-0 px-2.5 h-8 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flip</span>
            </button>
            <button
              type="button"
              onClick={() => setFlashOn((f) => !f)}
              className={`shrink-0 px-2.5 h-8 rounded-full border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                flashOn ? 'bg-amber-500/35 border-amber-400' : 'bg-white/10 border-white/15'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Flash</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowHostBeautyDrawer((s) => !s);
                setShowHostFxDrawer(false);
                setShowMoreDrawer(false);
              }}
              className="shrink-0 px-2.5 h-8 rounded-full bg-[#FF0080]/30 border border-[#FF0080] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Beautify ({BEAUTY_EFFECTS_25.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowHostFxDrawer((s) => !s);
                setShowHostBeautyDrawer(false);
                setShowMoreDrawer(false);
              }}
              className="shrink-0 px-2.5 h-8 rounded-full bg-[#9D00FF]/30 border border-[#9D00FF] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModPanel(true);
                setShowMoreDrawer(false);
              }}
              className="shrink-0 px-2.5 h-8 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mods</span>
            </button>
            <button
              type="button"
              onClick={handleDoubleTapHeart}
              className="shrink-0 px-2.5 h-8 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-[#FF0080] fill-[#FF0080]" />
              <span>Like</span>
            </button>
            <button
              type="button"
              onClick={handleShareLive}
              className="shrink-0 px-2.5 h-8 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-300" />
              <span>Share</span>
            </button>
            {(selectedMode === 'studio' || selectedMode === 'gaming') && (
              <button
                type="button"
                onClick={() => {
                  setShowStudioRtmpModal(true);
                  setShowMoreDrawer(false);
                }}
                className="shrink-0 px-2.5 h-8 rounded-full bg-sky-500/20 border border-sky-400/50 text-[11px] font-bold text-sky-200 flex items-center gap-1 cursor-pointer"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>RTMP</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pinned Comment & Compact Live Chat Stream */}
      <div className="max-w-xs px-2.5 py-1 rounded-xl bg-amber-500/15 backdrop-blur-md border border-amber-400/35 text-[10px] flex items-center gap-1.5">
        <Pin className="w-3 h-3 text-amber-300 shrink-0" />
        <span className="truncate">{pinnedComment}</span>
      </div>

      <div className="max-w-xs max-h-12 sm:max-h-16 overflow-y-auto space-y-1">
        {chatMessages
          .filter((m) => !mutedChatUsers.includes(m.user))
          .map((m) => (
            <div
              key={m.id}
              className="px-2.5 py-0.5 rounded-xl bg-black/55 backdrop-blur-sm text-[11px] flex items-center justify-between gap-2"
            >
              <p className="truncate">
                {m.isMod && <span className="text-[9px] font-bold text-emerald-300 mr-1">[MOD]</span>}
                <span className="font-bold text-pink-300">{m.user}: </span>
                <span className="text-white/95">{m.text}</span>
              </p>
              <button
                type="button"
                onClick={() => setPinnedComment(`${m.user}: ${m.text}`)}
                className="text-[10px] text-purple-300 hover:text-white shrink-0 cursor-pointer"
              >
                Pin
              </button>
            </div>
          ))}
      </div>

      {/* Bottom Live Control Bar: Chat Input ("Type a message...") + Gift, Recharge, Battle (2 or 4 ONLY), Guests, More */}
      <div
        data-testid="live-bottom-toolbar"
        className="flex items-center gap-1.5 flex-nowrap"
      >
        <form onSubmit={handleSendChat} className="flex-1 min-w-0 flex items-center gap-1">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full min-w-0 h-9 px-3 rounded-full bg-black/65 border border-white/20 text-xs text-white placeholder:text-purple-200/60 focus:outline-none focus:border-[#FF0080]"
          />
          {chatInput.trim() && (
            <button
              type="submit"
              aria-label="Send live chat message"
              className="w-8 h-8 rounded-full bg-[#FF0080] flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title="Gift"
            aria-label="Gift"
            onClick={() =>
              onOpenGiftStore(`@${currentUser.handle} (${currentUser.name})`, currentUser.handle)
            }
            className="w-9 h-9 rounded-full bg-amber-400 text-black flex items-center justify-center cursor-pointer shadow"
          >
            <Gift className="w-4 h-4" />
          </button>

          <button
            type="button"
            title="Recharge"
            aria-label="Recharge"
            onClick={() => {
              if (onOpenRecharge) {
                onOpenRecharge();
              } else {
                onNotify('Open Wallet to recharge NepTok Coins');
              }
            }}
            className="w-9 h-9 rounded-full bg-[#9D00FF]/35 border border-[#9D00FF] text-amber-300 flex items-center justify-center cursor-pointer"
          >
            <Coins className="w-4 h-4" />
          </button>

          {/* Allow Battle ONLY for 2 or 4 participants (disabled/hidden for 8-user multi-guest room) */}
          {(battleAllowed || battleRequestState === 'active') && (
            <button
              type="button"
              title="Start Battle"
              aria-label="Start Battle"
              onClick={() => {
                if (!battleAllowed && battleRequestState !== 'active') return;
                if (battleRequestState === 'idle' && acceptedGuests.length === 1) {
                  handleChallengeGuest(acceptedGuests[0]);
                } else {
                  setShowInviteBattleModal(true);
                }
              }}
              className={`px-2.5 h-9 rounded-full border flex items-center gap-1 text-[11px] font-bold shrink-0 cursor-pointer ${
                battleRequestState === 'active'
                  ? 'bg-[#FF0080] border-white text-white'
                  : 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] border-white/25 text-white shadow'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>{battleRequestState === 'active' ? 'Battle On' : 'Start Battle'}</span>
            </button>
          )}

          <button
            type="button"
            title="Guests / Add New Guest"
            aria-label="Guests / Add New Guest"
            onClick={() => setShowGuestSheet(true)}
            className="relative w-9 h-9 rounded-full bg-black/65 border border-[#9D00FF]/70 text-purple-100 flex items-center justify-center cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#FF0080]" />
            <span className="absolute -top-1 -right-1 px-1 rounded-full bg-[#FF0080] text-[9px] font-bold leading-tight">
              {totalParticipants}
            </span>
          </button>

          <button
            type="button"
            title="More"
            aria-label="More"
            onClick={() => setShowMoreDrawer((m) => !m)}
            className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer ${
              showMoreDrawer
                ? 'bg-white text-black border-white'
                : 'bg-black/65 border-white/20 text-white'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="relative w-full h-full min-h-0 bg-black text-white flex flex-col justify-between overflow-hidden"
      onDoubleClick={handleDoubleTapHeart}
    >
      {/* CASE A: AUDIO ROOM MODE */}
      {isAudioRoom && (
        <>
          <div className="relative z-10 p-3 bg-gradient-to-b from-black/80 to-transparent">
            {topHudContent}
          </div>
          <div className="flex-1 min-h-0 bg-[#090514] overflow-y-auto px-3 py-2">
            <div className="mb-3 p-3 rounded-2xl bg-[#140A26] border border-[#9D00FF]/40 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white">{liveTitle}</p>
                <p className="text-[11px] text-purple-200/75">
                  Voice Chat Room · Host + up to 30 live mic seats
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenGiftStore(`@${currentUser.handle} (Audio Room)`)}
                className="px-3 py-1.5 rounded-full bg-[#FF0080] text-[11px] font-bold shrink-0 cursor-pointer"
              >
                Room Gift
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {audioSeats.map((s) => (
                <button
                  key={s.seat}
                  type="button"
                  onClick={() =>
                    setAudioSeats((prev) =>
                      prev.map((item) =>
                        item.seat === s.seat
                          ? item.occupied
                            ? { ...item, muted: !item.muted }
                            : { ...item, occupied: true, name: `Guest ${item.seat}`, muted: false }
                          : item
                      )
                    )
                  }
                  className={`p-2 rounded-2xl border flex flex-col items-center gap-1 cursor-pointer ${
                    s.occupied ? 'bg-[#1A0D33] border-[#9D00FF]/50' : 'bg-[#100720] border-white/10 opacity-75'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      s.occupied
                        ? 'bg-gradient-to-br from-[#FF0080] to-[#9D00FF] text-white'
                        : 'bg-white/10 text-purple-200'
                    }`}
                  >
                    {s.occupied ? s.name.slice(0, 2).toUpperCase() : `+${s.seat}`}
                  </div>
                  <span className="text-[9px] font-semibold truncate max-w-full">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="relative z-10 p-3 bg-[#090514] border-t border-white/10">
            {bottomControlsContent}
          </div>
        </>
      )}

      {/* CASE B: SINGLE HOST FULL SCREEN (No unnecessary top tabs, full screen camera with clean HUD overlays + Tap-to-Gift) */}
      {!isAudioRoom && !isSplitOrGrid && (
        <>
          <div
            data-testid="live-video-grid"
            onClick={() =>
              openParticipantGiftCard({
                name: currentUser.name,
                handle: currentUser.handle,
                avatarImage: thumbnailUrl,
                isHost: true,
                micOn: !micMuted,
              })
            }
            className="absolute inset-0 grid grid-cols-1 bg-black cursor-pointer"
          >
            <div className="relative w-full h-full overflow-hidden bg-[#120824]">
              {cameraOn ? (
                <img
                  src={thumbnailUrl}
                  alt={`${currentUser.name} Live Stream`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  style={{
                    filter: computedHostFilter,
                    transform: facingFront ? 'scaleX(1)' : 'scaleX(-1)',
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#120824]">
                  <VideoOff className="w-10 h-10 text-purple-300" />
                  <p className="text-xs text-purple-200">Host Camera Paused</p>
                </div>
              )}
              <div className="absolute left-3 bottom-36 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-white/15 text-[10px] font-bold">
                <span>{currentUser.name}</span>
                {micMuted ? (
                  <MicOff className="w-3 h-3 text-rose-500" />
                ) : (
                  <Mic className="w-3 h-3 text-emerald-400" />
                )}
              </div>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/80 pointer-events-none" />

          <div className="relative z-10 p-2.5 sm:p-3">{topHudContent}</div>

          <div className="relative z-10 p-2.5 sm:p-3 mt-auto">{bottomControlsContent}</div>
        </>
      )}

      {/* CASE C: GAP-FREE MULTI-GUEST & 2/4-PERSON "THIS VS. THAT" BATTLE GRID ON SOLID #000000 */}
      {isSplitOrGrid && (
        <>
          <div className="shrink-0 p-1.5 sm:p-2 bg-[#090514] border-b border-white/10 z-10">
            {topHudContent}
          </div>

          <div
            data-testid="live-video-grid"
            className={`flex-1 min-h-0 relative grid ${layout.colsClass} auto-rows-fr gap-px p-0 bg-black`}
          >
            {/* HOST TILE (Spans 2 columns on 3, 5, 7 participant counts to guarantee zero empty gaps) */}
            <div
              data-testid={`live-participant-tile-${currentUser.handle}`}
              onClick={() =>
                openParticipantGiftCard({
                  name: currentUser.name,
                  handle: currentUser.handle,
                  avatarImage: thumbnailUrl,
                  isHost: true,
                  micOn: !micMuted,
                })
              }
              className={`relative w-full h-full min-h-[100px] flex flex-col overflow-hidden bg-[#120824] cursor-pointer ${
                totalParticipants === 3 || totalParticipants === 5 || totalParticipants === 7
                  ? 'col-span-2'
                  : ''
              }`}
            >
              <div className="relative flex-1 min-h-0 overflow-hidden">
                {cameraOn ? (
                  <img
                    src={thumbnailUrl}
                    alt={`${currentUser.name} Live Stream`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    style={{
                      filter: computedHostFilter,
                      transform: facingFront ? 'scaleX(1)' : 'scaleX(-1)',
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-[#120824]">
                    <VideoOff className="w-7 h-7 text-purple-300" />
                    <p className="text-[11px] text-purple-200">Camera Off</p>
                  </div>
                )}

                {/* Top of Host Frame: Consistent WIN xN Streak Badge (2/4-player Battle Mode, including WIN x0) + Battle Gift Count & Live Points */}
                <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between gap-1 pointer-events-none z-10">
                  {(battleAllowed || battleResultOverlay !== null) && (
                    <span
                      data-testid="host-win-streak-badge"
                      className={`whitespace-nowrap shrink-0 px-2 py-0.5 rounded-full text-white text-[10px] font-extrabold border border-white/40 ${
                        hostWinStreak > 0
                          ? 'bg-gradient-to-r from-amber-400 via-[#FF0080] to-[#9D00FF] shadow-[0_0_12px_rgba(255,0,128,0.85)]'
                          : 'bg-black/75 text-purple-200'
                      }`}
                    >
                      WIN x{hostWinStreak}
                    </span>
                  )}
                  <span
                    data-testid={`participant-gift-badge-${currentUser.handle}`}
                    className="ml-auto whitespace-nowrap shrink-0 px-2 py-0.5 rounded-full bg-black/80 border border-[#FF0080]/60 text-[10px] font-mono font-bold text-amber-300"
                  >
                    🎁 {battleRequestState === 'active' ? myBattleGiftsCount : participantStats[currentUser.handle]?.giftsCount ?? myBattleGiftsCount} ·{' '}
                    {(battleRequestState === 'active'
                      ? myScore
                      : participantStats[currentUser.handle]?.coins ?? giftsReceivedCoins
                    ).toLocaleString()}
                  </span>
                </div>

                {/* Automatic WIN / LOSE Overlay on Host Side When Battle Finishes */}
                {battleResultOverlay && (
                  <div
                    data-testid="host-battle-outcome-overlay"
                    className="absolute inset-0 bg-black/55 flex items-center justify-center pointer-events-none z-20"
                  >
                    <span
                      className={`px-4 py-1.5 rounded-2xl border-2 font-display font-extrabold text-xl tracking-wider shadow-2xl ${
                        battleResultOverlay.hostWon
                          ? 'bg-gradient-to-r from-amber-400 to-[#FF0080] border-white text-white'
                          : 'bg-slate-900/90 border-slate-400 text-slate-200'
                      }`}
                    >
                      {battleResultOverlay.hostWon ? 'WIN' : 'LOSE'}
                    </span>
                  </div>
                )}

                {/* Bottom-Left Corner: Host Name + Mic / Red Mic Mute Button */}
                <div className="absolute left-1.5 bottom-1.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 border border-white/15 max-w-[90%]">
                  <span className="text-[10px] font-bold text-white truncate">{currentUser.name}</span>
                  <button
                    type="button"
                    aria-label="Toggle Host Mic"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMicMuted((m) => !m);
                    }}
                    className={`p-0.5 rounded-full shrink-0 cursor-pointer ${
                      micMuted ? 'bg-rose-600 text-white' : 'text-emerald-400'
                    }`}
                  >
                    {micMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Co-Gifter Rank Row (#1-#5) Beneath Host Frame in Multi-Guest (3+ users) */}
              {totalParticipants > 2 &&
                renderCoGifterStrip(currentUser.handle, currentUser.name, 'pink')}
            </div>

            {/* GUEST TILES (Up to 7 guests -> 8 total users) */}
            {acceptedGuests.slice(0, 7).map((g, gIdx) => {
              const isPrimaryOpponent =
                battleOpponent?.id === g.id || (!battleOpponent && gIdx === 0);
              const isOpponentSide =
                isPrimaryOpponent || (totalParticipants === 4 && gIdx >= 1);
              const guestStats = participantStats[g.handle] ?? { giftsCount: 0, coins: 0 };
              return (
                <div
                  key={g.id}
                  data-testid={`live-guest-tile-${g.handle}`}
                  onClick={() =>
                    openParticipantGiftCard({
                      name: g.name,
                      handle: g.handle,
                      avatarImage: g.avatarImage,
                      isHost: false,
                      micOn: g.micOn,
                    })
                  }
                  className="relative w-full h-full min-h-[100px] flex flex-col overflow-hidden bg-[#160B2B] cursor-pointer"
                >
                  <div className="relative flex-1 min-h-0 overflow-hidden">
                    {g.camOn ? (
                      <img
                        src={g.avatarImage}
                        alt={g.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-purple-200/80">
                        <VideoOff className="w-6 h-6" />
                        <span className="text-[10px] font-semibold">Camera Off</span>
                      </div>
                    )}

                    {/* Top of Guest Frame: Consistent WIN xN Streak Badge + Gift Count + Remove */}
                    <div className="absolute inset-x-1.5 top-1.5 flex items-center justify-between gap-1 z-10">
                      <div className="flex items-center gap-1 pointer-events-none min-w-0 overflow-hidden">
                        {isOpponentSide && (battleAllowed || battleResultOverlay !== null) && (
                          <span
                            data-testid={isPrimaryOpponent ? 'opponent-win-streak-badge' : undefined}
                            className={`whitespace-nowrap shrink-0 px-2 py-0.5 rounded-full text-white text-[10px] font-extrabold border border-white/40 ${
                              opponentWinStreak > 0
                                ? 'bg-gradient-to-r from-sky-500 to-[#9D00FF] shadow-[0_0_12px_rgba(56,189,248,0.85)]'
                                : 'bg-black/75 text-purple-200'
                            }`}
                          >
                            WIN x{opponentWinStreak}
                          </span>
                        )}
                        <span
                          data-testid={`participant-gift-badge-${g.handle}`}
                          className="whitespace-nowrap shrink-0 px-1.5 py-0.5 rounded-full bg-black/80 border border-sky-400/60 text-[10px] font-mono font-bold text-amber-300"
                        >
                          🎁 {isPrimaryOpponent && battleRequestState === 'active' ? oppBattleGiftsCount : guestStats.giftsCount}
                          {guestStats.coins > 0 || (isPrimaryOpponent && battleRequestState === 'active')
                            ? ` · ${(
                                isPrimaryOpponent && battleRequestState === 'active'
                                  ? opponentScore
                                  : guestStats.coins
                              ).toLocaleString()}`
                            : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove guest ${g.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = acceptedGuests.filter((x) => x.id !== g.id);
                          setAcceptedGuests(next);
                          if (battleOpponent?.id === g.id || !canStartLiveBattle(1 + next.length)) {
                            setBattleRequestState('idle');
                            setBattleOpponent(null);
                            setBattleResultOverlay(null);
                          }
                          onNotify(`Removed @${g.handle}`);
                        }}
                        className="p-1 rounded-full bg-rose-600/85 border border-white/20 cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Automatic WIN / LOSE Overlay on Opponent Side When Battle Finishes */}
                    {isOpponentSide && battleResultOverlay && (
                      <div
                        data-testid={isPrimaryOpponent ? 'opponent-battle-outcome-overlay' : undefined}
                        className="absolute inset-0 bg-black/55 flex items-center justify-center pointer-events-none z-20"
                      >
                        <span
                          className={`px-4 py-1.5 rounded-2xl border-2 font-display font-extrabold text-xl tracking-wider shadow-2xl ${
                            !battleResultOverlay.hostWon
                              ? 'bg-gradient-to-r from-amber-400 to-sky-500 border-white text-white'
                              : 'bg-slate-900/90 border-slate-400 text-slate-200'
                          }`}
                        >
                          {!battleResultOverlay.hostWon ? 'WIN' : 'LOSE'}
                        </span>
                      </div>
                    )}

                    {/* Bottom-Left Corner: Guest Name + Red Mic Mute Icon Beside Name */}
                    <div className="absolute left-1.5 bottom-1.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 border border-white/15 max-w-[90%]">
                      <span className="text-[10px] font-bold text-white truncate">{g.name}</span>
                      <button
                        type="button"
                        aria-label={`Toggle mic for ${g.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAcceptedGuests((prev) =>
                            prev.map((x) => (x.id === g.id ? { ...x, micOn: !x.micOn } : x))
                          );
                        }}
                        className={`p-0.5 rounded-full shrink-0 cursor-pointer ${
                          !g.micOn ? 'bg-rose-600 text-white' : 'text-emerald-400'
                        }`}
                      >
                        {g.micOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Co-Gifter Rank Row (#1-#5) Beneath Each Guest Frame in Multi-Guest (3+ users) */}
                  {totalParticipants > 2 && renderCoGifterStrip(g.handle, g.name, 'sky')}
                </div>
              );
            })}

            {/* Center "VS" Badge between sides in 2-person / 4-person Battle */}
            {(totalParticipants === 2 || battleRequestState === 'active') && (
              <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-[#FF0080] to-[#3B82F6] border-2 border-white shadow-2xl flex items-center justify-center font-display font-extrabold text-xs z-10">
                VS
              </div>
            )}
          </div>

          {/* Dedicated Co-Gifter Rank (#1-#5) Row Beneath 2-Person Split / Battle Sides */}
          {totalParticipants === 2 && (
            <div
              data-testid="battle-top-gifters-row"
              className="shrink-0 grid grid-cols-2 gap-px bg-black border-t border-white/10"
            >
              {renderCoGifterStrip(currentUser.handle, currentUser.name, 'pink')}
              {acceptedGuests[0] &&
                renderCoGifterStrip(acceptedGuests[0].handle, acceptedGuests[0].name, 'sky')}
            </div>
          )}

          <div className="shrink-0 p-2 bg-[#090514] border-t border-white/10 z-10">
            {bottomControlsContent}
          </div>
        </>
      )}

      {/* Floating Hearts Layer */}
      <div className="pointer-events-none absolute right-5 bottom-40 z-20">
        {floatingHearts.map((id) => (
          <div key={id} className="animate-float-heart absolute bottom-0 right-0">
            <Heart className="w-7 h-7 text-[#FF0080] fill-[#FF0080]" />
          </div>
        ))}
      </div>

      {/* DEDICATED "INVITE TO BATTLE" MODAL (Select specific active guest for 03:00 Battle) */}
      {showInviteBattleModal && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="w-full max-w-md rounded-3xl bg-[#140A26] border border-[#FF0080]/50 p-5 space-y-4 max-h-[82vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <Swords className="w-4 h-4 text-[#FF0080]" />
                  <span>Invite Guest to 03:00 Battle</span>
                </h3>
                <p className="text-[11px] text-purple-200/75">
                  Select an active guest from this Live session to send a formal Battle/Game request.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close Invite to Battle"
                onClick={() => setShowInviteBattleModal(false)}
                className="cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {battleRequestState === 'active' && (
              <div className="p-3 rounded-2xl bg-[#FF0080]/15 border border-[#FF0080] flex items-center justify-between text-xs">
                <span>
                  Active Battle vs @{battleOpponent?.handle || acceptedGuests[0]?.handle || 'guest'} ({battleMins}:{battleSecs})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBattleRequestState('idle');
                    setShowInviteBattleModal(false);
                    onNotify('Ended active NEP Battle early');
                  }}
                  className="px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-[11px] cursor-pointer"
                >
                  End Battle
                </button>
              </div>
            )}

            {!battleAllowed ? (
              <div className="p-4 rounded-2xl bg-[#090514] border border-amber-400/35 text-center space-y-2.5">
                <p className="text-xs font-bold text-amber-300">
                  Battle Mode Restricted to 2 or 4 Participants
                </p>
                <p className="text-[11px] text-purple-200/80">
                  Currently {totalParticipants} users on stage. Battle is disabled in 8-user and odd-count rooms; adjust to 2 or 4 creators to start a Battle.
                </p>
              </div>
            ) : acceptedGuests.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#090514] border border-white/10 text-center space-y-3">
                <p className="text-xs text-purple-200">
                  No guests are on stage yet. Accept or invite a guest first to launch a Battle.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteBattleModal(false);
                    setShowGuestSheet(true);
                  }}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs font-bold cursor-pointer"
                >
                  Open Multi-Guest Stage
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {acceptedGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className="p-2.5 rounded-2xl bg-[#090514] border border-white/10 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={guest.avatarImage}
                        alt={guest.name}
                        className="w-9 h-9 rounded-full object-cover border border-white/20"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{guest.name}</p>
                        <p className="text-[11px] text-purple-300/75 truncate">@{guest.handle}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChallengeGuest(guest)}
                      className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white font-bold text-[11px] shrink-0 cursor-pointer"
                    >
                      Send Battle Request
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Host-Only Multi-Guest Stage (Only Host/Admin can invite & add guests — no random viewer spam) */}
      {showGuestSheet && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="w-full max-w-md rounded-3xl bg-[#140A26] border border-[#9D00FF]/40 p-5 space-y-4 max-h-[82vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base">
                  Host Multi-Guest Control ({totalParticipants}/8 Users)
                </h3>
                <p className="text-[11px] text-purple-200/75">
                  Host-only access: Select creators to invite on stage (zero unsolicited join spam).
                </p>
              </div>
              <button
                type="button"
                aria-label="Close Guest Sheet"
                onClick={() => setShowGuestSheet(false)}
                className="cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-purple-200 uppercase">
                Invite Creators to Stage
              </p>
              {AVAILABLE_GUEST_CANDIDATES.map((candidate) => {
                const onStage = acceptedGuests.some((g) => g.id === candidate.id);
                return (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[#090514] border border-white/10 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={candidate.avatarImage}
                        alt={candidate.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/20"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{candidate.name}</p>
                        <p className="text-[11px] text-purple-300/75 truncate">@{candidate.handle}</p>
                      </div>
                    </div>
                    {onStage ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                        On Stage
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleHostInviteGuest(candidate)}
                        className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white font-bold text-[11px] cursor-pointer"
                      >
                        Invite Guest
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-purple-200 uppercase">
                Active On-Stage ({totalParticipants}/8)
              </p>
              <div className="p-2.5 rounded-2xl bg-[#090514] border border-[#FF0080]/30 flex items-center justify-between text-xs">
                <span className="font-bold text-white">{currentUser.name} (Host)</span>
                <span className="text-[10px] text-emerald-400 font-bold">Live</span>
              </div>
              {acceptedGuests.map((g) => (
                <div
                  key={g.id}
                  className="p-2.5 rounded-2xl bg-[#090514] border border-white/10 flex items-center justify-between text-xs"
                >
                  <span>
                    {g.name} <span className="text-purple-300/75">(@{g.handle})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAcceptedGuests((prev) => prev.filter((x) => x.id !== g.id));
                      onNotify(`@${g.handle} left stage`);
                    }}
                    className="text-rose-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" /> Leave
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OBS / RTMP Modal for Studio & Gaming Live */}
      {showStudioRtmpModal && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#140A26] border border-sky-400/40 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base">Studio &amp; Gaming RTMP Ingest</h3>
              <button type="button" onClick={() => setShowStudioRtmpModal(false)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 rounded-2xl bg-[#090514] border border-white/10 flex items-center justify-between font-mono">
              <span>rtmp://live.neptok.com/live</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText('rtmp://live.neptok.com/live').catch(() => {});
                  onNotify('Copied RTMP URL');
                }}
                className="text-[#FF0080] flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
            <div className="p-3 rounded-2xl bg-[#090514] border border-white/10 flex items-center justify-between font-mono">
              <span>nt_live_ktm_9841_secure8k</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText('nt_live_ktm_9841_secure8k').catch(() => {});
                  onNotify('Copied Stream Key');
                }}
                className="text-[#FF0080] flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderator Modal */}
      {showModPanel && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#140A26] border border-white/15 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base">Live Moderators &amp; Safety</h3>
              <button type="button" onClick={() => setShowModPanel(false)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {moderators.map((mod) => (
                <div
                  key={mod}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#090514] text-xs"
                >
                  <span>{mod}</span>
                  <button
                    type="button"
                    onClick={() => setModerators((m) => m.filter((x) => x !== mod))}
                    className="text-rose-400 font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  if (!moderators.includes('@pokhara_maya')) {
                    setModerators((m) => [...m, '@pokhara_maya']);
                  }
                }}
                className="w-full py-2 rounded-xl bg-white/10 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add @pokhara_maya as Moderator
              </button>
              <button
                type="button"
                onClick={() => {
                  setMutedChatUsers((prev) =>
                    prev.includes('@everest_binod') ? prev : [...prev, '@everest_binod']
                  );
                  onNotify('Muted chat user');
                }}
                className="w-full py-2 rounded-xl bg-rose-500/20 text-rose-200 text-xs font-bold cursor-pointer"
              >
                Mute Spammer in Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rankings & Battle History Modal */}
      {showRankingsModal && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#140A26] border border-amber-400/35 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base">Rankings &amp; NEP Battle History</h3>
              <button type="button" onClick={() => setShowRankingsModal(false)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { rank: 1, handle: '@sita_kathmandu', coins: 48200 },
                { rank: 2, handle: '@aarav_nepal', coins: 34900 },
                { rank: 3, handle: '@pokhara_maya', coins: 27400 },
              ].map((r) => (
                <div
                  key={r.rank}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#090514] border border-white/10 text-xs"
                >
                  <span className="font-bold flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> #{r.rank} {r.handle}
                  </span>
                  <span className="font-mono font-bold text-amber-300 tabular-nums">
                    {r.coins.toLocaleString()} N ({formatUsd(coinsToUsd(r.coins))})
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-white/10 space-y-2">
              <p className="text-xs font-bold text-purple-200">Recent NEP Battle History</p>
              {battleHistory.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 text-xs"
                >
                  <span>vs {b.opponent}</span>
                  <span className="font-mono text-purple-200 tabular-nums">{b.score}</span>
                  <span className={`font-bold ${b.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {b.result}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAP-TO-GIFT PARTICIPANT POPUP CARD (Works across 1, 2, 4, and 8-user rooms) */}
      {selectedParticipantPopup && (
        <div
          data-testid="participant-gift-popup"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedParticipantPopup(null)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-[#140A26] border border-[#FF0080]/60 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedParticipantPopup.avatarImage}
                  alt={selectedParticipantPopup.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[#FF0080] shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-bold text-sm text-white truncate">
                      {selectedParticipantPopup.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#9D00FF]/35 text-[9px] font-bold text-purple-100 shrink-0">
                      {selectedParticipantPopup.isHost ? 'Host' : 'Guest'}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-300 truncate">
                    @{selectedParticipantPopup.handle}
                  </p>
                  <p className="text-[10px] mt-1 flex items-center gap-1 text-purple-200/80">
                    {selectedParticipantPopup.micOn ? (
                      <>
                        <Mic className="w-3 h-3 text-emerald-400" /> Mic Live
                      </>
                    ) : (
                      <>
                        <MicOff className="w-3 h-3 text-rose-400" /> Mic Muted
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close Participant Card"
                onClick={() => setSelectedParticipantPopup(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-[#090514] border border-white/10">
                <p className="text-[10px] text-purple-300/75 uppercase font-bold">Gifts Received</p>
                <p className="text-sm font-mono font-extrabold text-amber-300 tabular-nums mt-0.5">
                  🎁 {(participantStats[selectedParticipantPopup.handle]?.giftsCount ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#090514] border border-white/10">
                <p className="text-[10px] text-purple-300/75 uppercase font-bold">Total Coins</p>
                <p className="text-sm font-mono font-extrabold text-pink-300 tabular-nums mt-0.5">
                  {(participantStats[selectedParticipantPopup.handle]?.coins ?? 0).toLocaleString()} N
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = selectedParticipantPopup;
                  setSelectedParticipantPopup(null);
                  onOpenGiftStore(`@${target.handle} (${target.name})`, target.handle);
                }}
                className="flex-1 h-10 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Gift className="w-4 h-4 text-amber-200" />
                <span>Send Gift</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedParticipantPopup;
                  setSelectedParticipantPopup(null);
                  setActiveGifterDrawer({
                    title: `${target.name}'s Top Gifters (#1–#5)`,
                    participantHandle: target.handle,
                  });
                }}
                className="px-3.5 h-10 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-amber-300 cursor-pointer"
              >
                Top #5
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NON-OVERLAPPING TOP GIFTERS & CO-GIFTERS BOTTOM SHEET DRAWER (#1-#5 Ranks) */}
      {activeGifterDrawer && (
        <div
          data-testid="top-gifters-drawer"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
          onClick={() => setActiveGifterDrawer(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#140A26] border border-amber-400/50 p-4 sm:p-5 space-y-3 max-h-[78vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <h3 className="font-display font-bold text-sm sm:text-base text-white flex items-center gap-1.5 truncate">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{activeGifterDrawer.title}</span>
                </h3>
                <p className="text-[11px] text-purple-200/75">
                  Real-time Top Gifters &amp; Co-Gifters ranking (#1 – #5)
                </p>
              </div>
              <button
                type="button"
                aria-label="Close Top Gifters Drawer"
                onClick={() => setActiveGifterDrawer(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {(participantGifters[activeGifterDrawer.participantHandle] ?? SEED_GIFTER_POOL)
                .slice(0, 5)
                .map((gifter, idx) => {
                  const rank = idx + 1;
                  const rankBadgeCls =
                    rank === 1
                      ? 'bg-amber-400 text-black border-white'
                      : rank === 2
                      ? 'bg-slate-200 text-black border-white'
                      : rank === 3
                      ? 'bg-amber-700 text-white border-amber-300'
                      : 'bg-[#1F1238] text-purple-200 border-white/20';
                  return (
                    <div
                      key={gifter.id}
                      data-testid={`gifter-rank-row-${rank}`}
                      className="p-2.5 rounded-2xl bg-[#090514] border border-white/10 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-full border font-mono font-extrabold text-[11px] flex items-center justify-center shrink-0 ${rankBadgeCls}`}
                        >
                          #{rank}
                        </span>
                        <img
                          src={gifter.img}
                          alt={gifter.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate flex items-center gap-1">
                            <span>{gifter.name}</span>
                            {rank <= 3 && (
                              <Crown
                                className={`w-3 h-3 shrink-0 ${
                                  rank === 1
                                    ? 'text-amber-400'
                                    : rank === 2
                                    ? 'text-slate-200'
                                    : 'text-amber-600'
                                }`}
                              />
                            )}
                          </p>
                          <p className="text-[10px] text-purple-300/75 truncate">
                            @{gifter.handle}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-300 tabular-nums shrink-0">
                        {gifter.coins.toLocaleString()} N
                      </span>
                    </div>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => {
                const handle = activeGifterDrawer.participantHandle;
                setActiveGifterDrawer(null);
                onOpenGiftStore(`@${handle}`, handle);
              }}
              className="w-full h-10 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Gift className="w-4 h-4" />
              <span>Send Gift to @{activeGifterDrawer.participantHandle}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

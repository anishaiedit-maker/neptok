import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  User,
  Radio,
  MessageCircle,
  Plus,
  Bell,
  Wallet,
  Home,
  ShieldCheck,
  Sparkles,
  Gift,
  Users,
  Coins,
} from 'lucide-react';
import {
  INITIAL_USER,
  SEED_POSTS,
  SEED_STORIES,
  SEED_CHATS,
  SEED_NOTIFICATIONS,
  SEED_TRANSACTIONS,
  SEED_LINKED_ACCOUNTS,
  type AuthStage,
  type NavTab,
  type AppSurfaceMode,
  type FeedPost,
  type StoryItem,
  type ChatThread,
  type BellNotificationItem,
  type WalletTransaction,
  type LinkedAccountItem,
  type UserProfile,
  type OriginalSound,
  type CreateOption,
} from './types/neptok';
import {
  filterVisiblePosts,
  processRapidGiftTap,
  coinsToUsd,
  formatUsd,
  formatCoins,
  type GiftItem,
} from './utils/neptokLogic';
import { NepTokLogo } from './components/NepTokLogo';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { LoginScreen } from './components/LoginScreen';
import { HomeFeed } from './components/HomeFeed';
import { CreateModalAndEditor } from './components/CreateModalAndEditor';
import { LiveHub, type LiveGiftEvent } from './components/LiveHub';
import { ChatHub } from './components/ChatHub';
import { WalletHub } from './components/WalletHub';
import { BellNotifications } from './components/BellNotifications';
import { ExploreHub } from './components/ExploreHub';
import { ProfileHub } from './components/ProfileHub';
import { CreatorStudio } from './components/CreatorStudio';
import { GiftStoreModal } from './components/GiftStoreModal';
import { Gift3DOverlay } from './components/Gift3DOverlay';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [authStage, setAuthStage] = useState<AuthStage>(autostart ? 'app' : 'splash');
  const [surfaceMode, setSurfaceMode] = useState<AppSurfaceMode>('mobile');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [subPage, setSubPage] = useState<'none' | 'explore' | 'creator-studio'>('none');

  // Core Interactive State
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [posts, setPosts] = useState<FeedPost[]>(SEED_POSTS);
  const [stories, setStories] = useState<StoryItem[]>(SEED_STORIES);
  const [chats, setChats] = useState<ChatThread[]>(SEED_CHATS);
  const [notifications, setNotifications] = useState<BellNotificationItem[]>(SEED_NOTIFICATIONS);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(SEED_TRANSACTIONS);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccountItem[]>(SEED_LINKED_ACCOUNTS);

  const [followingIds, setFollowingIds] = useState<string[]>(['u_sita', 'u_binod']);
  const [friendIds] = useState<string[]>(['u_sita', 'u_binod', 'u_maya']);
  const [blockedUsers, setBlockedUsers] = useState<
    Array<{ id: string; handle: string; name: string }>
  >([]);

  // Modals & Overlays
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialOption, setCreateInitialOption] = useState<CreateOption | null>(null);
  const [createSound, setCreateSound] = useState<OriginalSound | null>(null);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const [duetPost, setDuetPost] = useState<FeedPost | null>(null);

  const [giftStoreOpen, setGiftStoreOpen] = useState(false);
  const [giftRecipientLabel, setGiftRecipientLabel] = useState('@sita_kathmandu');
  const [giftTargetPostId, setGiftTargetPostId] = useState<string | null>(null);
  const [giftTargetLiveHandle, setGiftTargetLiveHandle] = useState<string | null>(null);
  const [active3DGift, setActive3DGift] = useState<GiftItem | null>(null);
  const [lastLiveGiftEvent, setLastLiveGiftEvent] = useState<LiveGiftEvent | null>(null);
  const [liveGiftEvents, setLiveGiftEvents] = useState<LiveGiftEvent[]>([]);
  const [giftCombo, setGiftCombo] = useState<{ giftId: number; count: number }>({
    giftId: 0,
    count: 0,
  });
  const coinsRef = useRef(user.coins);
  const giftSeqRef = useRef(0);
  useEffect(() => {
    coinsRef.current = user.coins;
  }, [user.coins]);
  const [giftHistory, setGiftHistory] = useState<
    Array<{
      id: string;
      giftName: string;
      emoji: string;
      coins: number;
      direction: 'sent' | 'received';
      counterparty: string;
      time: string;
    }>
  >([
    {
      id: 'gh-1',
      giftName: 'Sagarmatha',
      emoji: '🗻',
      coins: 1000,
      direction: 'received',
      counterparty: '@sita_kathmandu',
      time: 'Today, 6:20 PM',
    },
    {
      id: 'gh-2',
      giftName: 'Golden Pagoda',
      emoji: '🏯',
      coins: 300,
      direction: 'sent',
      counterparty: '@sita_kathmandu',
      time: 'Nov 15',
    },
  ]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const blockedIds = useMemo(() => blockedUsers.map((b) => b.id), [blockedUsers]);

  const visibleFeedPosts = useMemo(
    () =>
      filterVisiblePosts(
        posts.filter((p) => !p.isDraft),
        user.id,
        blockedIds,
        followingIds,
        friendIds
      ),
    [posts, user.id, blockedIds, followingIds, friendIds]
  );

  // Handlers
  const handleToggleFollow = (authorId: string) => {
    setFollowingIds((prev) => {
      const exists = prev.includes(authorId);
      notify(exists ? 'Unfollowed creator' : 'Following creator!');
      return exists ? prev.filter((id) => id !== authorId) : [...prev, authorId];
    });
  };

  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likes: p.likedByMe ? Math.max(0, p.likes - 1) : p.likes + 1,
            }
          : p
      )
    );
  };

  const handleAddComment = (postId: string, text: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: `c-${Date.now()}`,
                  authorName: user.name,
                  authorHandle: user.handle,
                  text,
                  createdAt: 'Just now',
                  likes: 0,
                },
              ],
            }
          : p
      )
    );
    notify('Comment posted');
  };

  const handleToggleRepost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              repostedByMe: !p.repostedByMe,
              reposts: p.repostedByMe ? Math.max(0, p.reposts - 1) : p.reposts + 1,
            }
          : p
      )
    );
  };

  const handleToggleSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, savedByMe: !p.savedByMe } : p))
    );
  };

  const handleUpdatePost = (postId: string, patch: Partial<FeedPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...patch } : p)));
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    notify('Post deleted');
  };

  const handleBlockUser = (userId: string, handle: string) => {
    if (userId === user.id) return;
    setBlockedUsers((prev) => {
      if (prev.some((b) => b.id === userId)) return prev;
      return [...prev, { id: userId, handle, name: handle }];
    });
    notify(`Blocked @${handle}. Their content is now hidden.`);
  };

  const handleUnblockUser = (userId: string) => {
    setBlockedUsers((prev) => prev.filter((b) => b.id !== userId));
    notify('User unblocked');
  };

  const handleSendGift = (gift: GiftItem) => {
    const check = processRapidGiftTap(coinsRef.current, gift.coins);
    if (!check.ok) {
      notify('Insufficient Coins! Recharge your wallet to continue sending gifts.');
      if (activeTab !== 'live') {
        setGiftStoreOpen(false);
        setActiveTab('wallet');
        setSubPage('none');
      }
      return;
    }

    // Synchronous atomic deduction so 20-100+ rapid clicks never race or lag
    coinsRef.current = check.remainingCoins;
    setUser((prev) => ({ ...prev, coins: Math.max(0, prev.coins - gift.coins) }));

    // Fire-and-forget server ledger sync without blocking rapid taps
    fetch('/api/gifts/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ giftId: gift.id, recipient: giftRecipientLabel }),
    }).catch(() => {});

    if (giftTargetPostId) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === giftTargetPostId
            ? { ...p, giftsReceivedCoins: p.giftsReceivedCoins + gift.coins }
            : p
        )
      );
    }

    const isLiveSession = activeTab === 'live';
    if (isLiveSession) {
      const targetHandle = (
        giftTargetLiveHandle ||
        giftRecipientLabel.replace(/^@/, '').split(/\s+/)[0] ||
        user.handle
      ).replace(/^@/, '');
      giftSeqRef.current += 1;
      const evt: LiveGiftEvent = {
        id: giftSeqRef.current,
        coins: gift.coins,
        recipientHandle: targetHandle,
        giftName: gift.name,
        senderName: user.name,
        senderHandle: user.handle,
      };
      setLastLiveGiftEvent(evt);
      setLiveGiftEvents((prev) => [...prev.slice(-199), evt]);
      setGiftCombo((prev) =>
        prev.giftId === gift.id
          ? { giftId: gift.id, count: prev.count + 1 }
          : { giftId: gift.id, count: 1 }
      );
    } else {
      setGiftStoreOpen(false);
    }

    const eventKey = `${Date.now()}-${giftSeqRef.current}-${Math.random().toString(36).slice(2, 6)}`;
    setGiftHistory((prev) => [
      {
        id: `gh-${eventKey}`,
        giftName: gift.name,
        emoji: gift.emoji,
        coins: gift.coins,
        direction: 'sent',
        counterparty: giftRecipientLabel,
        time: 'Just now',
      },
      ...prev.slice(0, 99),
    ]);

    setTransactions((prev) => [
      {
        id: `tx-${eventKey}`,
        title: `Sent ${gift.name} to ${giftRecipientLabel}`,
        type: 'Gift Sent',
        coinsDelta: -gift.coins,
        usdAmount: coinsToUsd(gift.coins),
        time: 'Just now',
        method: 'Coin Balance',
      },
      ...prev.slice(0, 99),
    ]);

    setActive3DGift({ ...gift });
  };

  const handleRechargeCoins = async (packageId: string, method: string) => {
    const res = await fetch('/api/wallet/recharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId, method }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || 'Recharge failed');
      return;
    }
    setUser((prev) => ({ ...prev, coins: prev.coins + data.creditedCoins }));
    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        title: `Recharged ${data.creditedCoins.toLocaleString()} Coins`,
        type: 'Recharge',
        coinsDelta: data.creditedCoins,
        usdAmount: data.chargedUsd,
        time: 'Just now',
        method: data.method,
      },
      ...prev,
    ]);
    notify(`Credited +${data.creditedCoins.toLocaleString()} N (${formatUsd(data.chargedUsd)})`);
  };

  const handleWithdrawUsd = async (amountUsd: number, method: string) => {
    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountUsd, method, creator: `@${user.handle}` }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || 'Withdrawal failed');
      return;
    }
    setUser((prev) => ({
      ...prev,
      creatorBalanceUsd: Number((prev.creatorBalanceUsd - amountUsd).toFixed(2)),
    }));
    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        title: `Creator USD Withdrawal (${method})`,
        type: 'Withdraw',
        coinsDelta: 0,
        usdAmount: amountUsd,
        time: 'Just now',
        method,
      },
      ...prev,
    ]);
    notify(`Submitted ${formatUsd(amountUsd)} USD payout request`);
  };

  const openCreateFlow = (
    opt: CreateOption | null = null,
    sound: OriginalSound | null = null,
    editPost: FeedPost | null = null,
    duet: FeedPost | null = null
  ) => {
    setCreateInitialOption(opt);
    setCreateSound(sound);
    setEditingPost(editPost);
    setDuetPost(duet);
    setCreateOpen(true);
  };

  // Exact Bottom Navigation Bar Order:
  // Profile | Live | Chat | + (Create - Central Glowing Pink Circle) | Bell | Wallet | Home
  const bottomNavItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isCreate?: boolean;
  }> = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'live', label: 'Live', icon: Radio },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'create', label: 'Create', icon: Plus, isCreate: true },
    { id: 'bell', label: 'Bell', icon: Bell },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'home', label: 'Home', icon: Home },
  ];

  const renderMobileScreen = () => {
    if (authStage === 'splash') {
      return <SplashScreen onGetStarted={() => setAuthStage('onboarding')} />;
    }
    if (authStage === 'onboarding') {
      return <OnboardingScreen onNext={() => setAuthStage('login')} />;
    }
    if (authStage === 'login') {
      return (
        <LoginScreen
          onSuccess={() => {
            setAuthStage('app');
            setActiveTab('home');
          }}
          onSkip={() => {
            setAuthStage('app');
            setActiveTab('home');
          }}
        />
      );
    }

    if (subPage === 'creator-studio') {
      return (
        <CreatorStudio
          user={user}
          posts={posts}
          onBack={() => setSubPage('none')}
          onUpdatePost={handleUpdatePost}
          onNotify={notify}
        />
      );
    }

    const handleSendToFriend = (chatId: string, post: FeedPost) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                lastMessage: `Shared post by @${post.authorHandle}`,
                lastTime: 'Just now',
                messages: [
                  ...c.messages,
                  {
                    id: `m-${Date.now()}`,
                    sender: 'me',
                    text: post.caption,
                    sharedPostTitle: `@${post.authorHandle} · ${post.caption.slice(0, 40)}`,
                    time: 'Just now',
                  },
                ],
              }
            : c
        )
      );
      notify('Sent post to NepTok friend');
    };

    const handleAddToStory48h = (post: FeedPost) => {
      setStories((prev) => [
        {
          id: `st-${Date.now()}`,
          authorId: user.id,
          authorName: user.name.split(' ')[0],
          authorHandle: user.handle,
          mediaUrl: post.mediaUrl,
          caption: post.caption,
          templateName: 'Shared 48h Story',
          createdAtMs: Date.now(),
          online: true,
        },
        ...prev,
      ]);
      notify('Added to your 48-Hour Story');
    };

    const handleOpenGiftForPost = (post: FeedPost) => {
      setGiftTargetPostId(post.id);
      setGiftRecipientLabel(`@${post.authorHandle}`);
      setGiftStoreOpen(true);
    };

    if (subPage === 'explore') {
      return (
        <ExploreHub
          posts={visibleFeedPosts}
          currentUserId={user.id}
          followingIds={followingIds}
          chats={chats}
          onToggleFollow={handleToggleFollow}
          onToggleLike={handleToggleLike}
          onAddComment={handleAddComment}
          onToggleRepost={handleToggleRepost}
          onToggleSave={handleToggleSave}
          onOpenGiftForPost={handleOpenGiftForPost}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
          onSendToFriend={handleSendToFriend}
          onAddToStory48h={handleAddToStory48h}
          onUseSound={(snd) => openCreateFlow('video', snd)}
          onOpenLive={() => {
            setSubPage('none');
            setActiveTab('live');
          }}
          onOpenFeedPost={() => {
            setSubPage('none');
            setActiveTab('home');
          }}
          onNotify={notify}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <HomeFeed
            posts={visibleFeedPosts}
            currentUserId={user.id}
            followingIds={followingIds}
            chats={chats}
            onToggleFollow={handleToggleFollow}
            onToggleLike={handleToggleLike}
            onAddComment={handleAddComment}
            onToggleRepost={handleToggleRepost}
            onToggleSave={handleToggleSave}
            onOpenGiftForPost={(post) => {
              setGiftTargetPostId(post.id);
              setGiftRecipientLabel(`@${post.authorHandle}`);
              setGiftStoreOpen(true);
            }}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            onBlockUser={handleBlockUser}
            onSendToFriend={(chatId, post) => {
              setChats((prev) =>
                prev.map((c) =>
                  c.id === chatId
                    ? {
                        ...c,
                        lastMessage: `Shared post by @${post.authorHandle}`,
                        lastTime: 'Just now',
                        messages: [
                          ...c.messages,
                          {
                            id: `m-${Date.now()}`,
                            sender: 'me',
                            text: post.caption,
                            sharedPostTitle: `@${post.authorHandle} · ${post.caption.slice(0, 40)}`,
                            time: 'Just now',
                          },
                        ],
                      }
                    : c
                )
              );
              notify('Sent post to NepTok friend');
            }}
            onAddToStory48h={(post) => {
              setStories((prev) => [
                {
                  id: `st-${Date.now()}`,
                  authorId: user.id,
                  authorName: user.name.split(' ')[0],
                  authorHandle: user.handle,
                  mediaUrl: post.mediaUrl,
                  caption: post.caption,
                  templateName: 'Shared 48h Story',
                  createdAtMs: Date.now(),
                  online: true,
                },
                ...prev,
              ]);
              notify('Added to your 48-Hour Story');
            }}
            onUseOriginalSound={(snd) => openCreateFlow('video', snd)}
            onToggleSaveSound={(soundId) => {
              setPosts((prev) =>
                prev.map((p) =>
                  p.sound.id === soundId
                    ? { ...p, sound: { ...p.sound, saved: !p.sound.saved } }
                    : p
                )
              );
              notify('Updated Saved Sounds');
            }}
            onOpenExploreTab={() => setSubPage('explore')}
            onStartDuet={(post) => openCreateFlow('video', post.sound, null, post)}
            onEditOwnPost={(post) => openCreateFlow('video', null, post)}
            onNotify={notify}
          />
        );
      case 'live':
        return (
          <LiveHub
            currentUser={{ id: user.id, name: user.name, handle: user.handle }}
            onOpenGiftStore={(recipientLabel, recipientHandle) => {
              setGiftTargetPostId(null);
              setGiftTargetLiveHandle(recipientHandle ?? null);
              setGiftRecipientLabel(recipientLabel);
              setGiftStoreOpen(true);
            }}
            lastLiveGiftEvent={lastLiveGiftEvent}
            liveGiftEvents={liveGiftEvents}
            onOpenRecharge={() => {
              setSubPage('none');
              setActiveTab('wallet');
            }}
            onNotify={notify}
          />
        );
      case 'chat':
        return (
          <ChatHub
            chats={chats}
            stories={stories}
            blockedUserIds={blockedIds}
            onSendMessage={(chatId, text) => {
              setChats((prev) =>
                prev.map((c) =>
                  c.id === chatId
                    ? {
                        ...c,
                        lastMessage: text,
                        lastTime: 'Just now',
                        messages: [
                          ...c.messages,
                          { id: `m-${Date.now()}`, sender: 'me', text, time: 'Just now' },
                        ],
                      }
                    : c
                )
              );
            }}
            onToggleBlockUser={(uid, handle) => {
              if (blockedIds.includes(uid)) {
                handleUnblockUser(uid);
              } else {
                handleBlockUser(uid, handle);
              }
            }}
            onCreateStory48h={() => openCreateFlow('story')}
            onNotify={notify}
          />
        );
      case 'bell':
        return (
          <BellNotifications
            notifications={notifications}
            onToggleFollowBack={(nid) => {
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === nid ? { ...n, followedBack: !n.followedBack } : n
                )
              );
              notify('Updated follow status');
            }}
          />
        );
      case 'wallet':
        return (
          <WalletHub
            coins={user.coins}
            creatorBalanceUsd={user.creatorBalanceUsd}
            transactions={transactions}
            linkedAccounts={linkedAccounts}
            onRechargeCoins={handleRechargeCoins}
            onWithdrawUsd={handleWithdrawUsd}
            onAddLinkedAccount={(provider, label) => {
              setLinkedAccounts((prev) => [
                ...prev,
                { id: `la-${Date.now()}`, provider, label, primary: false },
              ]);
              notify(`Linked ${provider} account`);
            }}
            onRemoveLinkedAccount={(id) => {
              setLinkedAccounts((prev) => prev.filter((a) => a.id !== id));
              notify('Removed payment method');
            }}
            onOpenGiftStore={() => {
              setGiftTargetPostId(null);
              setGiftRecipientLabel('@sita_kathmandu');
              setGiftStoreOpen(true);
            }}
            onOpenCreatorStudio={() => setSubPage('creator-studio')}
            onNotify={notify}
          />
        );
      case 'profile':
        return (
          <ProfileHub
            user={user}
            posts={posts}
            blockedUsers={blockedUsers}
            followingList={[
              { id: 'u_sita', handle: 'sita_kathmandu', name: 'Sita Tamang' },
              { id: 'u_binod', handle: 'everest_binod', name: 'Binod Sherpa' },
            ]}
            followingIds={followingIds}
            chats={chats}
            onToggleFollow={handleToggleFollow}
            onToggleLike={handleToggleLike}
            onAddComment={handleAddComment}
            onToggleRepost={handleToggleRepost}
            onToggleSave={handleToggleSave}
            onOpenGiftForPost={handleOpenGiftForPost}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            onSendToFriend={handleSendToFriend}
            onAddToStory48h={handleAddToStory48h}
            onUpdateUser={(patch) => setUser((prev) => ({ ...prev, ...patch }))}
            onUnblockUser={handleUnblockUser}
            onOpenCreatorStudio={() => setSubPage('creator-studio')}
            onOpenWallet={() => {
              setSubPage('none');
              setActiveTab('wallet');
            }}
            onOpenAdminDashboard={() => setSurfaceMode('admin')}
            onLogout={() => {
              setAuthStage('login');
              notify('Logged out securely');
            }}
            onNotify={notify}
            isOwnerView={true}
            onOpenDraftInEditor={(draft) =>
              openCreateFlow(
                draft.type === 'photo' ? 'photo' : draft.type === 'reel' ? 'reels' : 'video',
                null,
                draft
              )
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#090514] text-white flex flex-col">
      {/* Desktop Top Bar (3-zone contract: Brand — 4-5 single-line links — 1 primary CTA) */}
      <header className="hidden md:flex items-center justify-between gap-8 px-6 py-3 bg-[#100720]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setSurfaceMode('mobile');
            setAuthStage('app');
            setSubPage('none');
            setActiveTab('home');
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
        >
          <NepTokLogo size="sm" showWordmark={false} />
          <span className="font-display font-extrabold text-lg tracking-tight text-white">
            Nep<span className="text-[#FF0080]">Tok</span>
          </span>
        </a>

        <nav className="flex items-center gap-6 text-xs font-semibold text-purple-200/85">
          <button
            type="button"
            onClick={() => {
              setSurfaceMode('mobile');
              setAuthStage('app');
              setSubPage('none');
              setActiveTab('home');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              surfaceMode === 'mobile' && activeTab === 'home' && subPage === 'none'
                ? 'text-white underline decoration-[#FF0080] underline-offset-4'
                : ''
            }`}
          >
            Mobile Feed
          </button>
          <button
            type="button"
            onClick={() => {
              setSurfaceMode('mobile');
              setAuthStage('app');
              setSubPage('explore');
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Explore
          </button>
          <button
            type="button"
            onClick={() => {
              setSurfaceMode('mobile');
              setAuthStage('app');
              setSubPage('none');
              setActiveTab('live');
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            NEP Live
          </button>
          <button
            type="button"
            onClick={() => {
              setSurfaceMode('mobile');
              setAuthStage('app');
              setSubPage('creator-studio');
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Creator Studio
          </button>
          <button
            type="button"
            onClick={() => setSurfaceMode('admin')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              surfaceMode === 'admin'
                ? 'text-[#FF0080] underline decoration-[#FF0080] underline-offset-4'
                : ''
            }`}
          >
            Web Admin
          </button>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={() => {
              if (surfaceMode === 'admin') {
                setSurfaceMode('mobile');
                setAuthStage('app');
              } else {
                setSurfaceMode('admin');
              }
            }}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs font-bold text-white whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-[#FF0080]/25"
          >
            {surfaceMode === 'admin' ? 'Open Mobile App' : 'Admin Dashboard'}
          </button>
        </div>
      </header>

      {/* Main Responsive Workspace */}
      {surfaceMode === 'admin' ? (
        <AdminDashboard onNotify={notify} />
      ) : (
        <div className="flex-1 w-full max-w-7xl mx-auto md:px-6 md:py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Desktop Companion Panel (Hidden on mobile so mobile gets 100% pure app viewport) */}
          <aside className="hidden lg:flex lg:col-span-3 flex-col gap-4">
            <div className="p-5 rounded-3xl bg-[#140A26] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#FF0080]">Quick Stage Preview</p>
                  <p className="font-display font-bold text-base text-white mt-0.5">
                    @{user.handle}
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 tabular-nums">
                  {formatUsd(user.creatorBalanceUsd)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/10 text-xs">
                <div>
                  <p className="text-purple-300/75 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" /> Coins
                  </p>
                  <p className="font-mono font-bold text-sm text-amber-300 tabular-nums mt-1">
                    {formatCoins(user.coins)}
                  </p>
                </div>
                <div className="border-l border-white/10 pl-3">
                  <p className="text-purple-300/75 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#FF0080]" /> Followers
                  </p>
                  <p className="font-mono font-bold text-sm text-white tabular-nums mt-1">
                    {user.followers.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-[11px] font-bold text-purple-200/75">Onboarding Flow</p>
                <div className="grid grid-cols-4 gap-1">
                  {(
                    [
                      { id: 'splash', label: '01' },
                      { id: 'onboarding', label: '02' },
                      { id: 'login', label: '03' },
                      { id: 'app', label: '04+' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setAuthStage(st.id)}
                      className={`py-1.5 rounded-lg font-mono font-bold cursor-pointer ${
                        authStage === st.id
                          ? 'bg-[#FF0080] text-white'
                          : 'bg-[#090514] text-purple-200/75 hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAuthStage('app');
                  openCreateFlow();
                }}
                className="w-full h-10 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Pro Camera &amp; Editor</span>
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-[#140A26] border border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
                <span>AI Censorship &amp; Safety Engine</span>
              </div>
              <p className="text-purple-200/80 leading-relaxed">
                Real-time Copyright Audio/Video Scan, Nudity/NSFW Detection &amp; Community Harm Protection active across uploads and NEP Live.
              </p>
              <button
                type="button"
                onClick={() => setSurfaceMode('admin')}
                className="text-[#FF0080] font-bold hover:underline cursor-pointer"
              >
                Open Admin Moderation Queue →
              </button>
            </div>
          </aside>

          {/* Primary Cross-Platform Mobile App Viewport */}
          <main className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="relative w-full md:max-w-[430px] h-[100dvh] md:h-[780px] bg-[#090514] md:rounded-[38px] md:border-[3px] md:border-purple-500/35 md:shadow-[0_0_50px_rgba(157,0,255,0.22)] overflow-hidden flex flex-col">
              {/* Screen Body */}
              <div className="flex-1 min-h-0 overflow-hidden">{renderMobileScreen()}</div>

              {/* Updated Bottom Navigation Bar (Only when inside App) */}
              {authStage === 'app' && (
                <nav
                  aria-label="NepTok Bottom Navigation"
                  className="relative z-30 h-16 px-1 bg-[#0D061A]/95 backdrop-blur-xl border-t border-white/12 grid grid-cols-7 items-center shrink-0"
                >
                  {bottomNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = subPage === 'none' && activeTab === item.id;
                    if (item.isCreate) {
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-label="Create post, reel, photo, or story"
                          onClick={() => openCreateFlow()}
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          <span className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#FF0080] to-[#FF4DA6] shadow-[0_0_20px_rgba(255,0,128,0.65)] border-2 border-white/40 flex items-center justify-center text-white hover:scale-105 transition-transform">
                            <Plus className="w-6 h-6" />
                          </span>
                        </button>
                      );
                    }
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSubPage('none');
                          setActiveTab(item.id);
                        }}
                        className={`flex flex-col items-center justify-center gap-0.5 py-1 transition-colors cursor-pointer ${
                          isActive ? 'text-[#FF0080]' : 'text-purple-200/70 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-semibold tracking-tight leading-none">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>
          </main>

          {/* Right Desktop Companion Panel: Quick Gift Store & Live Status */}
          <aside className="hidden lg:flex lg:col-span-3 flex-col gap-4">
            <div className="p-5 rounded-3xl bg-[#140A26] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm">48 Original Gifts</h3>
                <Gift className="w-4 h-4 text-[#FF0080]" />
              </div>
              <p className="text-xs text-purple-200/80 leading-relaxed">
                Double Rose (1 N) to Sagarmatha (1,000 N). Send in NEP Live, NEP Battle, or Posts for full-screen 3D animations.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAuthStage('app');
                  setGiftRecipientLabel('@sita_kathmandu');
                  setGiftStoreOpen(true);
                }}
                className="w-full h-10 rounded-full bg-white/10 hover:bg-[#FF0080] text-xs font-bold transition-colors cursor-pointer"
              >
                Open Gift Store
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-[#140A26] border border-white/10 space-y-2.5 text-xs">
              <p className="font-display font-bold text-sm">Monetization &amp; Currency</p>
              <p className="text-purple-200/80">
                • Strictly USD ($) &amp; NepTok Coins (N)
              </p>
              <p className="text-purple-200/80">
                • 5,000 Followers unlock threshold
              </p>
              <p className="text-purple-200/80">
                • 48-Hour Story duration active
              </p>
              <p className="text-purple-200/80">
                • Audio Room: 30 · Video Room: 8
              </p>
              <button
                type="button"
                onClick={() => {
                  setAuthStage('app');
                  setSubPage('creator-studio');
                }}
                className="w-full h-9 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold mt-1 cursor-pointer"
              >
                View Creator Studio
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Create Modal & Pro Studio */}
      <CreateModalAndEditor
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        initialOption={createInitialOption}
        initialSound={createSound}
        editingPost={editingPost}
        duetPost={duetPost}
        communitySounds={posts.map((p) => p.sound)}
        currentUser={{ id: user.id, name: user.name, handle: user.handle }}
        onPublishPost={(newPost) => {
          const publishedPost = { ...newPost, isDraft: false };
          setPosts((prev) => {
            const exists = prev.some((p) => p.id === publishedPost.id);
            if (exists) return prev.map((p) => (p.id === publishedPost.id ? publishedPost : p));
            return [publishedPost, ...prev];
          });
          setSubPage('none');
          setActiveTab('home');
        }}
        onSaveDraft={(draftPost) => {
          const savedDraft = { ...draftPost, isDraft: true };
          setPosts((prev) => {
            const exists = prev.some((p) => p.id === savedDraft.id);
            if (exists) return prev.map((p) => (p.id === savedDraft.id ? savedDraft : p));
            return [savedDraft, ...prev];
          });
        }}
        onPublishStory={(newStory) => {
          setStories((prev) => [newStory, ...prev]);
          setSubPage('none');
          setActiveTab('chat');
        }}
        onNotify={notify}
      />

      {/* Unified 48-Gift Store Modal */}
      <GiftStoreModal
        isOpen={giftStoreOpen}
        onClose={() => {
          setGiftStoreOpen(false);
          setGiftCombo({ giftId: 0, count: 0 });
        }}
        userCoins={user.coins}
        recipientLabel={giftRecipientLabel}
        onSendGift={handleSendGift}
        onOpenRecharge={() => {
          setAuthStage('app');
          setSubPage('none');
          setActiveTab('wallet');
        }}
        history={giftHistory}
        continuousSendMode={activeTab === 'live'}
        comboCount={activeTab === 'live' ? giftCombo.count : 0}
        lastSentGiftId={activeTab === 'live' ? giftCombo.giftId : null}
      />

      {/* Full-Screen 3D Gift Animation Overlay */}
      <Gift3DOverlay
        gift={active3DGift}
        senderName={user.name}
        recipientName={giftRecipientLabel}
        comboCount={activeTab === 'live' ? giftCombo.count : 1}
        onComplete={() => setActive3DGift(null)}
      />

      {/* Clean Non-Blocking Toast Banner */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-3 left-1/2 -translate-x-1/2 md:top-auto md:left-auto md:translate-x-0 md:bottom-6 md:right-4 z-50 px-4 py-2 rounded-2xl bg-[#1C0F33]/95 backdrop-blur-md border border-[#FF0080]/60 text-xs font-bold text-white shadow-2xl whitespace-nowrap max-w-[90vw] truncate"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}

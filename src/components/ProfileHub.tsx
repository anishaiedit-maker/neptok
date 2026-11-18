import React, { useState, useEffect, useRef } from 'react';
import {
  MoreHorizontal,
  Camera,
  Edit3,
  BarChart3,
  Wallet,
  Grid3X3,
  Radio,
  Lock,
  Bookmark,
  ExternalLink,
  Shield,
  HelpCircle,
  Bot,
  Ban,
  LogOut,
  Globe,
  HardDrive,
  Smartphone,
  KeyRound,
  Mail,
  Phone,
  FileText,
  UserX,
  Trash2,
  Send,
  X,
  Check,
  Repeat,
  ChevronRight,
  Upload,
  Crop,
  RotateCcw,
  Heart,
  FileEdit,
} from 'lucide-react';
import {
  formatUsd,
  calculateAspectCropRect,
  filterProfilePostsByTab,
  type ProfileContentTab,
} from '../utils/neptokLogic';
import type { ChatThread, FeedPost, UserProfile } from '../types/neptok';
import { ProfileGridVideoPlayerModal } from './ProfileGridVideoPlayerModal';
import { uploadMediaFile } from '../utils/apiClient';
import { isVideoMediaUrl } from '../utils/streamHelpers';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ProfileHubProps {
  user: UserProfile;
  posts: FeedPost[];
  blockedUsers: Array<{ id: string; handle: string; name: string }>;
  followingList: Array<{ id: string; handle: string; name: string }>;
  followingIds: string[];
  chats: ChatThread[];
  onToggleFollow: (authorId: string) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onToggleRepost: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenGiftForPost: (post: FeedPost) => void;
  onUpdatePost: (postId: string, patch: Partial<FeedPost>) => void;
  onDeletePost: (postId: string) => void;
  onSendToFriend: (chatId: string, post: FeedPost) => void;
  onAddToStory48h: (post: FeedPost) => void;
  onUpdateUser: (patch: Partial<UserProfile>) => void;
  onUnblockUser: (userId: string) => void;
  onOpenCreatorStudio: () => void;
  onOpenWallet: () => void;
  onOpenAdminDashboard?: () => void;
  onLogout: () => void;
  onNotify: (msg: string) => void;
  isOwnerView?: boolean;
  onOpenDraftInEditor?: (draft: FeedPost) => void;
}

type SettingsView =
  | 'main'
  | 'edit-profile'
  | 'security-2fa'
  | 'privacy'
  | 'blocked'
  | 'following'
  | 'help-center'
  | 'chat-ai'
  | 'language'
  | 'storage';

export const ProfileHub: React.FC<ProfileHubProps> = ({
  user,
  posts,
  blockedUsers,
  followingList,
  followingIds,
  chats,
  onToggleFollow,
  onToggleLike,
  onAddComment,
  onToggleRepost,
  onToggleSave,
  onOpenGiftForPost,
  onUpdatePost,
  onDeletePost,
  onSendToFriend,
  onAddToStory48h,
  onUpdateUser,
  onUnblockUser,
  onOpenCreatorStudio,
  onOpenWallet,
  onOpenAdminDashboard,
  onLogout,
  onNotify,
  isOwnerView = true,
  onOpenDraftInEditor,
}) => {
  const [contentTab, setContentTab] = useState<ProfileContentTab>('Grid');
  const [playerPostId, setPlayerPostId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<SettingsView>('main');
  const [blockSearch, setBlockSearch] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const { isInstallable, isInstalled, isIOS, isOnline, promptInstall } = usePWAInstall();
  const [editDraft, setEditDraft] = useState({
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl || '',
    coverBannerUrl:
      user.coverBannerUrl || '/src/assets/images/nepal_profile_banner_1794926293036.jpg',
    youtube: user.socialLinks.youtube,
    instagram: user.socialLinks.instagram,
    facebook: user.socialLinks.facebook,
    tiktok: user.socialLinks.tiktok,
    x: user.socialLinks.x,
    website: user.socialLinks.website,
  });

  // Cover (3:1) & Avatar (1:1) Aspect-Ratio Cropper State
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [cropTarget, setCropTarget] = useState<'cover' | 'avatar' | null>(null);
  const [cropSourceUrl, setCropSourceUrl] = useState<string>('');
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropPanX, setCropPanX] = useState<number>(0);
  const [cropPanY, setCropPanY] = useState<number>(0);
  const [cropBusy, setCropBusy] = useState(false);

  useEffect(() => {
    if (settingsOpen && settingsView === 'edit-profile') {
      setEditDraft({
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl || '',
        coverBannerUrl:
          user.coverBannerUrl || '/src/assets/images/nepal_profile_banner_1794926293036.jpg',
        youtube: user.socialLinks.youtube,
        instagram: user.socialLinks.instagram,
        facebook: user.socialLinks.facebook,
        tiktok: user.socialLinks.tiktok,
        x: user.socialLinks.x,
        website: user.socialLinks.website,
      });
      setCropTarget(null);
    }
  }, [settingsOpen, settingsView, user]);

  const openCropperWithSource = (target: 'cover' | 'avatar', sourceUrl: string) => {
    setCropTarget(target);
    setCropSourceUrl(sourceUrl);
    setCropZoom(1);
    setCropPanX(0);
    setCropPanY(0);
  };

  const handleImageFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'cover' | 'avatar'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        openCropperWithSource(target, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyAspectCrop = () => {
    if (!cropTarget || !cropSourceUrl) return;
    setCropBusy(true);
    const targetAspect = cropTarget === 'cover' ? 3 : 1;
    const outWidth = cropTarget === 'cover' ? 1200 : 400;
    const outHeight = cropTarget === 'cover' ? 400 : 400;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const rect = calculateAspectCropRect(
          img.naturalWidth || outWidth,
          img.naturalHeight || outHeight,
          targetAspect,
          cropZoom,
          cropPanX,
          cropPanY
        );
        const canvas = document.createElement('canvas');
        canvas.width = outWidth;
        canvas.height = outHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, outWidth, outHeight);
          const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setEditDraft((prev) => ({
            ...prev,
            ...(cropTarget === 'cover'
              ? { coverBannerUrl: croppedDataUrl }
              : { avatarUrl: croppedDataUrl }),
          }));
          onNotify(
            cropTarget === 'cover'
              ? 'Cropped Cover Banner to 3:1 (1200×400) — tap Save to apply'
              : 'Cropped Profile Picture to 1:1 (400×400) — tap Save to apply'
          );
        }
      } catch {
        setEditDraft((prev) => ({
          ...prev,
          ...(cropTarget === 'cover'
            ? { coverBannerUrl: cropSourceUrl }
            : { avatarUrl: cropSourceUrl }),
        }));
      } finally {
        setCropBusy(false);
        setCropTarget(null);
      }
    };
    img.onerror = () => {
      setEditDraft((prev) => ({
        ...prev,
        ...(cropTarget === 'cover'
          ? { coverBannerUrl: cropSourceUrl }
          : { avatarUrl: cropSourceUrl }),
      }));
      setCropBusy(false);
      setCropTarget(null);
    };
    img.src = cropSourceUrl;
  };

  // Chat with AI Support Assistant State
  const [aiMessages, setAiMessages] = useState<
    Array<{ role: 'user' | 'model'; text: string; escalateSuggested?: boolean }>
  >([
    {
      role: 'model',
      text: `Namaste @${user.handle}! I am NepTok's 24/7 AI Support Assistant. Ask me anything about Creator Monetization (5,000 followers), USD ($) withdrawals, NEP Live, OBS/RTMP, or account security.`,
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [helpQuery, setHelpQuery] = useState('');

  const draftCount = isOwnerView
    ? posts.filter((p) => Boolean(p.isDraft) && p.authorId === user.id).length
    : 0;

  const myPosts = filterProfilePostsByTab(posts, user.id, contentTab, isOwnerView);

  const handleSendAiSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || aiLoading) return;
    const msg = aiInput.trim();
    setAiInput('');
    setAiError(null);
    const nextHistory = [...aiMessages, { role: 'user' as const, text: msg }];
    setAiMessages(nextHistory);
    setAiLoading(true);
    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: aiMessages.map((m) => ({ role: m.role, text: m.text })),
          language: user.language,
          userContext: {
            username: user.handle,
            followers: user.followers,
            coins: user.coins,
            creatorBalanceUsd: user.creatorBalanceUsd,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || 'AI support endpoint returned an error.');
      } else {
        setAiMessages((prev) => [
          ...prev,
          { role: 'model', text: data.reply, escalateSuggested: data.escalateSuggested },
        ]);
      }
    } catch {
      setAiError('Network error contacting NepTok AI Support.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleEscalateTicket = async () => {
    try {
      const res = await fetch('/api/support/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `@${user.handle}`,
          subject: 'Escalated from NepTok Chat with AI Support',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onNotify(`Ticket ${data.ticket.id} escalated to NepTok Human Support`);
      }
    } catch {
      onNotify('Could not escalate support ticket');
    }
  };

  return (
    <div className="relative w-full h-full min-h-[640px] bg-[#090514] text-white overflow-y-auto">
      {/* Scenic Nepali Cover Banner (User Cover or Heritage Default) */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden">
        <img
          src={user.coverBannerUrl || '/src/assets/images/nepal_profile_banner_1794926293036.jpg'}
          alt="NepTok Profile Cover Banner"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090514] via-[#090514]/30 to-black/40" />

        <div className="absolute top-3 left-4 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[11px] font-bold text-amber-300">
          🇳🇵 Proud to be Nepali
        </div>

        {/* Top-Right (...) Settings & Menu Trigger */}
        <button
          type="button"
          aria-label="Open Profile Settings Menu"
          onClick={() => {
            setSettingsView('main');
            setSettingsOpen(true);
          }}
          className="absolute top-3 right-4 w-10 h-10 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/15 cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Avatar, Name, Stats & 3 Primary Buttons */}
      <div className="px-4 sm:px-6 -mt-12 relative z-10 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-[#090514] bg-gradient-to-tr from-[#FF0080] to-[#9D00FF] flex items-center justify-center font-display text-2xl font-extrabold text-white shadow-xl overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <button
              type="button"
              aria-label="Edit avatar"
              onClick={() => {
                setSettingsView('edit-profile');
                setSettingsOpen(true);
              }}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FF0080] border-2 border-[#090514] flex items-center justify-center cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-3 gap-2 text-center pb-1">
            <div>
              <p className="font-display font-extrabold text-base sm:text-lg tabular-nums">
                {user.followers.toLocaleString()}
              </p>
              <p className="text-[11px] text-purple-200/75">Followers</p>
            </div>
            <div>
              <p className="font-display font-extrabold text-base sm:text-lg tabular-nums">
                {user.following.toLocaleString()}
              </p>
              <p className="text-[11px] text-purple-200/75">Following</p>
            </div>
            <div>
              <p className="font-display font-extrabold text-base sm:text-lg tabular-nums">
                {user.likes.toLocaleString()}
              </p>
              <p className="text-[11px] text-purple-200/75">Likes</p>
            </div>
          </div>
        </div>

        {/* Display Name + Verified Blue Tick + Handle + Bio */}
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="font-display font-extrabold text-xl text-white">{user.name}</h2>
            {user.verified && (
              <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                ✓
              </span>
            )}
            <span className="text-xs text-purple-300/80 ml-1">· {user.accountType}</span>
          </div>
          <p className="text-xs font-semibold text-[#FF0080]">@{user.handle}</p>
          <p className="text-xs text-purple-100/90 mt-1.5 leading-relaxed">{user.bio}</p>
        </div>

        {/* 3 Primary Buttons: Edit Profile | Creator Studio | My Wallet ($ USD) */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setSettingsView('edit-profile');
              setSettingsOpen(true);
            }}
            className="h-10 rounded-xl bg-[#190D30] border border-white/15 hover:border-[#FF0080] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreatorStudio}
            className="h-10 rounded-xl bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF0080]/25 cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Creator Studio</span>
          </button>
          <button
            type="button"
            onClick={onOpenWallet}
            className="h-10 rounded-xl bg-[#190D30] border border-emerald-400/35 hover:border-emerald-400 text-xs font-bold flex items-center justify-center gap-1 text-emerald-300 tabular-nums cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>My Wallet {formatUsd(user.creatorBalanceUsd)}</span>
          </button>
        </div>

        {/* Clickable Social & Channel Links */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { label: 'YouTube', url: user.socialLinks.youtube },
            { label: 'Instagram', url: user.socialLinks.instagram },
            { label: 'Facebook', url: user.socialLinks.facebook },
            { label: 'TikTok', url: user.socialLinks.tiktok },
            { label: 'X', url: user.socialLinks.x },
            { label: 'Website', url: user.socialLinks.website },
          ].map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-full bg-[#140A26] border border-white/10 hover:border-[#FF0080] text-[11px] font-semibold text-purple-100 flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>{s.label}</span>
              <ExternalLink className="w-3 h-3 text-[#FF0080]" />
            </a>
          ))}
        </div>

        {/* Content Tabs: Grid | Live | Private | Saved | Liked | Drafts (Owner-only) */}
        <div
          data-testid="profile-tabs-bar"
          className={`grid ${isOwnerView ? 'grid-cols-6' : 'grid-cols-5'} border-b border-white/10`}
        >
          {(
            [
              { id: 'Grid' as const, icon: Grid3X3 },
              { id: 'Live' as const, icon: Radio },
              { id: 'Private' as const, icon: Lock },
              { id: 'Saved' as const, icon: Bookmark },
              { id: 'Liked' as const, icon: Heart },
              ...(isOwnerView ? [{ id: 'Drafts' as const, icon: FileEdit }] : []),
            ] as Array<{ id: ProfileContentTab; icon: React.ComponentType<{ className?: string }> }>
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                data-testid={`profile-tab-${t.id.toLowerCase()}`}
                onClick={() => setContentTab(t.id)}
                className={`py-2 px-0.5 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  contentTab === t.id
                    ? 'border-[#FF0080] text-white'
                    : 'border-transparent text-purple-200/65 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>
                  {t.id}
                  {t.id === 'Drafts' && draftCount > 0 ? ` (${draftCount})` : ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* Profile Grid */}
        <div data-testid="profile-posts-grid" className="grid grid-cols-3 gap-1.5 pb-6">
          {myPosts.length === 0 ? (
            <div className="col-span-3 py-10 text-center text-xs text-purple-200/70">
              {contentTab === 'Drafts'
                ? 'No saved drafts yet. Tap "Save Draft" in the Create Studio to store private drafts here.'
                : contentTab === 'Liked'
                ? 'No liked videos yet. Double-tap or tap ❤️ on videos in the feed.'
                : `No items in ${contentTab} tab yet.`}
            </div>
          ) : (
            myPosts.map((p) =>
              p.isDraft ? (
                <div
                  key={p.id}
                  data-testid={`profile-draft-item-${p.id}`}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-[#140A26] border border-[#FF0080]/45 hover:border-[#FF0080] text-left"
                >
                  <button
                    type="button"
                    onClick={() => onOpenDraftInEditor?.(p)}
                    className="w-full h-full text-left cursor-pointer"
                  >
                    {isVideoMediaUrl(p.thumbnailUrl || p.mediaUrl, p.mediaMime) ? (
                      <video
                        src={p.thumbnailUrl || p.mediaUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        style={{ filter: p.cssFilter || 'none' }}
                      />
                    ) : (
                      <img
                        src={p.thumbnailUrl || p.mediaUrl}
                        alt={p.caption}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        style={{ filter: p.cssFilter || 'none' }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#FF0080] text-white text-[9px] font-extrabold uppercase tracking-wide">
                      Draft
                    </span>
                    <div className="absolute bottom-1.5 inset-x-1.5 space-y-0.5">
                      <p className="text-[10px] font-semibold text-white line-clamp-2 leading-tight">
                        {p.caption || 'Untitled Draft'}
                      </p>
                      <p className="text-[9px] text-pink-200 font-bold flex items-center gap-1">
                        <FileEdit className="w-2.5 h-2.5" />
                        <span>Tap to edit</span>
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label="Delete draft"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePost(p.id);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 border border-white/20 hover:bg-rose-600 flex items-center justify-center text-white cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`profile-grid-item-${p.id}`}
                  onClick={() => setPlayerPostId(p.id)}
                  onDoubleClick={() => setPlayerPostId(p.id)}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-[#140A26] border border-white/10 hover:border-[#FF0080]/70 text-left cursor-pointer"
                >
                  {isVideoMediaUrl(p.thumbnailUrl || p.mediaUrl, p.mediaMime) ? (
                    <video
                      src={p.thumbnailUrl || p.mediaUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      style={{ filter: p.cssFilter || 'none' }}
                    />
                  ) : (
                    <img
                      src={p.thumbnailUrl || p.mediaUrl}
                      alt={p.caption}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      style={{ filter: p.cssFilter || 'none' }}
                    />
                  )}
                  {p.visibility === 'Private' && (
                    <span
                      data-testid={`private-lock-${p.id}`}
                      aria-label="Private video"
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 border border-white/25 flex items-center justify-center text-[#FF0080]"
                    >
                      <Lock className="w-3 h-3" />
                    </span>
                  )}
                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/65 text-[10px] font-mono tabular-nums">
                    ▶ {p.views.toLocaleString()}
                  </div>
                </button>
              )
            )
          )}
        </div>
      </div>

      {/* Full-Screen Profile Grid Vertical Video Player & Owner Controls */}
      <ProfileGridVideoPlayerModal
        isOpen={playerPostId !== null}
        posts={myPosts}
        initialPostId={playerPostId}
        currentUserId={user.id}
        followingIds={followingIds}
        chats={chats}
        onClose={() => setPlayerPostId(null)}
        onToggleFollow={onToggleFollow}
        onToggleLike={onToggleLike}
        onAddComment={onAddComment}
        onToggleRepost={onToggleRepost}
        onToggleSave={onToggleSave}
        onOpenGiftForPost={onOpenGiftForPost}
        onUpdatePost={onUpdatePost}
        onDeletePost={onDeletePost}
        onSendToFriend={onSendToFriend}
        onAddToStory48h={onAddToStory48h}
        onNotify={onNotify}
      />

      {/* Complete Settings, Privacy, Security, Help Center ("Chat with AI") & Block Drawer */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md h-full bg-[#120824] border-l border-white/15 flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="px-5 py-4 bg-[#190D30] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settingsView !== 'main' && (
                  <button
                    type="button"
                    onClick={() => setSettingsView('main')}
                    className="text-xs font-bold text-[#FF0080] mr-1 cursor-pointer"
                  >
                    ← Back
                  </button>
                )}
                <h3 className="font-display font-bold text-base">
                  {settingsView === 'main'
                    ? 'Settings & Account Center'
                    : settingsView === 'chat-ai'
                    ? 'Chat with AI Support'
                    : settingsView === 'help-center'
                    ? 'NepTok Help Center'
                    : settingsView === 'blocked'
                    ? 'Blocked Accounts'
                    : settingsView === 'edit-profile'
                    ? 'Edit Profile & Social Links'
                    : settingsView === 'security-2fa'
                    ? 'Security, 2FA & Permissions'
                    : settingsView === 'privacy'
                    ? 'Privacy & Permissions'
                    : settingsView === 'following'
                    ? 'Following List'
                    : settingsView === 'language'
                    ? 'Display Language'
                    : 'Offline Videos & Free Space'}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close Settings Drawer"
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {settingsView === 'main' && (
                <>
                  {/* Prominent Chat with AI Banner */}
                  <button
                    type="button"
                    onClick={() => setSettingsView('chat-ai')}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-left flex items-center justify-between gap-3 shadow-lg shadow-[#FF0080]/30 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </span>
                      <div>
                        <p className="font-display font-bold text-sm text-white">Chat with AI</p>
                        <p className="text-[11px] text-pink-100">
                          24/7 AI Support Assistant for payouts, monetization &amp; help
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>

                  {/* 1. Creator & Account Management */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-purple-300/75 uppercase tracking-wider px-1">
                      Creator &amp; Account Management
                    </p>
                    {[
                      ...(onOpenAdminDashboard
                        ? [
                            {
                              label: 'Web Admin Dashboard',
                              icon: Shield,
                              action: () => {
                                setSettingsOpen(false);
                                onOpenAdminDashboard();
                              },
                            },
                          ]
                        : []),
                      { label: 'Creator Studio', icon: BarChart3, action: () => { setSettingsOpen(false); onOpenCreatorStudio(); } },
                      { label: 'Creator Dashboard', icon: BarChart3, action: () => { setSettingsOpen(false); onOpenCreatorStudio(); } },
                      { label: `Main Balance (${formatUsd(user.creatorBalanceUsd)})`, icon: Wallet, action: () => { setSettingsOpen(false); onOpenWallet(); } },
                      { label: 'Manage Posts', icon: Grid3X3, action: () => { setSettingsOpen(false); onOpenCreatorStudio(); } },
                      { label: 'Edit Profile (YouTube & Social Links)', icon: Edit3, action: () => setSettingsView('edit-profile') },
                      { label: 'Manage Payment Methods', icon: Wallet, action: () => { setSettingsOpen(false); onOpenWallet(); } },
                      {
                        label:
                          user.accountType === 'Personal'
                            ? 'Switch to Business Account'
                            : 'Create Personal Account',
                        icon: Repeat,
                        action: () => {
                          const next = user.accountType === 'Personal' ? 'Business' : 'Personal';
                          onUpdateUser({ accountType: next });
                          onNotify(`Switched to ${next} Account`);
                        },
                      },
                      { label: 'Switch Account', icon: Repeat, action: () => onNotify('Account switcher ready (@aarav_nepal)') },
                      { label: 'Log Out', icon: LogOut, action: () => { setSettingsOpen(false); onLogout(); }, danger: true },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={item.action}
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-[#190D30] hover:bg-white/10 flex items-center justify-between text-xs font-semibold cursor-pointer ${
                            item.danger ? 'text-rose-300' : 'text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-[#FF0080]" />
                            <span>{item.label}</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-purple-300/60" />
                        </button>
                      );
                    })}
                  </div>

                  {/* 2. Security & Permissions */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-purple-300/75 uppercase tracking-wider px-1">
                      Security &amp; Permissions
                    </p>
                    {[
                      { label: 'Two-Step Verification (2FA)', icon: Shield },
                      { label: 'Security & Permissions (Alerts & Devices)', icon: Smartphone },
                      { label: 'Change Password', icon: KeyRound },
                      { label: 'Change Phone Number (OTP)', icon: Phone },
                      { label: 'Change Email', icon: Mail },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setSettingsView('security-2fa')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#190D30] hover:bg-white/10 flex items-center justify-between text-xs font-semibold cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-[#9D00FF]" />
                            <span>{item.label}</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-purple-300/60" />
                        </button>
                      );
                    })}
                  </div>

                  {/* 3. Privacy & Block System */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-purple-300/75 uppercase tracking-wider px-1">
                      Privacy &amp; Block System
                    </p>
                    <button
                      type="button"
                      onClick={() => setSettingsView('privacy')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#190D30] hover:bg-white/10 flex items-center justify-between text-xs font-semibold cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <Lock className="w-4 h-4 text-[#FF0080]" />
                        <span>Privacy Account ({user.isPrivateAccount ? 'Private' : 'Public'})</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-purple-300/60" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsView('following')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#190D30] hover:bg-white/10 flex items-center justify-between text-xs font-semibold cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Following List ({followingList.length})</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-purple-300/60" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsView('blocked')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#190D30] hover:bg-white/10 flex items-center justify-between text-xs font-semibold cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <Ban className="w-4 h-4 text-rose-400" />
                        <span>Block Account / Blocked List ({blockedUsers.length})</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-purple-300/60" />
                    </button>
                  </div>

                  {/* 4. Help Center, Storage & Legal */}
                  <div className="space-y-1.5 pb-6">
                    <p className="text-[11px] font-bold text-purple-300/75 uppercase tracking-wider px-1">
                      Help Center, Content &amp; Legal
                    </p>
                    {[
                      { label: 'Help Center (FAQs, Report & Safety)', icon: HelpCircle, action: () => setSettingsView('help-center') },
                      { label: `Display Language (${user.language === 'ne' ? 'नेपाली' : 'English'})`, icon: Globe, action: () => setSettingsView('language') },
                      { label: 'Contact & Location (Kathmandu, Nepal)', icon: Globe, action: () => onNotify('Location & Contacts permissions verified') },
                      { label: 'Offline Videos & Free Space (Clear Cache)', icon: HardDrive, action: () => setSettingsView('storage') },
                      ...(!isInstalled && (isInstallable || isIOS)
                        ? [
                            {
                              label: isIOS
                                ? 'Install NepTok App (Share → Add to Home Screen)'
                                : 'Install NepTok App (PWA)',
                              icon: Smartphone,
                              action: async () => {
                                if (isInstallable) {
                                  const accepted = await promptInstall();
                                  onNotify(
                                    accepted
                                      ? 'NepTok installed! Launch anytime from your home screen.'
                                      : 'Install prompt dismissed'
                                  );
                                } else {
                                  onNotify('Tap Safari Share → Add to Home Screen to install NepTok.');
                                }
                              },
                            },
                          ]
                        : []),
                      { label: 'Wallpaper (Cosmic NepTok Dark)', icon: Smartphone, action: () => onNotify('Applied NepTok Cosmic Wallpaper') },
                      { label: 'Privacy Center & Terms & Policy', icon: FileText, action: () => onNotify('NepTok Privacy Center & Terms v2026') },
                      { label: 'Deactivate Account', icon: UserX, action: () => onNotify('Account deactivation confirmation sent via OTP'), danger: true },
                      { label: 'Delete Account', icon: Trash2, action: () => onNotify('Permanent deletion requires 2FA verification'), danger: true },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={item.action}
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-[#190D30] hover:bg-white/10 flex items-center justify-between text-xs font-semibold cursor-pointer ${
                            item.danger ? 'text-rose-300' : 'text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-purple-300" />
                            <span>{item.label}</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-purple-300/60" />
                        </button>
                      );
                    })}
                    {!isOnline && (
                      <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-400/35 text-[11px] font-semibold text-amber-200">
                        Offline mode active — cached views ready; changes will sync when back online.
                      </div>
                    )}
                  </div>
                </>
              )}

              {settingsView === 'edit-profile' && (
                <div className="space-y-4 text-xs">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileSelect(e, 'cover')}
                    className="hidden"
                  />
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileSelect(e, 'avatar')}
                    className="hidden"
                  />

                  {/* Aspect-Ratio Crop & Sizing Modal Panel */}
                  {cropTarget && (
                    <div
                      data-testid="profile-crop-studio"
                      className="p-3.5 rounded-2xl bg-[#190D30] border border-[#FF0080] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-white flex items-center gap-1.5">
                          <Crop className="w-3.5 h-3.5 text-[#FF0080]" />
                          <span>
                            {cropTarget === 'cover'
                              ? 'Crop Cover Banner (3:1 Ratio)'
                              : 'Crop Profile Picture (1:1 Ratio)'}
                          </span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setCropTarget(null)}
                          className="text-purple-200 hover:text-white cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div
                        className={`relative overflow-hidden bg-black border-2 border-dashed border-[#FF0080] mx-auto ${
                          cropTarget === 'cover'
                            ? 'w-full aspect-[3/1] rounded-xl'
                            : 'w-36 h-36 rounded-full'
                        }`}
                      >
                        <img
                          src={cropSourceUrl}
                          alt="Crop preview"
                          className="w-full h-full object-cover"
                          style={{
                            transform: `scale(${cropZoom}) translate(${-cropPanX * 18}%, ${-cropPanY * 18}%)`,
                          }}
                        />
                      </div>

                      <div className="space-y-2 text-[11px]">
                        <label className="block space-y-0.5">
                          <span className="flex justify-between text-purple-200">
                            <span>Zoom</span>
                            <span className="font-mono text-[#FF0080]">{cropZoom.toFixed(2)}x</span>
                          </span>
                          <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={cropZoom}
                            onChange={(e) => setCropZoom(Number(e.target.value))}
                            className="w-full accent-[#FF0080]"
                          />
                        </label>
                        <label className="block space-y-0.5">
                          <span className="flex justify-between text-purple-200">
                            <span>Horizontal Position</span>
                            <span className="font-mono">{Math.round(cropPanX * 100)}%</span>
                          </span>
                          <input
                            type="range"
                            min={-1}
                            max={1}
                            step={0.05}
                            value={cropPanX}
                            onChange={(e) => setCropPanX(Number(e.target.value))}
                            className="w-full accent-[#9D00FF]"
                          />
                        </label>
                        <label className="block space-y-0.5">
                          <span className="flex justify-between text-purple-200">
                            <span>Vertical Position</span>
                            <span className="font-mono">{Math.round(cropPanY * 100)}%</span>
                          </span>
                          <input
                            type="range"
                            min={-1}
                            max={1}
                            step={0.05}
                            value={cropPanY}
                            onChange={(e) => setCropPanY(Number(e.target.value))}
                            className="w-full accent-[#9D00FF]"
                          />
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCropZoom(1);
                            setCropPanX(0);
                            setCropPanY(0);
                          }}
                          className="px-3 py-2 rounded-xl bg-white/10 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                        <button
                          type="button"
                          disabled={cropBusy}
                          onClick={handleApplyAspectCrop}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-[11px] font-bold text-white cursor-pointer"
                        >
                          {cropBusy
                            ? 'Cropping...'
                            : cropTarget === 'cover'
                            ? 'Apply 3:1 Cover Crop'
                            : 'Apply 1:1 Avatar Crop'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cover Picture Management (3:1 Banner) */}
                  <div className="p-3 rounded-2xl bg-[#190D30] border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-white">Cover Picture (3:1 Banner)</p>
                        <p className="text-[10px] text-purple-200/75">
                          Upload a banner and fit 3:1 dimensions before saving
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Upload className="w-3 h-3 text-[#FF0080]" />
                        <span>Upload Cover</span>
                      </button>
                    </div>
                    <div className="relative aspect-[3/1] w-full rounded-xl overflow-hidden border border-white/15 bg-black">
                      <img
                        src={editDraft.coverBannerUrl}
                        alt="Cover banner preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => openCropperWithSource('cover', editDraft.coverBannerUrl)}
                        className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/75 border border-white/25 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Crop className="w-3 h-3 text-[#FF0080]" />
                        <span>Crop 3:1</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                      {[
                        {
                          label: 'Nepali Heritage',
                          url: '/src/assets/images/nepal_profile_banner_1794926293036.jpg',
                        },
                        {
                          label: 'Everest Dawn',
                          url: '/src/assets/images/creator_everest_trek_1794926294520.jpg',
                        },
                        {
                          label: 'Phewa Lake',
                          url: '/src/assets/images/creator_pokhara_lake_1794926294810.jpg',
                        },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => openCropperWithSource('cover', preset.url)}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-[#090514] border border-white/10 hover:border-[#FF0080] text-[10px] font-semibold cursor-pointer"
                        >
                          Use {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Profile Picture Management (1:1 Avatar) */}
                  <div className="p-3 rounded-2xl bg-[#190D30] border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#FF0080] bg-gradient-to-tr from-[#FF0080] to-[#9D00FF] flex items-center justify-center font-display text-base font-bold shrink-0">
                        {editDraft.avatarUrl ? (
                          <img
                            src={editDraft.avatarUrl}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          editDraft.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white">Profile Picture (1:1)</p>
                        <p className="text-[10px] text-purple-200/75 truncate">
                          Upload &amp; crop square avatar
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-[#FF0080]" />
                        <span>Upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openCropperWithSource(
                            'avatar',
                            editDraft.avatarUrl ||
                              '/src/assets/images/creator_dance_kathmandu_1794926294158.jpg'
                          )
                        }
                        className="px-2.5 py-1.5 rounded-full bg-[#FF0080]/20 border border-[#FF0080] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Crop className="w-3 h-3" />
                        <span>Crop 1:1</span>
                      </button>
                    </div>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-purple-200">Display Name</span>
                    <input
                      type="text"
                      value={editDraft.name}
                      onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-[#090514] border border-white/15"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-purple-200">Bio</span>
                    <textarea
                      rows={3}
                      value={editDraft.bio}
                      onChange={(e) => setEditDraft({ ...editDraft, bio: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#090514] border border-white/15"
                    />
                  </label>
                  {(['youtube', 'instagram', 'facebook', 'tiktok', 'x', 'website'] as const).map(
                    (k) => (
                      <label key={k} className="block space-y-1 capitalize">
                        <span className="text-purple-200">{k} Link</span>
                        <input
                          type="url"
                          value={editDraft[k]}
                          onChange={(e) => setEditDraft({ ...editDraft, [k]: e.target.value })}
                          className="w-full h-9 px-3 rounded-xl bg-[#090514] border border-white/15"
                        />
                      </label>
                    )
                  )}
                  <button
                    type="button"
                    disabled={isSavingProfile}
                    onClick={async () => {
                      setIsSavingProfile(true);
                      try {
                        let nextAvatarUrl = editDraft.avatarUrl;
                        let nextCoverUrl = editDraft.coverBannerUrl;
                        if (nextAvatarUrl.startsWith('data:')) {
                          const up = await uploadMediaFile(nextAvatarUrl, 'avatar', 'avatar.jpg').catch(() => null);
                          if (up?.url) nextAvatarUrl = up.url;
                        }
                        if (nextCoverUrl.startsWith('data:')) {
                          const up = await uploadMediaFile(nextCoverUrl, 'cover', 'cover.jpg').catch(() => null);
                          if (up?.url) nextCoverUrl = up.url;
                        }
                        onUpdateUser({
                          name: editDraft.name,
                          bio: editDraft.bio,
                          avatarUrl: nextAvatarUrl,
                          coverBannerUrl: nextCoverUrl,
                          socialLinks: {
                            youtube: editDraft.youtube,
                            instagram: editDraft.instagram,
                            facebook: editDraft.facebook,
                            tiktok: editDraft.tiktok,
                            x: editDraft.x,
                            website: editDraft.website,
                          },
                        });
                        onNotify('Profile, Cover Banner & social links saved');
                        setSettingsView('main');
                      } finally {
                        setIsSavingProfile(false);
                      }
                    }}
                    className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] font-bold text-xs cursor-pointer disabled:opacity-60"
                  >
                    {isSavingProfile ? 'Saving to Cloud...' : 'Save Profile Changes'}
                  </button>
                </div>
              )}

              {settingsView === 'security-2fa' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#190D30] border border-white/10">
                    <div>
                      <p className="font-bold text-white">Two-Step Verification (2FA)</p>
                      <p className="text-purple-200/75 mt-0.5">SMS / Email / Authenticator App</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateUser({ twoFactorEnabled: !user.twoFactorEnabled })
                      }
                      className={`px-3 py-1.5 rounded-full font-bold cursor-pointer ${
                        user.twoFactorEnabled ? 'bg-emerald-500 text-black' : 'bg-white/10'
                      }`}
                    >
                      {user.twoFactorEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#190D30] border border-white/10 space-y-2">
                    <p className="font-bold">Active Login Devices &amp; Permissions</p>
                    <p className="text-purple-200/80">• iPhone 16 Pro (Kathmandu, NP) · Current</p>
                    <p className="text-purple-200/80">• Web Studio (Chrome) · Camera &amp; Mic Allowed</p>
                  </div>
                </div>
              )}

              {settingsView === 'privacy' && (
                <div className="space-y-2.5 text-xs">
                  {[
                    {
                      label: 'Private Account (Approve Followers)',
                      val: user.isPrivateAccount,
                      key: 'isPrivateAccount' as const,
                    },
                    {
                      label: 'Allow Comments Globally',
                      val: user.allowCommentsGlobal,
                      key: 'allowCommentsGlobal' as const,
                    },
                    {
                      label: 'Allow Duet Globally',
                      val: user.allowDuetGlobal,
                      key: 'allowDuetGlobal' as const,
                    },
                    {
                      label: 'Allow Downloads',
                      val: user.allowDownloadGlobal,
                      key: 'allowDownloadGlobal' as const,
                    },
                    {
                      label: 'Allow Original Audio Reuse',
                      val: user.allowOriginalAudioReuse,
                      key: 'allowOriginalAudioReuse' as const,
                    },
                  ].map((opt) => (
                    <div
                      key={opt.key}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[#190D30] border border-white/10"
                    >
                      <span className="font-semibold">{opt.label}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateUser({ [opt.key]: !opt.val })}
                        className={`px-3 py-1 rounded-full font-bold cursor-pointer ${
                          opt.val ? 'bg-[#FF0080] text-white' : 'bg-white/10 text-purple-200'
                        }`}
                      >
                        {opt.val ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {settingsView === 'blocked' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={blockSearch}
                    onChange={(e) => setBlockSearch(e.target.value)}
                    placeholder="Search blocked accounts..."
                    className="w-full h-10 px-3 rounded-xl bg-[#090514] border border-white/15 text-xs"
                  />
                  {blockedUsers.length === 0 ? (
                    <p className="text-xs text-purple-200/75 text-center py-8">
                      No blocked accounts. Blocking a user immediately hides their posts and chats.
                    </p>
                  ) : (
                    blockedUsers
                      .filter((b) =>
                        b.handle.toLowerCase().includes(blockSearch.toLowerCase())
                      )
                      .map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-[#190D30] border border-white/10 text-xs"
                        >
                          <div>
                            <p className="font-bold">{b.name}</p>
                            <p className="text-purple-300/75">@{b.handle}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onUnblockUser(b.id)}
                            className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold cursor-pointer"
                          >
                            Unblock
                          </button>
                        </div>
                      ))
                  )}
                </div>
              )}

              {settingsView === 'following' && (
                <div className="space-y-2">
                  {followingList.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#190D30] border border-white/10 text-xs"
                    >
                      <div>
                        <p className="font-bold">{f.name}</p>
                        <p className="text-purple-300/75">@{f.handle}</p>
                      </div>
                      <span className="text-emerald-400 font-semibold">Following</span>
                    </div>
                  ))}
                </div>
              )}

              {settingsView === 'help-center' && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setSettingsView('chat-ai')}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#FF0080] to-[#9D00FF] flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <Bot className="w-6 h-6 text-white" />
                      <div>
                        <p className="font-display font-bold text-sm">Chat with AI</p>
                        <p className="text-[11px] text-pink-100">
                          Instant 24/7 Gemini AI Support &amp; Ticket Escalation
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={helpQuery}
                    onChange={(e) => setHelpQuery(e.target.value)}
                    placeholder="Search FAQs, monetization, safety..."
                    className="w-full h-10 px-3 rounded-xl bg-[#090514] border border-white/15 text-xs"
                  />

                  <div className="space-y-2 text-xs">
                    {[
                      {
                        q: 'How do I unlock Creator Monetization?',
                        a: 'Reach a minimum of 5,000 Followers with Good Account Standing, then activate Content Monetization and Gift Monetization in Creator Studio.',
                      },
                      {
                        q: 'How long do NepTok Stories stay active?',
                        a: 'Every Story stays live for 48 hours across Home and Chat Stories.',
                      },
                      {
                        q: 'What currency does NepTok Wallet use?',
                        a: 'All balances, coin packages, and creator payouts are strictly in USD ($) and NepTok Coins (100 N = $1.00).',
                      },
                    ]
                      .filter((f) =>
                        f.q.toLowerCase().includes(helpQuery.toLowerCase())
                      )
                      .map((faq) => (
                        <div
                          key={faq.q}
                          className="p-3.5 rounded-2xl bg-[#190D30] border border-white/10 space-y-1"
                        >
                          <p className="font-bold text-white">{faq.q}</p>
                          <p className="text-purple-200/80 leading-relaxed">{faq.a}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {settingsView === 'chat-ai' && (
                <div className="flex flex-col h-full min-h-[460px] space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-purple-200/80">
                    <span>NepTok 24/7 AI Support</span>
                    <button
                      type="button"
                      onClick={handleEscalateTicket}
                      className="text-[#FF0080] font-bold underline cursor-pointer"
                    >
                      Escalate to Human Agent
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[380px]">
                    {aiMessages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed space-y-2 ${
                            m.role === 'user'
                              ? 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white'
                              : 'bg-[#190D30] border border-white/15 text-purple-100'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          {m.escalateSuggested && (
                            <button
                              type="button"
                              onClick={handleEscalateTicket}
                              className="px-3 py-1 rounded-full bg-[#FF0080] text-white text-[10px] font-bold cursor-pointer"
                            >
                              Escalate Ticket to Human Support
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <p className="text-xs text-purple-300/75 italic">NepTok AI is typing...</p>
                    )}
                    {aiError && (
                      <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
                        {aiError}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendAiSupport} className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <input
                      type="text"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Ask AI about payouts, 5k monetization, live..."
                      className="flex-1 h-10 px-3.5 rounded-full bg-[#090514] border border-purple-500/35 text-xs text-white focus:outline-none focus:border-[#FF0080]"
                    />
                    <button
                      type="submit"
                      disabled={aiLoading}
                      aria-label="Send message to AI Support"
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] flex items-center justify-center cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {settingsView === 'language' && (
                <div className="space-y-2.5 text-xs">
                  {[
                    { code: 'en' as const, label: 'English (International)' },
                    { code: 'ne' as const, label: 'नेपाली (Nepali)' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onUpdateUser({ language: lang.code });
                        onNotify(`Language changed to ${lang.label}`);
                      }}
                      className={`w-full p-3.5 rounded-2xl border flex items-center justify-between font-bold cursor-pointer ${
                        user.language === lang.code
                          ? 'bg-[#FF0080]/20 border-[#FF0080]'
                          : 'bg-[#190D30] border-white/10'
                      }`}
                    >
                      <span>{lang.label}</span>
                      {user.language === lang.code && <Check className="w-4 h-4 text-[#FF0080]" />}
                    </button>
                  ))}
                </div>
              )}

              {settingsView === 'storage' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-[#190D30] border border-white/10 space-y-2">
                    <p className="font-bold">Cached Media &amp; Offline Videos</p>
                    <p className="text-purple-200/80">Offline Saved Videos: 148 MB · App Cache: 62 MB</p>
                    <button
                      type="button"
                      onClick={() => onNotify('Cleared 62 MB of temporary cache')}
                      className="px-4 py-2 rounded-full bg-[#FF0080] text-white font-bold cursor-pointer"
                    >
                      Clear Cache (Free Space)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

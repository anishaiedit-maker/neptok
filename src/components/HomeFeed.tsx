import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Gift,
  Repeat2,
  Share2,
  MoreHorizontal,
  Plus,
  Check,
  Music2,
  ChevronUp,
  ChevronDown,
  Bookmark,
  Download,
  Copy,
  Flag,
  EyeOff,
  Ban,
  Shield,
  SlidersHorizontal,
  Trash2,
  Sparkles,
  Search,
  Send,
  X,
  Image as ImageIcon,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { FeedPost, ChatThread, OriginalSound } from '../types/neptok';
import type { PostVisibility } from '../utils/neptokLogic';

interface HomeFeedProps {
  posts: FeedPost[];
  initialPostId?: string | null;
  currentUserId: string;
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
  onBlockUser: (authorId: string, handle: string) => void;
  onSendToFriend: (chatId: string, post: FeedPost) => void;
  onAddToStory48h: (post: FeedPost) => void;
  onUseOriginalSound: (sound: OriginalSound) => void;
  onToggleSaveSound: (soundId: string) => void;
  onOpenExploreTab: () => void;
  onStartDuet: (post: FeedPost) => void;
  onEditOwnPost: (post: FeedPost) => void;
  onNotify: (msg: string) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  posts,
  initialPostId = null,
  currentUserId,
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
  onBlockUser,
  onSendToFriend,
  onAddToStory48h,
  onUseOriginalSound,
  onToggleSaveSound,
  onOpenExploreTab,
  onStartDuet,
  onEditOwnPost,
  onNotify,
}) => {
  const [feedTab, setFeedTab] = useState<'For You' | 'Following' | 'Explore'>('For You');
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ x: number; y: number; id: number } | null>(
    null
  );
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [sharePost, setSharePost] = useState<FeedPost | null>(null);
  const [friendSearch, setFriendSearch] = useState('');
  const [sentFriends, setSentFriends] = useState<string[]>([]);
  const [menuPost, setMenuPost] = useState<FeedPost | null>(null);
  const [editingCaptionPost, setEditingCaptionPost] = useState<FeedPost | null>(null);
  const [captionDraft, setCaptionDraft] = useState('');
  const [soundDetail, setSoundDetail] = useState<OriginalSound | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const lastTapRef = useRef<number>(0);
  const wheelLockRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const visibleList =
    feedTab === 'Following'
      ? posts.filter((p) => followingIds.includes(p.authorId) || p.authorId === currentUserId)
      : posts;

  useEffect(() => {
    if (!initialPostId) return;
    const idx = visibleList.findIndex((p) => p.id === initialPostId);
    if (idx !== -1) setActiveIndex(idx);
  }, [initialPostId, visibleList.length]);

  const safeIndex = visibleList.length === 0 ? 0 : Math.min(activeIndex, visibleList.length - 1);
  const activePost = visibleList[safeIndex] ?? null;

  const isOverlayOpen = Boolean(
    commentPostId || sharePost || menuPost || editingCaptionPost || soundDetail
  );

  const isVideoFileUrl = (url: string) =>
    url.startsWith('data:video/') || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

  const handleMediaTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activePost) return;
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDoubleTapHeart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        id: now,
      });
      if (!activePost.likedByMe) {
        onToggleLike(activePost.id);
      }
      setTimeout(() => setDoubleTapHeart(null), 850);
    }
    lastTapRef.current = now;
  };

  const handleStepPost = (delta: number) => {
    if (visibleList.length === 0) return;
    setActiveIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return visibleList.length - 1;
      if (next >= visibleList.length) return 0;
      return next;
    });
  };

  const handleWheelFeed = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isOverlayOpen || visibleList.length <= 1) return;
    if (Math.abs(e.deltaY) < 10 || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    const now = Date.now();
    if (now - wheelLockRef.current < 340) return;
    wheelLockRef.current = now;
    handleStepPost(e.deltaY > 0 ? 1 : -1);
  };

  const handleTouchStartFeed = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isOverlayOpen || e.touches.length === 0) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMoveFeed = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || isOverlayOpen || e.touches.length === 0) return;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    if (Math.abs(dy) > Math.abs(dx)) {
      setDragOffsetY(Math.max(-72, Math.min(72, dy * 0.35)));
    }
  };

  const handleTouchEndFeed = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    setDragOffsetY(0);
    if (!start || isOverlayOpen || e.changedTouches.length === 0) return;
    const dy = e.changedTouches[0].clientY - start.y;
    const dx = e.changedTouches[0].clientX - start.x;
    if (Math.abs(dy) > 36 && Math.abs(dy) > Math.abs(dx)) {
      handleStepPost(dy < 0 ? 1 : -1);
    }
  };

  const activeCommentPost = posts.find((p) => p.id === commentPostId) ?? null;

  return (
    <div
      onWheel={handleWheelFeed}
      className="relative w-full h-full min-h-[640px] bg-[#090514] text-white overflow-hidden select-none flex flex-col"
    >
      {/* Top Feed Tabs: For You | Following | Explore */}
      <div className="absolute top-0 inset-x-0 z-20 pt-3 pb-2 px-4 bg-gradient-to-b from-black/75 via-black/35 to-transparent flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-4">
          {(['For You', 'Following', 'Explore'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (tab === 'Explore') {
                  onOpenExploreTab();
                } else {
                  setFeedTab(tab);
                  setActiveIndex(0);
                }
              }}
              className={`relative text-sm font-display font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 ${
                feedTab === tab ? 'text-white' : 'text-white/60 hover:text-white/90'
              }`}
            >
              {tab}
              {feedTab === tab && (
                <span className="absolute bottom-0 inset-x-1 h-0.5 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF]" />
              )}
            </button>
          ))}
        </div>

        {/* Next / Previous Vertical Swipe Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous video or photo"
            onClick={() => handleStepPost(-1)}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/15 cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Next video or photo"
            onClick={() => handleStepPost(1)}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/15 cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Media Stage (Mouse Wheel, Trackpad & Touch Swipe Vertical Scroll Across All Tabs) */}
      {!activePost ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
          <p className="font-display text-lg font-bold text-white">No posts in Following yet</p>
          <p className="text-xs text-purple-200/75 max-w-xs">
            Follow Nepali creators in For You or Explore to see their videos, reels, and photos here.
          </p>
          <button
            type="button"
            onClick={() => setFeedTab('For You')}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs font-bold cursor-pointer"
          >
            Switch to For You
          </button>
        </div>
      ) : (
        <div
          tabIndex={0}
          className="relative flex-1 w-full h-full overflow-hidden cursor-pointer focus:outline-none touch-none"
          onClick={handleMediaTap}
          onTouchStart={handleTouchStartFeed}
          onTouchMove={handleTouchMoveFeed}
          onTouchEnd={handleTouchEndFeed}
          onKeyDown={(e) => {
            if (isOverlayOpen) return;
            if (e.key === 'ArrowDown' || e.key === 'PageDown') {
              e.preventDefault();
              handleStepPost(1);
            } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
              e.preventDefault();
              handleStepPost(-1);
            }
          }}
          data-testid="home-feed-stage"
          data-active-post-id={activePost.id}
        >
          <div
            key={activePost.id}
            className="w-full h-full transition-transform duration-200 ease-out"
            style={{
              transform: dragOffsetY !== 0 ? `translateY(${dragOffsetY}px)` : undefined,
            }}
          >
            {isVideoFileUrl(activePost.mediaUrl) ? (
              <video
                key={activePost.id}
                src={activePost.mediaUrl}
                poster={activePost.thumbnailUrl}
                autoPlay
                playsInline
                loop
                muted={muted}
                className="w-full h-full object-cover"
                style={{ filter: activePost.cssFilter || 'none' }}
              />
            ) : (
              <img
                src={activePost.mediaUrl}
                alt={activePost.caption}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-300"
                style={{ filter: activePost.cssFilter || 'none' }}
              />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#090514]/95 via-transparent to-black/35 pointer-events-none" />

          {/* Post Type Indicator (Video / Reel / Photo) */}
          <div className="absolute top-14 left-4 flex items-center gap-2 text-[11px] font-semibold text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
            {activePost.type === 'photo' ? (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-[#FF0080]" />
                <span>Photo Post</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#FF0080] fill-[#FF0080]" />
                <span>{activePost.type === 'reel' ? 'Reel' : 'Video'}</span>
              </>
            )}
            <span className="text-white/50">·</span>
            <span className="tabular-nums">{safeIndex + 1}/{visibleList.length}</span>
          </div>

          {/* Double-Tap Heart Animation */}
          {doubleTapHeart && (
            <div
              key={doubleTapHeart.id}
              className="absolute z-30 pointer-events-none animate-ping"
              style={{ left: doubleTapHeart.x - 36, top: doubleTapHeart.y - 36 }}
            >
              <Heart className="w-20 h-20 text-[#FF0080] fill-[#FF0080] drop-shadow-[0_0_24px_rgba(255,0,128,0.9)]" />
            </div>
          )}

          {/* Right-Side Vertical Action Stack */}
          <div
            className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-3.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Creator Avatar + Quick Follow Badge */}
            <div className="relative mb-1">
              <div
                className="w-11 h-11 rounded-full border-2 border-[#FF0080] flex items-center justify-center font-display font-extrabold text-sm text-white shadow-lg"
                style={{ backgroundColor: activePost.authorAvatarColor }}
              >
                {activePost.authorName.slice(0, 2).toUpperCase()}
              </div>
              {activePost.authorId !== currentUserId && (
                <button
                  type="button"
                  aria-label={
                    followingIds.includes(activePost.authorId)
                      ? `Unfollow ${activePost.authorHandle}`
                      : `Follow ${activePost.authorHandle}`
                  }
                  onClick={() => onToggleFollow(activePost.authorId)}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#FF0080] border border-white flex items-center justify-center text-white cursor-pointer"
                >
                  {followingIds.includes(activePost.authorId) ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            {/* Like */}
            <button
              type="button"
              aria-label="Like post"
              onClick={() => onToggleLike(activePost.id)}
              className="flex flex-col items-center gap-0.5 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center hover:scale-105 transition-transform">
                <Heart
                  className={`w-6 h-6 ${
                    activePost.likedByMe ? 'text-[#FF0080] fill-[#FF0080]' : 'text-white'
                  }`}
                />
              </div>
              <span className="text-[11px] font-bold tabular-nums">
                {activePost.likes.toLocaleString()}
              </span>
            </button>

            {/* Comment */}
            <button
              type="button"
              aria-label="Open comments"
              onClick={() => setCommentPostId(activePost.id)}
              className="flex flex-col items-center gap-0.5 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center hover:scale-105 transition-transform">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-[11px] font-bold tabular-nums">
                {activePost.comments.length}
              </span>
            </button>

            {/* Gift */}
            <button
              type="button"
              aria-label="Send gift to creator"
              onClick={() => onOpenGiftForPost(activePost)}
              className="flex flex-col items-center gap-0.5 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF0080]/80 to-[#9D00FF]/80 border border-pink-300/40 shadow-[0_0_16px_rgba(255,0,128,0.45)] flex items-center justify-center hover:scale-105 transition-transform">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-bold tabular-nums text-amber-300">
                {activePost.giftsReceivedCoins.toLocaleString()} N
              </span>
            </button>

            {/* Repost */}
            <button
              type="button"
              aria-label="Repost"
              onClick={() => onToggleRepost(activePost.id)}
              className="flex flex-col items-center gap-0.5 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center hover:scale-105 transition-transform">
                <Repeat2
                  className={`w-6 h-6 ${
                    activePost.repostedByMe ? 'text-emerald-400' : 'text-white'
                  }`}
                />
              </div>
              <span className="text-[11px] font-bold tabular-nums">
                {activePost.reposts.toLocaleString()}
              </span>
            </button>

            {/* Share */}
            <button
              type="button"
              aria-label="Share post"
              onClick={() => {
                setSharePost(activePost);
                setSentFriends([]);
              }}
              className="flex flex-col items-center gap-0.5 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center hover:scale-105 transition-transform">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-bold">Share</span>
            </button>

            {/* Three-Dot Menu (...) */}
            <button
              type="button"
              aria-label="Post options menu"
              onClick={() => setMenuPost(activePost)}
              className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/15 cursor-pointer"
            >
              <MoreHorizontal className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Bottom-Left Creator Info, Caption, and Original Sound Attribution Bar */}
          <div
            className="absolute left-4 right-20 bottom-6 z-20 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-base text-white">
                @{activePost.authorHandle}
              </span>
              {activePost.authorVerified && (
                <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                  ✓
                </span>
              )}
              <span className="text-xs text-purple-200/80">· {activePost.visibility}</span>
            </div>

            <p className="text-xs sm:text-sm text-white/95 leading-snug line-clamp-2">
              {activePost.caption}{' '}
              <span className="text-pink-300 font-semibold">
                {activePost.hashtags.join(' ')}
              </span>
            </p>

            {/* Original Sound & Uploader Attribution Bar directly below creator profile & caption */}
            <button
              type="button"
              onClick={() => setSoundDetail(activePost.sound)}
              className="w-full max-w-xs flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/15 hover:border-[#FF0080]/60 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF0080] to-[#9D00FF] flex items-center justify-center shrink-0 animate-disc-spin">
                <Music2 className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 overflow-hidden text-left">
                <div className="whitespace-nowrap text-[11px] font-semibold text-white/95 truncate">
                  Original Sound – Uploaded by @{activePost.sound.originalUploaderHandle} ·{' '}
                  {activePost.sound.title}
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Comment Drawer */}
      {activeCommentPost && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-[#140A26] border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-display font-bold text-sm">
                Comments ({activeCommentPost.comments.length})
              </h3>
              <button
                type="button"
                aria-label="Close comments"
                onClick={() => setCommentPostId(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {activeCommentPost.comments.length === 0 ? (
                <p className="text-xs text-purple-200/70 text-center py-6">
                  Be the first to comment on this post!
                </p>
              ) : (
                activeCommentPost.comments.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-pink-300">
                        @{c.authorHandle}{' '}
                        <span className="text-purple-300/60 font-normal">· {c.createdAt}</span>
                      </p>
                      <p className="text-sm text-white mt-0.5">{c.text}</p>
                    </div>
                    <span className="text-[11px] text-purple-200/70 tabular-nums">♥ {c.likes}</span>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!commentText.trim()) return;
                onAddComment(activeCommentPost.id, commentText.trim());
                setCommentText('');
              }}
              className="pt-3 border-t border-white/10 flex items-center gap-2"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment (AI-moderated)..."
                className="flex-1 h-10 px-4 rounded-full bg-[#090514] border border-purple-500/35 text-xs text-white focus:outline-none focus:border-[#FF0080]"
              />
              <button
                type="submit"
                className="px-4 h-10 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs font-bold cursor-pointer"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Share Sheet (In-App Friends + Visual Brand Icons) */}
      {sharePost && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-[#140A26] border border-[#FF0080]/30 rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base">Share Post</h3>
              <button
                type="button"
                aria-label="Close share sheet"
                onClick={() => setSharePost(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top Row: Send to NepTok Friends */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-purple-100">Send to NepTok Friends</p>
                <div className="relative w-44">
                  <Search className="w-3.5 h-3.5 text-purple-300/60 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full h-7 pl-8 pr-2 rounded-full bg-[#090514] border border-white/15 text-[11px] text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {chats
                  .filter((c) =>
                    c.name.toLowerCase().includes(friendSearch.toLowerCase())
                  )
                  .map((chat) => {
                    const alreadySent = sentFriends.includes(chat.id);
                    return (
                      <div
                        key={chat.id}
                        className="flex flex-col items-center gap-1.5 min-w-[78px] p-2 rounded-2xl bg-[#1D0F36] border border-white/10"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF0080] to-[#9D00FF] flex items-center justify-center font-bold text-xs">
                          {chat.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-semibold truncate max-w-[70px]">
                          {chat.name.split(' ')[0]}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!alreadySent) {
                              onSendToFriend(chat.id, sharePost);
                              setSentFriends((prev) => [...prev, chat.id]);
                            }
                          }}
                          className={`w-full py-1 rounded-full text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                            alreadySent
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-[#FF0080] text-white'
                          }`}
                        >
                          {alreadySent ? <Check className="w-3 h-3" /> : <Send className="w-2.5 h-2.5" />}
                          <span>{alreadySent ? 'Sent' : 'Send'}</span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Bottom Row: Visual Brand Icons & Labels */}
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs font-bold text-purple-100 mb-3">Share Externally &amp; Stories</p>
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { label: 'Facebook', bg: '#1877F2', icon: 'f' },
                  { label: 'WhatsApp', bg: '#25D366', icon: 'W' },
                  { label: 'Instagram', bg: 'linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)', icon: 'IG' },
                  { label: 'Messenger', bg: '#00B2FF', icon: '⚡' },
                  { label: 'TikTok', bg: '#111827', icon: '♪' },
                  { label: 'Copy Link', bg: '#334155', icon: '🔗' },
                  { label: 'Other Social Media', bg: '#6D28D9', icon: '↗' },
                  { label: 'Create Story (48h)', bg: '#FF0080', icon: '48h' },
                ].map((platform) => (
                  <button
                    key={platform.label}
                    type="button"
                    onClick={() => {
                      if (platform.label === 'Create Story (48h)') {
                        onAddToStory48h(sharePost);
                      } else if (platform.label === 'Copy Link') {
                        navigator.clipboard?.writeText(`https://neptok.com/p/${sharePost.id}`).catch(() => {});
                        onNotify(`Copied link for @${sharePost.authorHandle}'s post`);
                      } else {
                        onNotify(`Shared to ${platform.label}`);
                      }
                      setSharePost(null);
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                      style={{ background: platform.bg }}
                    >
                      {platform.icon}
                    </span>
                    <span className="text-[10px] font-medium text-purple-100 text-center leading-tight">
                      {platform.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Three-Dot Menu (...) – Granular Privacy, Duet, Ad Settings & Owner/Viewer Controls */}
      {menuPost && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-[#140A26] border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base">
                {menuPost.authorId === currentUserId ? 'Creator Post Controls' : 'Post Options'}
              </h3>
              <button
                type="button"
                aria-label="Close post menu"
                onClick={() => setMenuPost(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {menuPost.authorId === currentUserId ? (
              <div className="space-y-4">
                {/* 4 Granular Privacy Visibility Options */}
                <div className="p-3.5 rounded-2xl bg-[#1C0F33] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Shield className="w-4 h-4 text-[#FF0080]" />
                    <span>Privacy Settings (Visibility)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { val: 'Everyone', label: 'Everyone (Public)' },
                        { val: 'Friends', label: 'Friends' },
                        { val: 'Followers', label: 'Following / Followers' },
                        { val: 'Private', label: 'Private (Only Me)' },
                      ] as Array<{ val: PostVisibility; label: string }>
                    ).map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => {
                          onUpdatePost(menuPost.id, { visibility: opt.val });
                          setMenuPost({ ...menuPost, visibility: opt.val });
                          onNotify(`Visibility updated to ${opt.label}`);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border cursor-pointer ${
                          menuPost.visibility === opt.val
                            ? 'bg-[#FF0080]/20 border-[#FF0080] text-white'
                            : 'bg-[#090514] border-white/10 text-purple-200/80'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duet, Ad Settings, Comments, Sharing Toggles */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: 'Allow Others to Duet',
                      val: menuPost.allowDuet,
                      key: 'allowDuet' as const,
                    },
                    {
                      label: 'Ad Settings (Monetize)',
                      val: menuPost.adSettingsEnabled,
                      key: 'adSettingsEnabled' as const,
                    },
                    {
                      label: 'Manage Comments',
                      val: menuPost.allowComments,
                      key: 'allowComments' as const,
                    },
                    {
                      label: 'Manage Sharing',
                      val: menuPost.allowSharing,
                      key: 'allowSharing' as const,
                    },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        const next = !item.val;
                        onUpdatePost(menuPost.id, { [item.key]: next });
                        setMenuPost({ ...menuPost, [item.key]: next });
                      }}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#1C0F33] border border-white/10 text-xs font-semibold cursor-pointer"
                    >
                      <span className="truncate">{item.label}</span>
                      <span className={item.val ? 'text-emerald-400' : 'text-slate-400'}>
                        {item.val ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      const target = menuPost;
                      setMenuPost(null);
                      onEditOwnPost(target);
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-[#FF0080]" />
                    <span>Edit Video / Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCaptionPost(menuPost);
                      setCaptionDraft(menuPost.caption);
                      setMenuPost(null);
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#9D00FF]" />
                    <span>Change Caption</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdatePost(menuPost.id, {
                        mediaUrl: '/src/assets/images/creator_pokhara_lake_1794926294810.jpg',
                      });
                      onNotify('Cover thumbnail replaced');
                      setMenuPost(null);
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-sky-400" />
                    <span>Replace Thumbnail</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onAddToStory48h(menuPost);
                      setMenuPost(null);
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#FF0080]" />
                    <span>Add to Story (48h)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdatePost(menuPost.id, { isDraft: true });
                      onNotify('Saved post to Drafts');
                      setMenuPost(null);
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4 text-amber-400" />
                    <span>Save to Draft</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeletePost(menuPost.id);
                      setMenuPost(null);
                    }}
                    className="p-3 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Post</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    onToggleSave(menuPost.id);
                    onNotify(menuPost.savedByMe ? 'Removed from Saved' : 'Saved post');
                    setMenuPost(null);
                  }}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-[#FF0080]" />
                  <span>{menuPost.savedByMe ? 'Unsave Post' : 'Save Video / Photo'}</span>
                </button>
                {menuPost.allowDownload && (
                  <button
                    type="button"
                    onClick={() => {
                      onNotify(`Downloading @${menuPost.authorHandle}'s media...`);
                      setMenuPost(null);
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-sky-400" />
                    <span>Download</span>
                  </button>
                )}
                {menuPost.allowDuet && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = menuPost;
                      setMenuPost(null);
                      onStartDuet(target);
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#9D00FF]" />
                    <span>Duet</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onToggleRepost(menuPost.id);
                    setMenuPost(null);
                  }}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                >
                  <Repeat2 className="w-4 h-4 text-emerald-400" />
                  <span>Repost</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`https://neptok.com/p/${menuPost.id}`).catch(() => {});
                    onNotify('Post link copied');
                    setMenuPost(null);
                  }}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-purple-300" />
                  <span>Copy Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNotify('Marked Not Interested');
                    setMenuPost(null);
                    handleStepPost(1);
                  }}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                >
                  <EyeOff className="w-4 h-4 text-amber-400" />
                  <span>Not Interested</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNotify('Content reported to AI Moderation Queue');
                    setMenuPost(null);
                  }}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                >
                  <Flag className="w-4 h-4 text-amber-400" />
                  <span>Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onBlockUser(menuPost.authorId, menuPost.authorHandle);
                    setMenuPost(null);
                  }}
                  className="p-3 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 flex items-center gap-2 cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>Block @{menuPost.authorHandle}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Caption Dialog */}
      {editingCaptionPost && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#140A26] border border-white/15 p-5 space-y-4">
            <h3 className="font-display font-bold text-base">Edit Caption</h3>
            <textarea
              rows={3}
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              className="w-full rounded-2xl bg-[#090514] border border-purple-500/35 p-3 text-sm text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCaptionPost(null)}
                className="px-4 py-2 rounded-full bg-white/10 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdatePost(editingCaptionPost.id, { caption: captionDraft });
                  setEditingCaptionPost(null);
                  onNotify('Caption updated');
                }}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs font-bold cursor-pointer"
              >
                Save Caption
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Original Sound Detail Page */}
      {soundDetail && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#140A26] border border-[#FF0080]/40 p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF0080] to-[#9D00FF] flex items-center justify-center shadow-lg">
                  <Music2 className="w-8 h-8 text-white animate-disc-spin" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#FF0080] uppercase">
                    Original Sound Detail
                  </span>
                  <h3 className="font-display font-bold text-base text-white leading-tight mt-0.5">
                    {soundDetail.title}
                  </h3>
                  <p className="text-xs text-purple-200/80 mt-1">
                    Originally Uploaded by{' '}
                    <strong className="text-white">@{soundDetail.originalUploaderHandle}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close Original Sound Detail"
                onClick={() => setSoundDetail(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#090514] border border-white/10 text-xs">
              <div>
                <p className="text-purple-300/70">Total Videos Using Sound</p>
                <p className="font-mono font-bold text-white text-sm tabular-nums mt-0.5">
                  {soundDetail.usesCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-purple-300/70">Audio Duration</p>
                <p className="font-mono font-bold text-white text-sm tabular-nums mt-0.5">
                  0:{soundDetail.durationSec.toString().padStart(2, '0')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onToggleSaveSound(soundDetail.id);
                  setSoundDetail({ ...soundDetail, saved: !soundDetail.saved });
                }}
                className="h-11 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bookmark
                  className={`w-4 h-4 ${soundDetail.saved ? 'text-[#FF0080] fill-[#FF0080]' : ''}`}
                />
                <span>{soundDetail.saved ? 'Saved Sound' : 'Save Sound'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = soundDetail;
                  setSoundDetail(null);
                  onUseOriginalSound(s);
                }}
                className="h-11 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-[#FF0080]/30 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Use This Sound</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

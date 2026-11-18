import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Gift,
  Repeat2,
  Share2,
  MoreVertical,
  Plus,
  Check,
  Music2,
  ChevronUp,
  ChevronDown,
  Bookmark,
  Download,
  Copy,
  Shield,
  Trash2,
  Edit3,
  Lock,
  Globe,
  Search,
  Send,
  X,
  Volume2,
  VolumeX,
  Play,
  Image as ImageIcon,
} from 'lucide-react';
import type { FeedPost, ChatThread } from '../types/neptok';

interface ProfileGridVideoPlayerModalProps {
  isOpen: boolean;
  posts: FeedPost[];
  initialPostId: string | null;
  currentUserId: string;
  followingIds: string[];
  chats: ChatThread[];
  onClose: () => void;
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
  onNotify: (msg: string) => void;
}

export const ProfileGridVideoPlayerModal: React.FC<ProfileGridVideoPlayerModalProps> = ({
  isOpen,
  posts,
  initialPostId,
  currentUserId,
  followingIds,
  chats,
  onClose,
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
  onNotify,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ x: number; y: number; id: number } | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [sentFriends, setSentFriends] = useState<string[]>([]);
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [captionDraft, setCaptionDraft] = useState('');
  const [tagsDraft, setTagsDraft] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  const lastTapRef = useRef(0);
  const wheelLockRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isOpen || !initialPostId) return;
    const idx = posts.findIndex((p) => p.id === initialPostId);
    setActiveIndex(idx >= 0 ? idx : 0);
    setCommentOpen(false);
    setShareOpen(false);
    setOwnerMenuOpen(false);
    setEditDetailsOpen(false);
    setConfirmDeleteOpen(false);
  }, [isOpen, initialPostId]);

  if (!isOpen || posts.length === 0) return null;

  const safeIndex = Math.min(activeIndex, posts.length - 1);
  const activePost = posts[safeIndex];
  const isOwner = activePost.authorId === currentUserId;
  const isModalBusy = commentOpen || shareOpen || ownerMenuOpen || editDetailsOpen || confirmDeleteOpen;

  const isVideoFileUrl = (url: string) =>
    url.startsWith('data:video/') || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

  const stepPost = (delta: number) => {
    if (posts.length <= 1) return;
    setActiveIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return posts.length - 1;
      if (next >= posts.length) return 0;
      return next;
    });
  };

  const handleMediaTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDoubleTapHeart({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: now });
      if (!activePost.likedByMe) onToggleLike(activePost.id);
      setTimeout(() => setDoubleTapHeart(null), 850);
    }
    lastTapRef.current = now;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isModalBusy || posts.length <= 1) return;
    if (Math.abs(e.deltaY) < 10 || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    const now = Date.now();
    if (now - wheelLockRef.current < 340) return;
    wheelLockRef.current = now;
    stepPost(e.deltaY > 0 ? 1 : -1);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isModalBusy || e.touches.length === 0) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || isModalBusy || e.touches.length === 0) return;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    if (Math.abs(dy) > Math.abs(dx)) {
      setDragOffsetY(Math.max(-72, Math.min(72, dy * 0.35)));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    setDragOffsetY(0);
    if (!start || isModalBusy || e.changedTouches.length === 0) return;
    const dy = e.changedTouches[0].clientY - start.y;
    const dx = e.changedTouches[0].clientX - start.x;
    if (Math.abs(dy) > 36 && Math.abs(dy) > Math.abs(dx)) {
      stepPost(dy < 0 ? 1 : -1);
    }
  };

  return (
    <div
      data-testid="profile-fullscreen-player"
      data-active-post-id={activePost.id}
      className="fixed inset-0 z-50 bg-[#090514] text-white flex items-center justify-center"
    >
      <div
        tabIndex={0}
        onClick={handleMediaTap}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={(e) => {
          if (isModalBusy) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            stepPost(1);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            stepPost(-1);
          } else if (e.key === 'Escape') {
            onClose();
          }
        }}
        className="relative w-full max-w-[460px] h-full max-h-[100dvh] bg-black overflow-hidden select-none focus:outline-none touch-none"
      >
        {/* Top Controls: Close, Mute, Index, Up/Down Scroll */}
        <div
          className="absolute top-0 inset-x-0 z-20 p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Close video player"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/15 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label={muted ? 'Unmute video' : 'Mute video'}
              onClick={() => setMuted((m) => !m)}
              className="w-9 h-9 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/15 cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[11px] font-bold">
            {activePost.type === 'photo' ? (
              <ImageIcon className="w-3.5 h-3.5 text-[#FF0080]" />
            ) : (
              <Play className="w-3.5 h-3.5 text-[#FF0080] fill-[#FF0080]" />
            )}
            <span className="tabular-nums">
              {safeIndex + 1} / {posts.length}
            </span>
            {activePost.visibility === 'Private' && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-[#FF0080]/30 text-pink-200 flex items-center gap-0.5 text-[10px]">
                <Lock className="w-2.5 h-2.5" /> Private
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous profile video"
              onClick={() => stepPost(-1)}
              className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/15 cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Next profile video"
              onClick={() => stepPost(1)}
              className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/15 cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Full-Screen Media Canvas */}
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
              className="w-full h-full object-cover"
              style={{ filter: activePost.cssFilter || 'none' }}
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#090514]/95 via-transparent to-black/35 pointer-events-none" />

        {doubleTapHeart && (
          <div
            key={doubleTapHeart.id}
            className="absolute z-30 pointer-events-none animate-ping"
            style={{ left: doubleTapHeart.x - 36, top: doubleTapHeart.y - 36 }}
          >
            <Heart className="w-20 h-20 text-[#FF0080] fill-[#FF0080]" />
          </div>
        )}

        {/* Homepage-Style Right Action Stack (Like, Comment, Share, Repost, Gift, ⋮ Menu) */}
        <div
          className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Creator Avatar + Follow */}
          <div className="relative mb-1">
            <div
              className="w-11 h-11 rounded-full border-2 border-[#FF0080] flex items-center justify-center font-display font-extrabold text-sm text-white shadow-lg"
              style={{ backgroundColor: activePost.authorAvatarColor }}
            >
              {activePost.authorName.slice(0, 2).toUpperCase()}
            </div>
            {!isOwner && (
              <button
                type="button"
                aria-label={followingIds.includes(activePost.authorId) ? 'Unfollow' : 'Follow'}
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

          <button
            type="button"
            aria-label="Like video"
            onClick={() => onToggleLike(activePost.id)}
            className="flex flex-col items-center gap-0.5 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center">
              <Heart
                className={`w-6 h-6 ${activePost.likedByMe ? 'text-[#FF0080] fill-[#FF0080]' : 'text-white'}`}
              />
            </div>
            <span className="text-[11px] font-bold tabular-nums">{activePost.likes.toLocaleString()}</span>
          </button>

          <button
            type="button"
            aria-label="Open comments"
            onClick={() => setCommentOpen(true)}
            className="flex flex-col items-center gap-0.5 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-[11px] font-bold tabular-nums">{activePost.comments.length}</span>
          </button>

          <button
            type="button"
            aria-label="Send gift"
            onClick={() => onOpenGiftForPost(activePost)}
            className="flex flex-col items-center gap-0.5 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF0080]/80 to-[#9D00FF]/80 border border-pink-300/40 flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] font-bold tabular-nums text-amber-300">
              {activePost.giftsReceivedCoins.toLocaleString()} N
            </span>
          </button>

          <button
            type="button"
            aria-label="Repost video"
            onClick={() => onToggleRepost(activePost.id)}
            className="flex flex-col items-center gap-0.5 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center">
              <Repeat2
                className={`w-6 h-6 ${activePost.repostedByMe ? 'text-emerald-400' : 'text-white'}`}
              />
            </div>
            <span className="text-[11px] font-bold tabular-nums">{activePost.reposts.toLocaleString()}</span>
          </button>

          <button
            type="button"
            aria-label="Share video"
            onClick={() => {
              setSentFriends([]);
              setShareOpen(true);
            }}
            className="flex flex-col items-center gap-0.5 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] font-bold">Share</span>
          </button>

          <button
            type="button"
            aria-label="More video controls"
            onClick={() => setOwnerMenuOpen(true)}
            className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/15 cursor-pointer"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Bottom-Left Creator Info, Caption, Hashtags & Sound */}
        <div
          className="absolute left-4 right-20 bottom-6 z-20 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold text-base text-white">@{activePost.authorHandle}</span>
            {activePost.authorVerified && (
              <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                ✓
              </span>
            )}
            <span className="text-xs text-purple-200/80">· {activePost.visibility}</span>
          </div>

          <p className="text-xs sm:text-sm text-white/95 leading-snug line-clamp-2">
            {activePost.caption}{' '}
            <span className="text-pink-300 font-semibold">{activePost.hashtags.join(' ')}</span>
          </p>

          <div className="w-full max-w-xs flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/15">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF0080] to-[#9D00FF] flex items-center justify-center shrink-0">
              <Music2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[11px] font-semibold text-white/95 truncate">
              Original Sound – @{activePost.sound.originalUploaderHandle} · {activePost.sound.title}
            </span>
          </div>
        </div>
      </div>

      {/* Comments Drawer */}
      {commentOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-[#140A26] border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-display font-bold text-sm">
                Comments ({activePost.comments.length})
              </h3>
              <button
                type="button"
                aria-label="Close comments"
                onClick={() => setCommentOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {activePost.comments.length === 0 ? (
                <p className="text-xs text-purple-200/70 text-center py-6">
                  Be the first to comment on this video!
                </p>
              ) : (
                activePost.comments.map((c) => (
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
                onAddComment(activePost.id, commentText.trim());
                setCommentText('');
              }}
              className="pt-3 border-t border-white/10 flex items-center gap-2"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
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

      {/* Share Sheet */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-[#140A26] border border-[#FF0080]/30 rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base">Share Post</h3>
              <button
                type="button"
                aria-label="Close share sheet"
                onClick={() => setShareOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
                  .filter((c) => c.name.toLowerCase().includes(friendSearch.toLowerCase()))
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
                              onSendToFriend(chat.id, activePost);
                              setSentFriends((prev) => [...prev, chat.id]);
                            }
                          }}
                          className={`w-full py-1 rounded-full text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                            alreadySent ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#FF0080] text-white'
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
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`https://neptok.com/p/${activePost.id}`).catch(() => {});
                  onNotify('Copied link');
                  setShareOpen(false);
                }}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[11px] font-bold cursor-pointer"
              >
                Copy Link
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddToStory48h(activePost);
                  setShareOpen(false);
                }}
                className="p-2.5 rounded-2xl bg-[#FF0080]/20 border border-[#FF0080]/40 text-[11px] font-bold cursor-pointer"
              >
                Add to Story (48h)
              </button>
              <button
                type="button"
                onClick={() => {
                  onNotify('Shared externally');
                  setShareOpen(false);
                }}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[11px] font-bold cursor-pointer"
              >
                Share Social
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner & Viewer More Controls (⋮) */}
      {ownerMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-[#140A26] border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base">
                {isOwner ? 'Owner Video Controls' : 'Video Options'}
              </h3>
              <button
                type="button"
                aria-label="Close video options"
                onClick={() => setOwnerMenuOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isOwner ? (
              <div className="space-y-2.5 text-xs">
                {/* Public / Private Privacy Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVis = activePost.visibility === 'Private' ? 'Everyone' : 'Private';
                    onUpdatePost(activePost.id, { visibility: nextVis });
                    onNotify(
                      nextVis === 'Private'
                        ? 'Video set to Private (Only Me)'
                        : 'Video set to Public (Everyone)'
                    );
                    setOwnerMenuOpen(false);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-[#1C0F33] border border-white/10 hover:border-[#FF0080] flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2.5 font-bold">
                    {activePost.visibility === 'Private' ? (
                      <Globe className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-[#FF0080]" />
                    )}
                    <span>
                      {activePost.visibility === 'Private'
                        ? 'Make Public (Everyone)'
                        : 'Make Private (Only Me)'}
                    </span>
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activePost.visibility === 'Private'
                        ? 'bg-[#FF0080]/25 text-pink-200'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {activePost.visibility === 'Private' ? 'Private' : 'Public'}
                  </span>
                </button>

                {/* Edit Details (Caption & Tags) */}
                <button
                  type="button"
                  onClick={() => {
                    setCaptionDraft(activePost.caption);
                    setTagsDraft(activePost.hashtags.join(' '));
                    setOwnerMenuOpen(false);
                    setEditDetailsOpen(true);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-[#1C0F33] border border-white/10 hover:border-[#9D00FF] flex items-center gap-2.5 font-bold cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-[#9D00FF]" />
                  <span>Edit Details (Caption &amp; Tags)</span>
                </button>

                {/* Delete Video (Triggers Confirmation Prompt) */}
                <button
                  type="button"
                  onClick={() => {
                    setOwnerMenuOpen(false);
                    setConfirmDeleteOpen(true);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/35 hover:bg-rose-500/25 flex items-center gap-2.5 font-bold text-rose-300 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Video</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    onToggleSave(activePost.id);
                    onNotify(activePost.savedByMe ? 'Removed from Saved' : 'Saved video');
                    setOwnerMenuOpen(false);
                  }}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-[#FF0080]" />
                  <span>{activePost.savedByMe ? 'Unsave' : 'Save Video'}</span>
                </button>
                {activePost.allowDownload && (
                  <button
                    type="button"
                    onClick={() => {
                      onNotify(`Downloading @${activePost.authorHandle}'s video...`);
                      setOwnerMenuOpen(false);
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-sky-400" />
                    <span>Download</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`https://neptok.com/p/${activePost.id}`).catch(() => {});
                    onNotify('Copied link');
                    setOwnerMenuOpen(false);
                  }}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-purple-300" />
                  <span>Copy Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNotify('Reported to AI Safety Queue');
                    setOwnerMenuOpen(false);
                  }}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Report</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Owner Edit Details Modal (Caption & Tags) */}
      {editDetailsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#140A26] border border-[#9D00FF]/40 p-5 space-y-4">
            <h3 className="font-display font-bold text-base">Edit Video Details</h3>
            <label className="block space-y-1 text-xs">
              <span className="text-purple-200 font-semibold">Caption</span>
              <textarea
                rows={3}
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
                className="w-full rounded-2xl bg-[#090514] border border-white/15 p-3 text-xs text-white focus:outline-none focus:border-[#FF0080]"
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="text-purple-200 font-semibold">Hashtags / Tags (space separated)</span>
              <input
                type="text"
                value={tagsDraft}
                onChange={(e) => setTagsDraft(e.target.value)}
                placeholder="#NepTok #Nepal #Creator"
                className="w-full h-10 rounded-xl bg-[#090514] border border-white/15 px-3 text-xs text-white focus:outline-none focus:border-[#FF0080]"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditDetailsOpen(false)}
                className="px-4 py-2 rounded-full bg-white/10 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsedHashtags = tagsDraft
                    .split(/[\s,]+/)
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((t) => (t.startsWith('#') ? t : `#${t}`));
                  onUpdatePost(activePost.id, {
                    caption: captionDraft,
                    hashtags: parsedHashtags.length > 0 ? parsedHashtags : activePost.hashtags,
                    tags: parsedHashtags.map((h) => h.replace(/^#/, '')),
                  });
                  setEditDetailsOpen(false);
                  onNotify('Updated video details');
                }}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs font-bold cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner Delete Video Confirmation Prompt */}
      {confirmDeleteOpen && (
        <div
          data-testid="confirm-delete-video-dialog"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#140A26] border border-rose-500/45 p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-300">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-display font-bold text-base text-white">Delete Video Permanently?</h3>
            </div>
            <p className="text-xs text-purple-200/85 leading-relaxed">
              This will permanently remove this video from your profile and NepTok feed. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="px-4 py-2 rounded-full bg-white/10 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = activePost.id;
                  const remainingCount = posts.length - 1;
                  setConfirmDeleteOpen(false);
                  onDeletePost(targetId);
                  if (remainingCount <= 0) {
                    onClose();
                  } else if (safeIndex >= remainingCount) {
                    setActiveIndex(Math.max(0, remainingCount - 1));
                  }
                }}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer"
              >
                Delete Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

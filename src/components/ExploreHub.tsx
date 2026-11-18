import React, { useState } from 'react';
import { Search, Mic, Flame, Music2, Radio, UserPlus, Check, Play, X, ChevronLeft } from 'lucide-react';
import type { ChatThread, FeedPost, OriginalSound } from '../types/neptok';
import { ProfileGridVideoPlayerModal } from './ProfileGridVideoPlayerModal';

interface ExploreHubProps {
  posts: FeedPost[];
  currentUserId: string;
  followingIds: string[];
  chats: ChatThread[];
  onToggleFollow: (userId: string) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onToggleRepost: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenGiftForPost: (post: FeedPost) => void;
  onUpdatePost: (postId: string, patch: Partial<FeedPost>) => void;
  onDeletePost: (postId: string) => void;
  onSendToFriend: (chatId: string, post: FeedPost) => void;
  onAddToStory48h: (post: FeedPost) => void;
  onUseSound: (sound: OriginalSound) => void;
  onOpenLive: () => void;
  onOpenFeedPost: () => void;
  onNotify: (msg: string) => void;
}

const CATEGORIES = ['All', 'Travel', 'Dance', 'Music', 'Food', 'Comedy', 'Himalayas', 'Gaming'];

export const ExploreHub: React.FC<ExploreHubProps> = ({
  posts,
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
  onSendToFriend,
  onAddToStory48h,
  onUseSound,
  onOpenLive,
  onNotify,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedCreator, setSelectedCreator] = useState<{
    id: string;
    name: string;
    handle: string;
    followers: string;
  } | null>(null);
  const [playerConfig, setPlayerConfig] = useState<{
    postId: string;
    list: FeedPost[];
  } | null>(null);

  const suggestedCreators = [
    { id: 'u_sita', name: 'Sita Tamang', handle: 'sita_kathmandu', followers: '48.2K' },
    { id: 'u_binod', name: 'Binod Sherpa', handle: 'everest_binod', followers: '19.4K' },
    { id: 'u_maya', name: 'Maya Pun', handle: 'pokhara_maya', followers: '32.1K' },
  ];

  const filteredPosts = posts.filter((p) => {
    const matchesQuery =
      !query.trim() ||
      p.caption.toLowerCase().includes(query.toLowerCase()) ||
      p.authorHandle.toLowerCase().includes(query.toLowerCase()) ||
      p.hashtags.some((h) => h.toLowerCase().includes(query.toLowerCase()));
    const matchesCat =
      category === 'All' ||
      p.caption.toLowerCase().includes(category.toLowerCase()) ||
      p.hashtags.some((h) => h.toLowerCase().includes(category.toLowerCase()));
    return matchesQuery && matchesCat;
  });

  const creatorPosts = selectedCreator
    ? posts.filter((p) => p.authorId === selectedCreator.id)
    : [];

  return (
    <div className="w-full h-full min-h-[640px] bg-[#090514] text-white overflow-y-auto p-4 space-y-5">
      {/* Search + Voice Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-purple-300/70 absolute left-3.5 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Nepal trends, sounds, creators..."
            className="w-full h-10 pl-10 pr-10 rounded-full bg-[#140A26] border border-white/15 text-xs text-white focus:outline-none focus:border-[#FF0080]"
          />
          <button
            type="button"
            aria-label="Voice Search"
            onClick={() => {
              setQuery('Everest');
              onNotify('Voice search recognized: "Everest"');
            }}
            className="absolute right-2.5 top-2 p-1 rounded-full hover:bg-white/10 text-[#FF0080] cursor-pointer"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
              category === cat
                ? 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white'
                : 'bg-[#140A26] border border-white/10 text-purple-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Trending in Nepal Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-[#FF0080]/40 p-5 min-h-[155px] flex flex-col justify-end">
        <img
          src="/src/assets/images/nepal_profile_banner_1794926293036.jpg"
          alt="Trending in Nepal"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090514] via-[#090514]/55 to-transparent" />
        <div className="relative z-10 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF0080]">
              <Flame className="w-4 h-4" />
              <span>Trending in Nepal</span>
            </div>
            <h3 className="font-display font-extrabold text-xl text-white mt-0.5">
              Discover Nepal&apos;s Creators &amp; NEP Battles
            </h3>
          </div>
          <button
            type="button"
            onClick={onOpenLive}
            className="px-4 py-2 rounded-full bg-[#FF0080] text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Now</span>
          </button>
        </div>
      </div>

      {/* Trending Videos Grid */}
      <div className="space-y-2.5">
        <h4 className="font-display font-bold text-sm">Trending Videos &amp; Photos</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {filteredPosts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setPlayerConfig({ postId: post.id, list: filteredPosts })}
              onDoubleClick={() => setPlayerConfig({ postId: post.id, list: filteredPosts })}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#140A26] border border-white/10 text-left cursor-pointer"
            >
              <img
                src={post.thumbnailUrl || post.mediaUrl}
                alt={post.caption}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              <div className="absolute bottom-2 inset-x-2">
                <p className="text-[11px] font-bold text-white truncate">@{post.authorHandle}</p>
                <p className="text-[10px] text-purple-200/80 flex items-center gap-1 tabular-nums">
                  <Play className="w-2.5 h-2.5 fill-white" /> {post.views.toLocaleString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trending Original Sounds */}
      <div className="space-y-2.5">
        <h4 className="font-display font-bold text-sm">Original Sounds</h4>
        <div className="space-y-2">
          {posts.slice(0, 3).map((p) => (
            <div
              key={p.sound.id}
              className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#140A26] border border-white/10"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF0080] to-[#9D00FF] flex items-center justify-center shrink-0">
                  <Music2 className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{p.sound.title}</p>
                  <p className="text-[11px] text-purple-200/75 truncate">
                    Uploaded by @{p.sound.originalUploaderHandle} ·{' '}
                    {p.sound.usesCount.toLocaleString()} uses
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUseSound(p.sound)}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-[#FF0080] text-xs font-bold shrink-0 cursor-pointer"
              >
                Use Sound
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Creators (Click Creator to Open Their Profile Grid) */}
      <div className="space-y-2.5 pb-4">
        <h4 className="font-display font-bold text-sm">Suggested Creators</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {suggestedCreators.map((c) => {
            const isFollowing = followingIds.includes(c.id);
            return (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#140A26] border border-white/10 hover:border-[#FF0080]/50 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCreator(c)}
                  className="text-left min-w-0 flex-1 cursor-pointer"
                >
                  <p className="text-xs font-bold text-white truncate">{c.name}</p>
                  <p className="text-[11px] text-purple-200/75 truncate">
                    @{c.handle} · {c.followers}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleFollow(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                    isFollowing
                      ? 'bg-white/10 text-purple-100'
                      : 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white'
                  }`}
                >
                  {isFollowing ? <Check className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                  <span>{isFollowing ? 'Following' : 'Follow'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Other User's Profile Grid Modal */}
      {selectedCreator && (
        <div
          data-testid="other-creator-profile-modal"
          className="fixed inset-0 z-40 bg-[#090514] text-white flex flex-col overflow-y-auto"
        >
          <div className="px-4 py-3 bg-[#120824] border-b border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedCreator(null)}
              className="flex items-center gap-1 text-xs font-bold text-purple-200 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="font-display font-bold text-sm">@{selectedCreator.handle}</span>
            <button
              type="button"
              aria-label="Close creator profile"
              onClick={() => setSelectedCreator(null)}
              className="p-1.5 rounded-full bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF0080] to-[#9D00FF] flex items-center justify-center font-display font-extrabold text-xl">
                  {selectedCreator.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">{selectedCreator.name}</h3>
                  <p className="text-xs text-[#FF0080]">@{selectedCreator.handle}</p>
                  <p className="text-[11px] text-purple-200/80 mt-0.5">
                    {selectedCreator.followers} Followers · {creatorPosts.length} Videos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleFollow(selectedCreator.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
                  followingIds.includes(selectedCreator.id)
                    ? 'bg-white/10 text-purple-100'
                    : 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white'
                }`}
              >
                {followingIds.includes(selectedCreator.id) ? 'Following' : 'Follow'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(creatorPosts.length > 0 ? creatorPosts : posts.slice(0, 3)).map((p) => {
                const list = creatorPosts.length > 0 ? creatorPosts : posts.slice(0, 3);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlayerConfig({ postId: p.id, list })}
                    onDoubleClick={() => setPlayerConfig({ postId: p.id, list })}
                    className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#140A26] border border-white/10 cursor-pointer"
                  >
                    <img
                      src={p.thumbnailUrl || p.mediaUrl}
                      alt={p.caption}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/65 text-[10px] font-mono tabular-nums">
                      ▶ {p.views.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Vertical Video Player */}
      <ProfileGridVideoPlayerModal
        isOpen={playerConfig !== null}
        posts={playerConfig?.list ?? []}
        initialPostId={playerConfig?.postId ?? null}
        currentUserId={currentUserId}
        followingIds={followingIds}
        chats={chats}
        onClose={() => setPlayerConfig(null)}
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
    </div>
  );
};


import React, { useState } from 'react';
import {
  Phone,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  PhoneOff,
  Send,
  Plus,
  Ban,
  CheckCircle2,
  ArrowLeft,
  Clock,
  X,
  Archive,
  Trash2,
} from 'lucide-react';
import { getStoryRemainingHours, isStoryActive } from '../utils/neptokLogic';
import type { ChatThread, StoryItem } from '../types/neptok';

interface ChatHubProps {
  chats: ChatThread[];
  stories: StoryItem[];
  blockedUserIds: string[];
  onSendMessage: (chatId: string, text: string) => void;
  onToggleBlockUser: (userId: string, handle: string) => void;
  onArchiveChat?: (chatId: string, isArchived: boolean) => void;
  onDeleteChat?: (chatId: string) => void;
  onDeleteMessage?: (chatId: string, messageId: string) => void;
  onCreateStory48h: () => void;
  onNotify: (msg: string) => void;
}

export const ChatHub: React.FC<ChatHubProps> = ({
  chats,
  stories,
  blockedUserIds,
  onSendMessage,
  onToggleBlockUser,
  onArchiveChat,
  onDeleteChat,
  onDeleteMessage,
  onCreateStory48h,
  onNotify,
}) => {
  const [filter, setFilter] = useState<'All' | 'Chats' | 'Group' | 'Calls' | 'Requests' | 'Archived'>('All');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [viewingStory, setViewingStory] = useState<StoryItem | null>(null);

  // Active Video / Audio Call state
  const [activeCall, setActiveCall] = useState<{
    type: 'video' | 'audio';
    name: string;
    handle: string;
    micMuted: boolean;
    camOn: boolean;
    speakerOn: boolean;
    beautyOn: boolean;
  } | null>(null);

  const [callHistory] = useState([
    { id: 'cal-1', name: 'Sita Tamang', type: 'Video Call', duration: '14:22', time: 'Today, 4:10 PM' },
    { id: 'cal-2', name: 'Binod Sherpa', type: 'Audio Call', duration: '06:45', time: 'Yesterday' },
  ]);

  const activeStories = stories.filter((s) => isStoryActive(s.createdAtMs));
  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const filteredChats = chats.filter((c) => {
    if (filter === 'Archived') return Boolean(c.isArchived);
    if (c.isArchived) return false;
    if (filter === 'Group') return Boolean(c.isGroup);
    if (filter === 'Requests') return Boolean(c.isRequest);
    if (filter === 'Chats') return !c.isGroup && !c.isRequest;
    return true;
  });

  return (
    <div className="relative w-full h-full min-h-[640px] bg-[#090514] text-white flex flex-col overflow-hidden">
      {/* Scenic Nepal Header */}
      <div className="relative px-4 pt-4 pb-3 border-b border-white/10 overflow-hidden shrink-0">
        <img
          src="/src/assets/images/nepal_profile_banner_1794926293036.jpg"
          alt="Scenic Nepal Messages Header"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
        />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-white">Messages &amp; Calls</h2>
            <p className="text-[11px] text-purple-200/85">
              End-to-end encrypted chats · 48-Hour Stories
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setActiveCall({
                type: 'video',
                name: 'Sita Tamang',
                handle: 'sita_kathmandu',
                micMuted: false,
                camOn: true,
                speakerOn: true,
                beautyOn: true,
              })
            }
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Quick Call</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="relative z-10 flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar">
          {(['All', 'Chats', 'Group', 'Calls', 'Requests', 'Archived'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setFilter(tab);
                setActiveChatId(null);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                filter === tab
                  ? 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white'
                  : 'bg-black/45 border border-white/15 text-purple-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Online 48-Hour Stories */}
      {!activeChat && (
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 overflow-x-auto shrink-0 bg-[#100720]">
          <button
            type="button"
            onClick={onCreateStory48h}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
          >
            <div className="relative w-13 h-13 rounded-full bg-[#1C0F33] border-2 border-dashed border-[#FF0080] flex items-center justify-center">
              <Plus className="w-5 h-5 text-[#FF0080]" />
            </div>
            <span className="text-[10px] font-semibold text-purple-100">My Story +</span>
          </button>

          {activeStories.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setViewingStory(st)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
            >
              <div className="relative w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-[#FF0080] to-[#9D00FF]">
                <img
                  src={st.mediaUrl}
                  alt={st.authorName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full border-2 border-[#090514]"
                />
                {st.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#090514]" />
                )}
              </div>
              <span className="text-[10px] font-semibold text-purple-100 truncate max-w-[58px]">
                {st.authorName}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area: Call History OR Active Thread OR Inbox List */}
      <div className="flex-1 overflow-y-auto">
        {filter === 'Calls' && !activeChat ? (
          <div className="p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider">
              Recent Call History
            </h3>
            {callHistory.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#140A26] border border-white/10"
              >
                <div>
                  <p className="text-sm font-bold text-white">{call.name}</p>
                  <p className="text-xs text-purple-200/75">
                    {call.type} · {call.duration} · {call.time}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setActiveCall({
                      type: call.type === 'Video Call' ? 'video' : 'audio',
                      name: call.name,
                      handle: call.name.toLowerCase().replace(/\s+/g, '_'),
                      micMuted: false,
                      camOn: call.type === 'Video Call',
                      speakerOn: true,
                      beautyOn: true,
                    })
                  }
                  className="px-3 py-1.5 rounded-full bg-[#FF0080]/20 border border-[#FF0080] text-xs font-bold cursor-pointer"
                >
                  Call Back
                </button>
              </div>
            ))}
          </div>
        ) : activeChat ? (
          <div className="flex flex-col h-full">
            {/* Active Chat Header */}
            <div className="px-4 py-3 bg-[#140A26] border-b border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-label="Back to inbox"
                  onClick={() => setActiveChatId(null)}
                  className="p-1.5 rounded-full bg-white/10 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <p className="text-sm font-bold text-white">{activeChat.name}</p>
                  <p className="text-[11px] text-purple-200/75">@{activeChat.handle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Start Audio Call"
                  onClick={() =>
                    setActiveCall({
                      type: 'audio',
                      name: activeChat.name,
                      handle: activeChat.handle,
                      micMuted: false,
                      camOn: false,
                      speakerOn: true,
                      beautyOn: false,
                    })
                  }
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                </button>
                <button
                  type="button"
                  aria-label="Start Video Call"
                  onClick={() =>
                    setActiveCall({
                      type: 'video',
                      name: activeChat.name,
                      handle: activeChat.handle,
                      micMuted: false,
                      camOn: true,
                      speakerOn: true,
                      beautyOn: true,
                    })
                  }
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
                >
                  <Video className="w-4 h-4 text-[#FF0080]" />
                </button>
                {onArchiveChat && (
                  <button
                    type="button"
                    aria-label={activeChat.isArchived ? 'Unarchive chat' : 'Archive chat'}
                    onClick={() => {
                      onArchiveChat(activeChat.id, !activeChat.isArchived);
                      setActiveChatId(null);
                    }}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
                  >
                    <Archive className="w-4 h-4 text-purple-200" />
                  </button>
                )}
                {onDeleteChat && (
                  <button
                    type="button"
                    aria-label="Delete conversation"
                    onClick={() => {
                      const targetId = activeChat.id;
                      setActiveChatId(null);
                      onDeleteChat(targetId);
                    }}
                    className="p-2 rounded-full bg-rose-500/20 hover:bg-rose-500/35 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-300" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onToggleBlockUser(activeChat.userId, activeChat.handle)}
                  className="px-2.5 py-1.5 rounded-full bg-rose-500/20 text-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Ban className="w-3 h-3" />
                  <span>{blockedUserIds.includes(activeChat.userId) ? 'Unblock' : 'Block'}</span>
                </button>
              </div>
            </div>

            {/* Thread Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {activeChat.messages.map((m) => (
                <div
                  key={m.id}
                  className={`group flex items-end gap-1.5 ${
                    m.sender === 'me' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.sender === 'me' && onDeleteMessage && (
                    <button
                      type="button"
                      aria-label="Delete message"
                      onClick={() => onDeleteMessage(activeChat.id, m.id)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-full bg-white/10 hover:bg-rose-500/30 text-rose-200 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs space-y-1 ${
                      m.sender === 'me'
                        ? 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white'
                        : 'bg-[#180C2E] border border-white/10 text-purple-100'
                    }`}
                  >
                    {m.sharedPostTitle && (
                      <div className="p-2 rounded-xl bg-black/30 border border-white/15 text-[11px] font-semibold">
                        Shared NepTok Post: {m.sharedPostTitle}
                      </div>
                    )}
                    <p>{m.text}</p>
                    <p className="text-[10px] opacity-70 text-right">{m.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Composer */}
            {blockedUserIds.includes(activeChat.userId) ? (
              <div className="p-3 bg-[#140A26] border-t border-white/10 flex items-center justify-between gap-2 text-xs text-rose-200">
                <span>Messaging disabled — you blocked @{activeChat.handle}.</span>
                <button
                  type="button"
                  onClick={() => onToggleBlockUser(activeChat.userId, activeChat.handle)}
                  className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold cursor-pointer"
                >
                  Unblock
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!messageDraft.trim()) return;
                  onSendMessage(activeChat.id, messageDraft.trim());
                  setMessageDraft('');
                }}
                className="p-3 bg-[#140A26] border-t border-white/10 flex items-center gap-2"
              >
                <button
                  type="button"
                  aria-label="Send voice note"
                  onClick={() => onSendMessage(activeChat.id, '🎤 Voice message (0:08)')}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/15 cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-[#FF0080]" />
                </button>
                <input
                  type="text"
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  placeholder="Write an encrypted message..."
                  className="flex-1 h-10 px-4 rounded-full bg-[#090514] border border-purple-500/35 text-xs text-white focus:outline-none focus:border-[#FF0080]"
                />
                <button
                  type="submit"
                  aria-label="Send chat message"
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/8">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveChatId(chat.id)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0 cursor-pointer"
                >
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#FF0080] to-[#9D00FF] flex items-center justify-center font-bold text-sm shrink-0">
                    {chat.name.slice(0, 2).toUpperCase()}
                    {chat.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#090514]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-white truncate">{chat.name}</p>
                      <span className="text-[11px] text-purple-300/65 shrink-0">
                        {chat.lastTime}
                      </span>
                    </div>
                    <p className="text-xs text-purple-200/75 truncate mt-0.5">
                      {chat.lastMessage}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  {chat.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#FF0080] text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {chat.unread}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Video call ${chat.name}`}
                    onClick={() =>
                      setActiveCall({
                        type: 'video',
                        name: chat.name,
                        handle: chat.handle,
                        micMuted: false,
                        camOn: true,
                        speakerOn: true,
                        beautyOn: true,
                      })
                    }
                    className="p-2 rounded-full bg-white/8 hover:bg-white/15 cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-[#FF0080]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 48-Hour Story Viewer Modal */}
      {viewingStory && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4">
          <img
            src={viewingStory.mediaUrl}
            alt={viewingStory.caption}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-85"
          />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5 text-[#FF0080]" />
              <span className="text-xs font-bold">
                @{viewingStory.authorHandle} · {getStoryRemainingHours(viewingStory.createdAtMs)}h left (48h Story)
              </span>
            </div>
            <button
              type="button"
              aria-label="Close Story"
              onClick={() => setViewingStory(null)}
              className="p-2 rounded-full bg-black/60 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative z-10 p-4 rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 text-center">
            <p className="text-xs text-pink-300 font-bold">{viewingStory.templateName}</p>
            <p className="text-sm font-semibold text-white mt-1">{viewingStory.caption}</p>
          </div>
        </div>
      )}

      {/* Full-Screen Active Video / Audio Call Modal */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-[#090514] flex flex-col justify-between p-5">
          {activeCall.type === 'video' && activeCall.camOn && (
            <img
              src="/src/assets/images/creator_dance_kathmandu_1794926294158.jpg"
              alt={activeCall.name}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              style={{ filter: activeCall.beautyOn ? 'brightness(1.07) saturate(1.15)' : 'none' }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/85 pointer-events-none" />

          {/* Top Call Info + Floating Self-View */}
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#FF0080] uppercase">
                NepTok Encrypted {activeCall.type === 'video' ? 'Video Call' : 'Audio Call'}
              </span>
              <h3 className="font-display text-2xl font-extrabold text-white mt-0.5">
                {activeCall.name}
              </h3>
              <p className="text-xs text-emerald-300 font-mono mt-1">00:42 · HD Connected</p>
            </div>

            {activeCall.type === 'video' && (
              <div className="w-24 h-34 rounded-2xl overflow-hidden border-2 border-[#FF0080] shadow-xl bg-[#140A26]">
                <img
                  src="/src/assets/images/creator_everest_trek_1794926294520.jpg"
                  alt="Self View"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="relative z-10 flex items-center justify-center gap-3 pb-4 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCall({ ...activeCall, micMuted: !activeCall.micMuted })}
              className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${
                activeCall.micMuted ? 'bg-rose-500 text-white' : 'bg-white/15 text-white'
              }`}
              aria-label="Toggle Mic Mute"
            >
              {activeCall.micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveCall({ ...activeCall, camOn: !activeCall.camOn })}
              className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${
                !activeCall.camOn ? 'bg-rose-500 text-white' : 'bg-white/15 text-white'
              }`}
              aria-label="Stop Video / Toggle Camera"
            >
              {activeCall.camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveCall({ ...activeCall, speakerOn: !activeCall.speakerOn })}
              className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${
                activeCall.speakerOn ? 'bg-[#9D00FF] text-white' : 'bg-white/15 text-white'
              }`}
              aria-label="Toggle Speaker"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveCall({ ...activeCall, beautyOn: !activeCall.beautyOn })}
              className={`px-4 h-12 rounded-full flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                activeCall.beautyOn ? 'bg-[#FF0080] text-white' : 'bg-white/15 text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Beauty FX</span>
            </button>

            <button
              type="button"
              aria-label="End Call"
              onClick={() => {
                setActiveCall(null);
                onNotify('Call ended');
              }}
              className="w-14 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg cursor-pointer"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

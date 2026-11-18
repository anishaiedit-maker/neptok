import React, { useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Gift, AtSign, Radio, Award, Check } from 'lucide-react';
import type { BellNotificationItem } from '../types/neptok';

interface BellNotificationsProps {
  notifications: BellNotificationItem[];
  onToggleFollowBack: (id: string) => void;
}

const FILTERS = [
  'All',
  'Likes',
  'Comments',
  'Follows',
  'Gifts',
  'Mentions',
  'Live Invites',
  'Creator Rewards',
] as const;

export const BellNotifications: React.FC<BellNotificationsProps> = ({
  notifications,
  onToggleFollowBack,
}) => {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const visible =
    filter === 'All' ? notifications : notifications.filter((n) => n.category === filter);

  const iconForCategory = (cat: BellNotificationItem['category']) => {
    switch (cat) {
      case 'Likes':
        return <Heart className="w-4 h-4 text-[#FF0080] fill-[#FF0080]" />;
      case 'Comments':
        return <MessageCircle className="w-4 h-4 text-sky-400" />;
      case 'Follows':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'Gifts':
        return <Gift className="w-4 h-4 text-amber-300" />;
      case 'Mentions':
        return <AtSign className="w-4 h-4 text-[#9D00FF]" />;
      case 'Live Invites':
        return <Radio className="w-4 h-4 text-rose-400" />;
      case 'Creator Rewards':
        return <Award className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="w-full h-full min-h-[640px] bg-[#090514] text-white flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 bg-[#120824] border-b border-white/10 space-y-3 shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#FF0080]" />
          <h2 className="font-display font-bold text-lg">Activity &amp; Bell Alerts</h2>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                filter === f
                  ? 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white'
                  : 'bg-white/8 text-purple-200 hover:bg-white/15'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {visible.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#140A26] border border-white/10"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center shrink-0">
                {iconForCategory(item.category)}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white leading-snug">
                  <strong className="text-pink-300">@{item.actorHandle}</strong> {item.message}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-purple-300/70">
                  <span>{item.category}</span>
                  <span>·</span>
                  <span>{item.time}</span>
                  {item.amountText && (
                    <span className="font-mono font-bold text-emerald-400">
                      · {item.amountText}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {item.category === 'Follows' && (
              <button
                type="button"
                onClick={() => onToggleFollowBack(item.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
                  item.followedBack
                    ? 'bg-white/10 text-purple-200'
                    : 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white'
                }`}
              >
                {item.followedBack && <Check className="w-3.5 h-3.5" />}
                <span>{item.followedBack ? 'Following' : 'Follow Back'}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

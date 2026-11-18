import React, { useState } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  Eye,
  Gift,
  Video,
  CheckCircle2,
  Lock,
  Sparkles,
  DollarSign,
  Users,
} from 'lucide-react';
import {
  evaluateMonetizationEligibility,
  calculateCreatorContentEarningsUsd,
  calculateCreatorGiftPayoutUsd,
  formatUsd,
} from '../utils/neptokLogic';
import type { FeedPost, UserProfile } from '../types/neptok';

interface CreatorStudioProps {
  user: UserProfile;
  posts: FeedPost[];
  onBack: () => void;
  onUpdatePost: (postId: string, patch: Partial<FeedPost>) => void;
  onNotify: (msg: string) => void;
}

export const CreatorStudio: React.FC<CreatorStudioProps> = ({
  user,
  posts,
  onBack,
  onUpdatePost,
  onNotify,
}) => {
  const [contentMonetizationOn, setContentMonetizationOn] = useState(true);
  const [giftMonetizationOn, setGiftMonetizationOn] = useState(true);
  const [simulatedFollowers, setSimulatedFollowers] = useState(user.followers);

  const myPosts = posts.filter((p) => p.authorId === user.id || posts.indexOf(p) < 3);
  const totalViews = myPosts.reduce((s, p) => s + p.views, 0);
  const totalGiftCoins = myPosts.reduce((s, p) => s + p.giftsReceivedCoins, 0);
  const videoUsd = calculateCreatorContentEarningsUsd(totalViews, 7.2);
  const giftUsd = calculateCreatorGiftPayoutUsd(totalGiftCoins, 0.7);
  const liveUsd = 148.6;
  const monthlyUsd = Number((videoUsd * 0.45 + giftUsd * 0.5 + liveUsd).toFixed(2));
  const lifetimeUsd = Number((videoUsd + giftUsd + liveUsd + 640).toFixed(2));

  const eligibility = evaluateMonetizationEligibility(simulatedFollowers, true);

  return (
    <div className="w-full h-full min-h-[640px] bg-[#090514] text-white overflow-y-auto p-4 sm:p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Back to Profile"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-display font-bold text-lg">Creator Studio &amp; Monetization</h2>
            <p className="text-xs text-purple-200/75">
              @{user.handle} · All earnings &amp; payouts calculated in USD ($)
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-sky-400' },
          { label: 'Video & Photo ($)', value: formatUsd(videoUsd), icon: Video, color: 'text-[#FF0080]' },
          { label: 'Live Earnings ($)', value: formatUsd(liveUsd), icon: TrendingUp, color: 'text-[#9D00FF]' },
          { label: 'Gift Earnings ($)', value: formatUsd(giftUsd), icon: Gift, color: 'text-amber-300' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="p-3.5 rounded-2xl bg-[#140A26] border border-white/10 space-y-1"
            >
              <div className="flex items-center justify-between text-[11px] text-purple-200/75">
                <span>{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="font-display font-extrabold text-lg text-white tabular-nums">
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Monthly & Lifetime Summary + Audience Growth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-[#140A26] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-purple-200">Earnings Summary (USD)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] text-purple-300/70">Monthly Earnings</p>
              <p className="font-display font-extrabold text-xl text-emerald-400 tabular-nums">
                {formatUsd(monthlyUsd)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-purple-300/70">Lifetime Earnings</p>
              <p className="font-display font-extrabold text-xl text-white tabular-nums">
                {formatUsd(lifetimeUsd)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-[#140A26] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-purple-200">Audience &amp; Followers Growth</span>
            <Users className="w-4 h-4 text-[#FF0080]" />
          </div>
          <p className="font-display font-extrabold text-xl text-white tabular-nums">
            {simulatedFollowers.toLocaleString()} Followers{' '}
            <span className="text-xs font-semibold text-emerald-400">+18.4% this month</span>
          </p>
          <p className="text-[11px] text-purple-200/75">
            Top Audience: Nepal (68%) · India (12%) · UAE/Diaspora (11%) · US/UK (9%)
          </p>
        </div>
      </div>

      {/* Dedicated Monetization Hub (5,000 Followers Requirement) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#190D30] to-[#261046] border border-[#FF0080]/40 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <span className="text-[11px] font-bold text-[#FF0080] uppercase">
              Creator Monetization Hub
            </span>
            <h3 className="font-display font-bold text-base text-white mt-0.5">
              Minimum 5,000 Followers Required to Unlock Monetization
            </h3>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              eligibility.eligible
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
            }`}
          >
            {eligibility.eligible ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Eligible &amp; Verified
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> {eligibility.remainingFollowers.toLocaleString()} more needed
              </>
            )}
          </span>
        </div>

        {/* Eligibility Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono tabular-nums">
            <span>
              {eligibility.followers.toLocaleString()} / 5,000 Followers ({eligibility.progressPct}%)
            </span>
            <span className="text-emerald-300">Account Standing: Good ✓</span>
          </div>
          <div className="h-2.5 rounded-full bg-black/50 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF0080] to-emerald-400 transition-all duration-300"
              style={{ width: `${eligibility.progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-purple-200/70 pt-1">
            <span>Preview Threshold Behavior:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSimulatedFollowers(4200)}
                className="underline hover:text-white cursor-pointer"
              >
                Test &lt;5,000 (4,200)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedFollowers(user.followers)}
                className="underline hover:text-white cursor-pointer"
              >
                Restore ({user.followers.toLocaleString()})
              </button>
            </div>
          </div>
        </div>

        {/* Two Separate Monetization Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Module 1: Content Monetization */}
          <div className="p-4 rounded-2xl bg-[#090514]/85 border border-white/12 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-white">
                1. Content Monetization
              </h4>
              <Sparkles className="w-4 h-4 text-[#FF0080]" />
            </div>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              Earn USD ($) RPM payouts from original Videos &amp; Photos based on qualified views, watch time, and in-video Ad Settings.
            </p>
            <button
              type="button"
              disabled={!eligibility.eligible}
              onClick={() => {
                setContentMonetizationOn((v) => !v);
                onNotify(
                  !contentMonetizationOn
                    ? 'Content Monetization activated!'
                    : 'Content Monetization paused'
                );
              }}
              className={`w-full h-10 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                eligibility.eligible && contentMonetizationOn
                  ? 'bg-emerald-500 text-black'
                  : 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white'
              }`}
            >
              {!eligibility.eligible
                ? 'Requires 5,000 Followers'
                : contentMonetizationOn
                ? 'Content Monetization Active ✓'
                : 'Activate Content Monetization'}
            </button>
          </div>

          {/* Module 2: Gift Monetization */}
          <div className="p-4 rounded-2xl bg-[#090514]/85 border border-white/12 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-white">
                2. Gift Monetization
              </h4>
              <Gift className="w-4 h-4 text-amber-300" />
            </div>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              Receive any of the 48 NepTok Gifts in NEP Live, NEP Battle, Audio Rooms &amp; Posts. Coins convert directly to withdrawable USD ($).
            </p>
            <button
              type="button"
              disabled={!eligibility.eligible}
              onClick={() => {
                setGiftMonetizationOn((v) => !v);
                onNotify(
                  !giftMonetizationOn
                    ? 'Gift Monetization activated!'
                    : 'Gift Monetization paused'
                );
              }}
              className={`w-full h-10 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                eligibility.eligible && giftMonetizationOn
                  ? 'bg-emerald-500 text-black'
                  : 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white'
              }`}
            >
              {!eligibility.eligible
                ? 'Requires 5,000 Followers'
                : giftMonetizationOn
                ? 'Gift Monetization Active ✓'
                : 'Activate Gift Monetization'}
            </button>
          </div>
        </div>
      </div>

      {/* Video-Wise Earnings & Manage Posts */}
      <div className="space-y-2.5 pb-4">
        <h3 className="font-display font-bold text-sm">Video &amp; Photo Performance · Manage Posts</h3>
        <div className="space-y-2">
          {myPosts.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#140A26] border border-white/10"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={p.mediaUrl}
                  alt={p.caption}
                  referrerPolicy="no-referrer"
                  className="w-12 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{p.caption}</p>
                  <p className="text-[11px] text-purple-200/75 tabular-nums mt-0.5">
                    {p.views.toLocaleString()} views · {p.giftsReceivedCoins.toLocaleString()} N gifts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                  {formatUsd(p.estimatedEarningsUsd)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onUpdatePost(p.id, { adSettingsEnabled: !p.adSettingsEnabled });
                    onNotify(`Ad Settings ${!p.adSettingsEnabled ? 'enabled' : 'paused'} for post`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                    p.adSettingsEnabled
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/10 text-purple-200'
                  }`}
                >
                  Ads: {p.adSettingsEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

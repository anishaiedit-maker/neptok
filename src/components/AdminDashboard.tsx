import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  BadgeCheck,
  ShieldAlert,
  Radio,
  DollarSign,
  Gift,
  Database,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { GIFTS_48, formatUsd } from '../utils/neptokLogic';

interface AdminOverviewData {
  metrics: {
    totalActiveCreators: number;
    liveViewersNow: number;
    dailyGrossRevenueUsd: number;
    pendingModerationCount: number;
    pendingPayoutsUsd: number;
  };
  users: Array<{
    id: string;
    name: string;
    username: string;
    followers: number;
    kycStatus: 'Verified' | 'Pending' | 'Not Submitted';
    accountType: string;
    standing: string;
    monetizationContent: boolean;
    monetizationGifts: boolean;
    earningsUsd: number;
  }>;
  moderationQueue: Array<{
    id: string;
    contentType: string;
    creator: string;
    title: string;
    flagType: string;
    confidence: number;
    actionTaken: string;
    status: string;
    createdAt: string;
  }>;
  payouts: Array<{
    id: string;
    creator: string;
    method: string;
    amountUsd: number;
    status: string;
    requestedAt: string;
  }>;
  liveRooms: Array<{
    id: string;
    host: string;
    title: string;
    mode: string;
    viewers: number;
    participants: number;
    maxCapacity: number;
    status: string;
  }>;
  snapshotStatus: {
    lastBackupAt: string;
    region: string;
    encrypted: string;
  };
  giftCount: number;
}

type AdminSection =
  | 'overview'
  | 'kyc'
  | 'moderation'
  | 'live'
  | 'monetization'
  | 'payouts'
  | 'gifts'
  | 'infra';

export const AdminDashboard: React.FC<{ onNotify: (msg: string) => void }> = ({ onNotify }) => {
  const [section, setSection] = useState<AdminSection>('overview');
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      const json = await res.json();
      setData(json);
    } catch {
      onNotify('Failed to load Admin Dashboard data');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleKyc = async (userId: string, status: 'Verified' | 'Pending') => {
    await fetch(`/api/admin/kyc/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onNotify(`KYC updated to ${status}`);
    fetchOverview();
  };

  const handleModerationAction = async (modId: string, status: 'Removed' | 'Restored') => {
    await fetch(`/api/admin/moderation/${modId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onNotify(`Moderation item ${status}`);
    fetchOverview();
  };

  const handlePayoutAction = async (payoutId: string, status: 'Paid' | 'Rejected') => {
    await fetch(`/api/admin/payouts/${payoutId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onNotify(`USD payout marked ${status}`);
    fetchOverview();
  };

  const handleTerminateLive = async (roomId: string) => {
    await fetch(`/api/admin/live/${roomId}/terminate`, { method: 'POST' });
    onNotify('Live room terminated by Admin Moderator');
    fetchOverview();
  };

  const handleSimulateAiFlag = async (simulateFlag: 'copyright' | 'nsfw' | 'violence') => {
    await fetch('/api/moderation/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caption: `Test ${simulateFlag} stream detection`,
        audioTitle: 'Sample Audio',
        mediaType: 'video',
        creator: '@test_creator',
        simulateFlag,
      }),
    });
    onNotify(`AI Censorship triggered ${simulateFlag.toUpperCase()} detection into queue`);
    fetchOverview();
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#090514] text-white flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 bg-[#120824] border-b lg:border-b-0 lg:border-r border-white/10 p-4 space-y-1.5 shrink-0">
        <div className="px-2 pb-3 mb-2 border-b border-white/10">
          <p className="font-display font-extrabold text-sm text-white">
            NepTok Web Admin Console
          </p>
          <p className="text-[11px] text-purple-200/70">USD Ledger · AI Safety · KYC</p>
        </div>
        {(
          [
            { id: 'overview', label: 'Overview & Analytics', icon: LayoutDashboard },
            { id: 'kyc', label: 'User KYC Verification', icon: BadgeCheck },
            { id: 'moderation', label: 'AI Censorship Queue', icon: ShieldAlert },
            { id: 'live', label: 'Live Room Moderation', icon: Radio },
            { id: 'monetization', label: 'Monetization (5k Rule)', icon: Sparkles },
            { id: 'payouts', label: 'USD Payout Processing', icon: DollarSign },
            { id: 'gifts', label: '48 Original Gift Catalog', icon: Gift },
            { id: 'infra', label: 'Backups & Infrastructure', icon: Database },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                section === item.id
                  ? 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white'
                  : 'text-purple-200/80 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl">
              {section === 'overview'
                ? 'Platform Overview & Analytics'
                : section === 'kyc'
                ? 'Blue Tick KYC Verification'
                : section === 'moderation'
                ? 'AI Censorship, Copyright & NSFW Queue'
                : section === 'live'
                ? 'NEP Live & Multi-Room Moderation'
                : section === 'monetization'
                ? 'Creator Monetization Approvals (5,000+ Followers)'
                : section === 'payouts'
                ? 'Creator USD ($) Payout Processing'
                : section === 'gifts'
                ? 'Locked 48 Original Gift Catalog'
                : 'Encrypted Database, Storage & Daily Snapshots'}
            </h1>
          </div>
          <button
            type="button"
            onClick={fetchOverview}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {!data ? (
          <div className="p-8 rounded-2xl bg-[#140A26] border border-white/10 text-sm text-purple-200">
            Loading NepTok Admin Console...
          </div>
        ) : (
          <>
            {/* Top Metrics */}
            {(section === 'overview' || section === 'payouts') && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Active Creators', val: data.metrics.totalActiveCreators.toLocaleString() },
                  { label: 'Live Viewers Now', val: data.metrics.liveViewersNow.toLocaleString() },
                  { label: 'Daily Gross Revenue', val: formatUsd(data.metrics.dailyGrossRevenueUsd) },
                  { label: 'AI Moderation Pending', val: String(data.metrics.pendingModerationCount) },
                  { label: 'Pending USD Payouts', val: formatUsd(data.metrics.pendingPayoutsUsd) },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="p-4 rounded-2xl bg-[#140A26] border border-white/10 space-y-1"
                  >
                    <p className="text-[11px] text-purple-200/75">{m.label}</p>
                    <p className="font-display font-extrabold text-xl tabular-nums text-white">
                      {m.val}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* AI Censorship Moderation Queue */}
            {(section === 'overview' || section === 'moderation') && (
              <div className="p-4 sm:p-5 rounded-3xl bg-[#140A26] border border-white/10 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-display font-bold text-base">
                      AI Content Censorship &amp; Copyright Review Queue
                    </h2>
                    <p className="text-xs text-purple-200/75">
                      Automated Copyright Scan, Nudity/NSFW Detection &amp; Community Violence/Harm Protection
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSimulateAiFlag('copyright')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-bold cursor-pointer"
                    >
                      + Test Copyright Scan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateAiFlag('nsfw')}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[11px] font-bold cursor-pointer"
                    >
                      + Test NSFW Block
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateAiFlag('violence')}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-200 text-[11px] font-bold cursor-pointer"
                    >
                      + Test Violence Guard
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {data.moderationQueue.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[#090514] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#FF0080]">{item.flagType}</span>
                          <span className="text-purple-300/75">· {item.contentType}</span>
                          <span className="text-white font-semibold">{item.creator}</span>
                          <span className="font-mono text-amber-300 tabular-nums">
                            {item.confidence}% confidence
                          </span>
                        </div>
                        <p className="text-white font-semibold">{item.title}</p>
                        <p className="text-purple-200/75">{item.actionTaken}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-white/10 text-[11px] font-bold">
                          {item.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleModerationAction(item.id, 'Restored')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModerationAction(item.id, 'Removed')}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User KYC & Monetization Approvals */}
            {(section === 'kyc' || section === 'monetization' || section === 'overview') && (
              <div className="p-4 sm:p-5 rounded-3xl bg-[#140A26] border border-white/10 space-y-3">
                <h2 className="font-display font-bold text-base">
                  Creators, Blue Tick KYC &amp; Monetization (5,000 Followers Rule)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-purple-300/75 border-b border-white/10">
                      <tr>
                        <th className="py-2 pr-3">Creator</th>
                        <th className="py-2 pr-3">Followers</th>
                        <th className="py-2 pr-3">KYC Status</th>
                        <th className="py-2 pr-3">Content / Gifts</th>
                        <th className="py-2 pr-3 text-right">Earnings (USD)</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/8">
                      {data.users.map((u) => (
                        <tr key={u.id}>
                          <td className="py-3 pr-3 font-semibold">
                            {u.name} <span className="text-purple-300/70">@{u.username}</span>
                          </td>
                          <td className="py-3 pr-3 font-mono tabular-nums">
                            {u.followers.toLocaleString()}
                          </td>
                          <td className="py-3 pr-3">
                            <span
                              className={
                                u.kycStatus === 'Verified'
                                  ? 'text-sky-400 font-bold'
                                  : 'text-amber-300 font-bold'
                              }
                            >
                              {u.kycStatus}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            {u.monetizationContent ? 'Content ON' : 'Content OFF'} ·{' '}
                            {u.monetizationGifts ? 'Gifts ON' : 'Gifts OFF'}
                          </td>
                          <td className="py-3 pr-3 text-right font-mono text-emerald-400 tabular-nums">
                            {formatUsd(u.earningsUsd)}
                          </td>
                          <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleKyc(u.id, 'Verified')}
                              className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-bold cursor-pointer"
                            >
                              Verify KYC
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Live Room Moderation */}
            {(section === 'live' || section === 'overview') && (
              <div className="p-4 sm:p-5 rounded-3xl bg-[#140A26] border border-white/10 space-y-3">
                <h2 className="font-display font-bold text-base">Active Live Rooms</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {data.liveRooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-4 rounded-2xl bg-[#090514] border border-white/10 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#FF0080]">{room.mode}</span>
                        <span
                          className={
                            room.status === 'Active' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                          }
                        >
                          {room.status}
                        </span>
                      </div>
                      <p className="font-bold text-white">{room.title}</p>
                      <p className="text-purple-200/75">
                        {room.host} · {room.viewers.toLocaleString()} viewers · {room.participants}/{room.maxCapacity} seats
                      </p>
                      {room.status === 'Active' && (
                        <button
                          type="button"
                          onClick={() => handleTerminateLive(room.id)}
                          className="w-full py-2 rounded-xl bg-rose-500/20 text-rose-300 font-bold cursor-pointer"
                        >
                          Force Terminate Stream
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* USD Payout Processing */}
            {(section === 'payouts' || section === 'overview') && (
              <div className="p-4 sm:p-5 rounded-3xl bg-[#140A26] border border-white/10 space-y-3">
                <h2 className="font-display font-bold text-base">USD ($) Payout Requests</h2>
                <div className="space-y-2">
                  {data.payouts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#090514] border border-white/10 text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">
                          {p.creator} · {p.method}
                        </p>
                        <p className="text-purple-200/70">{p.requestedAt}</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                          {formatUsd(p.amountUsd)}
                        </span>
                        {p.status === 'Pending' ? (
                          <>
                            <button
                              type="button"
                              aria-label={`Approve payout ${p.id}`}
                              onClick={() => handlePayoutAction(p.id, 'Paid')}
                              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Reject payout ${p.id}`}
                              onClick={() => handlePayoutAction(p.id, 'Rejected')}
                              className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold">
                            {p.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 48 Gift Catalog */}
            {section === 'gifts' && (
              <div className="p-4 sm:p-5 rounded-3xl bg-[#140A26] border border-white/10 space-y-4">
                <p className="text-xs text-purple-200/80">
                  Locked 48 Original Gifts (Double Rose 1 N to Sagarmatha 1,000 N). Coin rates and names are locked per platform spec.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {GIFTS_48.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-2xl bg-[#090514] border border-white/10 flex flex-col items-center text-center gap-1"
                    >
                      <span className="text-2xl">{g.emoji}</span>
                      <span className="text-xs font-bold text-white">{g.name}</span>
                      <span className="text-[11px] font-mono text-amber-300 tabular-nums">
                        {g.coins} N ({formatUsd(g.coins * 0.01)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Infrastructure & Daily Snapshots */}
            {section === 'infra' && (
              <div className="p-5 rounded-3xl bg-[#140A26] border border-white/10 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-[#090514] border border-white/10">
                    <p className="text-purple-300/75">Last Automated DB Snapshot</p>
                    <p className="font-mono font-bold text-sm text-white mt-1">
                      {data.snapshotStatus.lastBackupAt}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#090514] border border-white/10">
                    <p className="text-purple-300/75">Multi-Region Media Storage</p>
                    <p className="font-mono font-bold text-sm text-emerald-400 mt-1">
                      {data.snapshotStatus.region}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#090514] border border-white/10">
                    <p className="text-purple-300/75">Encryption &amp; Compliance</p>
                    <p className="font-mono font-bold text-sm text-white mt-1">
                      {data.snapshotStatus.encrypted} · PCI-DSS
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/admin/backup/trigger', { method: 'POST' });
                    onNotify('Daily encrypted database & media snapshot triggered');
                    fetchOverview();
                  }}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] font-bold cursor-pointer"
                >
                  Run Snapshot Backup Now
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

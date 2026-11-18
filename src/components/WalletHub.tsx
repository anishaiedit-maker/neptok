import React, { useState } from 'react';
import {
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  CreditCard,
  Settings,
  Gift,
  Plus,
  Trash2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  COIN_PACKAGES,
  calculatePackageTotalCoins,
  coinsToUsd,
  formatUsd,
  formatCoins,
} from '../utils/neptokLogic';
import type { LinkedAccountItem, WalletTransaction } from '../types/neptok';

interface WalletHubProps {
  coins: number;
  creatorBalanceUsd: number;
  transactions: WalletTransaction[];
  linkedAccounts: LinkedAccountItem[];
  onRechargeCoins: (packageId: string, method: string) => Promise<void>;
  onWithdrawUsd: (amountUsd: number, method: string) => Promise<void>;
  onAddLinkedAccount: (provider: LinkedAccountItem['provider'], label: string) => void;
  onRemoveLinkedAccount: (id: string) => void;
  onOpenGiftStore: () => void;
  onOpenCreatorStudio: () => void;
  onNotify: (msg: string) => void;
}

export const WalletHub: React.FC<WalletHubProps> = ({
  coins,
  creatorBalanceUsd,
  transactions,
  linkedAccounts,
  onRechargeCoins,
  onWithdrawUsd,
  onAddLinkedAccount,
  onRemoveLinkedAccount,
  onOpenGiftStore,
  onOpenCreatorStudio,
  onNotify,
}) => {
  const [section, setSection] = useState<'overview' | 'recharge' | 'withdraw' | 'history' | 'linked' | 'settings'>('overview');
  const [selectedPkgId, setSelectedPkgId] = useState(COIN_PACKAGES[2].id);
  const [selectedMethod, setSelectedMethod] = useState(linkedAccounts[0]?.label || 'Visa •••• 4242 (USD)');
  const [withdrawAmount, setWithdrawAmount] = useState('50');
  const [newProvider, setNewProvider] = useState<LinkedAccountItem['provider']>('PayPal');
  const [newLabel, setNewLabel] = useState('');
  const [pinLock, setPinLock] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleRecharge = async () => {
    setBusy(true);
    try {
      await onRechargeCoins(selectedPkgId, selectedMethod);
      setSection('overview');
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmount);
    if (!Number.isFinite(amt) || amt < 10) {
      onNotify('Minimum withdrawal is $10.00 USD');
      return;
    }
    if (amt > creatorBalanceUsd) {
      onNotify('Insufficient Creator USD balance');
      return;
    }
    setBusy(true);
    try {
      await onWithdrawUsd(amt, selectedMethod);
      setSection('overview');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[640px] bg-[#090514] text-white overflow-y-auto p-4 sm:p-5 space-y-5">
      {/* Header + Quick Gift Store Access */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl">NepTok Wallet ($ USD)</h2>
          <p className="text-xs text-purple-200/75">
            Balances &amp; payouts strictly in USD ($) and NepTok Coins (N)
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenGiftStore}
          className="px-3.5 py-2 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs font-bold flex items-center gap-1.5 shadow-[0_0_18px_rgba(255,0,128,0.45)] cursor-pointer shrink-0"
        >
          <Gift className="w-4 h-4" />
          <span>Gift Store</span>
        </button>
      </div>

      {/* Dual Balance Card: My Wallet & Creator Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1C0F33] to-[#2B104E] border border-[#FF0080]/40 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-purple-200">
            <span>My Wallet</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <p className="font-display text-2xl font-extrabold text-white tabular-nums">
            {formatCoins(coins)}
          </p>
          <p className="text-xs font-mono text-amber-300 tabular-nums">
            ≈ {formatUsd(coinsToUsd(coins))} USD
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreatorStudio}
          className="text-left p-4 rounded-3xl bg-gradient-to-br from-[#140A26] to-[#1E103B] border border-[#9D00FF]/40 hover:border-[#FF0080] transition-colors space-y-1.5 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-purple-200">
            <span>Creator Balance</span>
            <span className="text-[#FF0080] font-bold">&gt;</span>
          </div>
          <p className="font-display text-2xl font-extrabold text-emerald-400 tabular-nums">
            {formatUsd(creatorBalanceUsd)}
          </p>
          <p className="text-xs text-purple-200/75">Content &amp; Gift Earnings (USD)</p>
        </button>
      </div>

      {/* 6 Action Tiles */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { id: 'recharge' as const, label: 'Recharge Your Wallet', icon: Plus, accent: 'text-[#FF0080]' },
          { id: 'overview' as const, label: 'Earn Coin', icon: Sparkles, accent: 'text-amber-300' },
          { id: 'withdraw' as const, label: 'Withdraw ($)', icon: ArrowUpRight, accent: 'text-emerald-400' },
          { id: 'history' as const, label: 'Transaction History', icon: History, accent: 'text-sky-400' },
          { id: 'linked' as const, label: 'Linked Accounts', icon: CreditCard, accent: 'text-[#9D00FF]' },
          { id: 'settings' as const, label: 'Wallet Settings', icon: Settings, accent: 'text-purple-200' },
        ].map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.label}
              type="button"
              onClick={() => {
                if (tile.label === 'Earn Coin') {
                  onOpenCreatorStudio();
                } else {
                  setSection(tile.id);
                }
              }}
              className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                section === tile.id
                  ? 'bg-[#FF0080]/15 border-[#FF0080]'
                  : 'bg-[#140A26] border-white/10 hover:border-purple-400/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${tile.accent}`} />
              <span className="text-xs font-bold leading-tight">{tile.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section Body */}
      {section === 'recharge' && (
        <div className="p-4 rounded-3xl bg-[#140A26] border border-[#FF0080]/35 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base">Recharge Your Wallet ($ USD)</h3>
            <button type="button" onClick={() => setSection('overview')} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {COIN_PACKAGES.map((pkg) => {
              const total = calculatePackageTotalCoins(pkg);
              const selected = selectedPkgId === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#FF0080]/20 border-[#FF0080]'
                      : 'bg-[#090514] border-white/10'
                  }`}
                >
                  <p className="text-[10px] font-bold text-amber-300">
                    {pkg.bonusPct > 0 ? `+${pkg.bonusPct}% Bonus` : pkg.label}
                  </p>
                  <p className="font-display font-extrabold text-base text-white tabular-nums mt-0.5">
                    {total.toLocaleString()} N
                  </p>
                  <p className="text-xs font-mono text-emerald-400 tabular-nums">
                    {formatUsd(pkg.priceUsd)}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-purple-200 font-semibold">Payment Method</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#090514] border border-white/15 text-xs"
            >
              {linkedAccounts.map((la) => (
                <option key={la.id} value={la.label}>
                  {la.provider}: {la.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleRecharge}
            className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] font-bold text-xs cursor-pointer disabled:opacity-60"
          >
            {busy ? 'Processing USD Checkout...' : 'Confirm Coin Recharge'}
          </button>
        </div>
      )}

      {section === 'withdraw' && (
        <div className="p-4 rounded-3xl bg-[#140A26] border border-emerald-400/35 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base">Withdraw Creator Earnings ($ USD)</h3>
            <button type="button" onClick={() => setSection('overview')} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-purple-200/80">
            Available Creator Balance: <strong className="text-emerald-400">{formatUsd(creatorBalanceUsd)}</strong>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="number"
              min={10}
              step={5}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              aria-label="Withdrawal amount in USD"
              className="h-10 px-3 rounded-xl bg-[#090514] border border-white/15 text-sm font-mono tabular-nums"
            />
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="h-10 px-3 rounded-xl bg-[#090514] border border-white/15 text-xs"
            >
              {linkedAccounts.map((la) => (
                <option key={la.id} value={la.label}>
                  {la.provider}: {la.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleWithdraw}
            className="w-full h-11 rounded-full bg-emerald-500 text-black font-bold text-xs cursor-pointer disabled:opacity-60"
          >
            {busy ? 'Submitting Payout Request...' : 'Request USD Payout'}
          </button>
        </div>
      )}

      {section === 'linked' && (
        <div className="p-4 rounded-3xl bg-[#140A26] border border-white/15 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base">Linked Cards &amp; Payment Accounts</h3>
            <button type="button" onClick={() => setSection('overview')} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {linkedAccounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#090514] border border-white/10 text-xs"
              >
                <div>
                  <p className="font-bold text-white">{acc.provider}</p>
                  <p className="text-purple-200/75">{acc.label}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${acc.label}`}
                  onClick={() => onRemoveLinkedAccount(acc.id)}
                  className="p-1.5 rounded-lg bg-rose-500/15 text-rose-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2">
            <select
              value={newProvider}
              onChange={(e) => setNewProvider(e.target.value as LinkedAccountItem['provider'])}
              className="h-10 px-3 rounded-xl bg-[#090514] border border-white/15 text-xs"
            >
              {(['Visa', 'Mastercard', 'PayPal', 'Google Pay', 'Apple Pay', 'Wise', 'USDT (Crypto)', 'Bank Account'] as const).map(
                (p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                )
              )}
            </select>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Account email, last 4 digits, or wallet..."
              className="flex-1 h-10 px-3 rounded-xl bg-[#090514] border border-white/15 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (!newLabel.trim()) return;
                onAddLinkedAccount(newProvider, newLabel.trim());
                setNewLabel('');
              }}
              className="px-4 h-10 rounded-xl bg-[#FF0080] text-xs font-bold cursor-pointer"
            >
              Add Account
            </button>
          </div>
        </div>
      )}

      {section === 'settings' && (
        <div className="p-4 rounded-3xl bg-[#140A26] border border-white/15 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base">Payment Security &amp; Settings</h3>
            <button type="button" onClick={() => setSection('overview')} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#090514] border border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Require 2FA / Biometric PIN before sending gifts or USD payouts</span>
            </div>
            <button
              type="button"
              onClick={() => setPinLock((p) => !p)}
              className={`px-3 py-1 rounded-full font-bold cursor-pointer ${
                pinLock ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'
              }`}
            >
              {pinLock ? 'ENABLED' : 'OFF'}
            </button>
          </div>
        </div>
      )}

      {/* Transaction History (Shown in Overview & History) */}
      {(section === 'overview' || section === 'history') && (
        <div className="space-y-2.5">
          <h3 className="font-display font-bold text-sm text-purple-100">
            Recent USD &amp; Coin Transactions
          </h3>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#140A26] border border-white/10"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
                    {tx.coinsDelta < 0 || tx.type === 'Withdraw' ? (
                      <ArrowUpRight className="w-4 h-4 text-rose-400" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{tx.title}</p>
                    <p className="text-[11px] text-purple-200/70 truncate">
                      {tx.method} · {tx.time}
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  {tx.coinsDelta !== 0 && (
                    <p
                      className={`text-xs font-bold ${
                        tx.coinsDelta > 0 ? 'text-amber-300' : 'text-rose-400'
                      }`}
                    >
                      {tx.coinsDelta > 0 ? '+' : ''}
                      {tx.coinsDelta.toLocaleString()} N
                    </p>
                  )}
                  <p className="text-[11px] text-emerald-400">{formatUsd(tx.usdAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prominent "Gift Store" Button Inside Bottom of Wallet Page */}
      <div className="pt-2 pb-4">
        <button
          type="button"
          onClick={onOpenGiftStore}
          className="w-full p-4 rounded-3xl bg-gradient-to-r from-[#FF0080] via-[#C800B5] to-[#9D00FF] shadow-[0_0_28px_rgba(255,0,128,0.45)] flex items-center justify-between gap-3 hover:brightness-110 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 text-left">
            <span className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </span>
            <div>
              <p className="font-display font-extrabold text-base text-white">
                Open NepTok Gift Store
              </p>
              <p className="text-xs text-pink-100">
                Browse &amp; send all 48 original gifts (Double Rose 1 N to Sagarmatha 1,000 N)
              </p>
            </div>
          </div>
          <Wallet className="w-5 h-5 text-white shrink-0" />
        </button>
      </div>
    </div>
  );
};

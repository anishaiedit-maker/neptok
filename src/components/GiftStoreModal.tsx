import React, { useState } from 'react';
import { X, Coins, History, Send, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { GIFTS_48, formatCoins, formatUsd, coinsToUsd, type GiftItem, type GiftCategory } from '../utils/neptokLogic';

interface GiftHistoryRecord {
  id: string;
  giftName: string;
  emoji: string;
  coins: number;
  direction: 'sent' | 'received';
  counterparty: string;
  time: string;
}

interface GiftStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoins: number;
  recipientLabel: string;
  onSendGift: (gift: GiftItem) => void;
  onOpenRecharge: () => void;
  history: GiftHistoryRecord[];
  continuousSendMode?: boolean;
  comboCount?: number;
  lastSentGiftId?: number | null;
}

type StoreTab = 'history' | 'sent' | 'send' | 'received';

export const GiftStoreModal: React.FC<GiftStoreModalProps> = ({
  isOpen,
  onClose,
  userCoins,
  recipientLabel,
  onSendGift,
  onOpenRecharge,
  history,
  continuousSendMode = false,
  comboCount = 0,
  lastSentGiftId = null,
}) => {
  const [activeTab, setActiveTab] = useState<StoreTab>('send');
  const [category, setCategory] = useState<'All' | GiftCategory>('All');
  const [selectedGift, setSelectedGift] = useState<GiftItem>(GIFTS_48[0]);

  if (!isOpen) return null;
  const canAffordSelected = userCoins >= selectedGift.coins;

  const filteredGifts =
    category === 'All' ? GIFTS_48 : GIFTS_48.filter((g) => g.category === category);

  const visibleHistory =
    activeTab === 'sent'
      ? history.filter((h) => h.direction === 'sent')
      : activeTab === 'received'
      ? history.filter((h) => h.direction === 'received')
      : history;

  return (
    <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-2xl bg-[#120824] border border-[#FF0080]/35 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#1A0D33] to-[#261046] border-b border-white/10 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-base text-white">
              NepTok Gift Store (48 Gifts)
            </h2>
            <p className="text-xs text-purple-200/80">
              Sending to <span className="text-[#FF0080] font-semibold">{recipientLabel}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#090514] border border-amber-400/30 flex items-center gap-1.5 text-xs font-bold tabular-nums whitespace-nowrap">
              <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-300">{formatCoins(userCoins)}</span>
              <span className="text-purple-300/70">({formatUsd(coinsToUsd(userCoins))})</span>
            </div>
            <button
              type="button"
              aria-label="Close Gift Store"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Bar */}
        {activeTab === 'send' && (
          <div className="px-4 py-2.5 bg-[#0D061A] border-b border-white/10 flex items-center gap-2 overflow-x-auto">
            {(['All', 'Floral', 'Cultural', 'Love', 'Luxury', 'Himalayan'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  category === cat
                    ? 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white'
                    : 'bg-white/5 text-purple-200 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'send' ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
              {filteredGifts.map((gift) => {
                const isSelected = selectedGift.id === gift.id;
                const affordable = userCoins >= gift.coins;
                return (
                  <button
                    key={gift.id}
                    type="button"
                    data-testid={`gift-tile-${gift.id}`}
                    onClick={() => {
                      if (continuousSendMode && isSelected) {
                        onSendGift(gift);
                      } else {
                        setSelectedGift(gift);
                      }
                    }}
                    className={`group relative flex flex-col items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF0080]/20 border-[#FF0080] shadow-[0_0_16px_rgba(255,0,128,0.35)] scale-[1.02]'
                        : 'bg-[#190D30] border-white/10 hover:border-purple-400/50'
                    } ${!affordable ? 'opacity-65' : ''}`}
                  >
                    {continuousSendMode && isSelected && comboCount > 0 && lastSentGiftId === gift.id && (
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-mono font-extrabold shadow">
                        x{comboCount}
                      </span>
                    )}
                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                      {gift.emoji}
                    </span>
                    <span className="text-[11px] font-semibold text-white text-center leading-tight line-clamp-1">
                      {gift.name}
                    </span>
                    <span className="mt-1 text-[10px] font-mono font-bold text-amber-300 tabular-nums">
                      {gift.coins.toLocaleString()} N
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleHistory.length === 0 ? (
                <p className="text-center text-sm text-purple-200/70 py-10">
                  No gift records in this tab yet.
                </p>
              ) : (
                visibleHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#190D30] border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.giftName}</p>
                        <p className="text-xs text-purple-200/70">
                          {item.direction === 'sent' ? 'To' : 'From'} {item.counterparty} · {item.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <p
                        className={`text-xs font-bold ${
                          item.direction === 'sent' ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {item.direction === 'sent' ? '-' : '+'}
                        {item.coins.toLocaleString()} N
                      </p>
                      <p className="text-[11px] text-purple-300/70">
                        {formatUsd(coinsToUsd(item.coins))}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected Gift Send Action Bar */}
        {activeTab === 'send' && (
          <div className="px-4 py-3 bg-[#170B2D] border-t border-white/10 space-y-2">
            {!canAffordSelected && (
              <div
                data-testid="gift-insufficient-coins-banner"
                className="px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-400/45 flex items-center justify-between gap-2 text-xs"
              >
                <span className="font-bold text-rose-200">
                  Insufficient Coins ({formatCoins(userCoins)} available, needs {selectedGift.coins.toLocaleString()} N)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRecharge();
                  }}
                  className="px-3 py-1 rounded-full bg-amber-400 text-black font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  Recharge
                </button>
              </div>
            )}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-2xl shrink-0">{selectedGift.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{selectedGift.name}</span>
                    {continuousSendMode && comboCount > 0 && lastSentGiftId === selectedGift.id && (
                      <span
                        data-testid="gift-store-combo-badge"
                        className="px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-mono text-[10px] font-extrabold shrink-0"
                      >
                        x{comboCount}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] font-mono text-amber-300 tabular-nums truncate">
                    {selectedGift.coins.toLocaleString()} N · {formatUsd(coinsToUsd(selectedGift.coins))}
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-testid="gift-store-send-btn"
                onClick={() => onSendGift(selectedGift)}
                className={`px-5 h-10 rounded-full text-xs font-bold shadow-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  canAffordSelected
                    ? 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white shadow-[#FF0080]/30 hover:brightness-110 active:scale-95'
                    : 'bg-rose-500/25 border border-rose-400/60 text-rose-200'
                }`}
              >
                {canAffordSelected ? `Send ${selectedGift.name}` : 'Insufficient Coins · Recharge'}
              </button>
            </div>
          </div>
        )}

        {/* Bottom 5 Tabs: Gift History | Sent Gifts | Send Gift | Received Gifts | Recharge Your Wallet */}
        <div className="grid grid-cols-5 bg-[#090514] border-t border-white/10 px-1 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold cursor-pointer ${
              activeTab === 'history' ? 'text-[#FF0080]' : 'text-purple-200/70'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Gift History</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold cursor-pointer ${
              activeTab === 'sent' ? 'text-[#FF0080]' : 'text-purple-200/70'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Sent Gifts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold cursor-pointer ${
              activeTab === 'send' ? 'text-[#FF0080]' : 'text-purple-200/70'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send Gift</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('received')}
            className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold cursor-pointer ${
              activeTab === 'received' ? 'text-[#FF0080]' : 'text-purple-200/70'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Received Gifts</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenRecharge();
            }}
            className="flex flex-col items-center gap-1 py-1 text-[10px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span className="truncate max-w-full">Recharge Your Wallet</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Bell,
  Copy,
  Check,
  Upload,
  Wifi,
  WifiOff,
  Smartphone,
} from 'lucide-react';
import {
  encodeSyncToken,
  decodeSyncToken,
  formatBdtPrice,
  type Language,
  type SyncStatePayload,
  type OrderRecord,
} from '../utils/storeLogic';

export interface AppNotificationItem {
  id: string;
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  timestamp: string;
}

interface SyncAndNotificationModalProps {
  isOpen: boolean;
  language: Language;
  syncPayload: SyncStatePayload;
  lastSyncedAt: string;
  notifications: AppNotificationItem[];
  simulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  onImportSyncPayload: (payload: SyncStatePayload) => void;
  onTriggerPushNotification: (customTitleEn?: string, customTitleBn?: string) => void;
  onClose: () => void;
}

export const SyncAndNotificationModal: React.FC<SyncAndNotificationModalProps> = ({
  isOpen,
  language,
  syncPayload,
  lastSyncedAt,
  notifications,
  simulatedOffline,
  onToggleSimulatedOffline,
  onImportSyncPayload,
  onTriggerPushNotification,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const currentToken = encodeSyncToken(syncPayload);

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(currentToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleApplyToken = (e: React.FormEvent) => {
    e.preventDefault();
    const decoded = decodeSyncToken(importInput);
    if (!decoded) {
      setImportStatus('error');
      return;
    }
    onImportSyncPayload(decoded);
    setImportStatus('success');
    setImportInput('');
    setTimeout(() => setImportStatus('idle'), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
    >
      <div className="relative w-full max-w-3xl rounded-xl bg-[#fafaf7] dark:bg-[#101e15] border border-stone-200 dark:border-emerald-900/60 p-6 md:p-8 shadow-2xl my-8">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 dark:border-emerald-900/50 pb-4">
          <div>
            <h2
              id="sync-modal-title"
              className="text-xl font-bold text-stone-900 dark:text-stone-100"
            >
              {language === 'bn'
                ? 'মাল্টি-ডিভাইস ডেটা সিঙ্ক, অফলাইন পিডব্লিউএ ও পুশ নোটিফিকেশন'
                : 'Multi-Device Data Sync, Offline Cache & Push Notifications'}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {language === 'bn'
                ? `ডিভাইস আইডি: ${syncPayload.deviceId} · সর্বশেষ সিঙ্ক: ${lastSyncedAt}`
                : `Device ID: ${syncPayload.deviceId} · Last BroadcastChannel Sync: ${lastSyncedAt}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sync and notifications dialog"
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Multi-Device Synchronization & Offline Control */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-300">
              <Smartphone className="w-4 h-4" />
              <h3>
                {language === 'bn'
                  ? '১. মাল্টি-ডিভাইস ও ক্রস-ট্যাব সিঙ্ক্রোনাইজেশন'
                  : '1. Cross-Device & Real-Time Tab Sync'}
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {language === 'bn'
                ? 'আপনার কার্ট, অর্ডার হিস্ট্রি, ভাষা এবং ডার্ক মোড স্বয়ংক্রিয়ভাবে ব্রাউজারের সকল ট্যাবে রিয়েল-টাইমে সিঙ্ক হয়। অন্য মোবাইল বা ল্যাপটপে সিঙ্ক করতে নিচের সিঙ্ক কোডটি কপি বা পেস্ট করুন।'
                : 'Your shopping bag, order history, language, and theme preferences synchronize automatically across open tabs via BroadcastChannel and IndexedDB/localStorage. Copy your portable Sync Token below to restore state on another phone or laptop.'}
            </p>

            {/* Export Sync Token */}
            <div className="p-3.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>
                  {language === 'bn' ? 'আপনার বর্তমান ডিভাইস সিঙ্ক কোড:' : 'Your Portable Device Sync Token:'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="inline-flex items-center gap-1 text-emerald-900 dark:text-emerald-300 hover:underline cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>
                    {copied
                      ? language === 'bn'
                        ? 'কপি হয়েছে'
                        : 'Copied!'
                      : language === 'bn'
                        ? 'কোড কপি করুন'
                        : 'Copy Sync Code'}
                  </span>
                </button>
              </div>
              <input
                type="text"
                readOnly
                aria-label="Portable Device Sync Token"
                value={currentToken}
                className="w-full rounded bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 px-2.5 py-1.5 text-[11px] font-mono text-stone-600 dark:text-stone-400"
              />
            </div>

            {/* Import Sync Token */}
            <form onSubmit={handleApplyToken} className="space-y-2">
              <label
                htmlFor="import-sync-token-input"
                className="block text-xs font-semibold text-stone-700 dark:text-stone-300"
              >
                {language === 'bn'
                  ? 'অন্য ডিভাইসের সিঙ্ক কোড পেস্ট করে ডেটা লোড করুন:'
                  : 'Restore State from Another Device Token:'}
              </label>
              <div className="flex gap-2">
                <input
                  id="import-sync-token-input"
                  type="text"
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder="TAW1:eyJ2ZXJzaW9uIjox..."
                  className="flex-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-xs font-mono"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-900 text-white dark:bg-emerald-500 dark:text-stone-950 text-xs font-semibold hover:opacity-90 cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'সিঙ্ক করুন' : 'Sync State'}</span>
                </button>
              </div>
              {importStatus === 'success' && (
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                  {language === 'bn'
                    ? 'সফলভাবে ডিভাইস ডেটা সিঙ্ক সম্পন্ন হয়েছে!'
                    : 'Device state synchronized successfully!'}
                </p>
              )}
              {importStatus === 'error' && (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                  {language === 'bn'
                    ? 'সিঙ্ক কোডটি সঠিক নয়। অনুগ্রহ করে TAW1: দিয়ে শুরু হওয়া কোড দিন।'
                    : 'Invalid Sync Token format. Ensure token starts with TAW1:.'}
                </p>
              )}
            </form>

            {/* Offline Mode Test Switch */}
            <div className="pt-3 border-t border-stone-200 dark:border-emerald-900/50 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {language === 'bn' ? 'অফলাইন রেজিলিয়েন্স মোড পরীক্ষা' : 'Offline Resilience Mode'}
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                  {language === 'bn'
                    ? 'ইন্টারনেট ছাড়াই সম্পূর্ণ ক্যাটালগ ও কার্ট ব্রাউজ করুন'
                    : 'Verify Service Worker & local persistence without network'}
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleSimulatedOffline}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  simulatedOffline
                    ? 'bg-amber-900 text-white border-amber-500'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700'
                }`}
              >
                {simulatedOffline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'অফলাইন সক্রিয়' : 'Offline Active'}</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>{language === 'bn' ? 'অনলাইন (টেস্ট অফলাইন)' : 'Online (Test Offline)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Column 2: Push Notifications & Order History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-300">
                <Bell className="w-4 h-4" />
                <h3>
                  {language === 'bn'
                    ? '২. পুশ নোটিফিকেশন ও হারভেস্ট অ্যালার্ট'
                    : '2. Push Notifications & Harvest Alerts'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onTriggerPushNotification()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900 text-white dark:bg-emerald-500 dark:text-stone-950 text-xs font-semibold hover:opacity-90 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {language === 'bn' ? 'টেস্ট পুশ নোটিফিকেশন' : 'Send Push Alert'}
                </span>
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300">
              {language === 'bn'
                ? 'নতুন সুন্দরবনের মধু সংগ্রহ, রাজশাহীর আমের বুকিং এবং আপনার অর্ডারের ডেলিভারি আপডেট সাথে সাথে পুশ নোটিফিকেশনে পান।'
                : 'Receive instant Web Push and in-app alerts when raw Sundarbans honey batches arrive or when your order dispatches.'}
            </p>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-emerald-900/50 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                    <span>{language === 'bn' ? notif.titleBn : notif.titleEn}</span>
                    <span className="text-[10px] font-mono text-stone-500">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-400 mt-1">
                    {language === 'bn' ? notif.bodyBn : notif.bodyEn}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent Synced Orders */}
            <div className="pt-3 border-t border-stone-200 dark:border-emerald-900/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                {language === 'bn'
                  ? `সিঙ্ক করা অর্ডারসমূহ (${syncPayload.orders.length})`
                  : `Synchronized Orders (${syncPayload.orders.length})`}
              </h4>
              {syncPayload.orders.length === 0 ? (
                <p className="text-xs text-stone-500">
                  {language === 'bn'
                    ? 'এখনো কোনো অর্ডার করা হয়নি।'
                    : 'No orders placed on this profile yet.'}
                </p>
              ) : (
                <ul className="space-y-1.5 max-h-28 overflow-y-auto text-xs">
                  {syncPayload.orders.map((ord: OrderRecord) => (
                    <li
                      key={ord.orderId}
                      className="flex items-center justify-between p-2 rounded bg-stone-100 dark:bg-stone-900"
                    >
                      <span className="font-mono font-semibold text-emerald-900 dark:text-emerald-300">
                        {ord.orderId} · {ord.customer.district}
                      </span>
                      <span className="font-bold tabular-nums">
                        {formatBdtPrice(ord.grandTotalBdt, language)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

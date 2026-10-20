import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { Language } from '../utils/storeLogic';

interface PWAInstallButtonProps {
  language: Language;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ language }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAction}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--accent-text)] hover:border-emerald-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        aria-label={language === 'bn' ? 'অফলাইন অ্যাপ ইনস্টল' : 'Install Offline App'}
      >
        <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>
          {isIOS
            ? language === 'bn'
              ? 'আইওএস অ্যাপ ইনস্টল'
              : 'Install on iOS'
            : language === 'bn'
              ? 'অফলাইন অ্যাপ ইনস্টল'
              : 'Install Offline App'}
        </span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-md rounded-xl bg-[#fafaf7] dark:bg-[#132219] border border-stone-200 dark:border-emerald-900/60 p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h3
                id="pwa-guide-title"
                className="text-lg font-bold text-stone-900 dark:text-stone-100"
              >
                {language === 'bn'
                  ? 'তানজিম এগ্রো ওয়ার্ল্ড অফলাইন অ্যাপ ইনস্টল'
                  : 'Install Tanzim Agro World PWA'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close install guide"
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-stone-700 dark:text-stone-300">
              {isIOS ? (
                <p>
                  {language === 'bn' ? (
                    <>
                      ১. সাফারি ব্রাউজারের নিচে <strong>Share</strong> আইকনে ট্যাপ করুন।
                      <br />
                      ২. নিচে স্ক্রল করে <strong>Add to Home Screen</strong> নির্বাচন করুন।
                    </>
                  ) : (
                    <>
                      1. Tap the <strong>Share</strong> button in your Safari toolbar.
                      <br />
                      2. Scroll down and select <strong>Add to Home Screen</strong> for instant offline shopping.
                    </>
                  )}
                </p>
              ) : (
                <p>
                  {language === 'bn' ? (
                    <>
                      আপনার ব্রাউজারের অ্যাড্রেস বারের ডান পাশে থাকা <strong>Install App</strong> আইকনে ক্লিক করুন অথবা ব্রাউজার মেনু থেকে <strong>Add to Home Screen</strong> নির্বাচন করুন। আমাদের সার্ভিস ওয়ার্কার সম্পূর্ণ ক্যাটালগ ও কার্ট অফলাইনে সংরক্ষণ করে।
                    </>
                  ) : (
                    <>
                      Click the <strong>Install Tanzim Agro World</strong> icon in your browser address bar (or select <strong>Install App / Add to Home Screen</strong> from the browser menu). Full catalog browsing and cart storage work 100% offline.
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-lg bg-emerald-900 text-white dark:bg-emerald-500 dark:text-stone-950 text-xs font-semibold hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'বুঝেছি' : 'Got It'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

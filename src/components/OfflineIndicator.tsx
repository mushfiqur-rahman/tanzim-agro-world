import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import type { Language } from '../utils/storeLogic';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

interface OfflineIndicatorProps {
  language: Language;
  simulatedOffline: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  language,
  simulatedOffline,
}) => {
  const browserOnline = useOnlineStatus();
  const isOnline = browserOnline && !simulatedOffline;

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-lg bg-amber-900 text-amber-50 border border-amber-400/40 px-4 py-2.5 text-xs font-semibold shadow-lg"
    >
      <WifiOff className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
      <span>
        {language === 'bn'
          ? 'অফলাইন মোড সক্রিয় — ক্যাশ করা ডেটা ও লোকাল কার্ট ব্যবহৃত হচ্ছে।'
          : 'Offline Mode Active — Browsing cached catalog & local cart.'}
      </span>
    </div>
  );
};

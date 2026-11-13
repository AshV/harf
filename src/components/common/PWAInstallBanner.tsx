import React, { useState, useEffect } from 'react';
import { Download, X, WifiOff } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if already running in standalone mode (installed)
    const isInStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true);
    setIsStandalone(isInStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt on Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after 2 seconds so it is not intrusive immediately
      const dismissed = localStorage.getItem('harf_pwa_install_dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 1500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('harf_pwa_install_dismissed', 'true');
  };

  // Don't show if already installed
  if (isStandalone) return null;

  return (
    <>
      {/* Offline Alert Pill (Shows when internet drops) */}
      {!isOnline && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-[#1F1916] text-[#FAF5E8] border border-amber-500/30 px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top duration-300">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>ऑफ़लाइन मोड (डाउनलोड की गई पुस्तकें उपलब्ध हैं)</span>
        </div>
      )}

      {/* Install App Floating Banner */}
      {showBanner && deferredPrompt && (
        <aside
          aria-label="ऐप इंस्टॉल बैनर"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-[#231814] text-[#FAF5E8] rounded-2xl p-4 shadow-2xl border border-amber-900/40 flex items-start gap-3.5 animate-in slide-in-from-bottom duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E08E45] to-[#C85A32] text-[#1F140E] flex items-center justify-center font-black font-serif text-lg shrink-0 shadow-sm">
            ह
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold font-serif leading-tight text-[#FAF5E8]">
              हर्फ़ ऐप इंस्टॉल करें
            </h4>
            <p className="text-[11px] text-[#FAF5E8]/70 mt-0.5 leading-snug">
              बिना इंटरनेट के भी पढ़ने के लिए होम स्क्रीन पर जोड़ें। तेज़ और विज्ञापन-मुक्त।
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#E08E45] to-[#C85A32] text-[#1F140E] text-xs font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>इंस्टॉल करें</span>
              </button>

              <button
                onClick={handleDismiss}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#FAF5E8]/80 text-xs font-medium transition-all"
              >
                बाद में
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </aside>
      )}

      {/* iOS Safari instructions pill (if user visits on iOS and hasn't installed) */}
      {isIOS && !isStandalone && (
        <div className="hidden" aria-hidden="true">
          {/* Internal state marker for iOS */}
        </div>
      )}
    </>
  );
};

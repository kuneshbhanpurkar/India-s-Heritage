import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already in standalone (installed) mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('dharohar_pwa_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // Listen for Chrome / Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('[Dharohar PWA] Successfully installed on device');
    });

    // Custom trigger from Header or other UI buttons
    const handleCustomTrigger = () => {
      setIsDismissed(false);
      sessionStorage.removeItem('dharohar_pwa_dismissed');
      // Prompt user or show iOS instructions
      setTimeout(() => {
        const promptBtn = document.getElementById('dharohar-pwa-install-btn');
        if (promptBtn) {
          promptBtn.click();
        } else {
          // If no prompt event captured yet, check iOS or show info
          const ua = window.navigator.userAgent.toLowerCase();
          if (/iphone|ipad|ipod/.test(ua)) {
            setShowIOSGuide(true);
          } else {
            alert('To install Dharohar on Android/Chrome: tap your browser menu (⋮) and select "Install app" or "Add to Home screen".');
          }
        }
      }, 50);
    };

    window.addEventListener('dharohar:trigger-pwa-install', handleCustomTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('dharohar:trigger-pwa-install', handleCustomTrigger);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          console.log('[Dharohar PWA] User accepted installation');
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error triggering PWA install prompt:', err);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('dharohar_pwa_dismissed', 'true');
  };

  // If already installed, dismissed, or not ready for prompt (unless on iOS without standalone)
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only display if deferredPrompt is available OR user is on iOS Safari
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom PWA Banner */}
      <aside
        aria-label="Install Dharohar Mobile App"
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-[#1c1b1b] text-white p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-lg animate-fadeIn flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="Dharohar App"
              className="w-12 h-12 rounded-xl shadow-md border border-[#D4AF37]/40 p-0.5 bg-[#9C4212]"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-sm text-[#FBF9F5]">Dharohar App</h4>
                <span className="text-[10px] bg-[#9C4212] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Mobile App
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5">
                Install on your phone for faster access & offline heritage exploration.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
            title="Dismiss"
            aria-label="Dismiss banner"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <button
            id="dharohar-pwa-install-btn"
            onClick={handleInstallClick}
            className="flex-1 bg-gradient-to-r from-[#9C4212] to-[#B8531B] hover:opacity-95 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">install_mobile</span>
            <span>{isIOS ? 'How to Install on iPhone' : 'Install Mobile App'}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs text-neutral-400 hover:text-neutral-200 px-3 py-2 cursor-pointer transition"
          >
            Later
          </button>
        </div>
      </aside>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-6 text-neutral-800 shadow-2xl relative animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src="/icons/icon-192.png"
                alt="Dharohar"
                className="w-12 h-12 rounded-2xl shadow bg-[#9C4212] p-0.5"
              />
              <div>
                <h3 className="font-serif font-bold text-lg text-[#9C4212]">Install on iPhone / iPad</h3>
                <p className="text-xs text-neutral-500">Add to your iOS Home Screen</p>
              </div>
            </div>

            <ol className="text-xs space-y-3 text-neutral-700 mb-5">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#9C4212] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <span>
                  Tap the <strong className="text-neutral-900">Share button</strong> (
                  <span className="material-symbols-outlined text-sm align-middle text-blue-600">ios_share</span>) at
                  the bottom of Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#9C4212] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-neutral-900">"Add to Home Screen"</strong> (
                  <span className="material-symbols-outlined text-sm align-middle text-neutral-700">add_box</span>).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#9C4212] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  3
                </span>
                <span>
                  Tap <strong className="text-neutral-900">"Add"</strong> in top right. Dharohar will launch like a native mobile app!
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full bg-[#9C4212] text-white py-2.5 rounded-xl font-semibold text-xs hover:bg-[#853409] transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

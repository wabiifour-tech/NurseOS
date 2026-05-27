'use client';

import { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Download, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PWAInstallBanner() {
  const { canInstall, isInstalled, isIOS, showInstallHint, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner after a short delay if installable
    if ((canInstall || showInstallHint) && !isInstalled) {
      const timer = setTimeout(() => {
        const wasDismissed = localStorage.getItem('nurseos-install-dismissed');
        if (!wasDismissed) {
          setShowBanner(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, showInstallHint, isInstalled]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[NurseOS] Service Worker registered:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Every hour
        })
        .catch((error) => {
          console.log('[NurseOS] Service Worker registration failed:', error);
        });
    }
  }, []);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    localStorage.setItem('nurseos-install-dismissed', 'true');
  };

  if (isInstalled || dismissed || !showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto max-w-lg rounded-2xl border border-teal-500/30 bg-slate-900/95 backdrop-blur-lg shadow-2xl shadow-teal-500/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">
              Install NurseOS
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isIOS ? (
                <>
                  Tap <Share className="inline h-3 w-3" /> then{' '}
                  <Plus className="inline h-3 w-3" /> &quot;Add to Home Screen&quot;
                </>
              ) : (
                'Add to your device for quick access and offline support'
              )}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {!isIOS && canInstall && (
          <div className="mt-3 flex gap-2">
            <Button
              onClick={handleInstall}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm"
              size="sm"
            >
              <Download className="mr-1.5 h-4 w-4" />
              Install App
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="text-slate-400 border-slate-700 hover:bg-slate-800"
            >
              Not Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

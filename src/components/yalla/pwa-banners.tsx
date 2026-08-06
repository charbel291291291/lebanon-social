import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import { useState } from "react";
import { usePWA } from "@/hooks/use-pwa";
import { FaceLebIcon } from "./faceleb-icon";

export function PWABanners() {
  const { canInstall, install, updateAvailable, applyUpdate, isOnline } = usePWA();
  const [installDismissed, setInstallDismissed] = useState(false);

  return (
    <>
      {/* Offline toast — pinned to top */}
      {!isOnline && (
        <div
          role="alert"
          className="fixed inset-x-0 top-0 z-[200] flex items-center justify-center gap-2 bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground shadow-lg"
        >
          <WifiOff className="size-4 shrink-0" />
          You're offline — some content may be unavailable
        </div>
      )}

      {/* Update available banner */}
      {updateAvailable && (
        <div className="fixed bottom-4 left-1/2 z-[190] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border/60 bg-card/95 px-4 py-3 shadow-lift backdrop-blur-md sm:bottom-6">
          <RefreshCw className="size-4 shrink-0 text-primary" />
          <span className="text-sm font-semibold">New version available</span>
          <button
            onClick={applyUpdate}
            className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Install prompt — shown once per session */}
      {canInstall && !installDismissed && (
        <div className="fixed bottom-20 left-1/2 z-[190] flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-3xl border border-border/60 bg-card/95 p-4 shadow-lift backdrop-blur-md sm:bottom-24">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <FaceLebIcon className="size-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Install FaceLeb</p>
            <p className="text-xs text-muted-foreground">Add to your home screen for the best experience</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              onClick={install}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              <Download className="size-3" />
              Install
            </button>
            <button
              onClick={() => setInstallDismissed(true)}
              className="rounded-full p-1.5 hover:bg-muted"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

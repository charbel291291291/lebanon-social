import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAState {
  canInstall: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  install: () => Promise<void>;
  applyUpdate: () => void;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  notificationPermission: NotificationPermission | null;
}

let registration: ServiceWorkerRegistration | null = null;
let pendingWorker: ServiceWorker | null = null;

export function usePWA(): PWAState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission | null>(
      typeof Notification !== "undefined" ? Notification.permission : null
    );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ── Detect standalone (already installed) ──────────────────────────────
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mq.matches || (navigator as any).standalone === true);
    const mqHandler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener("change", mqHandler);

    // ── Install prompt ─────────────────────────────────────────────────────
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    // ── Online / offline ───────────────────────────────────────────────────
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // ── Service worker registration ────────────────────────────────────────
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          registration = reg;

          // Check for a waiting worker (app opened after update was downloaded)
          if (reg.waiting) {
            pendingWorker = reg.waiting;
            setUpdateAvailable(true);
          }

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                pendingWorker = newWorker;
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch((err) => console.error("[SW] registration failed:", err));

      // When the SW controlling the page changes, reload to apply update
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      mq.removeEventListener("change", mqHandler);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return;
    const result = await installPrompt.prompt();
    if (result.outcome === "accepted") {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  const applyUpdate = useCallback(() => {
    if (pendingWorker) {
      pendingWorker.postMessage({ type: "SKIP_WAITING" });
    } else if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    // controllerchange listener above handles the reload
  }, []);

  const requestNotificationPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      if (typeof Notification === "undefined") return "denied";
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      return perm;
    }, []);

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    isOnline,
    updateAvailable,
    install,
    applyUpdate,
    requestNotificationPermission,
    notificationPermission,
  };
}

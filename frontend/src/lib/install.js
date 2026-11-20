// Installing FindIt as an app (PWA) on a phone or a computer.
//
// Chromium browsers fire `beforeinstallprompt` very early, usually before React mounts, so it is
// captured in main.jsx with captureInstallPrompt() and kept here. Safari on iPhone / iPad and
// Firefox don't have that event: there the dialog shows the manual steps instead.
import { useEffect, useState } from "react";

const EVENT = "findit:install-changed";
let deferredPrompt = null;

export function captureInstallPrompt() {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we show our own button instead of the browser's mini bar
    deferredPrompt = e;
    window.dispatchEvent(new Event(EVENT));
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    window.dispatchEvent(new Event(EVENT));
  });
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

/** "ios" | "android" | "desktop" */
export function detectPlatform() {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac but has a touch screen
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function computeStatus() {
  if (isStandalone()) return "installed";
  if (deferredPrompt) return "prompt";
  return "manual";
}

/**
 * status:
 *  - "installed": already running as an app → show nothing
 *  - "prompt":    the browser can install in one click
 *  - "manual":    show the manual steps (Safari, Firefox…)
 */
export function useInstallApp() {
  const [status, setStatus] = useState(computeStatus);

  useEffect(() => {
    const update = () => setStatus(computeStatus());
    update();
    window.addEventListener(EVENT, update);
    const mq = window.matchMedia?.("(display-mode: standalone)");
    mq?.addEventListener?.("change", update);
    return () => {
      window.removeEventListener(EVENT, update);
      mq?.removeEventListener?.("change", update);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return "unavailable";
    const event = deferredPrompt;
    deferredPrompt = null;
    try {
      event.prompt();
      const { outcome } = await event.userChoice; // "accepted" | "dismissed"
      if (outcome !== "accepted") deferredPrompt = event; // some browsers allow asking again
      return outcome;
    } catch {
      return "unavailable";
    } finally {
      window.dispatchEvent(new Event(EVENT));
    }
  }

  return { status, platform: detectPlatform(), promptInstall };
}

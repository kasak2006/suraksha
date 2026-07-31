"use client";

import { useEffect } from "react";

/*
 * Registers the service worker (public/sw.js) once on mount, so the app shell
 * and the neural model are cached for offline use (spec §5.8). Renders nothing.
 * Capability-gated: on browsers without service workers it is a silent no-op, so
 * the app degrades gracefully.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    // Register after load so it never competes with first paint (§10).
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failing (e.g. private mode) must not break the app.
      });
    };
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}

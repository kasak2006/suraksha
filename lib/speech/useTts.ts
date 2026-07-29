"use client";

import { useEffect, useState } from "react";
import { hasVoiceForLocale, isTtsSupported, onVoicesChanged } from "./tts";

/*
 * True only when a TTS voice for `locale` is actually available on this device.
 * Voices load asynchronously (getVoices() is often empty on first paint, then a
 * `voiceschanged` event fires), so this re-checks on that event. Components gate
 * their Listen/Read-aloud UI on this — a Gujarati button never appears on a
 * device with no Gujarati voice, instead of appearing and doing nothing.
 */
export function useTtsAvailable(locale: string): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!isTtsSupported()) {
      setAvailable(false);
      return;
    }
    const update = () => setAvailable(hasVoiceForLocale(locale));
    update();
    const unsubscribe = onVoicesChanged(update);
    // Some browsers populate voices shortly after load without firing the event.
    const timer = setTimeout(update, 500);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [locale]);

  return available;
}

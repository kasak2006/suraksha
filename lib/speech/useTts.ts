"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cancelSpeech,
  hasVoiceForLocale,
  isTtsSupported,
  onVoicesChanged,
  speak,
} from "./tts";

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

/*
 * Speaking-state wrapper so a Listen control can toggle to Stop. `speakingId`
 * names what is currently being read (a caller-supplied id, or "default"), or
 * null when silent — letting one hook drive several buttons (e.g. a list of
 * lessons) where only the active one shows Stop. Speech is stopped on unmount so
 * navigating away never leaves audio playing.
 */
export function useSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => () => cancelSpeech(), []);

  const start = useCallback(
    (text: string, locale: string, id = "default") => {
      speak(text, locale, {
        onStart: () => setSpeakingId(id),
        onEnd: () => setSpeakingId((cur) => (cur === id ? null : cur)),
      });
      // Optimistic: flip the button to Stop immediately, before `start` fires.
      setSpeakingId(id);
    },
    [],
  );

  const stop = useCallback(() => {
    cancelSpeech();
    setSpeakingId(null);
  }, []);

  return { speakingId, speak: start, stop };
}

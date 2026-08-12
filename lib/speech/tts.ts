/*
 * Text-to-speech via the Web Speech Synthesis API (spec §5.2) — free, built in,
 * critical for low-literacy users. Client-only and capability-gated: on a
 * browser without support every function is a safe no-op, so callers never need
 * to guard themselves.
 */

const LOCALE_TO_LANG: Record<string, string> = {
  gu: "gu-IN",
  hi: "hi-IN",
  en: "en-IN",
};

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Whether a usable voice exists for this locale. The API is "supported" on
 * desktop even when no Gujarati/Hindi voice is installed — in which case
 * speak() is silently a no-op — so callers gate their Listen UI on this instead,
 * to avoid a dead button. (A typical Android phone ships gu-IN/hi-IN voices.)
 */
export function hasVoiceForLocale(locale: string): boolean {
  if (!isTtsSupported()) return false;
  const lang = LOCALE_TO_LANG[locale] ?? "en-IN";
  const base = lang.split("-")[0] ?? lang;
  return window.speechSynthesis
    .getVoices()
    .some((v) => v.lang === lang || v.lang.toLowerCase().startsWith(base));
}

/** Subscribe to the async voice list becoming available. Returns an unsubscribe. */
export function onVoicesChanged(callback: () => void): () => void {
  if (!isTtsSupported()) return () => {};
  const synth = window.speechSynthesis;
  synth.addEventListener("voiceschanged", callback);
  return () => synth.removeEventListener("voiceschanged", callback);
}

/** Best available voice for a BCP-47 lang, falling back to the base language. */
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const base = lang.split("-")[0] ?? lang;
  return (
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith(base)) ??
    null
  );
}

/** Lifecycle callbacks so callers can reflect play/stop state in the UI. */
export interface SpeakHandlers {
  onStart?: () => void;
  /** Fires when speech ends — naturally, on error, or when superseded. */
  onEnd?: () => void;
}

/*
 * The utterance currently owned by speak(). We strip its handlers before
 * cancelling or replacing it, so a superseded utterance's `end` event can never
 * fire a stale onEnd and, say, flip a Stop button back to Listen mid-speech.
 */
let current: SpeechSynthesisUtterance | null = null;

function detachCurrent(): void {
  if (!current) return;
  current.onstart = null;
  current.onend = null;
  current.onerror = null;
  current = null;
}

/** Speak `text` in the given app locale. Cancels anything already speaking. */
export function speak(
  text: string,
  locale: string,
  handlers?: SpeakHandlers,
): void {
  if (!isTtsSupported() || text.trim().length === 0) return;
  const synth = window.speechSynthesis;
  detachCurrent();
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LOCALE_TO_LANG[locale] ?? "en-IN";
  const voice = pickVoice(utterance.lang);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  if (handlers?.onStart) utterance.onstart = handlers.onStart;
  const finish = () => {
    if (current === utterance) current = null;
    handlers?.onEnd?.();
  };
  utterance.onend = finish;
  utterance.onerror = finish;
  current = utterance;
  synth.speak(utterance);
}

/** Stop any current speech. Does not invoke the caller's onEnd handler. */
export function cancelSpeech(): void {
  if (!isTtsSupported()) return;
  detachCurrent();
  window.speechSynthesis.cancel();
}

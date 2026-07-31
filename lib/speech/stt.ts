/*
 * Speech-to-text via the Web Speech Recognition API (spec §5.1). Chrome/Edge
 * support it (webkit-prefixed); Firefox/Safari do not — so this is fully
 * capability-gated and callers must handle `null`. The SpeechRecognition types
 * are not in lib.dom (non-standard), so we declare the minimal surface we use
 * rather than reach for `any`.
 */

interface SpeechAlternative {
  transcript: string;
}
interface SpeechResult {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechAlternative;
}
interface SpeechResultList {
  readonly length: number;
  [index: number]: SpeechResult;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechResultList;
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const LOCALE_TO_LANG: Record<string, string> = {
  gu: "gu-IN",
  hi: "hi-IN",
  en: "en-IN",
};

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSttSupported(): boolean {
  return getCtor() !== null;
}

export interface Recognizer {
  start(): void;
  stop(): void;
}

export interface RecognizerOptions {
  locale: string;
  /**
   * Keep listening across pauses (spec §5.3, the call guard). The Web Speech
   * engine still ends on silence — especially on Android — so continuous mode
   * auto-restarts on `onend` until the caller stops. Default false: the single
   * shot used by the home input box is unchanged.
   */
  continuous?: boolean;
  /** Called with the running transcript; `isFinal` marks a settled phrase. */
  onResult: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: () => void;
}

// Errors after which restarting is pointless (and would re-prompt in a loop).
const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed"]);

/** Create a recognizer, or null when the browser has no support. */
export function createRecognizer(options: RecognizerOptions): Recognizer | null {
  const Ctor = getCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = LOCALE_TO_LANG[options.locale] ?? "en-IN";
  const continuous = options.continuous ?? false;
  recognition.continuous = continuous;
  recognition.interimResults = true;

  // In continuous mode we restart on silence unless the caller stopped us or a
  // fatal (permission) error occurred.
  let stopped = false;
  let fatal = false;

  recognition.onresult = (event) => {
    let transcript = "";
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result) continue;
      const alt = result[0];
      if (alt) transcript += alt.transcript;
      if (result.isFinal) isFinal = true;
    }
    options.onResult(transcript, isFinal);
  };
  recognition.onend = () => {
    if (continuous && !stopped && !fatal) {
      try {
        recognition.start();
        return;
      } catch {
        // Already started or in a bad state — fall through to signal the end.
      }
    }
    options.onEnd?.();
  };
  recognition.onerror = (event) => {
    if (FATAL_ERRORS.has(event.error)) fatal = true;
    options.onError?.();
  };

  return {
    start: () => {
      stopped = false;
      fatal = false;
      recognition.start();
    },
    stop: () => {
      stopped = true;
      recognition.stop();
    },
  };
}

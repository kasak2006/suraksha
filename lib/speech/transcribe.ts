/*
 * On-device speech-to-text for an UPLOADED audio file (spec §5.3, recording
 * path). The live call guard (lib/speech/stt.ts) uses the Web Speech API on the
 * microphone, but that API cannot read a file — so to turn a saved recording of
 * a call into text we run OpenAI Whisper (base, multilingual) entirely in the
 * browser via Transformers.js. Same on-device, offline-after-first-load,
 * nothing-leaves-the-phone story as the neural classifier
 * (lib/engine/classifier.ts).
 *
 * Like the classifier, the model is DYNAMICALLY imported on first use (so the
 * page stays light and Node tests never pull in onnxruntime) and degrades
 * gracefully: when it cannot run — an unsupported browser, no network on the
 * very first use, or an undecodable file — transcribeFile returns null and the
 * caller keeps the live-mic and paste-into-Check paths.
 */
import { normalizeTranscript } from "./normalize";

export type TranscriptionState = "unloaded" | "loading" | "ready" | "failed";

// Whisper is trained on 16 kHz mono PCM; we resample every upload to that.
const TARGET_SAMPLE_RATE = 16000;
// whisper-base — clearly more accurate than tiny, still a ~75 MB one-time,
// cache-forever download that runs offline on mid-range phones.
const MODEL_ID = "Xenova/whisper-base";

// Whisper takes a spoken-out language name, not a BCP-47 tag.
const LOCALE_TO_WHISPER_LANG: Record<string, string> = {
  gu: "gujarati",
  hi: "hindi",
  en: "english",
};

/** Minimal shape of the Transformers.js ASR pipeline call we use, so we needn't
 *  import the heavy union type eagerly. */
type Transcriber = (
  audio: Float32Array,
  opts: {
    language?: string;
    task?: "transcribe";
    chunk_length_s?: number;
    stride_length_s?: number;
  },
) => Promise<{ text: string }>;

export interface TranscribeProgress {
  /** 0–100 while the model downloads on first use; null once it is transcribing. */
  percent: number | null;
}

let state: TranscriptionState = "unloaded";
let transcriberPromise: Promise<Transcriber> | null = null;

export function getTranscriptionState(): TranscriptionState {
  return state;
}

/** True only where we can decode audio in-browser (never SSR or Node tests). */
export function isTranscriptionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const hasAudioCtx =
    typeof window.AudioContext !== "undefined" ||
    "webkitAudioContext" in window;
  return hasAudioCtx && typeof window.OfflineAudioContext !== "undefined";
}

/** Decode any browser-supported audio file to 16 kHz mono PCM for Whisper. */
async function decodeToMono16k(file: File): Promise<Float32Array> {
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const decoded = await ctx.decodeAudioData(await file.arrayBuffer());
    const frames = Math.max(1, Math.ceil(decoded.duration * TARGET_SAMPLE_RATE));
    // OfflineAudioContext renders the buffer down to one 16 kHz mono channel.
    const offline = new OfflineAudioContext(1, frames, TARGET_SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return rendered.getChannelData(0);
  } finally {
    void ctx.close();
  }
}

/*
 * WASM + int8 (q8), deliberately. The accuracy win here is the bigger MODEL
 * (base vs tiny); WebGPU was tried but its onnxruntime path is still flaky on
 * diverse Windows/Android hardware — it can stall inference indefinitely, which
 * is unacceptable for a safety tool — and q8 keeps the model a ~75 MB one-time,
 * cache-forever download. WASM runs the same everywhere, if a little slower.
 */
function selectBackend(): { device: "wasm"; dtype: "q8" } {
  return { device: "wasm", dtype: "q8" };
}

function getTranscriber(
  onProgress?: (p: TranscribeProgress) => void,
): Promise<Transcriber> {
  if (!transcriberPromise) {
    transcriberPromise = import("@huggingface/transformers").then((mod) => {
      // Cast past the library's very large pipeline() overload union — TS can't
      // represent it, and we only need the ASR call shape.
      const createPipeline = mod.pipeline as unknown as (
        task: "automatic-speech-recognition",
        model: string,
        opts: {
          device?: "wasm";
          dtype?: "q8";
          progress_callback?: (e: { status?: string; progress?: number }) => void;
        },
      ) => Promise<Transcriber>;
      const { device, dtype } = selectBackend();
      return createPipeline("automatic-speech-recognition", MODEL_ID, {
        device,
        dtype,
        progress_callback: (e) => {
          if (typeof e.progress === "number") {
            onProgress?.({ percent: Math.round(e.progress) });
          }
        },
      });
    });
  }
  return transcriberPromise;
}

/**
 * Why a transcription attempt didn't yield text — each maps to a different, and
 * actionable, message for the user (bad file vs. no network vs. no speech).
 *  - "unsupported": this browser can't decode audio on-device at all.
 *  - "decode": the file couldn't be decoded (corrupt, or a codec this browser
 *    lacks — e.g. some Chromium builds can't read AAC/.m4a).
 *  - "model": the Whisper model couldn't be loaded or run — almost always no
 *    internet on the very first use, before it is cached.
 *  - "empty": it ran, but found no speech (silence / too noisy).
 */
export type TranscribeFailure = "unsupported" | "decode" | "model" | "empty";

export type TranscribeResult =
  | { ok: true; text: string }
  | { ok: false; reason: TranscribeFailure };

/**
 * Transcribe an uploaded audio file on-device. Returns the text, or a typed
 * failure reason so the caller can show an accurate message and still fall back
 * to the live mic / paste-into-Check.
 */
export async function transcribeFile(
  file: File,
  locale: string,
  onProgress?: (p: TranscribeProgress) => void,
): Promise<TranscribeResult> {
  if (!isTranscriptionSupported()) return { ok: false, reason: "unsupported" };

  let audio: Float32Array;
  try {
    audio = await decodeToMono16k(file);
  } catch (err) {
    // Undecodable / unsupported container — leave any loaded model intact.
    console.warn("[suraksha] could not decode the audio file:", err);
    return { ok: false, reason: "decode" };
  }

  let transcriber: Transcriber;
  try {
    state = "loading";
    transcriber = await getTranscriber(onProgress);
  } catch (err) {
    // Model download / init failed — usually offline on first use.
    state = "failed";
    transcriberPromise = null; // let a later attempt re-try the import
    console.warn("[suraksha] could not load the transcription model:", err);
    return { ok: false, reason: "model" };
  }

  try {
    onProgress?.({ percent: null }); // download done; now running inference
    const output = await transcriber(audio, {
      language: LOCALE_TO_WHISPER_LANG[locale] ?? "english",
      task: "transcribe",
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    state = "ready";
    // Repair mis-heard security acronyms (OTP/UPI PIN…) so the rule engine sees
    // the keywords it scores on.
    const text = normalizeTranscript(output.text.trim());
    if (text.length === 0) return { ok: false, reason: "empty" };
    return { ok: true, text };
  } catch (err) {
    state = "failed";
    console.warn("[suraksha] transcription failed while running:", err);
    return { ok: false, reason: "model" };
  }
}

import { describe, expect, it } from "vitest";
import {
  getTranscriptionState,
  isTranscriptionSupported,
  transcribeFile,
} from "@/lib/speech/transcribe";

/*
 * These run in Node (no `window`, no Web Audio), which is exactly the
 * degrade-gracefully contract the /call upload path relies on: transcription
 * reports a typed failure instead of throwing, so the caller keeps the live-mic
 * and paste fallbacks. The actual Whisper transcription is browser-only and
 * covered by manual/preview testing.
 */
describe("transcribe (unsupported environment)", () => {
  it("reports transcription unsupported without a browser audio stack", () => {
    expect(isTranscriptionSupported()).toBe(false);
  });

  it("returns a typed 'unsupported' failure rather than throwing", async () => {
    const file = new File([new Uint8Array([0, 1, 2, 3])], "call.webm", {
      type: "audio/webm",
    });
    const result = await transcribeFile(file, "hi");
    expect(result).toEqual({ ok: false, reason: "unsupported" });
  });

  it("does not flip to a loaded state when it never ran", async () => {
    const file = new File([new Uint8Array([0])], "x.mp3", { type: "audio/mpeg" });
    await transcribeFile(file, "en");
    expect(getTranscriptionState()).not.toBe("ready");
  });
});

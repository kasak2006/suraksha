import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/engine";
import { normalizeTranscript } from "@/lib/speech/normalize";

describe("normalizeTranscript", () => {
  it("repairs the OTP mishears Whisper produces", () => {
    expect(normalizeTranscript("share your UTP now")).toBe("share your OTP now");
    expect(normalizeTranscript("tell me the OTB")).toBe("tell me the OTP");
    expect(normalizeTranscript("your O T P is")).toBe("your OTP is");
    expect(normalizeTranscript("the U T P code")).toBe("the OTP code");
  });

  it("repairs UPI PIN / UPI mishears", () => {
    expect(normalizeTranscript("enter your UPIP")).toBe("enter your UPI PIN");
    expect(normalizeTranscript("your UPI P please")).toBe("your UPI PIN please");
    expect(normalizeTranscript("send on U P I")).toBe("send on UPI");
  });

  it("is case-insensitive but emits canonical casing", () => {
    expect(normalizeTranscript("your utp")).toBe("your OTP");
    expect(normalizeTranscript("your upip")).toBe("your UPI PIN");
  });

  it("leaves ordinary speech untouched (no false positives)", () => {
    const safe =
      "Hello, your parcel is out for delivery today. Please keep the receipt.";
    expect(normalizeTranscript(safe)).toBe(safe);
    // A real word that merely contains the letters must not be rewritten.
    expect(normalizeTranscript("computer setup")).toBe("computer setup");
  });

  it("lifts a mis-transcribed scam call to DANGER after normalization", () => {
    // The actual whisper-base output for a spoken KYC/OTP scam recording.
    const heard =
      "Hello, I am calling from your bank, your account will block today, " +
      "share your UTP and UPIP now to verify your KYC or else your account " +
      "will be suspended today.";
    expect(analyze(heard).band).not.toBe("danger"); // acronyms hidden → missed
    expect(analyze(normalizeTranscript(heard)).band).toBe("danger"); // restored
  });
});

# Suraksha — Ethics, Privacy & Honest Engineering

Suraksha is used by people who may be frightened and financially vulnerable. That places a high bar on honesty and care. This document states the commitments we hold ourselves to.

---

## 1. Privacy by design

- **All analysis runs on the device.** The message text, call transcript, or link the user enters is processed in the browser. It is not sent to any server for analysis.
- **No accounts, no PII collection.** Suraksha is anonymous by default. There are no passwords, no sign-up.
- **No third-party analytics on user content.** The only network calls are to fetch the app and the model files (once, then cached).
- **On-device learning.** The adaptive `/learn` progress and shield score are stored locally on the device, never uploaded.

This is both an ethics decision and the reason the system scales at zero marginal cost.

---

## 2. Honest engineering (we do not overclaim)

The jury includes industry experts; overclaiming is the fastest way to lose trust — and users' trust matters more.

1. **We never claim to tap a live phone call.** The browser cannot. `/call` is speaker-phone or recorded-audio assistance, and the UI says so plainly.
2. **We never claim bank / UPI / NPCI integration.** It is described as a future integration path, never faked.
3. **We publish real metrics, including the unflattering ones** — small corpus size, per-language gaps, and the ablation that shows exactly what each layer adds.
4. **We state dataset size and origin.** Small-but-ours over big-but-unexplained.
5. **Every external fact is verified and cited** — helpline numbers (1930), report portal (cybercrime.gov.in), and playbook sources live in `docs/PLAYBOOK-SOURCES.md`. No fabricated numbers, URLs, or statistics.

---

## 3. Safety-first defaults

- **When uncertain, warn.** We tune the decision threshold for high recall on scams. This deliberately raises false positives — because a missed scam can cost someone their savings, while a false alarm costs ten seconds of verification.
- **Hard safety overrides.** An explicit OTP/PIN request or an APK-download link always floors the verdict to DANGER, regardless of what the neural model thinks.
- **A visible disclaimer** states that Suraksha is a safety assistant, not a guarantee, and directs users to call their bank's official number (from a passbook or card) — never a number from the message.

---

## 4. Dignity in the design

- **Never shame the user.** The copy is that of a calm relative who works at a bank. Being targeted by a scam is not the victim's fault.
- **Accessibility as inclusion.** 18px base text, 48px touch targets, one-handed layout, and text-to-speech on every verdict, so low-literacy and low-vision users are first-class, not an afterthought.
- **Gujarati first.** The language of the most vulnerable users in this context is the default, not a translation layer.

---

## 5. Known limitations

- **Corpus coverage.** The labelled corpus is being expanded to a trilingual ~1,200-row target; current metrics are pipeline validation.
- **Code-mixed & romanised text** (e.g. Gujarati written in Latin script) is harder and reduces accuracy.
- **Audio quality.** Live transcription depends on the browser's Web Speech API and degrades with background noise; it is unavailable on some browsers, where the app falls back gracefully.
- **Adversarial evasion.** A determined scammer can paraphrase around a small model. The tactic engine and a growing corpus are the mitigations, not a claim of immunity.
- **Model drift.** Scams evolve; the corpus and head must be periodically retrained. The reproducible notebook exists precisely so this is cheap.

---

## 6. Responsible scope

Suraksha does not:
- execute or advise on any financial transaction;
- store, forward, or sell any user data;
- claim to replace professional or official advice.

It informs and empowers a user to make a safer decision, and points them to official help. That is the whole of its ambition — and it tries to do that one thing honestly and well.

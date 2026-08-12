# Suraksha — 3-Minute Demo Video Script

A shot-by-shot script with voiceover. Target length **3:00**. Record on the **live URL on an Android phone** if possible (Android ships gu-IN/hi-IN voices, so the "phone speaks the warning aloud" moment actually works — desktop browsers often have no Gujarati voice and the auto-read will be silent).

Legend: **[SHOW]** = what's on screen · **(VO)** = voiceover to read.

---

### 0:00–0:15 — Hook
**[SHOW]** Phone home screen → tap the installed Suraksha PWA icon (shows it's an installed "app"). App opens on the Gujarati home screen.
**(VO)** "Every day, first-time digital-banking users in India lose their savings to a scam call or a fake message. Suraksha is a scam-defence app that runs entirely on the phone — in Gujarati, Hindi and English — and explains *why* something is a scam."

### 0:15–0:38 — Instant verdict, spoken aloud
**[SHOW]** Tap "Try an example" → the Gujarati KYC-expiry scam. The verdict screen renders instantly; the **DANGER** band fills red; the phone **speaks the warning in Gujarati**.
**(VO)** "Paste or speak any suspicious message. In under a second, the on-device rules engine gives a verdict — and reads it aloud, so it works even for someone who can't read well."

### 0:38–1:02 — Explain: evidence + tactic radar + next step
**[SHOW]** Scroll: the highlighted phrases in the original message → the "Why" list → the **8-axis tactic radar** (fear + authority + urgency lit) → the archetype card "KYC expiry scam" and **"what they will ask for next."**
**(VO)** "This is the difference. Suraksha doesn't just say 'scam' — it highlights the exact phrases, shows the *manipulation tactics* being used as a radar, names the fraud, and predicts the scammer's next move."

### 1:02–1:25 — Act: the playbook + 1930 complaint
**[SHOW]** Tap "See what to do now" → the playbook steps (don't share OTP, call the number on your card, call **1930** in the golden hour) → scroll to the auto-filled **cybercrime.gov.in complaint draft** → tap Copy.
**(VO)** "Then it tells you what to do right now — including 1930, the national cyber-crime helpline most people have never heard of — and generates a ready-to-file complaint in one tap."

### 1:25–1:52 — The live call guard (the wow moment)
**[SHOW]** Go to the **Call** tile → tap record → read a scam aloud (put a second phone on speaker playing a scam, or read it yourself). The **pressure meter climbs** as tactics are detected → at DANGER a **full-screen red interrupt** appears and the phone **speaks "Hang up — no bank will ever ask for your OTP."**
**(VO)** "For scam *calls*, put the caller on speaker. Suraksha transcribes live, a pressure meter rises as the manipulation escalates, and at danger it interrupts with a spoken warning. We're honest: a browser can't tap a call — this is speaker-phone assistance."

### 1:52–2:12 — Works offline (kill the network)
**[SHOW]** Open Android quick settings → turn on **Aeroplane mode** (show the toggle). Return to Suraksha, run another check → it still returns a full verdict. Point at the "Works offline" badge.
**(VO)** "And it all works with no internet. No data plan, no server, no cost — the AI downloads once, then runs offline forever. Nothing you type ever leaves your phone."

### 2:12–2:32 — Learn: it adapts
**[SHOW]** Turn network back on → open **Learn** → play two "Scam or Safe?" cards; deliberately get one loan-scam card wrong → start the next round and note it serves more of that type. Show the shield score tick up.
**(VO)** "A short daily drill trains people to spot scams themselves — and adapts to the mistakes each user makes."

### 2:32–3:00 — Proof + close
**[SHOW]** Cut to the metrics slide (from the pitch deck): the ablation table (rules 0.786 → ensemble 0.923) and the limitations line. End on the Suraksha logo + the live URL.
**(VO)** "It's a calibrated hybrid — rules, a multilingual neural model, and the tactic engine — with honest, published metrics and a limitations page. Open it on your own phone, switch to Gujarati, and try a real scam. Suraksha: safety, in your language, in your hand."

---

## How to record it (free, Windows)

1. **Deploy first** (or run `npm run dev` and use your PC's IP so a phone on the same Wi-Fi can open it).
2. **Best: record on an Android phone.** Use the built-in Screen Recorder (Quick Settings) so the Gujarati text-to-speech is captured. Record narration separately or speak while recording.
3. **Alternative: record on PC.** Chrome → F12 → device toolbar (Ctrl+Shift+M) → pick a phone size for the mobile look. Record with **Xbox Game Bar** (Win+Alt+R) or **OBS Studio** (free, better control + mic + webcam).
4. **Narration:** either speak live into the mic, or record the VO separately and combine in a free editor (**Clipchamp**, built into Windows 11, or **CapCut**).
5. **Keep it to 3:00.** Rehearse twice; cut dead air.

## Upload
- Upload to **YouTube** and set visibility to **Unlisted** (link works for judges, not public), or **Vimeo**.
- Paste that link into the submission form's **Video Link** field.

## Pre-flight checklist
- [ ] Gujarati voice available on the recording device (test the "Listen" button speaks).
- [ ] The example scams load and hit DANGER.
- [ ] `/call` mic permission granted before recording.
- [ ] Aeroplane-mode check actually returns a verdict (run one check online first to cache the model).
- [ ] Final video is ≤ your platform limit and the link is set to Unlisted, not Private.

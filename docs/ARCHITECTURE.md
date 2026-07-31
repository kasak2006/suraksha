# Suraksha — Architecture & Methodology

This document explains how Suraksha turns a suspicious message, call, or link into a trustworthy, explainable verdict — and the design decisions behind it.

---

## 1. Design principles

1. **Model the psychology, not the wording.** Scam text mutates; the manipulation grammar does not. The tactic engine is the durable core.
2. **No single model owns the decision.** Three independent components are fused, so a failure or blind spot in one is caught by the others.
3. **Everything is explainable.** Every verdict names the phrases, the tactic, and the archetype that drove it.
4. **On-device first.** All inference runs in the browser — a cost decision (zero marginal compute) and an ethics decision (no PII leaves the phone).
5. **Safety-first when uncertain.** We optimise for catching scams; a missed scam costs savings, a false alarm costs seconds.
6. **Honest engineering.** We never claim capabilities the browser cannot deliver (e.g. tapping a live call).

---

## 2. The three components

### A. Neural classifier (semantic)
- **Encoder:** `paraphrase-multilingual-MiniLM-L12-v2` (384-dim), covering Indic languages, served in-browser as the int8 ONNX `Xenova/…` build from the Hugging Face CDN.
- **Head:** a logistic-regression classifier over the feature vector `[embedding(384), rule-group scores(8), meta features(6)]`, trained in `notebooks/train.ipynb` and shipped as a few-KB JSON.
- **Output:** `pScam ∈ [0,1]`.
- **Lazy + degradable:** the encoder is dynamically imported only on the first check, so first paint never waits on it; if the head is absent or the model fails to load, the app runs rules-only.

### B. Deterministic rule engine (structural)
Pure, framework-free TypeScript. Eight rule groups, each emitting `{ id, weightDelta, category, evidenceSpan, reasonKey }`:
- **credential** — OTP/PIN/CVV/MPIN asks, remote-access apps (AnyDesk/TeamViewer), "install this app".
- **upi** — the collect-request trap, QR-to-receive, wrong-transfer refund, name/handle mismatch.
- **url** — shorteners, punycode/homoglyphs, lookalike bank domains (Levenshtein vs a whitelist), raw-IP, suspicious TLDs, http-for-bank, **APK/EXE links (very high weight)**.
- **loan** — advance-fee, "no documents / guaranteed", fake "RBI approved".
- **impersonation** — bank/RBI/police/courier/"digital arrest", sender-ID mismatch.
- **urgency** — deadlines, countdowns, **secrecy demands**.
- **reward** — lottery/KBC, job-upfront, guaranteed-return investment.
- **textual** — excessive caps, character substitution, homoglyph words.

Each reason indexes the i18n catalogue, so explanations render in the user's language, with the matched span highlighted in the original text.

### C. Manipulation-tactic scorer + archetype matcher
- **8 axes (0–100):** Urgency, False Authority, Fear, Reward bait, Secrecy, Credential ask, Fake trust, Irreversible-payment pressure — from trilingual lexicons, regex, and embedding similarity to axis exemplars. Rendered as a hand-drawn SVG radar (no charting dependency).
- **16 archetypes:** KYC-expiry, UPI-collect, refund-reversal, digital-arrest, courier-parcel, electricity-bill, army-officer marketplace, loan-advance-fee, job/task, lottery, SIM-swap, card-upgrade, investment/trading, QR-receive, phishing-link, and a generic fallback. Matching the tactic vector + rule signals yields the archetype, its plain-language summary, and **what the scammer will ask for next**.

---

## 3. Fusion & calibration

```
riskScore = clamp( 0.45·pScam + 0.40·ruleScore + 0.15·tacticPeak , 0, 100 )
```

- **Bands:** SAFE 0–24 · CAUTION 25–54 · RISKY 55–79 · DANGER 80–100.
- **Hard overrides** bypass the weights: an explicit credential ask or an APK link floors the band to **DANGER** regardless of `pScam`. The override floor survives fusion, so the neural score can never talk a certain-danger message down.
- The rules verdict renders in **<300ms**; the neural score then refines the same result shape with a smooth animation. The user never waits on a download to get an answer.

---

## 4. Data & methodology

- **Sources:** public SMS-spam and phishing datasets, RBI/NPCI/Cyber Dost awareness material, and an **authored Gujarati/Hindi/English corpus** — legitimate examples (real bank alerts, OTP delivery, UPI credit notices) are included deliberately, so the model does not flag everything.
- **Storage:** `data/corpus.jsonl` with `{id, text, lang, label, archetype, tactics[], source}`, published in the repo.
- **Training:** `notebooks/train.ipynb` (Google Colab, free tier) — embed → train head → evaluate → export JSON. Fully reproducible; every metric in `docs/METRICS.md` is a pasted cell output.
- **Cross-runtime parity:** the head is trained on the Python encoder but scored on the browser ONNX build — a parity probe ensures the two embeddings agree, and `tests/engine/meta.test.ts` pins the metadata-feature vector byte-for-byte.

---

## 5. Quality & correctness

- TypeScript **strict** with `noUncheckedIndexedAccess`, no non-null assertions.
- **405 unit tests** (Vitest, test-driven).
- A test fails if any rule's explanation is missing in any of the three languages.
- A custom ESLint rule reserves the four verdict colours for verdict UI only (they may never be decorative).

---

## 6. Performance & offline

- Total model download ~30MB int8, **lazy-loaded once** then cached by a service worker; the app is an installable PWA and works fully offline after first load.
- App JS stays lean — the engine has no heavyweight dependencies and the radar is hand-drawn SVG.

---

## 7. Portability & future integration (documented, not faked)

The engine is pure TypeScript with no UI dependency, so the same decision logic can be embedded as a **bank/NGO website widget**, an **SMS/IVR fallback** for feature phones, or a **WhatsApp helper**. Suraksha does not integrate with any bank or NPCI system today — that is a described future path, never a claim.

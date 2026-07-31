# Suraksha (સુરક્ષા / सुरक्षा — "safety")

**A trilingual, on-device scam-defence companion for first-time digital-banking users in rural India.**

Paste or speak a suspicious SMS, WhatsApp message, call, UPI request or link — Suraksha gives an instant, plain-language risk verdict in **Gujarati, Hindi or English**, explains *why*, shows *which manipulation tactic* is being used on you, predicts *what the scammer will ask for next*, and hands you a step-by-step response playbook (including the 1930 helpline and a ready-to-file complaint).

All analysis runs **in your browser** — it works offline, on low-end phones, with no data plan, and no personal data ever leaves the device.

> Built for **The Maverick Effect AI Challenge 2026** — problem statement: *Financial Safety for Rural India: help first-time digital-banking users detect scam calls, fake UPI requests, phishing and loan scams in local languages.*

---

## Why this, and why it's different

Most scam detectors are text classifiers, and text classifiers rot: Indian scams mutate constantly — new numbers, new brand names, new schemes. What does **not** change is the *psychological grammar of a scam*: manufactured urgency, false authority, fear, secrecy, reward bait, and the OTP/remote-access ask.

Suraksha's core is a **manipulation-tactic engine** that scores a message on **8 tactic axes** and matches it to **16 known Indian fraud archetypes** — so the user sees not "SCAM 87%" but *"this caller is using fear + authority + secrecy — the signature of a digital-arrest fraud."* That insight is language-portable and survives the constant churn of scam wording.

---

## What it does

| Route | Feature |
|---|---|
| `/` | Universal input — paste, speak (STT), or pick a seeded example |
| `/check` | The verdict: colour-banded score, evidence highlighted, tactic radar, archetype + "what they'll ask next", spoken aloud |
| `/call` | Live call guard — transcribes a speaker-phone call, shows a rising **pressure meter**, full-screen spoken **DANGER interrupt** |
| `/upi` | UPI request checker — teaches the invariant: *your PIN only ever sends money OUT* |
| `/link` | Link / phishing checker |
| `/playbook/[archetype]` | Guided response steps + 1930 helpline + auto-generated cybercrime.gov.in complaint (48 static pages, 16 archetypes × 3 languages) |
| `/learn` | Adaptive "Scam or Safe?" drills that resurface the archetypes you get wrong, a shield score, and 60-second audio lessons |

Cross-cutting: **installable PWA**, **works fully offline** after first load, text-to-speech on every verdict, 18px base text, 48px touch targets, WCAG-minded, Gujarati-first.

---

## The intelligence layer

Three components produce one verdict — no single model owns the decision.

1. **Neural (semantic).** `paraphrase-multilingual-MiniLM-L12-v2` (384-dim) runs in-browser as an int8 ONNX build (Transformers.js, WebGPU→WASM). A logistic-regression head over `[embedding(384), rule-groups(8), meta(6)]` outputs `pScam ∈ [0,1]`. The head is trained in `notebooks/train.ipynb` and shipped as a few-KB JSON; the app degrades to rules-only if it is absent.
2. **Deterministic rule engine.** Pure TypeScript, 8 groups (credential, UPI, URL, loan, impersonation, urgency, reward, textual). Each rule emits a weighted signal with a translated reason and the exact evidence span.
3. **8-axis tactic scorer + archetype matcher.**

**Fusion:** `riskScore = 0.45·pScam + 0.40·rules + 0.15·tacticPeak`, mapped to bands **SAFE 0–24 · CAUTION 25–54 · RISKY 55–79 · DANGER 80–100**. **Hard overrides** floor the verdict to DANGER for the two highest-certainty signals — an explicit OTP/PIN ask, or an APK download link — regardless of the model.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design.

---

## Honest metrics

Full numbers in [docs/METRICS.md](docs/METRICS.md), regenerated from the notebook. We report small, real numbers rather than a vague "95%".

- **5-fold CV F1:** mean **0.844**
- **Ablation (the honest signal):** rules-only F1 **0.786** → full ensemble **0.923**, lifting precision **0.786 → 1.000** while holding recall — the embedding layer mainly removes false alarms without missing more scams.
- Threshold tuned for **recall ≥ 0.95**: a missed scam costs someone their savings; a false alarm costs ten seconds.

**Corpus status:** the labelled corpus is being expanded to a trilingual ~1,200-row target with native speakers; current published numbers are pipeline validation, and will be regenerated as the corpus grows.

---

## Tech stack

Next.js 15 (App Router) · TypeScript (strict, `noUncheckedIndexedAccess`) · Tailwind CSS v4 · next-intl (gu/hi/en) · `@huggingface/transformers` (Transformers.js) · Web Speech API (STT/TTS) · custom service worker + Web App Manifest (PWA) · Vitest (**405 tests**, TDD) · deploys on the **Vercel free tier** with **zero paid services**.

The engine (`lib/engine`) is pure, framework-free TypeScript with no React imports — unit-testable and portable to a future SMS/IVR gateway or bank widget.

---

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000  (redirects to /gu)
```

```bash
npm run test         # 405 unit tests (Vitest)
npm run lint         # ESLint (incl. custom verdict-colour + i18n guards)
npm run build        # production build
```

The neural head lives at `public/models/classifier-head.json` (produced by running `notebooks/train.ipynb` in Google Colab). If it is absent, the app runs rules-only — the build still passes and everything else works.

---

## Limitations (read these)

- Code-mixed / romanised text and very noisy audio reduce accuracy.
- A determined scammer can paraphrase around a small model; the tactic engine and a growing corpus are the mitigations.
- The browser **cannot** tap a live phone call — `/call` is speaker-phone or recording assistance, and the UI says so plainly.
- No real bank/UPI/NPCI integration — described as a future path, never faked.

See [docs/ETHICS.md](docs/ETHICS.md) for privacy, safety-first defaults, and the full honesty rules.

---

## Repository layout

```
app/[locale]/…      routes (check, call, upi, link, learn, playbook)
components/          verdict, call, learn, input, layout, ui
lib/engine/          rules · tactics · archetypes · classifier · calibration (pure TS)
lib/speech/          STT + TTS wrappers (capability-gated)
messages/            gu.json · hi.json · en.json
data/                corpus.jsonl · drills.ts · legit-domains.json
notebooks/train.ipynb   reproducible Colab training
docs/                ARCHITECTURE · METRICS · ETHICS · PLAYBOOK-SOURCES
tests/               engine unit tests
```

## Licence

[MIT](LICENSE) — free to use, extend, and deploy.

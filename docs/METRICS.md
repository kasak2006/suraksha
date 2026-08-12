# Suraksha — Model Metrics

Honest, reproducible metrics for the neural classifier layer, produced by
`notebooks/train.ipynb`. Every number here comes from a printed notebook cell —
re-run the notebook to regenerate.

> ⚠️ **Read this first — current status.** These numbers are from a **176-row,
> trilingual** corpus (88 scam / 88 legit; en 110 · hi 30 · gu 36). The test set
> is **44 rows**, so treat every figure below as a **pipeline validation, not a
> headline claim**. The corpus is still small and mostly authored; numbers will
> move as it grows toward the larger target. We report the small numbers honestly
> rather than a vague "95%".

---

## 1. Dataset

| | Count |
|---|---|
| Total labelled rows | 176 |
| Scam / Legit | 88 / 88 |
| Languages | en 110 · gu 36 · hi 30 |
| Train / Test split | 132 / 44 (stratified on language × label, seed 42) |

Encoder: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (384-dim),
served in-browser as the `Xenova/…` int8 ONNX build from the Hugging Face CDN.
Classifier: logistic-regression head over `[embedding(384), rule-groups(8), meta(6)]`.
Decision threshold: **0.466** (chosen for highest precision at recall ≥ 0.95 — a
missed scam costs someone their savings; a false alarm costs ten seconds).

---

## 2. Headline metrics
<!-- FROM NOTEBOOK CELL §5 (the cell printing "ROC-AUC:" and "5-fold F1:") -->

- ROC-AUC: `0.9793`
- 5-fold CV F1: `[0.973 0.882 0.848 0.824 0.903]` (mean `0.886`)

<!-- FROM NOTEBOOK CELL §5 threshold cell (prints classification_report) -->

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| legit | `0.952` | `0.909` | `0.930` | `22` |
| scam  | `0.913` | `0.955` | `0.933` | `22` |
| **accuracy** | | | `0.932` | 44 |
| macro avg | `0.933` | `0.932` | `0.932` | 44 |

> The **5-fold CV F1 (mean 0.886)** and the **ablation in §5** are the honest
> signals of what this layer adds. The single missed scam (§3, §6) is a romanized
> Gujlish row — the model's known weakest surface, discussed in §7.

---

## 3. Confusion matrix
<!-- FROM NOTEBOOK CELL §5 (the pandas confusion-matrix print) -->

|  | pred legit | pred scam |
|---|---|---|
| **true legit** | `20` | `2` |
| **true scam**  | `1` | `21` |

**Missed scams (the number that matters):** `1`

---

## 4. Per-language metrics
<!-- FROM NOTEBOOK CELL §5 per-language table -->

| Lang | n | Precision | Recall | F1 |
|---|---|---|---|---|
| en | `28` | `0.875` | `1.000` | `0.933` |
| gu | `8`  | `1.000` | `0.750` | `0.857` |
| hi | `8`  | `1.000` | `1.000` | `1.000` |

Hindi is perfect on its (small) test slice; English catches every scam at the cost
of two marketing false alarms; Gujarati's lower recall is the single missed
romanized row (§6), on a test slice of only 8.

---

## 5. Ablation — does the ML layer earn its place?
<!-- FROM NOTEBOOK CELL §6 (evaluate: rules only / metadata only / … / full ensemble) -->

| Configuration | F1 | Recall | Precision |
|---|---|---|---|
| rules only | `0.791` | `0.773` | `0.810` |
| metadata only | `0.711` | `0.727` | `0.696` |
| embeddings only | `0.837` | `0.818` | `0.857` |
| embeddings + metadata | `0.933` | `0.955` | `0.913` |
| **full ensemble** | `0.909` | `0.909` | `0.909` |

**Interpretation:** the embedding layer is the biggest single lift — F1 climbs from
**0.791 (rules-only) to 0.837 (embeddings-only)** and to **0.933 once metadata is
added**, so the neural layer clearly earns its place over keyword rules alone. The
rule features inside the head add little on top of embeddings+metadata here (full
ensemble 0.909 vs 0.933) — a difference well within noise on a 44-row test set, and
the rule engine still contributes independently through the fusion step at scoring
time. (This ablation uses a fixed 0.5 threshold, so its numbers differ slightly from
the tuned-threshold report in §2.)

---

## 6. Error analysis
<!-- FROM NOTEBOOK CELL §5 (the loop printing "MISSED SCAM" / "false alarm" rows) -->

Three misclassified rows in the 44-row test set:

| Row | Type | p(scam) | Text |
|---|---|---|---|
| `gu-0033` | **MISSED SCAM** | `0.37` | "Tamara HDFC credit card ni limit 3 lakh sudhi vadhi shake chhe. Upgrade mate card number, CVV ane OTP janavo." |
| `en-0129` | false alarm | `0.57` | "Congratulations! You have earned 500 reward points on your HDFC card this month. Redeem anytime via NetBanking. No expiry this quarter." |
| `en-0136` | false alarm | `0.54` | "MEGA SALE! Up to 70% off on electronics this weekend at Reliance Digital. Visit your nearest store. T&C apply. Reply STOP to opt out." |

- **The missed scam is romanized Gujlish** (Latin-script Gujarati). The multilingual
  encoder embeds native scripts well but romanized Indic text poorly, and the rule
  engine's keyword matching does not fire on Latin-script Gujarati — so this row had
  little signal on either channel. This is the known limitation in §7, not a
  regression; native-script Gujarati scams are caught reliably.
- **Both false alarms are legitimate marketing** ("reward points", "MEGA SALE 70%
  off") — messages that genuinely resemble reward-bait scams. Both are low-confidence
  (p 0.54–0.57) and, at the tuned threshold, cost a user ten seconds of caution.

---

## 7. Limitations

- **Corpus size & coverage.** 176 rows across three languages — small, and mostly
  authored rather than sampled from real traffic. Numbers will move as the corpus
  grows.
- **Romanized / code-mixed script.** Latin-script Gujarati ("Gujlish") and Hindi
  ("Hinglish") are the model's weakest surface: the encoder embeds them poorly and
  the keyword rules do not fire on Latin script. The one missed scam (§6) is exactly
  this case. A dedicated romanized corpus cluster is the mitigation.
- **Class balance is synthetic.** Rows are mostly authored, modelled on real scam
  types — not a random sample of real message traffic, so precision/recall here
  won't directly transfer to field prevalence.
- **Adversarial evasion.** A determined scammer can paraphrase around both the
  rules and a small embedding model. The tactic engine (Phase 3) and a growing
  corpus are the mitigations.
- **Fusion cap.** With the tactic-peak component stubbed at 0 (Phase 3), pure
  fusion tops out at 85/100; hard overrides (explicit OTP/PIN ask, APK link)
  still floor to DANGER regardless of the model.

---

## 8. Cross-runtime parity (sanity)

The classifier head is trained on the Python encoder's embeddings but scored in the
browser via the ONNX (`Xenova/…`) build — these must agree or every score drifts.
Python's embedding for the probe `"Your KYC is expiring today. Update now to avoid
account block."` begins:

```
[-0.02633, 0.08545, 0.01537, 0.02270, 0.02806, 0.01598, -0.01153, -0.00821]
```

The browser's Transformers.js output for the same string must match these to ~4
decimals. The metadata-feature parity (TS `metaVector` vs the notebook's
`meta_vector`) is pinned separately in `tests/engine/meta.test.ts`.

---

*Regenerate: run `npm run corpus:validate && npm run corpus:features`, then run
`notebooks/train.ipynb` end-to-end and paste the cell outputs above.*

# Suraksha — Model Metrics

Honest, reproducible metrics for the neural classifier layer, produced by
`notebooks/train.ipynb`. Every number here comes from a printed notebook cell —
re-run the notebook to regenerate.

> ⚠️ **Read this first — current status.** These numbers are from a **110-row,
> English-only** corpus (55 scam / 55 legit). The test set is just **28 rows**,
> so treat every figure below as a **pipeline validation, not a headline claim**.
> Gujarati and Hindi rows are being authored by native speakers; the corpus and
> these metrics will be regenerated at the ~1,200-row / trilingual target before
> submission. We report the small numbers honestly rather than a vague "95%".

---

## 1. Dataset

| | Count |
|---|---|
| Total labelled rows | 110 |
| Scam / Legit | 55 / 55 |
| Languages | en 110 · **gu 0 · hi 0 (pending native authoring)** |
| Train / Test split | 82 / 28 (stratified on language × label, seed 42) |
| Hard-negatives (legit that look scammy) | 27 / 55 legit = 49% |

Encoder: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (384-dim),
served in-browser as the `Xenova/…` int8 ONNX build from the Hugging Face CDN.
Classifier: logistic-regression head over `[embedding(384), rule-groups(8), meta(6)]`.
Decision threshold: **0.49** (chosen for highest precision at recall ≥ 0.95 — a
missed scam costs someone their savings; a false alarm costs ten seconds).

---

## 2. Headline metrics
<!-- FROM NOTEBOOK CELL §5 (the cell printing "ROC-AUC:" and "5-fold F1:") -->

- ROC-AUC: ` 1.0`
- 5-fold CV F1: `[0.8   0.818 0.842 0.842 0.917]` (mean `0.844`)

<!-- FROM NOTEBOOK CELL §5 threshold cell (prints classification_report) -->

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| legit | `1.000` | `1.000` | `1.000` | `14` |
| scam  | `1.000` | `1.000` | `1.000` | `14` |
| **accuracy** | | | `1.000` | 28 |

> The perfect test-set scores are **not** the headline — 28 clean, authored rows is
> too small to contain a hard case. The **5-fold CV F1 (mean 0.844)** above and the
> **ablation in §5** are the honest signals of what this layer actually adds.

---

## 3. Confusion matrix
<!-- FROM NOTEBOOK CELL §5 (the pandas confusion-matrix print) -->

|  | pred legit | pred scam |
|---|---|---|
| **true legit** | `14` | `0` |
| **true scam**  | `0` | `14` |

**Missed scams (the number that matters):** `0`

---

## 4. Per-language metrics
<!-- FROM NOTEBOOK CELL §5 per-language table -->
<!-- Only `en` will have rows until gu/hi are added. -->

| Lang | n | Precision | Recall | F1 |
|---|---|---|---|---|
| en | `28` | `1.0` | `1.0` | `1.0` |

---

## 5. Ablation — does the ML layer earn its place?
<!-- FROM NOTEBOOK CELL §6 (evaluate: rules only / metadata only / … / full ensemble) -->

| Configuration | F1 | Recall | Precision |
|---|---|---|---|
| rules only | `0.786  ` | `0.786  ` | `0.786` |
| metadata only | `0.800  ` | `0.857` | `0.750` |
| embeddings only | `0.815  ` | `0.786` | `0.846` |
| embeddings + metadata | `0.857` | `0.857` | `0.857` |
| **full ensemble** | `0.923  ` | `0.857` | `1.000` |

**Interpretation:** the full ensemble lifts F1 from **0.786 (rules-only) to 0.923**,
almost entirely by improving **precision (0.786 → 1.000)** while holding recall —
i.e. the embedding layer's main contribution here is removing false alarms that the
rules alone would raise, without missing more scams. The gain is real but measured on
just 28 test rows and should be re-confirmed on the trilingual corpus. (This ablation
uses a fixed 0.5 threshold, so its numbers differ slightly from the tuned-threshold
report in §2.)

---

## 6. Error analysis
<!-- FROM NOTEBOOK CELL §5 (the loop printing "MISSED SCAM" / "false alarm" rows) -->
<!-- List each misclassified row; these are exactly where the corpus needs work. -->

**No misclassified rows** in the 28-row test set — every row was classified correctly
at the tuned threshold (confusion matrix in §3 is fully diagonal). This is expected on
a small, clean, authored test set and is **not** evidence of real-world perfection.
The 5-fold CV F1 (mean **0.844**) and the ablation in §5 are the more informative
signals at this corpus size; the perfect test scores mostly reflect that 28 rows is
too few to contain a hard case.

---

## 7. Limitations

- **Corpus size & coverage.** 110 rows, English only. Gujarati/Hindi and the full
  ~1,200-row target are pending. Numbers will move once they land.
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

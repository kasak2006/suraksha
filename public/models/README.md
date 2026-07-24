# models/ (served at `/models/`)

The neural classifier fetches its trained head from **`/models/classifier-head.json`**
at runtime, i.e. this folder (`public/models/`). Until the file is present the app
runs on the deterministic rule engine alone — a 404 here is expected and handled.

## How to produce `classifier-head.json`

1. Open `notebooks/train.ipynb` in Google Colab (free T4 tier).
2. Upload `data/corpus.jsonl` and `data/rule-features.json` (run `npm run corpus:features`).
3. Run all cells. The notebook exports `classifier-head.json` (a few KB: coefficients,
   intercept, threshold, feature layout).
4. Drop that file here as `public/models/classifier-head.json` and reload `/check` —
   the verdict will refine with the neural score and the "AI check" indicator resolves.

The encoder itself (`Xenova/paraphrase-multilingual-MiniLM-L12-v2`, int8 ONNX) is
loaded from the free Hugging Face CDN on first analyse — no weights are committed here.

> Note: the notebook's closing cell says "→ models/"; in this repo that means
> `public/models/` so the file is served statically. The feature layout in the head
> (`rule_groups`, `meta_features`) is validated against the runtime before scoring —
> a mismatched head is rejected and the app falls back to rules-only.

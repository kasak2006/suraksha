/*
 * Component A — the neural classifier (spec §4.1). A multilingual sentence
 * encoder produces an embedding; a tiny logistic head (trained in
 * notebooks/train.ipynb, shipped as JSON) turns [embedding, rule-groups, meta]
 * into pScam ∈ [0,1].
 *
 * Design constraints (PHASE2_PROMPT §3, spec §10):
 *  - The encoder (@huggingface/transformers) is DYNAMICALLY imported, and only
 *    on the first classify() call — never at module load. So `import { analyze }`
 *    stays light, first paint never waits on the model, and Node tests that only
 *    touch the rules path never pull in onnxruntime.
 *  - The head is FETCHED from /models/classifier-head.json. When it is absent
 *    (fresh clone, or the user hasn't run Colab yet) the fetch fails and we fall
 *    back to rules-only — so a production build passes with the file absent.
 *  - The feature layout is validated against RULE_GROUPS / META_NAMES; a head
 *    trained on a different layout is rejected rather than scored incorrectly.
 */
import { META_NAMES, metaVector } from "./meta";
import { RULE_GROUPS, ruleGroupVector } from "./features";

export type ModelState = "unloaded" | "loading" | "ready" | "failed";

export interface ClassifierHead {
  version: number;
  model_id: string;
  embedding_dim: number;
  rule_groups: string[];
  meta_features: string[];
  coef: number[];
  intercept: number;
  threshold: number;
  normalize_embeddings: boolean;
}

/** Minimal shape of the Transformers.js feature-extraction pipeline we use,
 *  so we needn't import the heavy type eagerly. */
type Embedder = (
  text: string,
  opts: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: ArrayLike<number> }>;

const HEAD_URL = "/models/classifier-head.json";
const DEFAULT_MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";

let modelState: ModelState = "unloaded";
let head: ClassifierHead | null = null;
let embedderPromise: Promise<Embedder> | null = null;
let readyPromise: Promise<boolean> | null = null;

export function getModelState(): ModelState {
  return modelState;
}

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/**
 * The full feature vector in the exact order the head was trained on
 * (notebook cell 11: `X = hstack([E, R, M])`): embedding, then rule-group
 * scores /100, then metadata.
 */
export function buildFeatures(embedding: number[], text: string): number[] {
  return [...embedding, ...ruleGroupVector(text), ...metaVector(text)];
}

/** Pure logistic scoring — unit-testable with a stub head and no model. */
export function scoreWithHead(
  h: ClassifierHead,
  embedding: number[],
  text: string,
): number {
  const features = buildFeatures(embedding, text);
  let dot = h.intercept;
  for (let i = 0; i < h.coef.length; i++) {
    dot += (h.coef[i] ?? 0) * (features[i] ?? 0);
  }
  return sigmoid(dot);
}

function isValidHead(value: unknown): value is ClassifierHead {
  if (typeof value !== "object" || value === null) return false;
  const h = value as Partial<ClassifierHead>;
  if (!Array.isArray(h.coef) || typeof h.intercept !== "number") return false;
  if (typeof h.embedding_dim !== "number") return false;
  if (!Array.isArray(h.rule_groups) || !Array.isArray(h.meta_features)) return false;

  // Reject a head trained on a different feature layout — scoring it would be
  // silently wrong. Order matters: it is the coefficient order.
  const groupsMatch =
    h.rule_groups.length === RULE_GROUPS.length &&
    h.rule_groups.every((g, i) => g === RULE_GROUPS[i]);
  const metaMatch =
    h.meta_features.length === META_NAMES.length &&
    h.meta_features.every((m, i) => m === META_NAMES[i]);
  const lengthMatch =
    h.coef.length === h.embedding_dim + RULE_GROUPS.length + META_NAMES.length;

  return groupsMatch && metaMatch && lengthMatch;
}

async function loadHead(): Promise<ClassifierHead | null> {
  try {
    const res = await fetch(HEAD_URL);
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (!isValidHead(json)) {
      console.warn("[suraksha] classifier-head.json has an unexpected shape; using rules only.");
      return null;
    }
    return json;
  } catch {
    // No file (404), no network, or non-absolute URL in Node — rules-only.
    return null;
  }
}

function getEmbedder(modelId: string): Promise<Embedder> {
  if (!embedderPromise) {
    embedderPromise = import("@huggingface/transformers").then((mod) => {
      // Cast past the library's very large pipeline() overload union — TS can't
      // represent it, and we only need the feature-extraction call shape.
      const createPipeline = mod.pipeline as unknown as (
        task: "feature-extraction",
        model: string,
      ) => Promise<Embedder>;
      return createPipeline("feature-extraction", modelId);
    });
  }
  return embedderPromise;
}

/** Load head + encoder once. Idempotent; safe to call on every analyse. */
function ensureReady(): Promise<boolean> {
  if (modelState === "ready") return Promise.resolve(true);
  if (modelState === "failed") return Promise.resolve(false);
  if (!readyPromise) {
    readyPromise = (async () => {
      modelState = "loading";
      const loaded = await loadHead();
      if (!loaded) {
        modelState = "failed";
        return false;
      }
      head = loaded;
      try {
        await getEmbedder(loaded.model_id || DEFAULT_MODEL_ID);
        modelState = "ready";
        return true;
      } catch {
        modelState = "failed";
        return false;
      }
    })();
  }
  return readyPromise;
}

/**
 * pScam for `text`, or null when the model is unavailable (caller falls back to
 * rules-only). First call lazily downloads the encoder.
 */
export async function classify(text: string): Promise<number | null> {
  const ready = await ensureReady();
  if (!ready || !head) return null;
  try {
    const embedder = await getEmbedder(head.model_id || DEFAULT_MODEL_ID);
    const output = await embedder(text, {
      pooling: "mean",
      normalize: head.normalize_embeddings,
    });
    const embedding = Array.from(output.data, Number);
    return scoreWithHead(head, embedding, text);
  } catch {
    modelState = "failed";
    return null;
  }
}

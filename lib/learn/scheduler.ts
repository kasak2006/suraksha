import type { DrillCard } from "@/data/drills";

/*
 * The adaptive learning scheduler (spec §5.6). Pure and framework-free so it is
 * unit-testable and could run anywhere. It tracks how well the user does per
 * scam archetype and per manipulation tactic, then weights the next round of
 * drill cards toward the categories they get wrong — a lightweight
 * spaced-repetition / Leitner idea without a heavy library.
 *
 * Legit cards are tracked under a single pseudo-category ("legit"), so a user
 * who keeps over-flagging safe messages also sees more safe cards to recalibrate.
 */

const LEGIT_KEY = "legit";

export interface CategoryStat {
  seen: number;
  correct: number;
}

export interface LearnProgress {
  /** Keyed by archetype id, plus the "legit" pseudo-category. */
  archetypes: Record<string, CategoryStat>;
  tactics: Record<string, CategoryStat>;
  shieldScore: number;
  streak: number;
  bestStreak: number;
  rounds: number;
}

export function emptyProgress(): LearnProgress {
  return {
    archetypes: {},
    tactics: {},
    shieldScore: 0,
    streak: 0,
    bestStreak: 0,
    rounds: 0,
  };
}

/** The category keys a card exercises: its archetype + tactics, or "legit". */
function cardCategories(card: DrillCard): { archetypes: string[]; tactics: string[] } {
  if (!card.isScam) return { archetypes: [LEGIT_KEY], tactics: [] };
  return {
    archetypes: card.archetype ? [card.archetype] : [],
    tactics: card.tactics,
  };
}

/** Accuracy in [0,1]; an unseen category is neutral (0.5), not "mastered". */
function accuracy(stat: CategoryStat | undefined): number {
  if (!stat || stat.seen === 0) return 0.5;
  return stat.correct / stat.seen;
}

/** How much this category needs practice: 0 (mastered) … 1 (always wrong). */
function weakness(stat: CategoryStat | undefined): number {
  return 1 - accuracy(stat);
}

/**
 * Relative weight of a card for the next round. A minimum base keeps every card
 * reachable; the average weakness of its categories amplifies weak ones.
 */
export function cardWeight(card: DrillCard, progress: LearnProgress): number {
  const { archetypes, tactics } = cardCategories(card);
  const weaknesses = [
    ...archetypes.map((a) => weakness(progress.archetypes[a])),
    ...tactics.map((t) => weakness(progress.tactics[t])),
  ];
  const avg =
    weaknesses.length > 0
      ? weaknesses.reduce((sum, w) => sum + w, 0) / weaknesses.length
      : 0.5;
  return 0.2 + avg;
}

function bump(stats: Record<string, CategoryStat>, key: string, correct: boolean) {
  const prev = stats[key] ?? { seen: 0, correct: 0 };
  stats[key] = {
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
  };
}

/**
 * Fold one answer into the progress and return a NEW progress object (pure).
 * The shield score only ever goes up (spec's non-shaming tone §8): a correct
 * answer earns more when the user is on a streak.
 */
export function recordAnswer(
  progress: LearnProgress,
  card: DrillCard,
  correct: boolean,
): LearnProgress {
  const next: LearnProgress = {
    archetypes: { ...progress.archetypes },
    tactics: { ...progress.tactics },
    shieldScore: progress.shieldScore,
    streak: progress.streak,
    bestStreak: progress.bestStreak,
    rounds: progress.rounds,
  };

  const { archetypes, tactics } = cardCategories(card);
  for (const a of archetypes) bump(next.archetypes, a, correct);
  for (const t of tactics) bump(next.tactics, t, correct);

  if (correct) {
    next.streak = progress.streak + 1;
    next.bestStreak = Math.max(progress.bestStreak, next.streak);
    next.shieldScore = progress.shieldScore + 10 + Math.min(next.streak, 5) * 2;
  } else {
    next.streak = 0;
  }
  return next;
}

/** Mark a completed round (for progress display). Pure. */
export function completeRound(progress: LearnProgress): LearnProgress {
  return { ...progress, rounds: progress.rounds + 1 };
}

/**
 * Choose `size` cards for the next round, weighted toward weak categories, with
 * no repeats. `rng` is injectable for deterministic tests. Weakest categories
 * are the most likely to appear, but every card keeps a nonzero chance.
 */
export function selectRound(
  deck: readonly DrillCard[],
  progress: LearnProgress,
  size: number,
  rng: () => number = Math.random,
): DrillCard[] {
  const pool = deck.map((card) => ({ card, weight: cardWeight(card, progress) }));
  const chosen: DrillCard[] = [];
  const count = Math.min(size, pool.length);

  for (let n = 0; n < count; n++) {
    const total = pool.reduce((sum, p) => sum + p.weight, 0);
    let threshold = rng() * total;
    let index = 0;
    for (let i = 0; i < pool.length; i++) {
      threshold -= pool[i]!.weight;
      if (threshold <= 0) {
        index = i;
        break;
      }
    }
    chosen.push(pool[index]!.card);
    pool.splice(index, 1); // no repeats within a round
  }
  return chosen;
}

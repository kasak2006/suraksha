"use client";

import { Check, Flame, Share2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/*
 * The user's "shield score" and streak (spec §5.6) — the gamified progress that
 * rewards practice, plus a shareable "I'm scam-aware" badge (the growth loop).
 * Uses the Web Share API where available, falling back to clipboard.
 */

/**
 * Copy `text`, returning whether it succeeded. Tries the async Clipboard API,
 * then falls back to a hidden-textarea execCommand — which works inside the
 * click gesture even when clipboard-write permission is denied (e.g. an embedded
 * or unfocused context). Returns false if both paths fail.
 */
async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or not focused — try the legacy path below.
    }
  }
  if (typeof document === "undefined") return false;
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function ShieldScore({
  score,
  streak,
  best,
}: {
  score: number;
  streak: number;
  best: number;
}) {
  const t = useTranslations("learn");
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = t("shareText", { score });
    // Native share sheet where available (mobile) — the sheet is its own feedback.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled, or share failed — fall through to copying instead.
      }
    }
    if (await copyText(text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-9 shrink-0 text-primary" aria-hidden />
        <div className="flex flex-col">
          <span className="text-2xl font-bold tabular-nums">{score}</span>
          <span className="text-sm text-muted-foreground">{t("shieldScore")}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-base">
        <Flame className="size-5 shrink-0 text-accent" aria-hidden />
        <span>{t("streak", { streak })}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{t("best", { best })}</span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="ms-auto"
        onClick={share}
      >
        {copied ? <Check aria-hidden /> : <Share2 aria-hidden />}
        {copied ? t("shareCopied") : t("shareBadge")}
      </Button>
    </section>
  );
}

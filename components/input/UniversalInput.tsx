"use client";

import { ClipboardPaste, MessageSquare, Phone, QrCode, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { scamExamples } from "@/data/examples";
import { encodeMessage } from "@/lib/check-link";
import { useRouter } from "@/lib/i18n/navigation";

const TILES = [
  { id: "message", icon: MessageSquare },
  { id: "call", icon: Phone },
  { id: "upi", icon: QrCode },
  { id: "link", icon: Link2 },
] as const;

export function UniversalInput() {
  const t = useTranslations("home");
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState(false);

  function submit(message: string) {
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      setError(true);
      return;
    }
    router.push(`/check?q=${encodeMessage(trimmed)}`);
  }

  async function paste() {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText(clip);
        setError(false);
      }
    } catch {
      // Clipboard blocked (permissions/insecure context) — user can paste manually.
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label htmlFor="universal-input" className="text-lg font-semibold">
          {t("inputLabel")}
        </label>
        <Textarea
          id="universal-input"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(false);
          }}
          placeholder={t("placeholder")}
          rows={5}
          aria-invalid={error}
          aria-describedby={error ? "input-error" : undefined}
        />
        {error && (
          <p id="input-error" className="text-base font-medium text-destructive">
            {t("emptyError")}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={paste}>
            <ClipboardPaste aria-hidden />
            {t("paste")}
          </Button>
          <Button
            type="button"
            variant="accent"
            className="flex-1"
            onClick={() => submit(text)}
          >
            {t("check")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-base font-semibold text-muted-foreground">
          {t("tilesLabel")}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TILES.map(({ id, icon: Icon }) => (
            <div
              key={id}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center"
            >
              <Icon className="size-6 text-primary" aria-hidden />
              <span className="text-sm font-medium">{t(`tiles.${id}`)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-base font-semibold text-muted-foreground">
          {t("examplesLabel")}
        </p>
        <div className="flex flex-col gap-2">
          {scamExamples.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() => submit(example.text)}
              className="rounded-lg border border-border bg-card px-4 py-3 text-left text-base hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t(`examples.${example.id}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

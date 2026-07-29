"use client";

import {
  ClipboardPaste,
  Link2,
  MessageSquare,
  Mic,
  Phone,
  QrCode,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { scamExamples } from "@/data/examples";
import { encodeMessage } from "@/lib/check-link";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { createRecognizer, isSttSupported, type Recognizer } from "@/lib/speech/stt";

const TILES = [
  { id: "message", icon: MessageSquare, action: "focus" },
  { id: "call", icon: Phone, action: "soon" },
  { id: "upi", icon: QrCode, action: "/upi" },
  { id: "link", icon: Link2, action: "/link" },
] as const;

export function UniversalInput() {
  const t = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState(false);

  // Voice input (STT) — gated behind mounted + capability to avoid SSR mismatch.
  const [mounted, setMounted] = useState(false);
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef<Recognizer | null>(null);
  useEffect(() => setMounted(true), []);

  function toggleMic() {
    if (listening) {
      recognizerRef.current?.stop();
      return;
    }
    const recognizer = createRecognizer({
      locale,
      onResult: (transcript) => {
        setText(transcript);
        setError(false);
      },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
    if (!recognizer) return;
    recognizerRef.current = recognizer;
    setListening(true);
    recognizer.start();
  }

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
          {mounted && isSttSupported() && (
            <Button
              type="button"
              variant={listening ? "accent" : "outline"}
              onClick={toggleMic}
              aria-pressed={listening}
            >
              <Mic aria-hidden />
              {listening ? t("listening") : t("speak")}
            </Button>
          )}
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
          {TILES.map(({ id, icon: Icon, action }) => {
            const inner = (
              <>
                <Icon className="size-6 text-primary" aria-hidden />
                <span className="text-sm font-medium">{t(`tiles.${id}`)}</span>
              </>
            );
            const base =
              "flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center";
            const interactive =
              "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

            if (action === "focus") {
              return (
                <button
                  key={id}
                  type="button"
                  className={`${base} ${interactive}`}
                  onClick={() => {
                    const el = document.getElementById("universal-input");
                    el?.focus();
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  {inner}
                </button>
              );
            }
            if (action === "soon") {
              return (
                <div
                  key={id}
                  aria-disabled
                  className={`${base} opacity-60`}
                >
                  {inner}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {t("comingSoon")}
                  </span>
                </div>
              );
            }
            return (
              <Link key={id} href={action} className={`${base} ${interactive}`}>
                {inner}
              </Link>
            );
          })}
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

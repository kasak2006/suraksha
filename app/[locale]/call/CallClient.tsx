"use client";

import { ArrowLeft, Info, Mic, Square } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { DangerInterrupt } from "@/components/call/DangerInterrupt";
import { LiveTranscript } from "@/components/call/LiveTranscript";
import { PressureMeter } from "@/components/call/PressureMeter";
import { Button } from "@/components/ui/button";
import { analyze } from "@/lib/engine";
import { encodeMessage } from "@/lib/check-link";
import { Link } from "@/lib/i18n/navigation";
import { createRecognizer, isSttSupported, type Recognizer } from "@/lib/speech/stt";

/*
 * /call — the live call guard (spec §5.3). The browser cannot tap a phone call
 * (§9.1), so this is speakerphone-mode assistance: it listens through the mic,
 * transcribes continuously, and re-runs the deterministic rule engine on the
 * growing transcript to drive a pressure meter and a DANGER interrupt. We use
 * the sync `analyze` (not the neural path) so updates stay instant.
 */
export function CallClient() {
  const t = useTranslations("call");
  const locale = useLocale();

  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [listening, setListening] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dangerDismissed, setDangerDismissed] = useState(false);
  const recognizerRef = useRef<Recognizer | null>(null);

  useEffect(() => setMounted(true), []);

  // Stop listening if the user leaves the page.
  useEffect(() => {
    return () => recognizerRef.current?.stop();
  }, []);

  const fullText = `${finalText} ${interimText}`.trim();
  const result = useMemo(() => analyze(fullText), [fullText]);

  // Let the interrupt re-arm once the conversation drops out of DANGER again.
  useEffect(() => {
    if (result.band !== "danger") setDangerDismissed(false);
  }, [result.band]);

  const showInterrupt = result.band === "danger" && !dangerDismissed;

  function start() {
    const recognizer = createRecognizer({
      locale,
      continuous: true,
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          setFinalText((prev) => `${prev} ${transcript}`.trim());
          setInterimText("");
        } else {
          setInterimText(transcript);
        }
      },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
    if (!recognizer) return;
    recognizerRef.current = recognizer;
    setListening(true);
    recognizer.start();
  }

  function stop() {
    recognizerRef.current?.stop();
    setListening(false);
  }

  function reset() {
    stop();
    setFinalText("");
    setInterimText("");
    setDangerDismissed(false);
  }

  const backButton = (
    <Button asChild variant="outline" className="self-start">
      <Link href="/">
        <ArrowLeft aria-hidden />
        {t("backToHome")}
      </Link>
    </Button>
  );

  // Browsers without the Web Speech API (Firefox/Safari): be honest and offer
  // the paste-into-Check fallback instead of a dead button.
  if (mounted && !isSttSupported()) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="rounded-xl border border-border bg-card p-4 text-base leading-relaxed">
          {t("unsupported")}
        </p>
        <Button asChild variant="accent" className="self-start">
          <Link href="/check">{t("goToCheck")}</Link>
        </Button>
        {backButton}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="flex items-start gap-2 rounded-xl border border-border bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{t("honestyNote")}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {listening ? (
          <Button type="button" variant="destructive" size="lg" onClick={stop}>
            <Square aria-hidden />
            {t("stop")}
          </Button>
        ) : (
          <Button type="button" variant="accent" size="lg" onClick={start}>
            <Mic aria-hidden />
            {finalText ? t("resume") : t("start")}
          </Button>
        )}
        {finalText && !listening && (
          <Button type="button" variant="outline" size="lg" onClick={reset}>
            {t("reset")}
          </Button>
        )}
      </div>

      {(fullText.length > 0 || listening) && (
        <PressureMeter
          score={result.score}
          band={result.band}
          tactics={result.tactics ?? {
            urgency: 0,
            authority: 0,
            fear: 0,
            reward: 0,
            secrecy: 0,
            credential: 0,
            trust: 0,
            irreversibility: 0,
          }}
        />
      )}

      <LiveTranscript final={finalText} interim={interimText} />

      {fullText.length > 0 && (
        <Button asChild variant="outline" className="self-start">
          <Link href={`/check?q=${encodeMessage(fullText)}`}>
            {t("checkFullMessage")}
          </Link>
        </Button>
      )}

      {backButton}

      {showInterrupt && (
        <DangerInterrupt
          archetype={result.archetype ?? null}
          onDismiss={() => setDangerDismissed(true)}
        />
      )}
    </div>
  );
}

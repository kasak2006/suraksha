"use client";

import { Square, Volume2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSpeech, useTtsAvailable } from "@/lib/speech/useTts";

/*
 * 60-second audio micro-lessons (spec §5.6). Content is TTS-read at runtime in
 * the user's language — no audio files to host (zero cost). The Listen button
 * only appears when a voice for the locale is actually installed.
 */
const LESSON_IDS = ["otp", "receiveNoPin", "checkLender"] as const;

export function LessonPlayer() {
  const t = useTranslations("lessons");
  const locale = useLocale();
  const canSpeak = useTtsAvailable(locale);
  const { speakingId, speak, stop } = useSpeech();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t("heading")}</h2>
      <ul className="flex flex-col gap-3">
        {LESSON_IDS.map((id) => (
          <li
            key={id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
          >
            <h3 className="text-base font-semibold">{t(`${id}.title`)}</h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t(`${id}.body`)}
            </p>
            {canSpeak && (
              <Button
                type="button"
                variant="outline"
                className="self-start"
                aria-pressed={speakingId === id}
                onClick={
                  speakingId === id
                    ? stop
                    : () =>
                        speak(`${t(`${id}.title`)}. ${t(`${id}.body`)}`, locale, id)
                }
              >
                {speakingId === id ? (
                  <Square aria-hidden />
                ) : (
                  <Volume2 aria-hidden />
                )}
                {speakingId === id ? t("stop") : t("listen")}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

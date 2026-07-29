"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { encodeMessage } from "@/lib/check-link";
import { useRouter } from "@/lib/i18n/navigation";

/*
 * /link — URL / phishing checker (spec §5.4). A focused entry point that reuses
 * the full engine: the pasted link (or message) is analysed on /check, where the
 * URL rule group (shorteners, lookalike domains, IP hosts, suspicious TLDs, APK
 * links) does the work.
 */
export function LinkClient() {
  const t = useTranslations("link");
  const router = useRouter();
  const [text, setText] = useState("");

  function submit() {
    const value = text.trim();
    if (value.length === 0) return;
    router.push(`/check?q=${encodeMessage(value)}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-base text-muted-foreground">{t("intro")}</p>
      </div>

      <div className="flex flex-col gap-3">
        <label htmlFor="link-input" className="text-lg font-semibold">
          {t("inputLabel")}
        </label>
        <Textarea
          id="link-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
          rows={3}
        />
        <Button
          type="button"
          variant="accent"
          className="self-start"
          onClick={submit}
        >
          {t("check")}
        </Button>
      </div>

      <p className="rounded-xl border border-border bg-card p-4 text-base leading-relaxed text-muted-foreground">
        {t("tips")}
      </p>
    </div>
  );
}

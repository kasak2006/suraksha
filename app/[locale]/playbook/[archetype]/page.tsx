import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ComplaintDraft } from "@/components/playbook/ComplaintDraft";
import { PlaybookSteps } from "@/components/playbook/PlaybookSteps";
import { Button } from "@/components/ui/button";
import { ARCHETYPE_IDS, type ArchetypeId } from "@/lib/engine/archetypes";
import { getPlaybook, isArchetypeId } from "@/lib/engine/playbooks";
import { Link } from "@/lib/i18n/navigation";

// Standalone, shareable playbook pages — statically generated for every archetype.
export function generateStaticParams() {
  return ARCHETYPE_IDS.map((archetype) => ({ archetype }));
}

export default async function PlaybookPage({
  params,
}: {
  params: Promise<{ locale: string; archetype: string }>;
}) {
  const { locale, archetype } = await params;
  setRequestLocale(locale);

  if (!isArchetypeId(archetype)) notFound();
  const id: ArchetypeId = archetype;

  const t = await getTranslations("playbook");
  const ta = await getTranslations("archetypes");
  const playbook = getPlaybook(id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">
          {ta(`${id}.name`)}
        </span>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-base text-muted-foreground">{t("intro")}</p>
      </div>

      <PlaybookSteps playbook={playbook} />

      <ComplaintDraft archetypeId={id} />

      <Button asChild variant="outline" className="self-start">
        <Link href="/">
          <ArrowLeft aria-hidden />
          {t("backToCheck")}
        </Link>
      </Button>
    </div>
  );
}

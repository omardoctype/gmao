import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiSource } from "@/types/ai-assistant";

interface AiSourcesCardsProps {
  sources: AiSource[];
  title?: string;
}

export function AiSourcesCards({ sources, title = "Sources documentaires" }: AiSourcesCardsProps) {
  if (sources.length === 0) {
    return (
      <Card className="border-border/90 bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>Aucune source explicite n'a ete retournee.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/90 bg-surface">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{sources.length} source(s) utilisee(s) pour cette reponse.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sources.map((source, index) => (
          <article key={`${source.file}-${index}`} className="rounded-lg border border-border/80 bg-surface-elevated p-3">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              {source.file}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">{source.snippet}</p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

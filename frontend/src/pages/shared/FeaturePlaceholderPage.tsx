import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FeaturePlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: "primary" | "secondary";
}

export function FeaturePlaceholderPage({
  title,
  description,
  icon: Icon,
  tone = "primary",
}: FeaturePlaceholderPageProps) {
  const iconToneClass = tone === "secondary" ? "text-accent" : "text-primary";

  return (
    <section className="ds-stack animate-fade-in-up">
      <div className="ds-section-heading">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <Badge variant="secondary">Placeholder</Badge>
      </div>

      <Card className="max-w-4xl border-border/90 bg-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="rounded-lg border border-border bg-surface-elevated p-2">
              <Icon className={`h-5 w-5 ${iconToneClass}`} />
            </span>
            Ecran de demonstration
          </CardTitle>
          <CardDescription>
            Cette page sert de base propre pour integrer la logique metier et les appels backend a l'etape suivante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-surface-elevated p-4 text-sm text-muted-foreground">
            UI responsive prete pour desktop, tablette et mobile, sans couplage au backend.
          </div>
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Next step: branchement API et donnees reelles
            <ArrowRight className="h-4 w-4" />
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

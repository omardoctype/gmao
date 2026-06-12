import { Home, MapPinOff } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { routePaths } from "@/routes/route-paths";

export function NotFoundPage() {
  return (
    <main className="ds-page flex min-h-[70vh] items-center justify-center py-8">
      <Card className="w-full max-w-lg border-border/90 bg-surface text-center">
        <CardHeader className="items-center">
          <div className="inline-flex rounded-full border border-border bg-surface-elevated p-3">
            <MapPinOff className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Page introuvable</CardTitle>
          <CardDescription>La route demandee n'existe pas ou n'est plus disponible.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to={routePaths.dashboard}>
              <Home className="mr-2 h-4 w-4" />
              Retour au dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

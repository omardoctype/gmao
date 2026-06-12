import { AlertTriangle, Ban, Inbox, LoaderCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StateAction {
  label: string;
  onClick: () => void;
}

interface PageLoadingStateProps {
  title: string;
  description: string;
}

export function PageLoadingState({ title, description }: PageLoadingStateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

interface PageErrorStateProps {
  description: string;
  title?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function PageErrorState({
  description,
  title = "Chargement impossible",
  retryLabel = "Reessayer",
  onRetry,
}: PageErrorStateProps) {
  return (
    <Card className="border-destructive/30 bg-destructive/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-destructive/90">{description}</CardDescription>
      </CardHeader>
      {onRetry ? (
        <CardContent>
          <Button variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}

interface PageEmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: StateAction;
}

export function PageEmptyState({ title, description, icon: Icon = Inbox, action }: PageEmptyStateProps) {
  return (
    <Card className="border-border/90 bg-surface">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action ? (
        <CardContent>
          <Button onClick={action.onClick}>{action.label}</Button>
        </CardContent>
      ) : null}
    </Card>
  );
}

interface PageRestrictedStateProps {
  description: string;
  title?: string;
  icon?: LucideIcon;
}

export function PageRestrictedState({
  description,
  title = "Visualisation restreinte",
  icon: Icon = Ban,
}: PageRestrictedStateProps) {
  return (
    <Card className="border-border/90 bg-surface">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

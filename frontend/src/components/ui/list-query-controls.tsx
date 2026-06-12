import type { ReactNode } from "react";
import { Filter, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface ListSortOption {
  value: string;
  label: string;
}

interface ListQueryControlsProps {
  title: string;
  description: string;
  columns?: 3 | 4;
  searchLabel?: string;
  sortLabel?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sortValue: string;
  sortOptions: ListSortOption[];
  onSortChange: (value: string) => void;
  actions?: ReactNode;
  children?: ReactNode;
}

interface FilterCardProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

interface FilterGridProps {
  children: ReactNode;
  columns?: 3 | 4;
  className?: string;
}

interface FilterFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

interface FilterActionsProps {
  children: ReactNode;
  className?: string;
}

export function FilterCard({ title, description, children, className }: FilterCardProps) {
  return (
    <Card className={cn("border-border/90 bg-surface", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children}
    </Card>
  );
}

export function FilterGrid({ children, columns = 4, className }: FilterGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 md:grid-cols-2",
        columns === 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FilterField({ label, children, className }: FilterFieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function FilterActions({ children, className }: FilterActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:pt-1 [&>*]:w-full sm:[&>*]:w-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ListQueryControls({
  title,
  description,
  columns = 4,
  searchLabel = "Recherche",
  sortLabel = "Tri",
  searchPlaceholder,
  searchValue,
  onSearchChange,
  sortValue,
  sortOptions,
  onSortChange,
  actions,
  children,
}: ListQueryControlsProps) {
  return (
    <FilterCard title={title} description={description}>
      <CardContent className="space-y-3">
        <FilterGrid columns={columns}>
          {typeof searchValue === "string" && onSearchChange ? (
            <FilterField
              label={searchLabel}
              className="md:col-span-2 lg:col-span-2 xl:col-span-2"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  value={searchValue}
                  placeholder={searchPlaceholder}
                  className="pl-9"
                  onChange={(event) => onSearchChange(event.target.value)}
                />
              </div>
            </FilterField>
          ) : null}

          <FilterField label={sortLabel}>
            <Select value={sortValue} onChange={(event) => onSortChange(event.target.value)}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FilterField>

          {children}
        </FilterGrid>
        {actions ? <FilterActions>{actions}</FilterActions> : null}
      </CardContent>
    </FilterCard>
  );
}

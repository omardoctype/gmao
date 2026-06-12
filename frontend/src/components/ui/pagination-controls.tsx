import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];

interface PaginationControlsProps {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  sizeOptions?: number[];
  disabled?: boolean;
}

export function PaginationControls({
  page,
  size,
  totalElements,
  totalPages,
  onPageChange,
  onSizeChange,
  sizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  disabled = false,
}: PaginationControlsProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const displayFrom = totalElements === 0 ? 0 : page * size + 1;
  const displayTo = totalElements === 0 ? 0 : Math.min((page + 1) * size, totalElements);
  const canGoPrevious = page > 0 && !disabled;
  const canGoNext = page + 1 < safeTotalPages && !disabled;

  return (
    <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Affichage {displayFrom}-{displayTo} sur {totalElements}
      </p>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Taille
          <Select
            className="h-9 w-[92px]"
            value={String(size)}
            onChange={(event) => onSizeChange(Number(event.target.value))}
            disabled={disabled}
          >
            {sizeOptions.map((sizeOption) => (
              <option key={sizeOption} value={sizeOption}>
                {sizeOption} / page
              </option>
            ))}
          </Select>
        </label>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious}
            aria-label="Page precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[92px] text-center text-sm text-muted-foreground">
            Page {Math.min(page + 1, safeTotalPages)} / {safeTotalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

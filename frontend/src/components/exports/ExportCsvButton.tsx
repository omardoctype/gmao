import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportCsvButtonProps {
  loading: boolean;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

export function ExportCsvButton({
  loading,
  onClick,
  disabled = false,
  label = "Exporter CSV",
}: ExportCsvButtonProps) {
  return (
    <Button variant="outline" disabled={disabled || loading} onClick={onClick}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Export..." : label}
    </Button>
  );
}

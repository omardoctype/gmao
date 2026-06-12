import { cn } from "@/lib/utils";
import type { WorkOrderStatus } from "@/types/work-order";

interface TimelineStep {
  key: "CREATED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
  label: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { key: "CREATED", label: "Creation" },
  { key: "ASSIGNED", label: "Affectation" },
  { key: "IN_PROGRESS", label: "Intervention" },
  { key: "COMPLETED", label: "Cloture" },
];

const STEP_ORDER: Record<WorkOrderStatus, number> = {
  CREATED: 0,
  ASSIGNED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  CANCELLED: 0,
};

interface WorkOrderStatusTimelineProps {
  status: WorkOrderStatus;
}

export function WorkOrderStatusTimeline({ status }: WorkOrderStatusTimelineProps) {
  const currentStep = STEP_ORDER[status];
  const isCancelled = status === "CANCELLED";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        {TIMELINE_STEPS.map((step, index) => {
          const isDone = !isCancelled && index <= currentStep;

          return (
            <div key={step.key} className="relative rounded-md border border-border bg-surface-elevated px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                    isCancelled
                      ? "bg-muted text-muted-foreground"
                      : isDone
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <span className={cn("text-xs font-semibold", isDone ? "text-foreground" : "text-muted-foreground")}>
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {isCancelled ? (
        <p className="text-xs font-medium text-destructive">Ordre de travail annule avant cloture.</p>
      ) : null}
    </div>
  );
}

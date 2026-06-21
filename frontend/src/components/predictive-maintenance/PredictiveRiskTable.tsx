import { Bot, Eye, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  EquipmentCriticalityBadge,
  EquipmentStatusBadge,
  PredictiveRiskLevelBadge,
} from "@/components/predictive-maintenance/PredictiveRiskBadges";
import { PredictiveRiskScoreMeter } from "@/components/predictive-maintenance/PredictiveRiskInsights";
import { cn } from "@/lib/utils";
import type { PredictiveRiskEquipment } from "@/types/predictive-maintenance";

interface PredictiveRiskTableProps {
  equipments: PredictiveRiskEquipment[];
  viewingRiskEquipmentId: number | null;
  analyzingAiEquipmentId: number | null;
  canAnalyzeWithAi: boolean;
  onViewRiskDetail: (equipment: PredictiveRiskEquipment) => void;
  onAnalyzeWithAi: (equipment: PredictiveRiskEquipment) => void;
}

export function PredictiveRiskTable({
  equipments,
  viewingRiskEquipmentId,
  analyzingAiEquipmentId,
  canAnalyzeWithAi,
  onViewRiskDetail,
  onAnalyzeWithAi,
}: PredictiveRiskTableProps) {
  const isAnalyzingAny = analyzingAiEquipmentId !== null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead>Categorie</TableHead>
          <TableHead>Localisation</TableHead>
          <TableHead>Criticite</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Risk Score</TableHead>
          <TableHead>Risk Level</TableHead>
          <TableHead>Action recommandee</TableHead>
          <TableHead className="sticky right-0 bg-secondary/95 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {equipments.map((equipment) => {
          const isViewing = viewingRiskEquipmentId === equipment.equipmentId;
          const isAnalyzing = analyzingAiEquipmentId === equipment.equipmentId;

          return (
            <TableRow key={equipment.equipmentId}>
              <TableCell className="font-semibold">{equipment.equipmentCode}</TableCell>
              <TableCell className="min-w-[200px]">
                <p className="font-medium text-foreground">{equipment.equipmentName}</p>
              </TableCell>
              <TableCell>{equipment.category}</TableCell>
              <TableCell>{equipment.location || "-"}</TableCell>
              <TableCell className="sticky right-0 bg-surface/95">
                <EquipmentCriticalityBadge criticality={equipment.criticality} />
              </TableCell>
              <TableCell>
                <EquipmentStatusBadge status={equipment.status} />
              </TableCell>
              <TableCell className="min-w-[150px]">
                <PredictiveRiskScoreMeter
                  riskScore={equipment.riskScore}
                  riskLevel={equipment.riskLevel}
                  compact
                />
              </TableCell>
              <TableCell>
                <PredictiveRiskLevelBadge riskLevel={equipment.riskLevel} />
              </TableCell>
              <TableCell className="max-w-[320px]">
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{equipment.recommendedAction}</p>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1.5">
                  <Button
                    variant={isViewing ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => onViewRiskDetail(equipment)}
                    disabled={isViewing}
                    title="Voir le detail du risque"
                    aria-label={`Voir le detail du risque pour l'equipement ${equipment.equipmentCode}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant={isAnalyzing ? "secondary" : "outline"}
                    size="sm"
                    className="gap-1.5 whitespace-nowrap"
                    onClick={() => onAnalyzeWithAi(equipment)}
                    disabled={!canAnalyzeWithAi || isAnalyzingAny}
                    title={canAnalyzeWithAi ? "Analyser avec IA" : "Analyse IA indisponible"}
                    aria-label={`Analyser avec IA l'equipement ${equipment.equipmentCode}`}
                  >
                    <Bot className={cn("h-4 w-4", isAnalyzing && "animate-pulse")} />
                    <span>{isAnalyzing ? "Analyse..." : "Analyser avec IA"}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="Creation OT preventif disponible prochainement"
                    aria-label={`Creation d'un ordre preventif pour l'equipement ${equipment.equipmentCode} indisponible`}
                  >
                    <Hammer className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

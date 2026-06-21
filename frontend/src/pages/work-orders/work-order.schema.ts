import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));
const optionalNonNegativeIntegerText = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d+$/.test(value), "La valeur doit etre un nombre entier positif ou nul.")
  .optional()
  .or(z.literal(""));

export const workOrderSchema = z.object({
  reference: z.string().trim().min(1, "La reference est obligatoire.").max(50, "Maximum 50 caracteres."),
  type: z.enum(["CORRECTIVE", "PREVENTIVE", "INSPECTION", "INSTALLATION", "OTHER"], {
    message: "Le type est obligatoire.",
  }),
  status: z.enum(["CREATED", "ASSIGNED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"], {
    message: "Le statut est obligatoire.",
  }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
    message: "La priorite est obligatoire.",
  }),
  plannedDate: optionalText,
  estimatedDurationMinutes: optionalNonNegativeIntegerText,
  estimatedCost: optionalText,
  realCost: optionalText,
  description: z.string().trim().min(1, "La description est obligatoire.").max(2000, "Maximum 2000 caracteres."),
  equipmentId: z.number().int().positive("L'equipement est obligatoire."),
  breakdownId: z.number().int().positive("La panne doit etre valide.").nullable(),
});

export const workOrderAssignSchema = z.object({
  technicianId: z.number().int().positive("L'identifiant technicien est obligatoire."),
});

export const workOrderInterventionReportSchema = z.object({
  performedTasks: z
    .string()
    .trim()
    .min(1, "Les travaux effectues sont obligatoires.")
    .max(10000, "Maximum 10000 caracteres."),
  realDiagnosis: optionalText,
  rootCause: optionalText,
  usedParts: optionalText,
  interventionDurationMinutes: optionalText,
  finalResult: z
    .string()
    .trim()
    .min(1, "Le resultat final est obligatoire.")
    .max(10000, "Maximum 10000 caracteres."),
  futureRecommendations: optionalText,
});

export type WorkOrderFormValues = z.infer<typeof workOrderSchema>;
export type WorkOrderAssignFormValues = z.infer<typeof workOrderAssignSchema>;
export type WorkOrderInterventionReportFormValues = z.infer<typeof workOrderInterventionReportSchema>;

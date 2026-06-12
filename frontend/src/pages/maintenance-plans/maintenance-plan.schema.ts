import { z } from "zod";

export const maintenancePlanSchema = z.object({
  type: z.enum(["PREVENTIVE", "PREDICTIVE", "LEGAL", "CONDITION_BASED", "OTHER"], {
    message: "Le type est obligatoire.",
  }),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"], {
    message: "La frequence est obligatoire.",
  }),
  nextExecutionDate: z.string().trim().min(1, "La date de prochaine execution est obligatoire."),
  description: z.string().trim().min(1, "La description est obligatoire.").max(2000, "Maximum 2000 caracteres."),
  equipmentId: z.number().int().positive("L'equipement est obligatoire."),
});

export type MaintenancePlanFormValues = z.infer<typeof maintenancePlanSchema>;

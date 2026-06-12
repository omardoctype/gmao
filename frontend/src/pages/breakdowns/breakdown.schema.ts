import { z } from "zod";

export const breakdownSchema = z.object({
  reference: z.string().trim().min(1, "La reference est obligatoire.").max(50, "Maximum 50 caracteres."),
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(200, "Maximum 200 caracteres."),
  description: z.string().trim().min(1, "La description est obligatoire.").max(2000, "Maximum 2000 caracteres."),
  type: z.enum(["MECHANICAL", "ELECTRICAL", "HYDRAULIC", "PNEUMATIC", "SOFTWARE", "OTHER"], {
    message: "Le type est obligatoire.",
  }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
    message: "La priorite est obligatoire.",
  }),
  status: z.enum(["DECLARED", "QUALIFIED", "IN_PROGRESS", "RESOLVED"], {
    message: "Le statut est obligatoire.",
  }),
  equipmentId: z.number().int().positive("L'equipement est obligatoire."),
});

export const breakdownStatusSchema = z.object({
  status: z.enum(["DECLARED", "QUALIFIED", "IN_PROGRESS", "RESOLVED"], {
    message: "Le statut est obligatoire.",
  }),
});

export type BreakdownFormValues = z.infer<typeof breakdownSchema>;
export type BreakdownStatusFormValues = z.infer<typeof breakdownStatusSchema>;

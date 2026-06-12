import { z } from "zod";

export const aiAskSchema = z.object({
  question: z.string().trim().min(3, "La question doit contenir au moins 3 caracteres.").max(3000),
  equipmentCode: z.string().trim().max(50).optional().or(z.literal("")),
});

export const aiDiagnosisSchema = z.object({
  equipmentCode: z.string().trim().min(1, "Veuillez selectionner un equipement.").max(50),
  breakdownDescription: z
    .string()
    .trim()
    .min(8, "La description de panne doit contenir au moins 8 caracteres.")
    .max(5000),
});

export type AiAskFormValues = z.infer<typeof aiAskSchema>;
export type AiDiagnosisFormValues = z.infer<typeof aiDiagnosisSchema>;

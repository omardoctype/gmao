import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(150, "Valeur trop longue.")
  .optional()
  .or(z.literal(""));

export const equipmentSchema = z.object({
  code: z.string().trim().min(1, "Le code est obligatoire.").max(50, "Maximum 50 caracteres."),
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(150, "Maximum 150 caracteres."),
  category: z.string().trim().min(1, "La categorie est obligatoire.").max(100, "Maximum 100 caracteres."),
  brand: z.string().trim().max(100, "Maximum 100 caracteres.").optional().or(z.literal("")),
  model: z.string().trim().max(100, "Maximum 100 caracteres.").optional().or(z.literal("")),
  serialNumber: z.string().trim().max(100, "Maximum 100 caracteres.").optional().or(z.literal("")),
  location: optionalText,
  status: z.enum(["OPERATIONAL", "MAINTENANCE", "OUT_OF_SERVICE"], {
    message: "Le statut est obligatoire.",
  }),
  criticality: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
    message: "La criticite est obligatoire.",
  }),
  installationDate: z.string().optional().or(z.literal("")),
  description: z.string().trim().max(2000, "Maximum 2000 caracteres.").optional().or(z.literal("")),
});

export type EquipmentFormValues = z.infer<typeof equipmentSchema>;

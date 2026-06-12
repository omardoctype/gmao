import { z } from "zod";

export const sparePartSchema = z.object({
  reference: z.string().trim().min(1, "La reference est obligatoire.").max(50, "Maximum 50 caracteres."),
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(150, "Maximum 150 caracteres."),
  category: z.string().trim().min(1, "La categorie est obligatoire.").max(100, "Maximum 100 caracteres."),
  quantityInStock: z.number().int().min(0, "Le stock doit etre positif."),
  minimumThreshold: z.number().int().min(0, "Le seuil doit etre positif."),
  unitPrice: z.string().trim().min(1, "Le prix unitaire est obligatoire."),
});

export const stockMovementSchema = z.object({
  quantity: z.number().int().min(1, "La quantite doit etre superieure a 0."),
});

export type SparePartFormValues = z.infer<typeof sparePartSchema>;
export type StockMovementFormValues = z.infer<typeof stockMovementSchema>;

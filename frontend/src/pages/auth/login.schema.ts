import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Adresse email invalide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caracteres."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

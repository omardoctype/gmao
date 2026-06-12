import { z } from "zod";

const roleSchema = z.enum([
  "ADMIN",
  "RESPONSABLE_MAINTENANCE",
  "TECHNICIAN",
  "STOREKEEPER",
  "OPERATOR",
  "DIRECTION",
]);

const optionalPhoneSchema = z.string().trim().max(30, "Maximum 30 caracteres.").optional().or(z.literal(""));

export const userCreateSchema = z.object({
  firstName: z.string().trim().min(1, "Le prenom est obligatoire.").max(100, "Maximum 100 caracteres."),
  lastName: z.string().trim().min(1, "Le nom est obligatoire.").max(100, "Maximum 100 caracteres."),
  email: z.string().trim().email("Email invalide.").max(150, "Maximum 150 caracteres."),
  password: z.string().min(8, "Minimum 8 caracteres.").max(255, "Maximum 255 caracteres."),
  phone: optionalPhoneSchema,
  active: z.boolean(),
  roles: z.array(roleSchema).min(1, "Selectionnez au moins un role."),
});

export const userUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "Le prenom est obligatoire.").max(100, "Maximum 100 caracteres."),
  lastName: z.string().trim().min(1, "Le nom est obligatoire.").max(100, "Maximum 100 caracteres."),
  email: z.string().trim().email("Email invalide.").max(150, "Maximum 150 caracteres."),
  password: z
    .string()
    .trim()
    .max(255, "Maximum 255 caracteres.")
    .optional()
    .or(z.literal(""))
    .refine((value) => value === undefined || value === "" || value.length >= 8, "Minimum 8 caracteres."),
  phone: optionalPhoneSchema,
  active: z.boolean(),
  roles: z.array(roleSchema).min(1, "Selectionnez au moins un role."),
});

export const userRoleAssignSchema = z.object({
  roles: z.array(roleSchema).min(1, "Selectionnez au moins un role."),
});

export type UserCreateFormValues = z.infer<typeof userCreateSchema>;
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
export type UserRoleAssignFormValues = z.infer<typeof userRoleAssignSchema>;

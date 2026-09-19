import { z } from "zod";

export const CLIENT_PASSWORD_MIN_LENGTH = 12;
export const CLIENT_PASSWORD_MAX_LENGTH = 128;

export const clientPasswordSchema = z
  .string()
  .min(
    CLIENT_PASSWORD_MIN_LENGTH,
    `${CLIENT_PASSWORD_MIN_LENGTH} caractères minimum`,
  )
  .max(
    CLIENT_PASSWORD_MAX_LENGTH,
    `${CLIENT_PASSWORD_MAX_LENGTH} caractères maximum`,
  );

export const clientRegisterSchema = z
  .object({
    nom: z.string().min(2, "Nom trop court").max(255),
    telephone: z
      .string()
      .regex(/^[0-9\s]{8,20}$/, "Numéro de téléphone invalide"),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    password: clientPasswordSchema,
    confirmPassword: z.string().max(CLIENT_PASSWORD_MAX_LENGTH),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type ClientRegisterInput = z.infer<typeof clientRegisterSchema>;

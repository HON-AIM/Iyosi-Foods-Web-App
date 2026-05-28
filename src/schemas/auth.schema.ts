import { z } from "zod"

export const LoginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
  rememberMe: z.coerce.boolean().optional(),
})

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100).trim().regex(/^[a-zA-Z\s'-]+$/),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>

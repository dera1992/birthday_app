import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const forgotPasswordConfirmSchema = z.object({
  uid: z.string().min(1),
  token: z.string().min(1),
  new_password: z.string().min(8),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(8),
  new_password: z.string().min(8),
});

export const accountSettingsSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone_number: z.string().min(7),
});

export const requestOtpSchema = z.object({
  phone_number: z.string().min(7),
});

export const verifyOtpSchema = z.object({
  code: z.string().min(4),
  phone_number: z.string().min(7).optional(),
});

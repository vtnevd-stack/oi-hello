import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

const email = z
  .string()
  .trim()
  .min(1, { message: "Informe seu e-mail." })
  .max(255, { message: "O e-mail deve ter no máximo 255 caracteres." })
  .email({ message: "Informe um e-mail válido." });

const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, {
    message: `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  })
  .max(72, { message: "A senha deve ter no máximo 72 caracteres." });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { message: "Informe sua senha." }),
});

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Informe seu nome." })
    .max(100, { message: "O nome deve ter no máximo 100 caracteres." }),
  email,
  password,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não coincidem.",
    path: ["confirm"],
  });

export type FormErrors = Partial<
  Record<"form" | "fullName" | "email" | "password" | "confirm", string>
>;

/** First validation message per field, for showing under inputs. */
export function fieldErrors(error: z.ZodError): FormErrors {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const MESSAGES = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
  user_already_exists: "Este e-mail já está cadastrado. Tente entrar.",
  email_exists: "Este e-mail já está cadastrado. Tente entrar.",
  weak_password: "Senha fraca ou muito comum. Escolha uma senha mais forte.",
  same_password: "A nova senha precisa ser diferente da atual.",
  over_email_send_rate_limit: "Muitos e-mails enviados. Aguarde alguns minutos e tente de novo.",
  over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
  email_address_invalid: "Informe um e-mail válido.",
  signup_disabled: "Novos cadastros estão desativados no momento.",
  session_not_found: "Sua sessão expirou. Entre novamente.",
  otp_expired: "O link expirou. Solicite um novo.",
} as const;

const MESSAGES_BY_CODE: Record<string, string | undefined> = MESSAGES;

/** Converts an auth error (code or English message) into a Portuguese message. */
export function translateAuthError(error: unknown): string {
  const { code, message } = (error ?? {}) as { code?: string; message?: string };
  const byCode = code ? MESSAGES_BY_CODE[code] : undefined;
  if (byCode) return byCode;
  const msg = (message ?? "").toLowerCase();
  if (msg.includes("invalid login credentials")) return MESSAGES.invalid_credentials;
  if (msg.includes("email not confirmed")) return MESSAGES.email_not_confirmed;
  if (msg.includes("already registered")) return MESSAGES.user_already_exists;
  if (msg.includes("password should")) return MESSAGES.weak_password;
  if (msg.includes("different from the old")) return MESSAGES.same_password;
  if (msg.includes("rate limit")) return MESSAGES.over_request_rate_limit;
  if (msg.includes("failed to fetch") || msg.includes("network"))
    return "Sem conexão com o servidor. Verifique sua internet.";
  return "Algo deu errado. Tente novamente.";
}

/** Only allow same-origin relative paths as post-login destinations. */
export function safeRedirect(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.startsWith("/auth")) return fallback;
  return value;
}

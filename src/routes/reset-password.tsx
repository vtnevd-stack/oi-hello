import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AuthShell, FieldError } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { type FormErrors, fieldErrors, PASSWORD_MIN_LENGTH, resetPasswordSchema, translateAuthError } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Acesso" },
      { name: "description", content: "Defina uma nova senha para a sua conta." },
      { property: "og:title", content: "Nova senha — Acesso" },
      { property: "og:description", content: "Defina uma nova senha para a sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

type Status = "checking" | "ready" | "invalid";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("error")) {
      setStatus("invalid");
      return;
    }
    const isRecovery = hash.get("type") === "recovery";
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (isRecovery && session)) setStatus("ready");
    });
    // Fall back to an existing recovery session (e.g. page refreshed after the link).
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setStatus((s) => (s === "checking" ? (data.session ? "ready" : "invalid") : s));
    }, 1200);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
      password: form.get("password"),
      confirm: form.get("confirm"),
    });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setLoading(false);
    if (error) return setErrors({ form: translateAuthError(error) });
    toast.success("Senha alterada com sucesso!");
    navigate({ to: "/dashboard", replace: true });
  }

  if (status === "checking") {
    return (
      <AuthShell title="Validando link…">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </AuthShell>
    );
  }

  if (status === "invalid") {
    return (
      <AuthShell
        title="Link inválido ou expirado"
        subtitle="Este link de recuperação não é mais válido. Solicite um novo para continuar."
      >
        <Button asChild className="h-11 w-full">
          <Link to="/forgot-password">Solicitar novo link</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Crie uma nova senha" subtitle={`Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {errors.form && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.form}
          </div>
        )}
        <div>
          <Label htmlFor="password">Nova senha</Label>
          <div className="mt-2">
            <PasswordInput id="password" name="password" autoComplete="new-password" className="h-11" aria-invalid={!!errors.password} aria-describedby="password-error" />
          </div>
          <FieldError id="password-error" message={errors.password} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirme a nova senha</Label>
          <div className="mt-2">
            <PasswordInput id="confirm" name="confirm" autoComplete="new-password" className="h-11" aria-invalid={!!errors.confirm} aria-describedby="confirm-error" />
          </div>
          <FieldError id="confirm-error" message={errors.confirm} />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar nova senha
        </Button>
      </form>
    </AuthShell>
  );
}

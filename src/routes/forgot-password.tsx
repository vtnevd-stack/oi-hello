import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AuthShell, FieldError } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { type FormErrors, fieldErrors, forgotPasswordSchema, translateAuthError } from "@/lib/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Acesso" },
      { name: "description", content: "Receba um link por e-mail para criar uma nova senha." },
      { property: "og:title", content: "Recuperar senha — Acesso" },
      { property: "og:description", content: "Receba um link por e-mail para criar uma nova senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({
      email: new FormData(e.currentTarget).get("email"),
    });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setErrors({ form: translateAuthError(error) });
    setSent(true);
  }

  const back = (
    <Link to="/auth" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
      <ArrowLeft className="h-4 w-4" /> Voltar para entrar
    </Link>
  );

  if (sent) {
    return (
      <AuthShell title="Verifique seu e-mail" footer={back}>
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <MailCheck className="h-8 w-8 text-success" />
          <p className="mt-4 text-sm text-muted-foreground">
            Se houver uma conta com esse e-mail, você vai receber um link para criar uma nova
            senha em instantes. Não encontrou? Veja a caixa de spam.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Esqueceu a senha?"
      subtitle="Informe seu e-mail e enviaremos um link para você criar uma nova."
      footer={back}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {errors.form && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.form}
          </div>
        )}
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" className="mt-2 h-11" aria-invalid={!!errors.email} aria-describedby="email-error" />
          <FieldError id="email-error" message={errors.email} />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar link
        </Button>
      </form>
    </AuthShell>
  );
}

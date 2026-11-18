import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell, FieldError } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  fieldErrors,
  type FormErrors,
  PASSWORD_MIN_LENGTH,
  safeRedirect,
  signInSchema,
  signUpSchema,
  translateAuthError,
} from "@/lib/auth";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["entrar", "cadastrar"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Acesso" },
      { name: "description", content: "Entre na sua conta ou crie uma nova com e-mail e senha." },
      { property: "og:title", content: "Entrar ou criar conta — Acesso" },
      { property: "og:description", content: "Entre na sua conta ou crie uma nova com e-mail e senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const mode = search.mode ?? "entrar";
  const destination = safeRedirect(search.redirect);

  // Already signed in? Skip the form.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: destination, replace: true });
    });
  }, [destination, navigate]);

  const setMode = (m: "entrar" | "cadastrar") =>
    navigate({ to: "/auth", search: { ...search, mode: m }, replace: true });

  return mode === "entrar" ? (
    <SignInForm destination={destination} onSwitch={() => setMode("cadastrar")} />
  ) : (
    <SignUpForm destination={destination} onSwitch={() => setMode("entrar")} />
  );
}

function SignInForm({ destination, onSwitch }: { destination: string; onSwitch: () => void }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      setErrors({ form: translateAuthError(error) });
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: destination, replace: true });
  }

  return (
    <AuthShell
      title="Entrar"
      subtitle="Use seu e-mail e senha para acessar sua conta."
      footer={
        <>
          Ainda não tem conta?{" "}
          <button type="button" onClick={onSwitch} className="font-semibold text-primary hover:underline">
            Criar conta
          </button>
        </>
      }
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
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <div className="mt-2">
            <PasswordInput id="password" name="password" autoComplete="current-password" className="h-11" aria-invalid={!!errors.password} aria-describedby="password-error" />
          </div>
          <FieldError id="password-error" message={errors.password} />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Entrar
        </Button>
      </form>
    </AuthShell>
  );
}

function SignUpForm({ destination, onSwitch }: { destination: string; onSwitch: () => void }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: form.get("fullName"),
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}${destination}`,
        data: { full_name: parsed.data.fullName },
      },
    });
    setLoading(false);
    if (error) {
      setErrors({ form: translateAuthError(error) });
      return;
    }
    // With email confirmation on, an existing address returns a user with no identities.
    if (data.user && data.user.identities?.length === 0) {
      setErrors({ form: translateAuthError({ code: "user_already_exists" }) });
      return;
    }
    if (data.session) {
      toast.success("Conta criada com sucesso!");
      navigate({ to: destination, replace: true });
      return;
    }
    setSentTo(parsed.data.email);
  }

  if (sentTo) {
    return (
      <AuthShell title="Confirme seu e-mail">
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <MailCheck className="h-8 w-8 text-success" />
          <p className="mt-4 font-semibold">Conta criada! Falta só um passo.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um link de confirmação para <span className="font-medium text-foreground">{sentTo}</span>.
            Abra o e-mail e clique no link para ativar sua conta. Não encontrou? Veja a caixa de spam.
          </p>
          <Button variant="outline" className="mt-6 w-full" onClick={onSwitch}>
            Voltar para entrar
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Leva menos de um minuto."
      footer={
        <>
          Já tem conta?{" "}
          <button type="button" onClick={onSwitch} className="font-semibold text-primary hover:underline">
            Entrar
          </button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {errors.form && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.form}
          </div>
        )}
        <div>
          <Label htmlFor="fullName">Nome</Label>
          <Input id="fullName" name="fullName" autoComplete="name" placeholder="Seu nome completo" className="mt-2 h-11" aria-invalid={!!errors.fullName} aria-describedby="fullName-error" />
          <FieldError id="fullName-error" message={errors.fullName} />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" className="mt-2 h-11" aria-invalid={!!errors.email} aria-describedby="email-error" />
          <FieldError id="email-error" message={errors.email} />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <div className="mt-2">
            <PasswordInput id="password" name="password" autoComplete="new-password" className="h-11" aria-invalid={!!errors.password} aria-describedby="password-error" />
          </div>
          {errors.password ? (
            <FieldError id="password-error" message={errors.password} />
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">Mínimo de {PASSWORD_MIN_LENGTH} caracteres.</p>
          )}
        </div>
        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar conta
        </Button>
      </form>
    </AuthShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Lock, MailCheck, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acesso — Login seguro para a sua conta" },
      { name: "description", content: "Crie sua conta, entre com e-mail e senha e recupere o acesso quando precisar." },
      { property: "og:title", content: "Acesso — Login seguro para a sua conta" },
      { property: "og:description", content: "Crie sua conta, entre com e-mail e senha e recupere o acesso quando precisar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Lock, title: "Senha protegida", text: "Sua senha é criptografada e nunca fica visível." },
  { icon: MailCheck, title: "E-mail confirmado", text: "Cada conta é verificada por um link enviado ao e-mail." },
  { icon: KeyRound, title: "Recuperação fácil", text: "Esqueceu a senha? Receba um link e crie outra." },
];

function Index() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <span className="flex items-center gap-2 font-display text-xl text-primary">
          <ShieldCheck className="h-5 w-5" /> Acesso
        </span>
        {signedIn ? (
          <Button asChild size="sm">
            <Link to="/dashboard">Minha conta</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="ghost">
            <Link to="/auth">Entrar</Link>
          </Button>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full bg-accent/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
            Seguro por padrão
          </p>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            Entre com tranquilidade. <span className="text-primary">Sua conta fica protegida.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Cadastro com nome, e-mail e senha, login rápido e recuperação de acesso em poucos cliques.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {signedIn ? (
              <Button asChild size="lg" className="h-12 px-6">
                <Link to="/dashboard">Ir para minha conta</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-12 px-6">
                  <Link to="/auth" search={{ mode: "cadastrar" }}>Criar conta grátis</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-6">
                  <Link to="/auth">Já tenho conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-20 grid gap-5 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border bg-card p-6 shadow-card">
              <Icon className="h-6 w-6 text-primary" />
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

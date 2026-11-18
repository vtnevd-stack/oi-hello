import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Minha conta — Acesso" },
      { name: "description", content: "Área privada da sua conta." },
      { property: "og:title", content: "Minha conta — Acesso" },
      { property: "og:description", content: "Área privada da sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, created_at")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function handleSignOut() {
    setSigningOut(true);
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSigningOut(false);
      toast.error("Não foi possível sair. Tente novamente.");
      return;
    }
    toast.success("Você saiu da sua conta.");
    navigate({ to: "/auth", replace: true });
  }

  const name = profile.data?.full_name || (user.user_metadata?.["full_name"] as string | undefined) || "";
  const firstName = name.split(" ")[0];

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <span className="flex items-center gap-2 font-display text-xl text-primary">
            <ShieldCheck className="h-5 w-5" /> Acesso
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut} disabled={signingOut}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12">
        {profile.isLoading ? (
          <Skeleton className="h-10 w-64" />
        ) : (
          <h1 className="font-display text-4xl tracking-tight">
            Olá{firstName ? `, ${firstName}` : ""}!
          </h1>
        )}
        <p className="mt-2 text-muted-foreground">Esta é a sua área privada. Só você tem acesso a ela.</p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <section className="rounded-xl border bg-card p-6 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Seus dados</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Nome</dt>
                <dd className="font-medium">{name || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">E-mail</dt>
                <dd className="font-medium break-all">{user.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Conta criada em</dt>
                <dd className="font-medium">
                  {new Date(user.created_at).toLocaleDateString("pt-BR", { dateStyle: "long" })}
                </dd>
              </div>
            </dl>
          </section>
          <section className="rounded-xl border bg-card p-6 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Segurança</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                user.email_confirmed_at ? "E-mail confirmado" : "E-mail aguardando confirmação",
                "Sessão protegida e renovada automaticamente",
                "Senha armazenada com criptografia",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

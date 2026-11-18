import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-brand-panel p-12 text-brand-panel-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-primary/40 blur-3xl"
        />
        <Link to="/" className="relative flex items-center gap-2 font-display text-2xl">
          <ShieldCheck className="h-6 w-6 text-accent" />
          Acesso
        </Link>
        <div className="relative max-w-md">
          <p className="font-display text-4xl leading-tight">
            Sua conta, protegida do começo ao fim.
          </p>
          <p className="mt-4 text-brand-panel-foreground/75">
            Senhas criptografadas, sessão segura e verificação por e-mail. Você entra,
            a gente cuida do resto.
          </p>
        </div>
        <p className="relative text-sm text-brand-panel-foreground/60">
          © {new Date().getFullYear()} Acesso
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="mb-10 flex items-center gap-2 font-display text-xl text-primary lg:hidden"
          >
            <ShieldCheck className="h-5 w-5" />
            Acesso
          </Link>
          <h1 className="font-display text-3xl tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-destructive">
      {message}
    </p>
  );
}

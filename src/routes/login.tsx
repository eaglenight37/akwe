import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CowrieMark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center">
            <span className="grid size-12 place-items-center rounded-xl bg-cover text-cover-fg">
              <CowrieMark className="size-6" />
            </span>
            <div className="mt-4 h-8 w-24 animate-pulse rounded-md bg-surface-2" />
          </div>
          <div className="h-80 animate-pulse rounded-2xl border border-line bg-surface" />
        </div>
      </main>
    );
  }

  if (user) return <Navigate to="/" />;

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim(),
          callbackURL: "/",
        });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: "/",
        });
        if (err) throw new Error(err.message);
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-cover text-cover-fg">
            <CowrieMark className="size-6" />
          </span>
          <h1 className="font-display mt-4 text-3xl">Akwɛ</h1>
          <p className="mt-1 text-sm text-muted">
            Azaka Group — tes écritures te suivent, sur PC comme sur téléphone.
          </p>
        </div>

        {!authEnabled ? (
          <p className="text-center text-sm text-muted">Connexion désactivée.</p>
        ) : (
          <div className="space-y-3 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_0_rgba(28,25,21,0.04)]">
            <div className="grid grid-cols-2 rounded-lg bg-surface-2 p-1 text-sm">
              <button
                type="button"
                className={`min-h-10 rounded-md ${mode === "in" ? "bg-surface font-medium shadow-sm" : "text-muted"}`}
                onClick={() => setMode("in")}
              >
                Connexion
              </button>
              <button
                type="button"
                className={`min-h-10 rounded-md ${mode === "up" ? "bg-surface font-medium shadow-sm" : "text-muted"}`}
                onClick={() => setMode("up")}
              >
                Créer un compte
              </button>
            </div>

            <form className="space-y-3" onSubmit={onEmail}>
              {mode === "up" ? (
                <div>
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Azaka Group"
                  />
                </div>
              ) : null}
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="toi@azakagroup.bj"
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? "Un instant…"
                  : mode === "up"
                    ? "Créer le compte"
                    : "Entrer dans Akwɛ"}
              </Button>
            </form>

            <div className="flex items-center gap-3 py-1 text-xs text-subtle">
              <span className="h-px flex-1 bg-line" />
              ou
              <span className="h-px flex-1 bg-line" />
            </div>

            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                Continuer avec {p.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

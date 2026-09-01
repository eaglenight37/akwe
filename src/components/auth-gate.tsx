import type { ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <ShellSkeleton />;
  if (!user) return <RedirectToSignIn />;
  return <>{children}</>;
}

function ShellSkeleton() {
  return (
    <div className="min-h-dvh bg-bg">
      <div className="hidden lg:block">
        <div className="fixed inset-y-0 left-0 w-60 bg-cover" />
      </div>
      <div className="lg:pl-60">
        <div className="h-14 border-b border-line" />
        <div className="mx-auto max-w-6xl space-y-4 px-6 py-8">
          <p className="text-sm text-muted">Chargement des livres…</p>
          <div className="h-8 w-48 animate-pulse rounded-md bg-surface-2" />
          <div className="grid gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

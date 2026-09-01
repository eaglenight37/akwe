import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { loadFinance, saveFinance } from "@/lib/finance-server";
import { isHydrating, snapshotFinance, useFinance } from "@/lib/store";
import type { AppState } from "@/lib/types";

function readLegacyLocal(): AppState | null {
  try {
    const raw = localStorage.getItem("akwe-azaka-v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: AppState } & Partial<AppState>;
    const state = parsed.state ?? parsed;
    if (!state.company?.name) return null;
    return state as AppState;
  } catch {
    return null;
  }
}

export function FinanceSync({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const legacy = readLegacyLocal();
    loadFinance({ data: legacy })
      .then((state) => {
        if (cancelled) return;
        useFinance.getState().hydrate(state);
        setReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        toast.error("Impossible de charger tes écritures.");
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useFinance.subscribe(() => {
      if (isHydrating()) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const snap = snapshotFinance(useFinance.getState());
        saveFinance({ data: snap }).catch(() => {
          toast.error("Sauvegarde interrompue — réessaie dans un instant.");
        });
      }, 450);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, [ready]);

  if (!ready) {
    return (
      <div className="min-h-dvh bg-bg">
        <div className="hidden lg:block">
          <div className="fixed inset-y-0 left-0 w-60 bg-cover" />
        </div>
        <div className="lg:pl-60">
          <div className="h-14 border-b border-line" />
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="h-8 w-56 animate-pulse rounded-md bg-surface-2" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

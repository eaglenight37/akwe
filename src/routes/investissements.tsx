import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, PeriodSelect } from "@/components/app-shell";
import { InvestmentDialog } from "@/components/investment-dialog";
import { Money } from "@/components/money-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { catName, INVEST_CATS, INVEST_TYPE_LABELS, entityName } from "@/lib/categories";
import { amortissementUntil, forEntity, periodBounds, summarize } from "@/lib/fiscal";
import { useFinance } from "@/lib/store";
import type { Investment } from "@/lib/types";

export const Route = createFileRoute("/investissements")({
  component: InvestPage,
});

function InvestPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const investments = useFinance((s) => s.investments);
  const entities = useFinance((s) => s.entities);
  const activeEntityId = useFinance((s) => s.activeEntityId);
  const removeInv = useFinance((s) => s.removeInv);
  const state = useFinance();
  const s = useMemo(() => summarize(state), [state]);
  const { to } = periodBounds(state.period);
  const display = state.display;
  const rate = state.company.tauxChange;
  const showEntity = activeEntityId === "all";

  const sorted = [...forEntity(investments, activeEntityId)].sort((a, b) =>
    b.dateAcquisition.localeCompare(a.dateAcquisition),
  );

  return (
    <>
      <PageHeader
        kicker="Classe 2 · Immobilisations"
        title="Investissements"
        description="Biens durables, logiciels et titres. Amortissement linéaire SYSCOHADA, hors financiers."
        action={
          <>
            <PeriodSelect />
            <Button onClick={() => setOpen(true)}>
              <Plus /> Nouvel investissement
            </Button>
          </>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted">Valeur brute</p>
          <Money xof={s.valeurBruteImmo} rate={rate} display={display} size="md" className="mt-1" />
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">Valeur nette comptable</p>
          <Money xof={s.valeurNetteImmo} rate={rate} display={display} size="md" className="mt-1" />
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">Dotation de la période</p>
          <Money xof={s.amort} rate={rate} display={display} size="md" className="mt-1" />
        </Card>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <p className="font-display text-xl">Aucun investissement</p>
          <p className="mt-2 text-sm text-muted">
            Enregistrez un premier bien durable pour cette activité.
          </p>
        </div>
      ) : (
      <div className="grid gap-3">
        {sorted.map((inv) => {
          const a = amortissementUntil(inv, to);
          const pct =
            inv.costXof > 0 ? Math.min(100, (a.cumule / inv.costXof) * 100) : 0;
          return (
            <article
              key={inv.id}
              className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(28,25,21,0.06)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-medium">{inv.name}</h3>
                    <Badge tone={inv.type === "financier" ? "cover" : "neutral"}>
                      {INVEST_TYPE_LABELS[inv.type]}
                    </Badge>
                    {showEntity ? (
                      <Badge tone="neutral">{entityName(entities, inv.entityId)}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {catName(inv.category, INVEST_CATS)} · acquis le{" "}
                    {format(new Date(`${inv.dateAcquisition}T00:00:00`), "d MMMM yyyy", {
                      locale: fr,
                    })}
                    {inv.durationYears > 0 ? ` · ${inv.durationYears} ans` : ""}
                  </p>
                  {inv.notes ? (
                    <p className="mt-2 text-sm text-subtle">{inv.notes}</p>
                  ) : null}
                </div>
                <div className="sm:text-right">
                  <p className="text-xs text-muted">Coût d'acquisition</p>
                  <Money xof={inv.costXof} rate={rate} display={display} size="md" />
                </div>
              </div>
              {inv.type !== "financier" && inv.durationYears > 0 ? (
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs text-muted">
                    <span>Amorti {Math.round(pct)} %</span>
                    <span>
                      VNC{" "}
                      <span className="tabular-nums text-ink">
                        {Math.round(a.valeurNette).toLocaleString("fr-FR")} F CFA
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-cover"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-subtle">
                    Dotation annuelle {Math.round(a.annuel).toLocaleString("fr-FR")} F CFA
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-xs text-subtle">Non amortissable</p>
              )}
              <div className="mt-3 flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="iconSm"
                  aria-label="Modifier"
                  onClick={() => setEditing(inv)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="iconSm"
                  aria-label="Supprimer"
                  onClick={() => {
                    removeInv(inv.id);
                    toast.success("Investissement retiré.");
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      )}

      <InvestmentDialog open={open} onOpenChange={setOpen} />
      <InvestmentDialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        initial={editing}
      />
    </>
  );
}

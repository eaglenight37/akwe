import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { useMemo } from "react";
import { PageHeader, PeriodSelect } from "@/components/app-shell";
import { Money } from "@/components/money-display";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { catName, DEPENSE_CATS, RECETTE_CATS } from "@/lib/categories";
import { downloadCsv, transactionsToCsv } from "@/lib/export";
import { periodLabel, summarize, activeRegime } from "@/lib/fiscal";
import { useFinance } from "@/lib/store";

export const Route = createFileRoute("/rapports")({ component: ReportsPage });

function ReportsPage() {
  const state = useFinance();
  const s = useMemo(() => summarize(state), [state]);
  const display = state.display;
  const rate = state.company.tauxChange;
  const regime = activeRegime(state);

  const recRows = Object.entries(s.recByCat).sort((a, b) => b[1] - a[1]);
  const depRows = Object.entries(s.depByCat).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader
        kicker="SYSCOHADA · Compte de résultat"
        title="Rapports"
        description={`${state.company.name} · ${periodLabel(state.period)}${
          state.activeEntityId !== "all"
            ? ` · ${state.entities.find((e) => e.id === state.activeEntityId)?.name ?? ""}`
            : " · groupe consolidé"
        }`}
        action={
          <>
            <PeriodSelect />
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  `akwe-${state.company.exercice}.csv`,
                  transactionsToCsv(state),
                )
              }
            >
              <Download /> Export CSV
            </Button>
            <Button variant="outline" className="no-print" onClick={() => window.print()}>
              <Printer /> Imprimer
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <p className="text-xs tracking-wide text-muted uppercase">En-tête</p>
        <h2 className="mt-1 font-display text-2xl">{state.company.name}</h2>
        <p className="text-sm text-muted">
          {state.company.forme} · IFU {state.company.ifu} · RCCM {state.company.rccm}
        </p>
        <p className="text-sm text-muted">
          {state.company.adresse}, {state.company.ville}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-lg">Produits d'exploitation</h3>
          <ul className="mt-3 space-y-2">
            {recRows.map(([code, amt]) => (
              <Li key={code} label={catName(code, RECETTE_CATS)} xof={amt} />
            ))}
            <Li label="Total produits HT" xof={s.recHt} strong />
          </ul>
        </Card>
        <Card>
          <h3 className="font-display text-lg">Charges d'exploitation</h3>
          <ul className="mt-3 space-y-2">
            {depRows.map(([code, amt]) => (
              <Li key={code} label={catName(code, DEPENSE_CATS)} xof={amt} />
            ))}
            <Li label="Dotations aux amortissements" xof={s.amort} />
            <Li label="Total charges HT" xof={s.depHt + s.amort} strong />
          </ul>
        </Card>
      </div>

      <Card className="mt-4">
        <h3 className="font-display text-lg">Synthèse</h3>
        <ul className="mt-3 space-y-2">
          <Li label="Résultat d'exploitation" xof={s.resultat} />
          <Li label="TVA nette" xof={s.tvaNette} />
          <Li
            label={regime === "tps" ? "TPS estimée" : "IS / IMF estimé"}
            xof={regime === "tps" ? s.tpsEstime : s.impotSocietes}
          />
          <Li
            label="Résultat après impôt estimé"
            xof={
              s.resultat -
              (regime === "tps" ? s.tpsEstime : s.impotSocietes)
            }
            strong
          />
          <Li label="Trésorerie" xof={s.tresorerie} />
          <Li label="Immobilisations nettes" xof={s.valeurNetteImmo} />
        </ul>
      </Card>
    </>
  );

  function Li({
    label,
    xof,
    strong,
  }: {
    label: string;
    xof: number;
    strong?: boolean;
  }) {
    return (
      <li
        className={
          strong
            ? "mt-2 flex items-center justify-between border-t border-line pt-2 text-sm font-medium"
            : "flex items-center justify-between gap-3 text-sm"
        }
      >
        <span className={strong ? "" : "text-muted"}>{label}</span>
        <Money xof={xof} rate={rate} display={display} size="sm" className="text-right" />
      </li>
    );
  }
}

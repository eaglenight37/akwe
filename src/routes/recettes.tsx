import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader, PeriodSelect } from "@/components/app-shell";
import { Money } from "@/components/money-display";
import { TransactionDialog } from "@/components/transaction-dialog";
import { TransactionList } from "@/components/transaction-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { summarize } from "@/lib/fiscal";
import { useFinance } from "@/lib/store";

export const Route = createFileRoute("/recettes")({ component: RecettesPage });

function RecettesPage() {
  const [open, setOpen] = useState(false);
  const state = useFinance();
  const s = useMemo(() => summarize(state), [state]);

  return (
    <>
      <PageHeader
        kicker="Classe 7 · Produits"
        title="Recettes"
        description="Cotisations Azakaedu, prestations de développement, ventes. TVA collectée et AIB retenu par les clients."
        action={
          <>
            <PeriodSelect />
            <Button onClick={() => setOpen(true)}>
              <Plus /> Nouvelle recette
            </Button>
          </>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Mini label="Chiffre d'affaires HT" xof={s.recHt} />
        <Mini label="TVA collectée" xof={s.recTva} />
        <Mini label="AIB retenu par les clients" xof={s.recAib} />
      </div>
      <TransactionList type="recette" />
      <TransactionDialog open={open} onOpenChange={setOpen} type="recette" />
    </>
  );
}

function Mini({ label, xof }: { label: string; xof: number }) {
  const display = useFinance((s) => s.display);
  const rate = useFinance((s) => s.company.tauxChange);
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <Money xof={xof} rate={rate} display={display} size="md" className="mt-1" />
    </Card>
  );
}

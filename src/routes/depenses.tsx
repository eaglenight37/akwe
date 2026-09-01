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

export const Route = createFileRoute("/depenses")({ component: DepensesPage });

function DepensesPage() {
  const [open, setOpen] = useState(false);
  const state = useFinance();
  const s = useMemo(() => summarize(state), [state]);

  return (
    <>
      <PageHeader
        kicker="Classe 6 · Charges"
        title="Dépenses"
        description="Achats, loyers, salaires, CNSS, patente, carburant. TVA déductible et AIB à reverser."
        action={
          <>
            <PeriodSelect />
            <Button onClick={() => setOpen(true)}>
              <Plus /> Nouvelle dépense
            </Button>
          </>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Mini label="Charges HT" xof={s.depHt} />
        <Mini label="TVA déductible" xof={s.depTva} />
        <Mini label="AIB à reverser" xof={s.depAib} />
      </div>
      <TransactionList type="depense" />
      <TransactionDialog open={open} onOpenChange={setOpen} type="depense" />
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

import { createFileRoute } from "@tanstack/react-router";
import { Landmark, Plus, Smartphone, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Money } from "@/components/money-display";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { ACCOUNT_TYPE_LABELS, EID, entityName } from "@/lib/categories";
import { accountBalance, forEntity, totalTreasury } from "@/lib/fiscal";
import { parseAmount, toXof } from "@/lib/money";
import { useFinance } from "@/lib/store";
import type { Account, AccountType, Currency } from "@/lib/types";

export const Route = createFileRoute("/tresorerie")({ component: TreasuryPage });

function TreasuryPage() {
  const accounts = useFinance((s) => s.accounts);
  const entities = useFinance((s) => s.entities);
  const activeEntityId = useFinance((s) => s.activeEntityId);
  const txs = useFinance((s) => s.transactions);
  const inv = useFinance((s) => s.investments);
  const display = useFinance((s) => s.display);
  const rate = useFinance((s) => s.company.tauxChange);
  const year = useFinance((s) => s.company.exercice);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const opening = `${year}-01-01`;
  const scoped = useMemo(
    () => forEntity(accounts, activeEntityId),
    [accounts, activeEntityId],
  );
  const total = useMemo(
    () => totalTreasury(scoped, txs, inv),
    [scoped, txs, inv],
  );
  const showEntity = activeEntityId === "all";

  return (
    <>
      <PageHeader
        kicker="Classe 5"
        title="Trésorerie"
        description="Caisse, banques et mobile money par activité. Soldes après écritures et investissements de l'exercice."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Nouveau compte
          </Button>
        }
      />
      <Card className="mb-5 p-5">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          Position nette
        </p>
        <Money xof={total} rate={rate} display={display} size="xl" className="mt-2" />
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {scoped.map((a) => {
          const bal = accountBalance(a, txs, inv, opening);
          const Icon =
            a.type === "banque" ? Landmark : a.type === "mobile_money" ? Smartphone : Wallet;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setEditing(a)}
              className="rounded-2xl bg-surface p-5 text-left shadow-[0_0_0_1px_rgba(28,25,21,0.06)] transition-shadow duration-150 hover:shadow-[0_0_0_1px_rgba(28,25,21,0.12)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-surface-2 text-cover">
                  <Icon className="size-4" />
                </span>
                <span className="text-xs text-muted">{ACCOUNT_TYPE_LABELS[a.type]}</span>
              </div>
              <h3 className="mt-4 font-display text-lg">{a.name}</h3>
              <p className="text-xs text-subtle">
                {a.provider}
                {showEntity ? ` · ${entityName(entities, a.entityId)}` : ""}
              </p>
              <div className="mt-4">
                <Money xof={bal} rate={rate} display={display} size="lg" />
              </div>
              <p className="mt-2 text-xs text-subtle">
                Ouverture {year} :{" "}
                {a.currency === "EUR"
                  ? `${(a.openingXof / rate).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`
                  : `${Math.round(a.openingXof).toLocaleString("fr-FR")} F CFA`}
              </p>
            </button>
          );
        })}
      </div>
      <AccountDialog open={open} onOpenChange={setOpen} />
      <AccountDialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        initial={editing}
      />
    </>
  );
}

function AccountDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Account | null;
}) {
  const upsertAccount = useFinance((s) => s.upsertAccount);
  const entities = useFinance((s) => s.entities);
  const activeEntityId = useFinance((s) => s.activeEntityId);
  const rate = useFinance((s) => s.company.tauxChange);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("banque");
  const [provider, setProvider] = useState("");
  const [currency, setCurrency] = useState<Currency>("XOF");
  const [opening, setOpening] = useState("");
  const [entityId, setEntityId] = useState<string>(EID.edu);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setType(initial?.type ?? "banque");
    setProvider(initial?.provider ?? "");
    setCurrency(initial?.currency ?? "XOF");
    setEntityId(
      initial?.entityId ?? (activeEntityId === "all" ? EID.edu : activeEntityId),
    );
    setOpening(
      initial
        ? String(
            initial.currency === "EUR"
              ? Math.round((initial.openingXof / rate) * 100) / 100
              : Math.round(initial.openingXof),
          )
        : "",
    );
  }, [open, initial, rate, activeEntityId]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseAmount(opening) || 0;
    upsertAccount({
      id: initial?.id,
      entityId,
      name: name.trim() || "Compte",
      type,
      provider: provider.trim() || (type === "banque" ? "Banque" : type === "mobile_money" ? "Mobile money" : "Caisse"),
      currency,
      openingXof: currency === "EUR" ? toXof(amt, "EUR") : amt,
    });
    toast.success("Compte enregistré.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={initial ? "Modifier le compte" : "Nouveau compte"}>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Intitulé" htmlFor="acc-name">
            <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Activité" htmlFor="acc-ent">
            <NativeSelect
              id="acc-ent"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
            >
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Type" htmlFor="acc-type">
            <NativeSelect
              id="acc-type"
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
            >
              <option value="caisse">Caisse</option>
              <option value="banque">Banque</option>
              <option value="mobile_money">Mobile money</option>
            </NativeSelect>
          </Field>
          <Field label="Établissement" htmlFor="acc-prov">
            <Input
              id="acc-prov"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Ecobank, BOA, MTN, Moov…"
            />
          </Field>
          <Field label="Devise du compte" htmlFor="acc-cur">
            <NativeSelect
              id="acc-cur"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              <option value="XOF">F CFA</option>
              <option value="EUR">Euro</option>
            </NativeSelect>
          </Field>
          <Field
            label={currency === "EUR" ? "Solde d'ouverture (€)" : "Solde d'ouverture (F CFA)"}
            htmlFor="acc-open"
          >
            <Input
              id="acc-open"
              inputMode="decimal"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

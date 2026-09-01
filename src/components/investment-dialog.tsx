import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EID, INVEST_CATS, INVEST_TYPE_LABELS } from "@/lib/categories";
import { formatEur, formatXof, parseAmount, toXof } from "@/lib/money";
import { useFinance } from "@/lib/store";
import type { Currency, Investment, InvestType } from "@/lib/types";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { Field, Input, NativeSelect, Textarea } from "./ui/input";

const empty = (): Omit<Investment, "id" | "costXof"> => ({
  name: "",
  entityId: EID.edu,
  type: "corporel",
  category: "24",
  dateAcquisition: new Date().toISOString().slice(0, 10),
  enteredAmount: 0,
  enteredCurrency: "XOF",
  durationYears: 5,
  residualXof: 0,
  accountId: "acc-edu-eco",
  notes: "",
  status: "actif",
});

export function InvestmentDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Investment | null;
}) {
  const accounts = useFinance((s) => s.accounts);
  const entities = useFinance((s) => s.entities);
  const activeEntityId = useFinance((s) => s.activeEntityId);
  const upsertInv = useFinance((s) => s.upsertInv);
  const taux = useFinance((s) => s.company.tauxChange);
  const [form, setForm] = useState(empty());
  const [amountStr, setAmountStr] = useState("");
  const [residStr, setResidStr] = useState("0");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({ ...initial });
      setAmountStr(String(initial.enteredAmount).replace(".", ","));
      setResidStr(String(initial.residualXof));
    } else {
      const eid = activeEntityId === "all" ? EID.edu : activeEntityId;
      const base = empty();
      base.entityId = eid;
      base.accountId =
        accounts.find((a) => a.entityId === eid)?.id ?? accounts[0]?.id ?? "acc-edu-eco";
      setForm(base);
      setAmountStr("");
      setResidStr("0");
    }
  }, [open, initial, accounts, activeEntityId]);

  const preview = useMemo(() => {
    const amount = parseAmount(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const cost = toXof(amount, form.enteredCurrency, taux);
    const residual = parseAmount(residStr) || 0;
    const years = Number(form.durationYears) || 0;
    const annuel =
      form.type === "financier" || years <= 0 ? 0 : (cost - residual) / years;
    return { cost, annuel };
  }, [amountStr, residStr, form.enteredCurrency, form.durationYears, form.type, taux]);

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseAmount(amountStr);
    if (!form.name.trim()) {
      toast.error("Nom de l'immobilisation requis.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Montant invalide.");
      return;
    }
    upsertInv({
      ...form,
      id: initial?.id,
      enteredAmount: amount,
      residualXof: parseAmount(residStr) || 0,
      durationYears: Number(form.durationYears) || 0,
    });
    toast.success(initial ? "Investissement mis à jour." : "Investissement ajouté.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        wide
        title={initial ? "Modifier l'investissement" : "Nouvel investissement"}
        description="Immobilisations SYSCOHADA — amortissement linéaire, hors titres."
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Désignation" htmlFor="inv-name">
              <Input
                id="inv-name"
                value={form.name}
                onChange={(e) => patch("name", e.target.value)}
                placeholder="Ex. Postes de formation, rayonnages"
                required
              />
            </Field>
          </div>
          <Field label="Activité" htmlFor="inv-ent">
            <NativeSelect
              id="inv-ent"
              value={form.entityId}
              onChange={(e) => {
                const eid = e.target.value;
                setForm((f) => ({
                  ...f,
                  entityId: eid,
                  accountId:
                    accounts.find((a) => a.entityId === eid)?.id ?? f.accountId,
                }));
              }}
            >
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Nature" htmlFor="inv-type">
            <NativeSelect
              id="inv-type"
              value={form.type}
              onChange={(e) => patch("type", e.target.value as InvestType)}
            >
              {Object.entries(INVEST_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Poste" htmlFor="inv-cat">
            <NativeSelect
              id="inv-cat"
              value={form.category}
              onChange={(e) => patch("category", e.target.value)}
            >
              {INVEST_CATS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Date d'acquisition" htmlFor="inv-date">
            <Input
              id="inv-date"
              type="date"
              value={form.dateAcquisition}
              onChange={(e) => patch("dateAcquisition", e.target.value)}
              required
            />
          </Field>
          <Field label="Compte débité" htmlFor="inv-acc">
            <NativeSelect
              id="inv-acc"
              value={form.accountId}
              onChange={(e) => patch("accountId", e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Coût d'acquisition" htmlFor="inv-amt">
            <Input
              id="inv-amt"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              required
            />
          </Field>
          <Field label="Devise" htmlFor="inv-cur">
            <NativeSelect
              id="inv-cur"
              value={form.enteredCurrency}
              onChange={(e) =>
                patch("enteredCurrency", e.target.value as Currency)
              }
            >
              <option value="XOF">F CFA</option>
              <option value="EUR">Euro</option>
            </NativeSelect>
          </Field>
          <Field
            label="Durée d'amortissement (années)"
            htmlFor="inv-dur"
            hint="0 pour les titres et dépôts (non amortissables)"
          >
            <Input
              id="inv-dur"
              type="number"
              min={0}
              max={50}
              value={form.durationYears}
              onChange={(e) => patch("durationYears", Number(e.target.value))}
            />
          </Field>
          <Field label="Valeur résiduelle (F CFA)" htmlFor="inv-res">
            <Input
              id="inv-res"
              inputMode="decimal"
              value={residStr}
              onChange={(e) => setResidStr(e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes" htmlFor="inv-notes">
              <Textarea
                id="inv-notes"
                value={form.notes}
                onChange={(e) => patch("notes", e.target.value)}
              />
            </Field>
          </div>
          {preview ? (
            <div className="sm:col-span-2 rounded-xl bg-surface-2 p-4 text-sm">
              <p className="text-muted">
                Coût : {formatXof(preview.cost)} · {formatEur(preview.cost / taux)}
              </p>
              {preview.annuel > 0 ? (
                <p className="mt-1 text-muted">
                  Dotation annuelle : {formatXof(preview.annuel)}
                </p>
              ) : (
                <p className="mt-1 text-muted">Non amortissable</p>
              )}
            </div>
          ) : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{initial ? "Enregistrer" : "Ajouter"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

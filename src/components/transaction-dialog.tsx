import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EID, defaultRecetteCat, DEPENSE_CATS, PAYMENT_LABELS, RECETTE_CATS } from "@/lib/categories";
import {
  formatEur,
  formatXof,
  parseAmount,
  splitTax,
  toXof,
} from "@/lib/money";
import { useFinance } from "@/lib/store";
import type { Currency, Saisie, Transaction, TxType } from "@/lib/types";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { Field, Input, NativeSelect, Textarea } from "./ui/input";

const empty = (type: TxType, entityId: string): Omit<Transaction, "id" | "htXof" | "tvaXof" | "ttcXof" | "aibXof"> => ({
  type,
  entityId,
  date: new Date().toISOString().slice(0, 10),
  libelle: "",
  category: type === "recette" ? "706F" : "601",
  enteredAmount: 0,
  enteredCurrency: "XOF",
  saisie: "ht",
  tvaRate: type === "recette" ? 0 : 18,
  aibRate: 0,
  payment: "virement",
  accountId: "acc-edu-eco",
  counterparty: "",
  reference: "",
  notes: "",
  status: "valide",
});

export function TransactionDialog({
  open,
  onOpenChange,
  type,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: TxType;
  initial?: Transaction | null;
}) {
  const accounts = useFinance((s) => s.accounts);
  const entities = useFinance((s) => s.entities);
  const activeEntityId = useFinance((s) => s.activeEntityId);
  const upsertTx = useFinance((s) => s.upsertTx);
  const taux = useFinance((s) => s.company.tauxChange);
  const cats = type === "recette" ? RECETTE_CATS : DEPENSE_CATS;
  const [form, setForm] = useState(empty(type, EID.edu));
  const [amountStr, setAmountStr] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({ ...initial });
      setAmountStr(String(initial.enteredAmount).replace(".", ","));
    } else {
      const eid = activeEntityId === "all" ? EID.edu : activeEntityId;
      const kind = entities.find((e) => e.id === eid)?.kind ?? "formation";
      const base = empty(type, eid);
      base.accountId =
        accounts.find((a) => a.entityId === eid)?.id ?? accounts[0]?.id ?? "acc-edu-eco";
      if (type === "recette") {
        base.category = defaultRecetteCat(kind);
        base.tvaRate = kind === "formation" || kind === "holding" ? 0 : 18;
      }
      setForm(base);
      setAmountStr("");
    }
  }, [open, initial, type, accounts, activeEntityId, entities]);

  const preview = useMemo(() => {
    const amount = parseAmount(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const xof = toXof(amount, form.enteredCurrency, taux);
    const { ht, tva, ttc } = splitTax(xof, form.tvaRate, form.saisie);
    const aib = ht * ((form.aibRate || 0) / 100);
    return { ht, tva, ttc, aib, xof };
  }, [amountStr, form.enteredCurrency, form.saisie, form.tvaRate, form.aibRate, taux]);

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseAmount(amountStr);
    if (!form.libelle.trim()) {
      toast.error("Indiquez un libellé.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Montant invalide.");
      return;
    }
    upsertTx({
      ...form,
      id: initial?.id,
      enteredAmount: amount,
    });
    toast.success(initial ? "Écriture mise à jour." : "Écriture enregistrée.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        wide
        title={
          initial
            ? `Modifier ${type === "recette" ? "la recette" : "la dépense"}`
            : type === "recette"
              ? "Nouvelle recette"
              : "Nouvelle dépense"
        }
        description="Saisie en F CFA ou en euros — conversion à la parité BCEAO."
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Activité" htmlFor="tx-ent">
            <NativeSelect
              id="tx-ent"
              value={form.entityId}
              onChange={(e) => {
                const eid = e.target.value;
                const kind = entities.find((x) => x.id === eid)?.kind ?? "formation";
                setForm((f) => ({
                  ...f,
                  entityId: eid,
                  category:
                    type === "recette" ? defaultRecetteCat(kind) : f.category,
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
          <Field label="Date" htmlFor="tx-date">
            <Input
              id="tx-date"
              type="date"
              value={form.date}
              onChange={(e) => patch("date", e.target.value)}
              required
            />
          </Field>
          <Field label="Catégorie SYSCOHADA" htmlFor="tx-cat">
            <NativeSelect
              id="tx-cat"
              value={form.category}
              onChange={(e) => patch("category", e.target.value)}
            >
              {cats.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Libellé" htmlFor="tx-lib">
              <Input
                id="tx-lib"
                value={form.libelle}
                onChange={(e) => patch("libelle", e.target.value)}
                placeholder="Ex. Cotisation mars — Kossi Agbo"
                required
              />
            </Field>
          </div>
          <Field label="Tiers" htmlFor="tx-tiers">
            <Input
              id="tx-tiers"
              value={form.counterparty}
              onChange={(e) => patch("counterparty", e.target.value)}
              placeholder="Client ou fournisseur"
            />
          </Field>
          <Field label="Référence" htmlFor="tx-ref">
            <Input
              id="tx-ref"
              value={form.reference}
              onChange={(e) => patch("reference", e.target.value)}
              placeholder="FA-2026-081"
            />
          </Field>
          <Field label="Montant" htmlFor="tx-amt">
            <Input
              id="tx-amt"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Devise" htmlFor="tx-cur">
              <NativeSelect
                id="tx-cur"
                value={form.enteredCurrency}
                onChange={(e) =>
                  patch("enteredCurrency", e.target.value as Currency)
                }
              >
                <option value="XOF">F CFA</option>
                <option value="EUR">Euro</option>
              </NativeSelect>
            </Field>
            <Field label="Saisie" htmlFor="tx-saisie">
              <NativeSelect
                id="tx-saisie"
                value={form.saisie}
                onChange={(e) => patch("saisie", e.target.value as Saisie)}
              >
                <option value="ht">Hors taxe</option>
                <option value="ttc">TTC</option>
              </NativeSelect>
            </Field>
          </div>
          <Field label="TVA" htmlFor="tx-tva">
            <NativeSelect
              id="tx-tva"
              value={form.tvaRate}
              onChange={(e) => patch("tvaRate", Number(e.target.value))}
            >
              <option value={18}>18 % — taux normal Bénin</option>
              <option value={0}>0 % — exonéré</option>
            </NativeSelect>
          </Field>
          <Field
            label="AIB"
            htmlFor="tx-aib"
            hint={
              type === "depense"
                ? "Retenu au fournisseur, à reverser à la DGI"
                : "Retenu par le client, crédit d'impôt"
            }
          >
            <NativeSelect
              id="tx-aib"
              value={form.aibRate}
              onChange={(e) => patch("aibRate", Number(e.target.value))}
            >
              <option value={0}>Aucun</option>
              <option value={1}>1 % — assujetti IFU</option>
              <option value={5}>5 % — sans IFU</option>
            </NativeSelect>
          </Field>
          <Field label="Compte" htmlFor="tx-acc">
            <NativeSelect
              id="tx-acc"
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
          <Field label="Règlement" htmlFor="tx-pay">
            <NativeSelect
              id="tx-pay"
              value={form.payment}
              onChange={(e) =>
                patch("payment", e.target.value as typeof form.payment)
              }
            >
              {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes" htmlFor="tx-notes">
              <Textarea
                id="tx-notes"
                value={form.notes}
                onChange={(e) => patch("notes", e.target.value)}
              />
            </Field>
          </div>

          {preview ? (
            <div className="sm:col-span-2 rounded-xl bg-surface-2 p-4 text-sm">
              <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
                Aperçu en F CFA
              </p>
              <div className="grid grid-cols-2 gap-2 tabular-nums sm:grid-cols-4">
                <div>
                  <p className="text-xs text-subtle">HT</p>
                  <p className="font-medium">{formatXof(preview.ht)}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle">TVA</p>
                  <p className="font-medium">{formatXof(preview.tva)}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle">TTC</p>
                  <p className="font-medium">{formatXof(preview.ttc)}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle">AIB</p>
                  <p className="font-medium">{formatXof(preview.aib)}</p>
                </div>
              </div>
              {form.enteredCurrency === "EUR" ? (
                <p className="mt-2 text-xs text-muted">
                  Saisi : {formatEur(parseAmount(amountStr) || 0)} →{" "}
                  {formatXof(preview.xof)}
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted">
                  Équivalent : {formatEur(preview.xof / taux)}
                </p>
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

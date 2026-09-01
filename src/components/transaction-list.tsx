import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { catName, DEPENSE_CATS, PAYMENT_LABELS, RECETTE_CATS } from "@/lib/categories";
import { forEntity, inPeriod } from "@/lib/fiscal";
import { formatXof } from "@/lib/money";
import { useFinance } from "@/lib/store";
import type { Transaction, TxType } from "@/lib/types";
import { DualInline } from "./money-display";
import { TransactionDialog } from "./transaction-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input, NativeSelect } from "./ui/input";

export function TransactionList({ type }: { type: TxType }) {
  const all = useFinance((s) => s.transactions);
  const period = useFinance((s) => s.period);
  const rate = useFinance((s) => s.company.tauxChange);
  const removeTx = useFinance((s) => s.removeTx);
  const accounts = useFinance((s) => s.accounts);
  const entities = useFinance((s) => s.entities);
  const activeEntityId = useFinance((s) => s.activeEntityId);
  const cats = type === "recette" ? RECETTE_CATS : DEPENSE_CATS;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [creating, setCreating] = useState(false);
  const showEntity = activeEntityId === "all";

  const rows = useMemo(() => {
    return forEntity(all, activeEntityId)
      .filter((t) => t.type === type && inPeriod(t.date, period))
      .filter((t) => (cat === "all" ? true : t.category === cat))
      .filter((t) => {
        if (!q.trim()) return true;
        const hay = `${t.libelle} ${t.counterparty} ${t.reference}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [all, type, period, cat, q, activeEntityId]);

  function entityLabel(id: string) {
    return entities.find((e) => e.id === id)?.name ?? "";
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input
            className="pl-9"
            placeholder="Rechercher un libellé, un tiers…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <NativeSelect
          className="sm:w-64"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label="Filtrer par catégorie"
        >
          <option value="all">Toutes les catégories</option>
          {cats.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} · {c.label}
            </option>
          ))}
        </NativeSelect>
        <Button className="sm:hidden" onClick={() => setCreating(true)}>
          Ajouter
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <p className="font-display text-xl">Aucune écriture</p>
          <p className="mt-2 text-sm text-muted">
            {q || cat !== "all"
              ? "Aucun résultat pour ces filtres."
              : "Ajoutez une première pièce pour cette période."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(28,25,21,0.06)] md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Libellé</th>
                  <th className="px-4 py-3 font-medium">Catégorie</th>
                  <th className="px-4 py-3 text-right font-medium">HT</th>
                  <th className="px-4 py-3 text-right font-medium">TVA</th>
                  <th className="px-4 py-3 text-right font-medium">TTC</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {format(new Date(`${t.date}T00:00:00`), "d MMM", { locale: fr })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.libelle}</p>
                      <p className="text-xs text-subtle">
                        {showEntity ? `${entityLabel(t.entityId)} · ` : ""}
                        {t.counterparty}
                        {t.aibRate ? ` · AIB ${t.aibRate} %` : ""}
                        {t.enteredCurrency === "EUR" ? " · saisi en €" : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted">{catName(t.category, cats)}</td>
                    <td className="px-4 py-3 text-right">
                      <DualInline xof={t.htXof} rate={rate} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {formatXof(t.tvaXof)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatXof(t.ttcXof)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RowActions
                        onEdit={() => setEditing(t)}
                        onDelete={() => {
                          removeTx(t.id);
                          toast.success("Écriture supprimée.");
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {rows.map((t) => (
              <article
                key={t.id}
                className="rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(28,25,21,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted">
                      {format(new Date(`${t.date}T00:00:00`), "d MMMM yyyy", {
                        locale: fr,
                      })}
                      {showEntity ? ` · ${entityLabel(t.entityId)}` : ""}
                    </p>
                    <h3 className="mt-0.5 font-medium">{t.libelle}</h3>
                    <p className="text-xs text-subtle">
                      {catName(t.category, cats)}
                      {t.counterparty ? ` · ${t.counterparty}` : ""}
                    </p>
                  </div>
                  <Badge tone={type === "recette" ? "ok" : "danger"}>
                    {type === "recette" ? "Recette" : "Dépense"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-xs text-subtle">
                    {PAYMENT_LABELS[t.payment]} ·{" "}
                    {accounts.find((a) => a.id === t.accountId)?.name}
                  </p>
                  <DualInline xof={t.htXof} rate={rate} className="text-right text-sm font-medium" />
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <RowActions
                    onEdit={() => setEditing(t)}
                    onDelete={() => {
                      removeTx(t.id);
                      toast.success("Écriture supprimée.");
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <TransactionDialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        type={type}
        initial={editing}
      />
      <TransactionDialog
        open={creating}
        onOpenChange={setCreating}
        type={type}
      />
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="iconSm" onClick={onEdit} aria-label="Modifier">
        <Pencil />
      </Button>
      <Button variant="ghost" size="iconSm" onClick={onDelete} aria-label="Supprimer">
        <Trash2 />
      </Button>
    </div>
  );
}

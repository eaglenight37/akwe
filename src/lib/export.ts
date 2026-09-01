import { catName, DEPENSE_CATS, RECETTE_CATS } from "./categories";
import { forEntity } from "./fiscal";
import { formatEur, formatXof, toEur } from "./money";
import type { AppState, Transaction } from "./types";

function csvEscape(v: string | number): string {
  const s = String(v);
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function transactionsToCsv(state: AppState): string {
  const header = [
    "Date",
    "Activité",
    "Type",
    "Libellé",
    "Catégorie",
    "Tiers",
    "Référence",
    "Devise saisie",
    "Montant saisi",
    "HT F CFA",
    "TVA F CFA",
    "TTC F CFA",
    "AIB F CFA",
    "HT EUR",
    "Compte",
  ];
  const lines = [header.join(";")];
  const scoped = forEntity(state.transactions, state.activeEntityId);
  const sorted = [...scoped].sort((a, b) => a.date.localeCompare(b.date));
  for (const t of sorted) {
    const cats = t.type === "recette" ? RECETTE_CATS : DEPENSE_CATS;
    const acc = state.accounts.find((a) => a.id === t.accountId)?.name ?? "";
    const ent = state.entities.find((e) => e.id === t.entityId)?.name ?? "";
    lines.push(
      [
        t.date,
        ent,
        t.type,
        t.libelle,
        catName(t.category, cats),
        t.counterparty,
        t.reference,
        t.enteredCurrency,
        t.enteredAmount,
        Math.round(t.htXof),
        Math.round(t.tvaXof),
        Math.round(t.ttcXof),
        Math.round(t.aibXof),
        toEur(t.htXof, state.company.tauxChange).toFixed(2),
        acc,
      ]
        .map(csvEscape)
        .join(";"),
    );
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function txLine(t: Transaction, rate: number): string {
  return `${t.date} · ${formatXof(t.htXof)} · ${formatEur(toEur(t.htXof, rate))}`;
}

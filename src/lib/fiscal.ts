import { toEur } from "./money";
import type {
  Account,
  AppState,
  Investment,
  Period,
  RegimeFiscal,
  Transaction,
} from "./types";

export function forEntity<T extends { entityId: string }>(
  items: T[],
  entityId: string,
): T[] {
  if (!entityId || entityId === "all") return items;
  return items.filter((i) => i.entityId === entityId);
}

export function activeRegime(state: AppState): RegimeFiscal {
  if (!state.activeEntityId || state.activeEntityId === "all") {
    return state.company.regime;
  }
  return (
    state.entities.find((e) => e.id === state.activeEntityId)?.regime ??
    state.company.regime
  );
}

export const TVA_STANDARD = 18;
export const IS_TAUX = 0.3;
export const IMF_TAUX = 0.01;
export const TPS_TAUX = 0.05;
export const CNSS_PATRONAL = 0.164;
export const AIB_STANDARD = 1;
export const AIB_SANS_IFU = 5;

export function inPeriod(date: string, period: Period): boolean {
  if (period.kind === "all") return true;
  const [y, m] = date.split("-").map(Number);
  if (!y || !m) return false;
  if (period.kind === "year") return y === period.year;
  if (period.kind === "month") return y === period.year && m === period.month;
  const q = Math.ceil(m / 3);
  return y === period.year && q === period.quarter;
}

export function periodLabel(period: Period): string {
  if (period.kind === "all") return "Tout";
  if (period.kind === "year") return `Exercice ${period.year}`;
  if (period.kind === "month") {
    const name = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(
      new Date(period.year, period.month - 1, 1),
    );
    return `${name} ${period.year}`;
  }
  return `T${period.quarter} ${period.year}`;
}

export function periodBounds(period: Period): { from: Date; to: Date } {
  const now = new Date();
  if (period.kind === "all") {
    return { from: new Date(now.getFullYear() - 5, 0, 1), to: now };
  }
  if (period.kind === "year") {
    return {
      from: new Date(period.year, 0, 1),
      to: new Date(period.year, 11, 31),
    };
  }
  if (period.kind === "month") {
    return {
      from: new Date(period.year, period.month - 1, 1),
      to: new Date(period.year, period.month, 0),
    };
  }
  const startMonth = (period.quarter - 1) * 3;
  return {
    from: new Date(period.year, startMonth, 1),
    to: new Date(period.year, startMonth + 3, 0),
  };
}

function monthsHeldInRange(
  acquisition: string,
  from: Date,
  to: Date,
): number {
  const acq = new Date(`${acquisition}T00:00:00`);
  const start = acq > from ? acq : from;
  if (start > to) return 0;
  const years = to.getFullYear() - start.getFullYear();
  const months = years * 12 + (to.getMonth() - start.getMonth()) + 1;
  return Math.max(0, months);
}

export function amortissementUntil(
  inv: Investment,
  asOf: Date,
): { cumule: number; annuel: number; valeurNette: number } {
  if (inv.type === "financier" || inv.durationYears <= 0) {
    return { cumule: 0, annuel: 0, valeurNette: inv.costXof };
  }
  const base = Math.max(0, inv.costXof - inv.residualXof);
  const annuel = base / inv.durationYears;
  const acq = new Date(`${inv.dateAcquisition}T00:00:00`);
  if (asOf < acq) {
    return { cumule: 0, annuel, valeurNette: inv.costXof };
  }
  const months = monthsHeldInRange(inv.dateAcquisition, acq, asOf);
  const cumule = Math.min(base, (annuel / 12) * months);
  return { cumule, annuel, valeurNette: inv.costXof - cumule };
}

export function amortissementForPeriod(
  investments: Investment[],
  period: Period,
): number {
  const { from, to } = periodBounds(period);
  let total = 0;
  for (const inv of investments) {
    if (inv.status === "cede" || inv.type === "financier" || inv.durationYears <= 0) {
      continue;
    }
    const atStart = amortissementUntil(
      inv,
      new Date(from.getTime() - 86400000),
    ).cumule;
    const atEnd = amortissementUntil(inv, to).cumule;
    total += Math.max(0, atEnd - atStart);
  }
  return total;
}

export interface Summary {
  recHt: number;
  recTtc: number;
  recTva: number;
  recAib: number;
  recCount: number;
  depHt: number;
  depTtc: number;
  depTva: number;
  depAib: number;
  depCount: number;
  amort: number;
  resultat: number;
  tvaNette: number;
  tresorerie: number;
  ca: number;
  isEstime: number;
  imf: number;
  impotSocietes: number;
  tpsEstime: number;
  cnssEstime: number;
  salaires: number;
  investissementsPeriode: number;
  valeurBruteImmo: number;
  valeurNetteImmo: number;
  recByCat: Record<string, number>;
  depByCat: Record<string, number>;
}

function sumByCat(txs: Transaction[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of txs) {
    out[t.category] = (out[t.category] ?? 0) + t.htXof;
  }
  return out;
}

export function accountBalance(
  account: Account,
  transactions: Transaction[],
  investments: Investment[],
  openingDate = "2026-01-01",
): number {
  let bal = account.openingXof;
  for (const t of transactions) {
    if (t.accountId !== account.id || t.status === "brouillon") continue;
    const cash =
      t.type === "recette" ? t.ttcXof - t.aibXof : -(t.ttcXof - t.aibXof);
    bal += cash;
  }
  for (const inv of investments) {
    if (inv.accountId !== account.id) continue;
    if (inv.dateAcquisition < openingDate) continue;
    bal -= inv.costXof;
  }
  return bal;
}

export function totalTreasury(
  accounts: Account[],
  transactions: Transaction[],
  investments: Investment[],
): number {
  return accounts.reduce(
    (s, a) => s + accountBalance(a, transactions, investments),
    0,
  );
}

export function summarize(state: AppState): Summary {
  const rec = forEntity(state.transactions, state.activeEntityId).filter(
    (t) =>
      t.type === "recette" &&
      t.status !== "brouillon" &&
      inPeriod(t.date, state.period),
  );
  const dep = forEntity(state.transactions, state.activeEntityId).filter(
    (t) =>
      t.type === "depense" &&
      t.status !== "brouillon" &&
      inPeriod(t.date, state.period),
  );
  const recHt = rec.reduce((s, t) => s + t.htXof, 0);
  const recTtc = rec.reduce((s, t) => s + t.ttcXof, 0);
  const recTva = rec.reduce((s, t) => s + t.tvaXof, 0);
  const recAib = rec.reduce((s, t) => s + t.aibXof, 0);
  const depHt = dep.reduce((s, t) => s + t.htXof, 0);
  const depTtc = dep.reduce((s, t) => s + t.ttcXof, 0);
  const depTva = dep.reduce((s, t) => s + t.tvaXof, 0);
  const depAib = dep.reduce((s, t) => s + t.aibXof, 0);
  const scopedInv = forEntity(state.investments, state.activeEntityId);
  const amort = amortissementForPeriod(scopedInv, state.period);
  const salaires = dep
    .filter((t) => t.category === "661")
    .reduce((s, t) => s + t.htXof, 0);
  const cnssBooked = dep
    .filter((t) => t.category === "664")
    .reduce((s, t) => s + t.htXof, 0);
  const cnssEstime = cnssBooked || salaires * CNSS_PATRONAL;
  const resultat = recHt - depHt - amort;
  const tvaNette = recTva - depTva;
  const ca = recHt;
  const regime = activeRegime(state);
  const isEstime = Math.max(0, resultat) * IS_TAUX;
  const imf = Math.max(0, ca) * IMF_TAUX;
  const impotSocietes =
    regime === "tps" ? 0 : Math.max(isEstime, ca > 0 ? imf : 0);
  const tpsEstime = regime === "tps" ? ca * TPS_TAUX : 0;
  const investissementsPeriode = scopedInv
    .filter((i) => inPeriod(i.dateAcquisition, state.period))
    .reduce((s, i) => s + i.costXof, 0);
  const { to } = periodBounds(state.period);
  let valeurBruteImmo = 0;
  let valeurNetteImmo = 0;
  for (const inv of scopedInv) {
    if (inv.status === "cede") continue;
    if (new Date(`${inv.dateAcquisition}T00:00:00`) > to) continue;
    valeurBruteImmo += inv.costXof;
    valeurNetteImmo += amortissementUntil(inv, to).valeurNette;
  }
  const scopedAcc = forEntity(state.accounts, state.activeEntityId);
  return {
    recHt,
    recTtc,
    recTva,
    recAib,
    recCount: rec.length,
    depHt,
    depTtc,
    depTva,
    depAib,
    depCount: dep.length,
    amort,
    resultat,
    tvaNette,
    tresorerie: totalTreasury(scopedAcc, state.transactions, state.investments),
    ca,
    isEstime,
    imf,
    impotSocietes,
    tpsEstime,
    cnssEstime,
    salaires,
    investissementsPeriode,
    valeurBruteImmo,
    valeurNetteImmo,
    recByCat: sumByCat(rec),
    depByCat: sumByCat(dep),
  };
}

export interface MonthPoint {
  key: string;
  label: string;
  rec: number;
  dep: number;
  recEur: number;
  depEur: number;
}

export function monthlySeries(
  transactions: Transaction[],
  year: number,
  rate: number,
  throughMonth = 12,
): MonthPoint[] {
  const points: MonthPoint[] = [];
  for (let m = 1; m <= throughMonth; m++) {
    const rec = transactions
      .filter(
        (t) =>
          t.type === "recette" &&
          t.status !== "brouillon" &&
          inPeriod(t.date, { kind: "month", year, month: m }),
      )
      .reduce((s, t) => s + t.htXof, 0);
    const dep = transactions
      .filter(
        (t) =>
          t.type === "depense" &&
          t.status !== "brouillon" &&
          inPeriod(t.date, { kind: "month", year, month: m }),
      )
      .reduce((s, t) => s + t.htXof, 0);
    const label = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(
      new Date(year, m - 1, 1),
    );
    points.push({
      key: `${year}-${m}`,
      label: label.replace(".", ""),
      rec,
      dep,
      recEur: toEur(rec, rate),
      depEur: toEur(dep, rate),
    });
  }
  return points;
}

export interface Deadline {
  id: string;
  date: string;
  title: string;
  detail: string;
  kind: "tva" | "is" | "cnss" | "dsf" | "patente";
}

export function upcomingDeadlines(year: number, now = new Date()): Deadline[] {
  const items: Deadline[] = [
    {
      id: "patente",
      date: `${year}-01-31`,
      title: "Patente / contribution des patentes",
      detail: "Paiement annuel auprès de la DGI",
      kind: "patente",
    },
    {
      id: "dsf",
      date: `${year}-04-30`,
      title: "DSF — liasse fiscale",
      detail: "Déclaration statistique et fiscale de l'exercice précédent",
      kind: "dsf",
    },
  ];
  for (let m = 1; m <= 12; m++) {
    const dueMonth = m === 12 ? 1 : m + 1;
    const dueYear = m === 12 ? year + 1 : year;
    const mm = String(dueMonth).padStart(2, "0");
    const prev = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(
      new Date(year, m - 1, 1),
    );
    items.push({
      id: `tva-${m}`,
      date: `${dueYear}-${mm}-10`,
      title: `TVA ${prev}`,
      detail: "Déclaration et paiement le 10 du mois suivant",
      kind: "tva",
    });
    items.push({
      id: `cnss-${m}`,
      date: `${dueYear}-${mm}-15`,
      title: `CNSS ${prev}`,
      detail: "Cotisations sociales — 15 du mois suivant",
      kind: "cnss",
    });
  }
  const acomptes: [string, string][] = [
    [`${year}-03-10`, "1er acompte IS"],
    [`${year}-06-10`, "2e acompte IS"],
    [`${year}-09-10`, "3e acompte IS"],
    [`${year}-12-10`, "4e acompte IS"],
  ];
  for (const [date, title] of acomptes) {
    items.push({
      id: date,
      date,
      title,
      detail: "Acompte d'impôt sur les sociétés",
      kind: "is",
    });
  }
  const today = now.toISOString().slice(0, 10);
  return items
    .filter((d) => d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);
}

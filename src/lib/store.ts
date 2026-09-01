import { create } from "zustand";
import { EID } from "./categories";
import { splitTax, toXof } from "./money";
import { createDemoState } from "./seed";
import type {
  Account,
  AppState,
  Company,
  Contribution,
  Currency,
  DisplayCurrency,
  Entity,
  Investment,
  PaymentMethod,
  Period,
  Student,
  Transaction,
} from "./types";
import { uid } from "./utils";

type DraftTx = Omit<Transaction, "id" | "htXof" | "tvaXof" | "ttcXof" | "aibXof"> & {
  id?: string;
};

type DraftInv = Omit<Investment, "id" | "costXof"> & { id?: string };

export type CollectFeeInput = {
  contributionId?: string;
  studentId: string;
  date: string;
  periodLabel: string;
  enteredAmount: number;
  enteredCurrency: Currency;
  payment: PaymentMethod;
  accountId: string;
  notes?: string;
};

function hydrateTx(d: DraftTx): Transaction {
  const xof = toXof(d.enteredAmount, d.enteredCurrency);
  const { ht, tva, ttc } = splitTax(xof, d.tvaRate, d.saisie);
  const aibXof = ht * ((d.aibRate || 0) / 100);
  return {
    ...d,
    id: d.id ?? uid(d.type === "recette" ? "r" : "d"),
    entityId: d.entityId || EID.edu,
    htXof: ht,
    tvaXof: tva,
    ttcXof: ttc,
    aibXof,
  };
}

function hydrateInv(d: DraftInv): Investment {
  return {
    ...d,
    id: d.id ?? uid("inv"),
    entityId: d.entityId || EID.edu,
    costXof: toXof(d.enteredAmount, d.enteredCurrency),
  };
}

interface Actions {
  hydrate: (state: AppState) => void;
  setCompany: (patch: Partial<Company>) => void;
  setDisplay: (display: DisplayCurrency) => void;
  setPeriod: (period: Period) => void;
  setActiveEntity: (id: string) => void;
  upsertEntity: (entity: Entity) => void;
  upsertTx: (draft: DraftTx) => void;
  removeTx: (id: string) => void;
  upsertInv: (draft: DraftInv) => void;
  removeInv: (id: string) => void;
  upsertAccount: (account: Omit<Account, "id"> & { id?: string }) => void;
  removeAccount: (id: string) => void;
  upsertStudent: (student: Omit<Student, "id"> & { id?: string }) => void;
  removeStudent: (id: string) => void;
  upsertContribution: (c: Omit<Contribution, "id"> & { id?: string }) => void;
  removeContribution: (id: string) => void;
  collectFee: (input: CollectFeeInput) => void;
  resetDemo: () => void;
}

export type FinanceStore = AppState & Actions;

let hydrating = false;

export function isHydrating() {
  return hydrating;
}

export function snapshotFinance(s: AppState): AppState {
  return {
    company: s.company,
    entities: s.entities,
    activeEntityId: s.activeEntityId,
    accounts: s.accounts,
    transactions: s.transactions,
    investments: s.investments,
    students: s.students,
    contributions: s.contributions,
    display: s.display,
    period: s.period,
  };
}

const demo = createDemoState();

export const useFinance = create<FinanceStore>()((set) => ({
  ...demo,
  hydrate: (state) => {
    hydrating = true;
    set(snapshotFinance(state));
    hydrating = false;
  },
  setCompany: (patch) =>
    set((s) => ({ company: { ...s.company, ...patch } })),
  setDisplay: (display) => set({ display }),
  setPeriod: (period) => set({ period }),
  setActiveEntity: (activeEntityId) => set({ activeEntityId }),
  upsertEntity: (entity) =>
    set((s) => {
      const idx = s.entities.findIndex((e) => e.id === entity.id);
      const entities =
        idx === -1
          ? [...s.entities, entity]
          : s.entities.map((e, i) => (i === idx ? entity : e));
      return { entities };
    }),
  upsertTx: (draft) =>
    set((s) => {
      const next = hydrateTx(draft);
      const idx = s.transactions.findIndex((t) => t.id === next.id);
      const transactions =
        idx === -1
          ? [next, ...s.transactions]
          : s.transactions.map((t, i) => (i === idx ? next : t));
      return { transactions };
    }),
  removeTx: (id) =>
    set((s) => ({
      transactions: s.transactions.filter((t) => t.id !== id),
    })),
  upsertInv: (draft) =>
    set((s) => {
      const next = hydrateInv(draft);
      const idx = s.investments.findIndex((t) => t.id === next.id);
      const investments =
        idx === -1
          ? [next, ...s.investments]
          : s.investments.map((t, i) => (i === idx ? next : t));
      return { investments };
    }),
  removeInv: (id) =>
    set((s) => ({
      investments: s.investments.filter((t) => t.id !== id),
    })),
  upsertAccount: (account) =>
    set((s) => {
      const next: Account = {
        ...account,
        id: account.id ?? uid("acc"),
        entityId: account.entityId || EID.edu,
      };
      const idx = s.accounts.findIndex((t) => t.id === next.id);
      const accounts =
        idx === -1
          ? [...s.accounts, next]
          : s.accounts.map((t, i) => (i === idx ? next : t));
      return { accounts };
    }),
  removeAccount: (id) =>
    set((s) => ({ accounts: s.accounts.filter((t) => t.id !== id) })),
  upsertStudent: (student) =>
    set((s) => {
      const next: Student = {
        ...student,
        id: student.id ?? uid("st"),
        entityId: student.entityId || EID.edu,
      };
      const idx = s.students.findIndex((t) => t.id === next.id);
      const students =
        idx === -1
          ? [next, ...s.students]
          : s.students.map((t, i) => (i === idx ? next : t));
      return { students };
    }),
  removeStudent: (id) =>
    set((s) => ({
      students: s.students.filter((t) => t.id !== id),
      contributions: s.contributions.filter((c) => c.studentId !== id),
    })),
  upsertContribution: (c) =>
    set((s) => {
      const next: Contribution = { ...c, id: c.id ?? uid("cot") };
      const idx = s.contributions.findIndex((t) => t.id === next.id);
      const contributions =
        idx === -1
          ? [next, ...s.contributions]
          : s.contributions.map((t, i) => (i === idx ? next : t));
      return { contributions };
    }),
  removeContribution: (id) =>
    set((s) => {
      const found = s.contributions.find((c) => c.id === id);
      return {
        contributions: s.contributions.filter((c) => c.id !== id),
        transactions: found?.transactionId
          ? s.transactions.filter((t) => t.id !== found.transactionId)
          : s.transactions,
      };
    }),
  collectFee: (input) =>
    set((s) => {
      const student = s.students.find((st) => st.id === input.studentId);
      if (!student) return s;
      const xof = toXof(input.enteredAmount, input.enteredCurrency);
      const { ht, tva, ttc } = splitTax(xof, 0, "ht");
      const cotId = input.contributionId ?? uid("cot");
      const txId = uid("r");
      const recette = hydrateTx({
        id: txId,
        entityId: student.entityId,
        type: "recette",
        date: input.date,
        libelle: `Cotisation ${input.periodLabel} — ${student.firstName} ${student.lastName}`,
        category: "706F",
        enteredAmount: input.enteredAmount,
        enteredCurrency: input.enteredCurrency,
        saisie: "ht",
        tvaRate: 0,
        aibRate: 0,
        payment: input.payment,
        accountId: input.accountId,
        counterparty: `${student.firstName} ${student.lastName}`,
        reference: `COT-${student.id.toUpperCase()}`,
        notes: input.notes ?? student.program,
        status: "valide",
        studentId: student.id,
      });
      const contribution: Contribution = {
        id: cotId,
        studentId: student.id,
        entityId: student.entityId,
        date: input.date,
        periodLabel: input.periodLabel,
        enteredAmount: input.enteredAmount,
        enteredCurrency: input.enteredCurrency,
        htXof: ht,
        tvaRate: 0,
        tvaXof: tva,
        ttcXof: ttc,
        paidXof: ttc,
        payment: input.payment,
        accountId: input.accountId,
        status: "payee",
        transactionId: txId,
        notes: input.notes ?? "",
      };
      const idx = s.contributions.findIndex((c) => c.id === cotId);
      const contributions =
        idx === -1
          ? [contribution, ...s.contributions]
          : s.contributions.map((c, i) => (i === idx ? contribution : c));
      const old = idx === -1 ? undefined : s.contributions[idx];
      const withoutOldTx = old?.transactionId
        ? s.transactions.filter((t) => t.id !== old.transactionId)
        : s.transactions;
      return {
        contributions,
        transactions: [recette, ...withoutOldTx],
      };
    }),
  resetDemo: () => set(createDemoState()),
}));

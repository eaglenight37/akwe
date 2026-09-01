import type { Currency } from "./money";

export type { Currency };

export type FormeJuridique = "SARL" | "SA" | "SAS" | "SUARL" | "EI" | "GIE";
export type RegimeFiscal = "reel" | "simplifie" | "tps";
export type TxType = "recette" | "depense";
export type TxStatus = "brouillon" | "valide";
export type Saisie = "ht" | "ttc";
export type PaymentMethod = "especes" | "virement" | "cheque" | "mobile_money";
export type AccountType = "caisse" | "banque" | "mobile_money";
export type InvestType = "corporel" | "incorporel" | "financier";
export type InvestStatus = "actif" | "cede";
export type DisplayCurrency = "both" | "xof" | "eur";
export type EntityKind = "holding" | "formation" | "pepiniere" | "commerce";
export type EntityStatus = "active" | "en_creation";
export type StudentStatus = "actif" | "diplome" | "suspendu" | "abandon";
export type FeePeriod = "mois" | "trimestre" | "formation";
export type ContributionStatus = "due" | "payee" | "partielle";

export type Period =
  | { kind: "all" }
  | { kind: "year"; year: number }
  | { kind: "quarter"; year: number; quarter: 1 | 2 | 3 | 4 }
  | { kind: "month"; year: number; month: number };

export interface Company {
  name: string;
  ifu: string;
  rccm: string;
  forme: FormeJuridique;
  regime: RegimeFiscal;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  exercice: number;
  tauxChange: number;
  capitalXof: number;
  activite: string;
}

export interface Entity {
  id: string;
  name: string;
  kind: EntityKind;
  status: EntityStatus;
  forme: FormeJuridique;
  ifu: string;
  rccm: string;
  regime: RegimeFiscal;
  activite: string;
  ville: string;
}

export interface Account {
  id: string;
  entityId: string;
  name: string;
  type: AccountType;
  provider: string;
  currency: Currency;
  openingXof: number;
}

export interface Transaction {
  id: string;
  entityId: string;
  type: TxType;
  date: string;
  libelle: string;
  category: string;
  enteredAmount: number;
  enteredCurrency: Currency;
  saisie: Saisie;
  htXof: number;
  tvaRate: number;
  tvaXof: number;
  ttcXof: number;
  aibRate: number;
  aibXof: number;
  payment: PaymentMethod;
  accountId: string;
  counterparty: string;
  reference: string;
  notes: string;
  status: TxStatus;
  studentId?: string;
}

export interface Investment {
  id: string;
  entityId: string;
  name: string;
  type: InvestType;
  category: string;
  dateAcquisition: string;
  enteredAmount: number;
  enteredCurrency: Currency;
  costXof: number;
  durationYears: number;
  residualXof: number;
  accountId: string;
  notes: string;
  status: InvestStatus;
}

export interface Student {
  id: string;
  entityId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  program: string;
  cohort: string;
  enrolledAt: string;
  status: StudentStatus;
  feeXof: number;
  feePeriod: FeePeriod;
  notes: string;
}

export interface Contribution {
  id: string;
  studentId: string;
  entityId: string;
  date: string;
  periodLabel: string;
  enteredAmount: number;
  enteredCurrency: Currency;
  htXof: number;
  tvaRate: number;
  tvaXof: number;
  ttcXof: number;
  paidXof: number;
  payment: PaymentMethod;
  accountId: string;
  status: ContributionStatus;
  transactionId?: string;
  notes: string;
}

export interface AppState {
  company: Company;
  entities: Entity[];
  activeEntityId: string;
  accounts: Account[];
  transactions: Transaction[];
  investments: Investment[];
  students: Student[];
  contributions: Contribution[];
  display: DisplayCurrency;
  period: Period;
}

import { EID } from "./categories";
import { splitTax, toXof } from "./money";
import type {
  Account,
  Company,
  Contribution,
  Entity,
  Investment,
  Student,
  Transaction,
} from "./types";

export const defaultCompany: Company = {
  name: "Azaka Group",
  ifu: "3202400190042",
  rccm: "RB/COT/24 B 1108",
  forme: "SAS",
  regime: "reel",
  adresse: "Immeuble Azaka, rue 12.156, Zogbo",
  ville: "Cotonou",
  telephone: "+229 01 41 20 18 90",
  email: "compta@azakagroup.bj",
  exercice: 2026,
  tauxChange: 655.957,
  capitalXof: 15_000_000,
  activite:
    "Holding — formation au développement, pépinière de projets et commerce de proximité",
};

export const defaultEntities: Entity[] = [
  {
    id: EID.holding,
    name: "Azaka Group",
    kind: "holding",
    status: "active",
    forme: "SAS",
    ifu: "3202400190042",
    rccm: "RB/COT/24 B 1108",
    regime: "reel",
    activite: "Société holding, direction et services partagés",
    ville: "Cotonou",
  },
  {
    id: EID.edu,
    name: "Azakaedu Code",
    kind: "formation",
    status: "active",
    forme: "SARL",
    ifu: "3202400191108",
    rccm: "RB/COT/24 B 2214",
    regime: "reel",
    activite: "Formation au développement logiciel et prestations digitales",
    ville: "Cotonou",
  },
  {
    id: EID.pepi,
    name: "Azaka Pépinière",
    kind: "pepiniere",
    status: "en_creation",
    forme: "SARL",
    ifu: "",
    rccm: "",
    regime: "simplifie",
    activite: "Pépinière de projets — incubation des promotions Azakaedu",
    ville: "Cotonou",
  },
  {
    id: EID.shop,
    name: "Azaka Proximité",
    kind: "commerce",
    status: "en_creation",
    forme: "SUARL",
    ifu: "",
    rccm: "",
    regime: "tps",
    activite: "Commerce de proximité — boutique de quartier",
    ville: "Cotonou",
  },
];

export const defaultAccounts: Account[] = [
  {
    id: "acc-edu-caisse",
    entityId: EID.edu,
    name: "Caisse Azakaedu",
    type: "caisse",
    provider: "Espèces",
    currency: "XOF",
    openingXof: 420_000,
  },
  {
    id: "acc-edu-eco",
    entityId: EID.edu,
    name: "Ecobank Azakaedu — XOF",
    type: "banque",
    provider: "Ecobank",
    currency: "XOF",
    openingXof: 6_800_000,
  },
  {
    id: "acc-edu-momo",
    entityId: EID.edu,
    name: "MTN MoMo Azakaedu",
    type: "mobile_money",
    provider: "MTN Bénin",
    currency: "XOF",
    openingXof: 890_000,
  },
  {
    id: "acc-hold-eco",
    entityId: EID.holding,
    name: "Ecobank Azaka Group",
    type: "banque",
    provider: "Ecobank",
    currency: "XOF",
    openingXof: 4_200_000,
  },
  {
    id: "acc-pepi-caisse",
    entityId: EID.pepi,
    name: "Caisse Pépinière",
    type: "caisse",
    provider: "Espèces",
    currency: "XOF",
    openingXof: 150_000,
  },
  {
    id: "acc-shop-caisse",
    entityId: EID.shop,
    name: "Caisse Proximité",
    type: "caisse",
    provider: "Espèces",
    currency: "XOF",
    openingXof: 80_000,
  },
];

function tx(
  partial: Omit<Transaction, "htXof" | "tvaXof" | "ttcXof" | "aibXof" | "aibRate"> & {
    aibRate?: number;
  },
): Transaction {
  const xof = toXof(partial.enteredAmount, partial.enteredCurrency);
  const { ht, tva, ttc } = splitTax(xof, partial.tvaRate, partial.saisie);
  const aibRate = partial.aibRate ?? 0;
  return {
    ...partial,
    htXof: ht,
    tvaXof: tva,
    ttcXof: ttc,
    aibRate,
    aibXof: ht * (aibRate / 100),
    notes: partial.notes,
  };
}

function d(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export const defaultInvestments: Investment[] = [
  {
    id: "inv-pcs",
    entityId: EID.edu,
    name: "Parc informatique salle de cours (12 postes)",
    type: "corporel",
    category: "26",
    dateAcquisition: "2024-09-10",
    enteredAmount: 4_800_000,
    enteredCurrency: "XOF",
    costXof: 4_800_000,
    durationYears: 4,
    residualXof: 200_000,
    accountId: "acc-edu-eco",
    notes: "Dell reconditionnés + switch + vidéoprojecteur",
    status: "actif",
  },
  {
    id: "inv-salle",
    entityId: EID.edu,
    name: "Aménagement salle Azakaedu Zogbo",
    type: "corporel",
    category: "23",
    dateAcquisition: "2024-08-20",
    enteredAmount: 3_600_000,
    enteredCurrency: "XOF",
    costXof: 3_600_000,
    durationYears: 8,
    residualXof: 0,
    accountId: "acc-edu-eco",
    notes: "Climatisation, tableaux, réseau",
    status: "actif",
  },
  {
    id: "inv-pepi",
    entityId: EID.pepi,
    name: "Aménagement open-space pépinière",
    type: "corporel",
    category: "23",
    dateAcquisition: "2026-06-12",
    enteredAmount: 2_400_000,
    enteredCurrency: "XOF",
    costXof: 2_400_000,
    durationYears: 10,
    residualXof: 0,
    accountId: "acc-hold-eco",
    notes: "En création — bureaux partagés pour les promotions",
    status: "actif",
  },
  {
    id: "inv-shop",
    entityId: EID.shop,
    name: "Rayonnages et caisse boutique",
    type: "corporel",
    category: "25",
    dateAcquisition: "2026-07-22",
    enteredAmount: 980_000,
    enteredCurrency: "XOF",
    costXof: 980_000,
    durationYears: 8,
    residualXof: 0,
    accountId: "acc-hold-eco",
    notes: "En création — commerce de proximité",
    status: "actif",
  },
];

export const defaultStudents: Student[] = [
  {
    id: "st-01",
    entityId: EID.edu,
    firstName: "Kossi",
    lastName: "Agbo",
    phone: "+229 01 97 22 11 40",
    email: "kossi.agbo@gmail.com",
    program: "Développement web",
    cohort: "Promo 2026-A",
    enrolledAt: "2026-01-06",
    status: "actif",
    feeXof: 75_000,
    feePeriod: "mois",
    notes: "",
  },
  {
    id: "st-02",
    entityId: EID.edu,
    firstName: "Afi",
    lastName: "Dossou",
    phone: "+229 01 96 14 08 22",
    email: "afi.dossou@yahoo.fr",
    program: "Développement web",
    cohort: "Promo 2026-A",
    enrolledAt: "2026-01-06",
    status: "actif",
    feeXof: 75_000,
    feePeriod: "mois",
    notes: "",
  },
  {
    id: "st-03",
    entityId: EID.edu,
    firstName: "Eniola",
    lastName: "Bello",
    phone: "+229 01 61 40 33 18",
    email: "eniola.bello@gmail.com",
    program: "Développement mobile",
    cohort: "Promo 2026-A",
    enrolledAt: "2026-01-13",
    status: "actif",
    feeXof: 85_000,
    feePeriod: "mois",
    notes: "",
  },
  {
    id: "st-04",
    entityId: EID.edu,
    firstName: "Mireille",
    lastName: "Houngbo",
    phone: "+229 01 94 08 71 55",
    email: "mireille.h@azakaedu.bj",
    program: "Développement web",
    cohort: "Promo 2026-A",
    enrolledAt: "2026-01-06",
    status: "actif",
    feeXof: 75_000,
    feePeriod: "mois",
    notes: "",
  },
  {
    id: "st-05",
    entityId: EID.edu,
    firstName: "Jean-Baptiste",
    lastName: "Zinsou",
    phone: "+229 01 67 22 90 11",
    email: "",
    program: "Initiation au code",
    cohort: "Promo 2026-B",
    enrolledAt: "2026-03-02",
    status: "actif",
    feeXof: 40_000,
    feePeriod: "mois",
    notes: "",
  },
  {
    id: "st-06",
    entityId: EID.edu,
    firstName: "Nadège",
    lastName: "Togbé",
    phone: "+229 01 95 33 12 08",
    email: "nadege.togbe@gmail.com",
    program: "Développement mobile",
    cohort: "Promo 2026-A",
    enrolledAt: "2026-01-13",
    status: "actif",
    feeXof: 85_000,
    feePeriod: "mois",
    notes: "",
  },
  {
    id: "st-07",
    entityId: EID.edu,
    firstName: "Sènami",
    lastName: "Kpognon",
    phone: "+229 01 62 18 44 90",
    email: "senami.k@gmail.com",
    program: "Développement web",
    cohort: "Promo 2026-A",
    enrolledAt: "2026-02-03",
    status: "actif",
    feeXof: 75_000,
    feePeriod: "mois",
    notes: "",
  },
  {
    id: "st-08",
    entityId: EID.edu,
    firstName: "Chantal",
    lastName: "Adjovi",
    phone: "+229 01 97 01 55 32",
    email: "chantal.adjovi@gmail.com",
    program: "Formation courte",
    cohort: "Promo 2026-C",
    enrolledAt: "2026-04-07",
    status: "actif",
    feeXof: 120_000,
    feePeriod: "formation",
    notes: "Forfait 8 semaines React",
  },
  {
    id: "st-09",
    entityId: EID.edu,
    firstName: "Yao",
    lastName: "Amoussou",
    phone: "+229 01 66 09 21 14",
    email: "yao.amoussou@outlook.com",
    program: "Développement mobile",
    cohort: "Promo 2026-A",
    enrolledAt: "2026-01-13",
    status: "suspendu",
    feeXof: 85_000,
    feePeriod: "mois",
    notes: "Retard de cotisations — relance août",
  },
  {
    id: "st-10",
    entityId: EID.edu,
    firstName: "Félicité",
    lastName: "Mensah",
    phone: "+229 01 91 44 70 06",
    email: "",
    program: "Initiation au code",
    cohort: "Promo 2026-B",
    enrolledAt: "2026-03-02",
    status: "actif",
    feeXof: 40_000,
    feePeriod: "mois",
    notes: "",
  },
];

const MONTH_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
];

function buildCotisations(): { contributions: Contribution[]; recettes: Transaction[] } {
  const contributions: Contribution[] = [];
  const recettes: Transaction[] = [];

  for (const st of defaultStudents) {
    const startM = Number(st.enrolledAt.slice(5, 7));
    if (st.feePeriod === "formation") {
      const paid = st.id !== "st-08" || true;
      const id = `cot-${st.id}-f`;
      const { ht, tva, ttc } = splitTax(st.feeXof, 0, "ht");
      contributions.push({
        id,
        studentId: st.id,
        entityId: EID.edu,
        date: st.enrolledAt,
        periodLabel: "Forfait formation",
        enteredAmount: st.feeXof,
        enteredCurrency: "XOF",
        htXof: ht,
        tvaRate: 0,
        tvaXof: tva,
        ttcXof: ttc,
        paidXof: paid ? ttc : 0,
        payment: "mobile_money",
        accountId: "acc-edu-momo",
        status: paid ? "payee" : "due",
        transactionId: paid ? `r-${id}` : undefined,
        notes: "",
      });
      if (paid) {
        recettes.push(
          tx({
            id: `r-${id}`,
            entityId: EID.edu,
            type: "recette",
            date: st.enrolledAt,
            libelle: `Cotisation forfait — ${st.firstName} ${st.lastName}`,
            category: "706F",
            enteredAmount: st.feeXof,
            enteredCurrency: "XOF",
            saisie: "ht",
            tvaRate: 0,
            payment: "mobile_money",
            accountId: "acc-edu-momo",
            counterparty: `${st.firstName} ${st.lastName}`,
            reference: `COT-${st.id.toUpperCase()}`,
            notes: st.program,
            status: "valide",
            studentId: st.id,
          }),
        );
      }
      continue;
    }

    for (let m = startM; m <= 8; m++) {
      const unpaid =
        (st.id === "st-09" && m >= 6) || (st.id === "st-07" && m === 8);
      const id = `cot-${st.id}-m${m}`;
      const { ht, tva, ttc } = splitTax(st.feeXof, 0, "ht");
      const payDate = d(m, 5 + (st.id.charCodeAt(4) % 7));
      const payment =
        m % 3 === 0 ? "especes" : m % 2 === 0 ? "mobile_money" : "virement";
      const accountId =
        payment === "especes"
          ? "acc-edu-caisse"
          : payment === "mobile_money"
            ? "acc-edu-momo"
            : "acc-edu-eco";
      contributions.push({
        id,
        studentId: st.id,
        entityId: EID.edu,
        date: payDate,
        periodLabel: `${MONTH_FR[m - 1]} 2026`,
        enteredAmount: st.feeXof,
        enteredCurrency: "XOF",
        htXof: ht,
        tvaRate: 0,
        tvaXof: tva,
        ttcXof: ttc,
        paidXof: unpaid ? 0 : ttc,
        payment,
        accountId,
        status: unpaid ? "due" : "payee",
        transactionId: unpaid ? undefined : `r-${id}`,
        notes: unpaid ? "Relance en cours" : "",
      });
      if (!unpaid) {
        recettes.push(
          tx({
            id: `r-${id}`,
            entityId: EID.edu,
            type: "recette",
            date: payDate,
            libelle: `Cotisation ${MONTH_FR[m - 1]} — ${st.firstName} ${st.lastName}`,
            category: "706F",
            enteredAmount: st.feeXof,
            enteredCurrency: "XOF",
            saisie: "ht",
            tvaRate: 0,
            payment,
            accountId,
            counterparty: `${st.firstName} ${st.lastName}`,
            reference: `COT-${st.id}-${m}`,
            notes: `${st.program} · ${st.cohort}`,
            status: "valide",
            studentId: st.id,
          }),
        );
      }
    }
  }

  return { contributions, recettes };
}

export function buildDefaultTransactions(): Transaction[] {
  const { recettes } = buildCotisations();
  const out: Transaction[] = [...recettes];

  const clients = [
    "Clinique Saint-Luc Cotonou",
    "Ets. Dossou Négoce",
    "Mairie de Abomey-Calavi",
  ];
  const presta = [1_200_000, 850_000, 1_450_000, 720_000, 980_000, 1_100_000, 640_000, 1_280_000];
  presta.forEach((ht, i) => {
    const m = i + 1;
    out.push(
      tx({
        id: `dev-${m}`,
        entityId: EID.edu,
        type: "recette",
        date: d(m, 16),
        libelle: `Prestation développement — ${clients[i % clients.length]}`,
        category: "706D",
        enteredAmount: ht,
        enteredCurrency: "XOF",
        saisie: "ht",
        tvaRate: 18,
        payment: "virement",
        accountId: "acc-edu-eco",
        counterparty: clients[i % clients.length],
        reference: `DEV-2026-${String(m).padStart(2, "0")}`,
        notes: "",
        status: "valide",
      }),
    );
  });

  for (let m = 1; m <= 8; m++) {
    out.push(
      tx({
        id: `sal-edu-${m}`,
        entityId: EID.edu,
        type: "depense",
        date: d(m, 28),
        libelle: "Salaires formateurs et assistant",
        category: "661",
        enteredAmount: 980_000,
        enteredCurrency: "XOF",
        saisie: "ht",
        tvaRate: 0,
        payment: "virement",
        accountId: "acc-edu-eco",
        counterparty: "Personnel Azakaedu",
        reference: `PAIE-EDU-${m}`,
        notes: "",
        status: "valide",
      }),
      tx({
        id: `cnss-edu-${m}`,
        entityId: EID.edu,
        type: "depense",
        date: d(m, 12),
        libelle: "Cotisations CNSS Azakaedu",
        category: "664",
        enteredAmount: 160_700,
        enteredCurrency: "XOF",
        saisie: "ht",
        tvaRate: 0,
        payment: "virement",
        accountId: "acc-edu-eco",
        counterparty: "CNSS Bénin",
        reference: `CNSS-EDU-${m}`,
        notes: "",
        status: "valide",
      }),
      tx({
        id: `loyer-edu-${m}`,
        entityId: EID.edu,
        type: "depense",
        date: d(m, 3),
        libelle: "Loyer salle de formation Zogbo",
        category: "622",
        enteredAmount: 250_000,
        enteredCurrency: "XOF",
        saisie: "ht",
        tvaRate: 18,
        payment: "virement",
        accountId: "acc-edu-eco",
        counterparty: "SCI Zogbo",
        reference: `LOY-EDU-${m}`,
        notes: "",
        status: "valide",
      }),
      tx({
        id: `net-edu-${m}`,
        entityId: EID.edu,
        type: "depense",
        date: d(m, 10),
        libelle: "Fibre Moov + SBEE salle",
        category: "628",
        enteredAmount: 64_000,
        enteredCurrency: "XOF",
        saisie: "ttc",
        tvaRate: 18,
        payment: "mobile_money",
        accountId: "acc-edu-momo",
        counterparty: "Moov / SBEE",
        reference: "",
        notes: "",
        status: "valide",
      }),
    );
  }

  out.push(
    tx({
      id: "hold-ec",
      entityId: EID.holding,
      type: "depense",
      date: d(3, 20),
      libelle: "Honoraires expert-comptable T1 — groupe",
      category: "633",
      enteredAmount: 280_000,
      enteredCurrency: "XOF",
      saisie: "ht",
      tvaRate: 18,
      payment: "virement",
      accountId: "acc-hold-eco",
      counterparty: "Cabinet Hounsou & Associés",
      reference: "HC-G-T1",
      notes: "",
      status: "valide",
    }),
    tx({
      id: "hold-patente",
      entityId: EID.holding,
      type: "depense",
      date: d(1, 18),
      libelle: "Patente 2026 — Azaka Group",
      category: "641",
      enteredAmount: 180_000,
      enteredCurrency: "XOF",
      saisie: "ht",
      tvaRate: 0,
      payment: "virement",
      accountId: "acc-hold-eco",
      counterparty: "DGI Cotonou 1",
      reference: "PAT-G-2026",
      notes: "",
      status: "valide",
    }),
    tx({
      id: "pepi-etude",
      entityId: EID.pepi,
      type: "depense",
      date: d(5, 14),
      libelle: "Étude d'aménagement pépinière",
      category: "633",
      enteredAmount: 350_000,
      enteredCurrency: "XOF",
      saisie: "ht",
      tvaRate: 18,
      payment: "virement",
      accountId: "acc-hold-eco",
      counterparty: "Atelier Kora Architecture",
      reference: "PEPI-ETU",
      notes: "Frais de création",
      status: "valide",
    }),
    tx({
      id: "pepi-loyer",
      entityId: EID.pepi,
      type: "depense",
      date: d(6, 2),
      libelle: "Dépôt de garantie local pépinière",
      category: "65",
      enteredAmount: 600_000,
      enteredCurrency: "XOF",
      saisie: "ht",
      tvaRate: 0,
      payment: "virement",
      accountId: "acc-hold-eco",
      counterparty: "SCI Fidjrossè",
      reference: "PEPI-DEPOT",
      notes: "En création",
      status: "valide",
    }),
    tx({
      id: "shop-stock",
      entityId: EID.shop,
      type: "depense",
      date: d(8, 4),
      libelle: "Premier stock boutique — épicerie",
      category: "601",
      enteredAmount: 1_150_000,
      enteredCurrency: "XOF",
      saisie: "ht",
      tvaRate: 18,
      aibRate: 1,
      payment: "virement",
      accountId: "acc-hold-eco",
      counterparty: "Grossiste Dantokpa",
      reference: "PROX-STK1",
      notes: "En création — pas encore de ventes",
      status: "valide",
    }),
    tx({
      id: "edu-pub",
      entityId: EID.edu,
      type: "depense",
      date: d(2, 8),
      libelle: "Campagne inscriptions Promo 2026-A — radio + bâches",
      category: "627",
      enteredAmount: 180_000,
      enteredCurrency: "XOF",
      saisie: "ht",
      tvaRate: 18,
      payment: "mobile_money",
      accountId: "acc-edu-momo",
      counterparty: "CAPP FM",
      reference: "",
      notes: "",
      status: "valide",
    }),
  );

  return out;
}

export function defaultContributions(): Contribution[] {
  return buildCotisations().contributions;
}

export function createDemoState() {
  return {
    company: { ...defaultCompany },
    entities: defaultEntities.map((e) => ({ ...e })),
    activeEntityId: "all",
    accounts: defaultAccounts.map((a) => ({ ...a })),
    transactions: buildDefaultTransactions(),
    investments: defaultInvestments.map((i) => ({ ...i })),
    students: defaultStudents.map((s) => ({ ...s })),
    contributions: defaultContributions(),
    display: "both" as const,
    period: { kind: "year" as const, year: 2026 },
  };
}

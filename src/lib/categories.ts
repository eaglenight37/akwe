export interface Category {
  code: string;
  label: string;
  groupe: string;
}

export const RECETTE_CATS: Category[] = [
  { code: "706F", label: "Cotisations de formation", groupe: "Formation" },
  { code: "706D", label: "Prestations de développement", groupe: "Formation" },
  { code: "706P", label: "Hébergement pépinière / incubation", groupe: "Pépinière" },
  { code: "701", label: "Ventes de marchandises", groupe: "Commerce" },
  { code: "706", label: "Autres prestations de services", groupe: "Exploitation" },
  { code: "75", label: "Autres produits d'exploitation", groupe: "Exploitation" },
  { code: "74", label: "Subventions d'exploitation", groupe: "Exploitation" },
  { code: "77", label: "Produits financiers", groupe: "Financier" },
  { code: "82", label: "Produit de cession d'immobilisation", groupe: "HAO" },
];

export const DEPENSE_CATS: Category[] = [
  { code: "601", label: "Achats de marchandises", groupe: "Achats" },
  { code: "602", label: "Achats de matières et fournitures", groupe: "Achats" },
  { code: "605", label: "Transports sur achats", groupe: "Achats" },
  { code: "61", label: "Transports extérieurs", groupe: "Services" },
  { code: "622", label: "Locations et charges locatives", groupe: "Services" },
  { code: "624", label: "Entretien et réparations", groupe: "Services" },
  { code: "625", label: "Primes d'assurance", groupe: "Services" },
  { code: "627", label: "Publicité et relations publiques", groupe: "Services" },
  { code: "628", label: "Télécoms, internet, SBEE", groupe: "Services" },
  { code: "633", label: "Honoraires (expert-comptable, notaire)", groupe: "Services" },
  { code: "635", label: "Frais bancaires", groupe: "Services" },
  { code: "641", label: "Impôts et taxes (patente, TVM, FONER)", groupe: "Impôts" },
  { code: "661", label: "Salaires et appointements", groupe: "Personnel" },
  { code: "664", label: "Charges sociales CNSS", groupe: "Personnel" },
  { code: "65", label: "Autres charges (carburant, divers)", groupe: "Autres" },
  { code: "67", label: "Charges financières", groupe: "Financier" },
];

export const INVEST_CATS: Category[] = [
  { code: "22", label: "Terrains", groupe: "Corporel" },
  { code: "23", label: "Bâtiments et aménagements", groupe: "Corporel" },
  { code: "24", label: "Matériel et outillage", groupe: "Corporel" },
  { code: "245", label: "Matériel de transport", groupe: "Corporel" },
  { code: "25", label: "Mobilier et matériel de bureau", groupe: "Corporel" },
  { code: "26", label: "Matériel informatique", groupe: "Corporel" },
  { code: "21", label: "Logiciels et incorporelles", groupe: "Incorporel" },
  { code: "27", label: "Titres de participation", groupe: "Financier" },
  { code: "28", label: "Dépôts et cautionnements", groupe: "Financier" },
];

export const PAYMENT_LABELS: Record<string, string> = {
  especes: "Espèces",
  virement: "Virement bancaire",
  cheque: "Chèque",
  mobile_money: "Mobile money",
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  caisse: "Caisse",
  banque: "Banque",
  mobile_money: "Mobile money",
};

export const FORME_LABELS: Record<string, string> = {
  SARL: "SARL",
  SA: "SA",
  SAS: "SAS",
  SUARL: "SUARL",
  EI: "Entreprise individuelle",
  GIE: "GIE",
};

export const REGIME_LABELS: Record<string, string> = {
  reel: "Régime réel (TVA + IS)",
  simplifie: "Régime simplifié d'imposition",
  tps: "Taxe professionnelle synthétique (TPS)",
};

export const INVEST_TYPE_LABELS: Record<string, string> = {
  corporel: "Immobilisation corporelle",
  incorporel: "Immobilisation incorporelle",
  financier: "Immobilisation financière",
};

export const ENTITY_KIND_LABELS: Record<string, string> = {
  holding: "Holding",
  formation: "Formation & développement",
  pepiniere: "Pépinière",
  commerce: "Commerce de proximité",
};

export const ENTITY_STATUS_LABELS: Record<string, string> = {
  active: "En activité",
  en_creation: "En création",
};

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  actif: "Actif",
  diplome: "Diplômé",
  suspendu: "Suspendu",
  abandon: "Abandon",
};

export const FEE_PERIOD_LABELS: Record<string, string> = {
  mois: "Mensuelle",
  trimestre: "Trimestrielle",
  formation: "Forfait formation",
};

export const PROGRAMS = [
  "Développement web",
  "Développement mobile",
  "Initiation au code",
  "Formation courte",
];

export const EID = {
  holding: "ent-holding",
  edu: "ent-edu",
  pepi: "ent-pepi",
  shop: "ent-shop",
} as const;

export function defaultRecetteCat(kind: string): string {
  if (kind === "formation") return "706F";
  if (kind === "pepiniere") return "706P";
  if (kind === "commerce") return "701";
  return "75";
}

export function entityName(
  entities: { id: string; name: string }[],
  id: string,
): string {
  if (!id || id === "all") return "Tout le groupe";
  return entities.find((e) => e.id === id)?.name ?? id;
}

export function catLabel(code: string, list: Category[]): string {
  const found = list.find((c) => c.code === code);
  return found ? `${found.code} · ${found.label}` : code;
}

export function catName(code: string, list: Category[]): string {
  return list.find((c) => c.code === code)?.label ?? code;
}

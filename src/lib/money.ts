export type Currency = "XOF" | "EUR";

/** Parité fixe BCEAO / zone franc : 1 EUR = 655,957 XOF. */
export const PARITE_EUR_XOF = 655.957;

export function toXof(
  amount: number,
  currency: Currency,
  rate = PARITE_EUR_XOF,
): number {
  if (!Number.isFinite(amount)) return 0;
  return currency === "XOF" ? amount : amount * rate;
}

export function toEur(xof: number, rate = PARITE_EUR_XOF): number {
  if (!Number.isFinite(xof) || rate === 0) return 0;
  return xof / rate;
}

export function roundXof(n: number): number {
  return Math.round(n);
}

export function splitTax(
  amount: number,
  rate: number,
  saisie: "ht" | "ttc",
): { ht: number; tva: number; ttc: number } {
  if (!Number.isFinite(amount) || amount === 0) {
    return { ht: 0, tva: 0, ttc: 0 };
  }
  if (!rate) return { ht: amount, tva: 0, ttc: amount };
  if (saisie === "ht") {
    const tva = amount * (rate / 100);
    return { ht: amount, tva, ttc: amount + tva };
  }
  const ht = amount / (1 + rate / 100);
  return { ht, tva: amount - ht, ttc: amount };
}

export function formatXof(xof: number, withSymbol = true): string {
  const n = roundXof(xof);
  const body = new Intl.NumberFormat("fr-FR").format(n);
  return withSymbol ? `${body} F CFA` : body;
}

export function formatEur(eur: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(eur);
}

export function formatAmount(xof: number, currency: Currency, rate = PARITE_EUR_XOF): string {
  return currency === "XOF" ? formatXof(xof) : formatEur(toEur(xof, rate));
}

export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/\u00a0/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export function formatParite(rate = PARITE_EUR_XOF): string {
  return `1 € = ${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(rate)} F CFA`;
}

import { formatEur, formatXof, toEur } from "@/lib/money";
import type { DisplayCurrency } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Money({
  xof,
  rate,
  display,
  signed,
  size = "md",
  className,
}: {
  xof: number;
  rate: number;
  display: DisplayCurrency;
  signed?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const eur = toEur(xof, rate);
  const sign = signed ? (xof > 0 ? "+" : xof < 0 ? "" : "") : "";
  const tone =
    signed && xof > 0 ? "text-ok" : signed && xof < 0 ? "text-danger" : "text-ink";

  const primaryCls = {
    sm: "text-sm font-medium tabular-nums",
    md: "text-base font-semibold tabular-nums",
    lg: "font-display text-2xl font-medium tabular-nums tracking-tight",
    xl: "font-display text-3xl font-medium tabular-nums tracking-tight sm:text-4xl",
  }[size];

  const xofLabel = `${sign}${formatXof(xof)}`;
  const eurLabel = `${sign}${formatEur(eur)}`;

  if (display === "xof") {
    return <span className={cn(primaryCls, tone, className)}>{xofLabel}</span>;
  }
  if (display === "eur") {
    return <span className={cn(primaryCls, tone, className)}>{eurLabel}</span>;
  }

  return (
    <span className={cn("flex flex-col", className)}>
      <span className={cn(primaryCls, tone)}>{xofLabel}</span>
      <span
        className={cn(
          "tabular-nums text-muted",
          size === "xl" || size === "lg" ? "text-sm" : "text-xs",
        )}
      >
        {eurLabel}
      </span>
    </span>
  );
}

export function DualInline({
  xof,
  rate,
  className,
}: {
  xof: number;
  rate: number;
  className?: string;
}) {
  return (
    <span className={cn("tabular-nums", className)}>
      {formatXof(xof)}
      <span className="text-subtle"> · {formatEur(toEur(xof, rate))}</span>
    </span>
  );
}

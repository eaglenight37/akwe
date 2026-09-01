import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  PiggyBank,
  Receipt,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { formatParite } from "@/lib/money";
import { useFinance } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CowrieMark } from "./mark";
import { AccountChip } from "./account-chip";
import { Button } from "./ui/button";
import { NativeSelect } from "./ui/input";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const NAV = [
  { to: "/", label: "Tableau", icon: LayoutDashboard },
  { to: "/etudiants", label: "Étudiants", icon: GraduationCap },
  { to: "/recettes", label: "Recettes", icon: TrendingUp },
  { to: "/depenses", label: "Dépenses", icon: TrendingDown },
  { to: "/investissements", label: "Investissements", icon: PiggyBank },
  { to: "/tresorerie", label: "Trésorerie", icon: Wallet },
  { to: "/fiscalite", label: "Fiscalité", icon: Scale },
  { to: "/rapports", label: "Rapports", icon: Receipt },
  { to: "/societe", label: "Groupe", icon: Building2 },
] as const;

const MOBILE_MAIN = [
  NAV[0],
  NAV[1],
  NAV[2],
  NAV[3],
] as const;
const MOBILE_MORE = NAV.slice(4);

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const display = useFinance((s) => s.display);
  const setDisplay = useFinance((s) => s.setDisplay);
  const company = useFinance((s) => s.company);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-cover text-cover-fg lg:flex">
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
          <span className="grid size-9 place-items-center rounded-md bg-cover-fg/10">
            <CowrieMark className="size-5" />
          </span>
          <div>
            <div className="font-display text-xl leading-none">Akwɛ</div>
            <div className="mt-0.5 text-xs tracking-wide text-cover-fg/65">
              Azaka Group
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-150",
                  active
                    ? "bg-cover-fg/12 text-cover-fg"
                    : "text-cover-fg/70 hover:bg-cover-fg/10 hover:text-cover-fg",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-5 text-xs text-cover-fg/55">
          <p className="font-medium text-cover-fg/80">{company.name}</p>
          <p className="mt-0.5">{company.ville}</p>
          <p className="mt-2">{formatParite(company.tauxChange)}</p>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <CowrieMark className="size-5 text-cover" />
            <span className="font-display text-lg leading-none">Akwɛ</span>
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <EntitySelect />
            <NativeSelect
              aria-label="Affichage des devises"
              className="h-10 min-h-10 w-32 bg-surface"
              value={display}
              onChange={(e) =>
                setDisplay(e.target.value as typeof display)
              }
            >
              <option value="both">FCFA + €</option>
              <option value="xof">FCFA</option>
              <option value="eur">Euro</option>
            </NativeSelect>
            <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
              <Landmark className="size-3.5" />
              Parité BCEAO
            </span>
            <AccountChip />
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:pb-10">
          {children}
        </main>
      </div>

      <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
        {MOBILE_MAIN.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs",
                active ? "text-cover" : "text-muted",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs",
                MOBILE_MORE.some((i) => isActive(pathname, i.to))
                  ? "text-cover"
                  : "text-muted",
              )}
            >
              <MoreHorizontal className="size-4" />
              Plus
            </button>
          </SheetTrigger>
          <SheetContent title="Plus">
            <div className="flex flex-col gap-1">
              {MOBILE_MORE.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-md px-3 text-sm",
                      isActive(pathname, item.to)
                        ? "bg-surface-2 text-ink"
                        : "text-ink",
                    )}
                  >
                    <Icon className="size-4 text-cover" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker ? (
          <p className="mb-1 text-xs font-medium tracking-wider text-muted uppercase">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-xl text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function EntitySelect() {
  const entities = useFinance((s) => s.entities);
  const active = useFinance((s) => s.activeEntityId);
  const setActive = useFinance((s) => s.setActiveEntity);
  return (
    <NativeSelect
      aria-label="Activité"
      className="h-10 min-h-10 max-w-52 bg-surface"
      value={active}
      onChange={(e) => setActive(e.target.value)}
    >
      <option value="all">Tout le groupe</option>
      {entities.map((e) => (
        <option key={e.id} value={e.id}>
          {e.name}
        </option>
      ))}
    </NativeSelect>
  );
}

export function PeriodSelect() {
  const period = useFinance((s) => s.period);
  const setPeriod = useFinance((s) => s.setPeriod);
  const year = useFinance((s) => s.company.exercice);

  const value =
    period.kind === "all"
      ? "all"
      : period.kind === "year"
        ? `y-${period.year}`
        : period.kind === "quarter"
          ? `q-${period.year}-${period.quarter}`
          : `m-${period.year}-${period.month}`;

  return (
    <NativeSelect
      aria-label="Période"
      className="h-11 w-full max-w-56 bg-surface sm:w-56"
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "all") setPeriod({ kind: "all" });
        else if (v.startsWith("y-")) setPeriod({ kind: "year", year: Number(v.slice(2)) });
        else if (v.startsWith("q-")) {
          const [, y, q] = v.split("-");
          setPeriod({
            kind: "quarter",
            year: Number(y),
            quarter: Number(q) as 1 | 2 | 3 | 4,
          });
        } else {
          const [, y, m] = v.split("-");
          setPeriod({ kind: "month", year: Number(y), month: Number(m) });
        }
      }}
    >
      <option value={`y-${year}`}>Exercice {year}</option>
      <option value={`q-${year}-1`}>T1 {year}</option>
      <option value={`q-${year}-2`}>T2 {year}</option>
      <option value={`q-${year}-3`}>T3 {year}</option>
      <option value={`q-${year}-4`}>T4 {year}</option>
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
        const name = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(
          new Date(year, m - 1, 1),
        );
        return (
          <option key={m} value={`m-${year}-${m}`}>
            {name} {year}
          </option>
        );
      })}
      <option value="all">Tout l'historique</option>
    </NativeSelect>
  );
}

export function MenuButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" size="iconSm" {...props}>
      <Menu />
    </Button>
  );
}

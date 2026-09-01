import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  GraduationCap,
  Landmark,
  Scale,
  Sprout,
  Store,
} from "lucide-react";
import { useMemo } from "react";
import { PageHeader, PeriodSelect } from "@/components/app-shell";
import { CashflowChart } from "@/components/cashflow-chart";
import { Money } from "@/components/money-display";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  catName,
  DEPENSE_CATS,
  EID,
  ENTITY_KIND_LABELS,
  ENTITY_STATUS_LABELS,
  RECETTE_CATS,
} from "@/lib/categories";
import { forEntity, periodLabel, summarize, upcomingDeadlines } from "@/lib/fiscal";
import { formatParite } from "@/lib/money";
import { useFinance } from "@/lib/store";
import { studentTotals } from "@/lib/students";
import type { EntityKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const KIND_ICON: Record<EntityKind, typeof Building2> = {
  holding: Building2,
  formation: GraduationCap,
  pepiniere: Sprout,
  commerce: Store,
};

function Home() {
  const state = useFinance();
  const s = useMemo(() => summarize(state), [state]);
  const deadlines = upcomingDeadlines(state.company.exercice);
  const recent = forEntity(state.transactions, state.activeEntityId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  const topDep = Object.entries(s.depByCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const setActive = useFinance((s) => s.setActiveEntity);
  const showAll = state.activeEntityId === "all";
  const activeName =
    state.entities.find((e) => e.id === state.activeEntityId)?.name ?? "Azaka Group";

  const byEntity = useMemo(
    () =>
      state.entities.map((entity) => ({
        entity,
        summary: summarize({ ...state, activeEntityId: entity.id }),
      })),
    [state],
  );

  const studentScope = forEntity(state.students, EID.edu);
  const contribScope = forEntity(state.contributions, EID.edu);
  const stTotals = studentTotals(studentScope, contribScope, state.period);
  const showStudents =
    state.activeEntityId === "all" || state.activeEntityId === EID.edu;

  return (
    <>
      <PageHeader
        kicker={showAll ? "Azaka Group" : activeName}
        title="Tableau de bord"
        description={`${periodLabel(state.period)} · ${formatParite(state.company.tauxChange)}`}
        action={<PeriodSelect />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {byEntity.map(({ entity, summary }) => {
          const Icon = KIND_ICON[entity.kind];
          const active = state.activeEntityId === entity.id;
          return (
            <button
              key={entity.id}
              type="button"
              onClick={() => setActive(active ? "all" : entity.id)}
              className={cn(
                "rounded-2xl bg-surface p-4 text-left shadow-[0_0_0_1px_rgba(28,25,21,0.06)] transition-shadow duration-150",
                active
                  ? "shadow-[0_0_0_2px_var(--color-cover)]"
                  : "hover:shadow-[0_0_0_1px_rgba(28,25,21,0.12)]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-9 place-items-center rounded-md bg-surface-2 text-cover">
                  <Icon className="size-4" />
                </span>
                <Badge tone={entity.status === "en_creation" ? "warn" : "ok"}>
                  {ENTITY_STATUS_LABELS[entity.status]}
                </Badge>
              </div>
              <h2 className="mt-3 font-display text-lg leading-tight">{entity.name}</h2>
              <p className="text-xs text-subtle">{ENTITY_KIND_LABELS[entity.kind]}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted">Recettes</p>
                  <Money
                    xof={summary.recHt}
                    rate={state.company.tauxChange}
                    display={state.display}
                    size="sm"
                  />
                </div>
                <div>
                  <p className="text-muted">Résultat</p>
                  <Money
                    xof={summary.resultat}
                    rate={state.company.tauxChange}
                    display={state.display}
                    size="sm"
                    signed
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Recettes HT" xof={s.recHt} hint={`${s.recCount} pièces`} tone="ok" />
        <Kpi label="Dépenses HT" xof={s.depHt} hint={`${s.depCount} pièces`} tone="danger" />
        <Kpi label="Résultat net" xof={s.resultat} hint="Après amortissements" signed />
        <Kpi label="Trésorerie" xof={s.tresorerie} hint="Comptes de l'activité" />
      </div>

      {showStudents ? (
        <Card className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg">Azakaedu Code — promotions</h2>
            <p className="text-sm text-muted">
              {stTotals.actifs} étudiants actifs · {stTotals.due > 0 ? "cotisations à relancer" : "cotisations à jour"}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs text-muted">Encaissé</p>
              <Money
                xof={stTotals.paid}
                rate={state.company.tauxChange}
                display={state.display}
                size="sm"
              />
            </div>
            <div>
              <p className="text-xs text-muted">Dû</p>
              <Money
                xof={stTotals.due}
                rate={state.company.tauxChange}
                display={state.display}
                size="sm"
              />
            </div>
            <Link
              to="/etudiants"
              className="inline-flex min-h-11 items-center text-sm font-medium text-cover"
            >
              Suivre les étudiants
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg">Flux d'exploitation</h2>
              <p className="text-sm text-muted">Recettes et charges HT par mois</p>
            </div>
            <div className="flex gap-3 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-cover" /> Recettes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-danger" /> Dépenses
              </span>
            </div>
          </div>
          <CashflowChart />
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="font-display text-lg">Fiscalité à surveiller</h2>
          <p className="mt-1 text-sm text-muted">
            Estimations, à valider avec l'expert-comptable
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="TVA nette" value={s.tvaNette} />
            <Row label="IS / IMF estimé" value={s.impotSocietes} />
            <Row label="AIB collecté (achats)" value={s.depAib} />
            <Row label="AIB retenu (ventes)" value={s.recAib} />
          </dl>
          <Link
            to="/fiscalite"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-cover"
          >
            Voir la liasse fiscale
          </Link>
        </Card>
      </div>

      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-3">
          <h2 className="mb-3 font-display text-lg">Dernières écritures</h2>
          <ul className="divide-y divide-line">
            {recent.map((t) => (
              <li key={t.id} className="flex min-w-0 items-start justify-between gap-3 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={
                      t.type === "recette"
                        ? "mt-0.5 grid size-8 place-items-center rounded-md bg-ok/10 text-ok"
                        : "mt-0.5 grid size-8 place-items-center rounded-md bg-danger/10 text-danger"
                    }
                  >
                    {t.type === "recette" ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownRight className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.libelle}</p>
                    <p className="text-xs text-subtle">
                      {format(new Date(`${t.date}T00:00:00`), "d MMM", { locale: fr })}
                      {" · "}
                      {showAll
                        ? `${state.entities.find((e) => e.id === t.entityId)?.name ?? ""} · `
                        : ""}
                      {catName(
                        t.category,
                        t.type === "recette" ? RECETTE_CATS : DEPENSE_CATS,
                      )}
                    </p>
                  </div>
                </div>
                <Money
                  xof={t.type === "recette" ? t.htXof : -t.htXof}
                  rate={state.company.tauxChange}
                  display={state.display}
                  signed
                  size="sm"
                  className="shrink-0 text-right"
                />
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <Card>
            <h2 className="font-display text-lg">Échéances</h2>
            <ul className="mt-3 space-y-3">
              {deadlines.map((d) => (
                <li key={d.id} className="flex gap-3 text-sm">
                  <span className="w-14 shrink-0 tabular-nums text-muted">
                    {format(new Date(`${d.date}T00:00:00`), "d MMM", { locale: fr })}
                  </span>
                  <span>
                    <span className="font-medium">{d.title}</span>
                    <span className="block text-xs text-subtle">{d.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="font-display text-lg">Charges par poste</h2>
            <ul className="mt-3 space-y-2">
              {topDep.map(([code, amt]) => (
                <li key={code} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-muted">{catName(code, DEPENSE_CATS)}</span>
                  <Money
                    xof={amt}
                    rate={state.company.tauxChange}
                    display={state.display}
                    size="sm"
                    className="shrink-0 text-right"
                  />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <p className="mt-8 flex flex-col gap-2 text-xs text-subtle sm:flex-row sm:items-start">
        <span className="inline-flex items-start gap-2">
          <Scale className="mt-0.5 size-3.5 shrink-0" />
          Données de démonstration : Azaka Group, Cotonou — Azakaedu Code, pépinière et
          commerce de proximité. Les taux (TVA 18 %, IS 30 %, IMF 1 %, AIB, CNSS) sont
          indicatifs — le CGI béninois et votre expert-comptable font foi.
        </span>
        <span className="inline-flex items-start gap-2">
          <Landmark className="mt-0.5 size-3.5 shrink-0" />
          Le franc CFA est ancré à l'euro à 655,957.
        </span>
      </p>
    </>
  );
}

function Kpi({
  label,
  xof,
  hint,
  tone,
  signed,
}: {
  label: string;
  xof: number;
  hint?: string;
  tone?: "ok" | "danger";
  signed?: boolean;
}) {
  const display = useFinance((s) => s.display);
  const rate = useFinance((s) => s.company.tauxChange);
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <div className="mt-2">
        <Money
          xof={xof}
          rate={rate}
          display={display}
          signed={signed}
          size="lg"
          className={tone === "ok" ? "text-ok" : tone === "danger" ? "text-danger" : undefined}
        />
      </div>
      {hint ? <p className="mt-2 text-xs text-subtle">{hint}</p> : null}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  const display = useFinance((s) => s.display);
  const rate = useFinance((s) => s.company.tauxChange);
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd>
        <Money xof={value} rate={rate} display={display} size="sm" signed className="text-right" />
      </dd>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo } from "react";
import { PageHeader, PeriodSelect } from "@/components/app-shell";
import { Money } from "@/components/money-display";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { REGIME_LABELS } from "@/lib/categories";
import {
  CNSS_PATRONAL,
  IMF_TAUX,
  IS_TAUX,
  activeRegime,
  summarize,
  TPS_TAUX,
  TVA_STANDARD,
  upcomingDeadlines,
} from "@/lib/fiscal";
import { useFinance } from "@/lib/store";

export const Route = createFileRoute("/fiscalite")({ component: FiscalPage });

function FiscalPage() {
  const state = useFinance();
  const s = useMemo(() => summarize(state), [state]);
  const deadlines = upcomingDeadlines(state.company.exercice);
  const display = state.display;
  const rate = state.company.tauxChange;
  const regime = activeRegime(state);
  const entity = state.entities.find((e) => e.id === state.activeEntityId);
  const ifu = entity?.ifu || state.company.ifu;

  return (
    <>
      <PageHeader
        kicker="DGI · CNSS · SYSCOHADA"
        title="Fiscalité"
        description={`${REGIME_LABELS[regime]} · IFU ${ifu || "à obtenir"}`}
        action={<PeriodSelect />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={`TVA ${TVA_STANDARD} % nette`} xof={s.tvaNette} hint="Collectée − déductible" />
        <Stat
          label={regime === "tps" ? `TPS ${TPS_TAUX * 100} %` : "IS / IMF"}
          xof={regime === "tps" ? s.tpsEstime : s.impotSocietes}
          hint={
            regime === "tps"
              ? "Sur le chiffre d'affaires"
              : `max(IS ${IS_TAUX * 100} %, IMF ${IMF_TAUX * 100} % du CA)`
          }
        />
        <Stat label="AIB net" xof={s.depAib - s.recAib} hint="À reverser − crédit ventes" />
        <Stat
          label="CNSS patronale"
          xof={s.cnssEstime}
          hint={s.salaires ? `${(CNSS_PATRONAL * 100).toFixed(1)} % sur salaires` : "D'après les écritures"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg">Liquidation TVA</h2>
          <p className="mt-1 text-sm text-muted">
            Taux normal 18 %. Les exonérations se saisissent à 0 % sur l'écriture.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <Line label="TVA collectée (ventes)" xof={s.recTva} />
            <Line label="TVA déductible (achats)" xof={s.depTva} />
            <div className="border-t border-line pt-3">
              <Line label="TVA nette à payer" xof={s.tvaNette} strong />
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="font-display text-lg">Impôt sur les sociétés</h2>
          <p className="mt-1 text-sm text-muted">
            Résultat fiscal approximatif (HT − charges − dotations). L'IMF s'applique si l'IS
            calculé lui est inférieur.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <Line label="Chiffre d'affaires HT" xof={s.ca} />
            <Line label="Résultat de la période" xof={s.resultat} />
            <Line label={`IS ${IS_TAUX * 100} %`} xof={s.isEstime} />
            <Line label={`IMF ${IMF_TAUX * 100} % du CA`} xof={s.imf} />
            <div className="border-t border-line pt-3">
              <Line
                label={regime === "tps" ? "TPS due" : "Charge d'impôt retenue"}
                xof={regime === "tps" ? s.tpsEstime : s.impotSocietes}
                strong
              />
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="font-display text-lg">AIB — acompte sur impôts</h2>
          <p className="mt-1 text-sm text-muted">
            1 % si le tiers a un IFU, 5 % sinon. Sur les achats : retenu et reversé à la DGI. Sur
            les ventes : retenu par le client, imputable.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <Line label="AIB retenu sur achats (dette DGI)" xof={s.depAib} />
            <Line label="AIB subi sur ventes (crédit)" xof={s.recAib} />
          </dl>
        </Card>

        <Card>
          <h2 className="font-display text-lg">Calendrier</h2>
          <ul className="mt-4 space-y-3">
            {deadlines.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  <span className="font-medium">{d.title}</span>
                  <span className="block text-xs text-subtle">{d.detail}</span>
                </span>
                <Badge tone="neutral">
                  {format(new Date(`${d.date}T00:00:00`), "d MMM", { locale: fr })}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <p className="mt-6 text-xs text-subtle">
        Outil de gestion, pas un substitut à la liasse DSF ni à un expert-comptable inscrit à
        l'ONECCA. Vérifiez les taux de la loi de finances en vigueur.
      </p>
    </>
  );

  function Line({
    label,
    xof,
    strong,
  }: {
    label: string;
    xof: number;
    strong?: boolean;
  }) {
    return (
      <div className="flex items-center justify-between gap-3">
        <dt className={strong ? "font-medium" : "text-muted"}>{label}</dt>
        <dd>
          <Money
            xof={xof}
            rate={rate}
            display={display}
            size="sm"
            signed
            className="text-right"
          />
        </dd>
      </div>
    );
  }
}

function Stat({
  label,
  xof,
  hint,
}: {
  label: string;
  xof: number;
  hint?: string;
}) {
  const display = useFinance((s) => s.display);
  const rate = useFinance((s) => s.company.tauxChange);
  return (
    <Card className="p-4">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <Money xof={xof} rate={rate} display={display} size="lg" className="mt-2" signed />
      {hint ? <p className="mt-2 text-xs text-subtle">{hint}</p> : null}
    </Card>
  );
}

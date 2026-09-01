import { createFileRoute } from "@tanstack/react-router";
import { Building2, GraduationCap, Pencil, Sprout, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import {
  ENTITY_KIND_LABELS,
  ENTITY_STATUS_LABELS,
  FORME_LABELS,
  REGIME_LABELS,
} from "@/lib/categories";
import { PARITE_EUR_XOF, formatParite } from "@/lib/money";
import { useFinance } from "@/lib/store";
import type {
  Entity,
  EntityKind,
  EntityStatus,
  FormeJuridique,
  RegimeFiscal,
} from "@/lib/types";

export const Route = createFileRoute("/societe")({ component: CompanyPage });

const KIND_ICON: Record<EntityKind, typeof Building2> = {
  holding: Building2,
  formation: GraduationCap,
  pepiniere: Sprout,
  commerce: Store,
};

function CompanyPage() {
  const company = useFinance((s) => s.company);
  const entities = useFinance((s) => s.entities);
  const setCompany = useFinance((s) => s.setCompany);
  const setActiveEntity = useFinance((s) => s.setActiveEntity);
  const resetDemo = useFinance((s) => s.resetDemo);
  const [editing, setEditing] = useState<Entity | null>(null);

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const taux = Number(String(fd.get("tauxChange")).replace(",", ".")) || PARITE_EUR_XOF;
    setCompany({
      name: String(fd.get("name")),
      ifu: String(fd.get("ifu")),
      rccm: String(fd.get("rccm")),
      forme: String(fd.get("forme")) as FormeJuridique,
      regime: String(fd.get("regime")) as RegimeFiscal,
      adresse: String(fd.get("adresse")),
      ville: String(fd.get("ville")),
      telephone: String(fd.get("telephone")),
      email: String(fd.get("email")),
      exercice: Number(fd.get("exercice")) || 2026,
      tauxChange: taux,
      capitalXof: Number(String(fd.get("capitalXof")).replace(/\s/g, "")) || 0,
      activite: String(fd.get("activite")),
    });
    toast.success("Fiche holding enregistrée.");
  }

  return (
    <>
      <PageHeader
        kicker="Azaka Group"
        title="Groupe"
        description="Holding, Azakaedu Code, pépinière et commerce de proximité. Les données restent dans ce navigateur."
      />

      <h2 className="mb-3 font-display text-xl">Activités</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {entities.map((e) => {
          const Icon = KIND_ICON[e.kind];
          return (
            <article
              key={e.id}
              className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(28,25,21,0.06)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-surface-2 text-cover">
                  <Icon className="size-4" />
                </span>
                <Badge tone={e.status === "en_creation" ? "warn" : "ok"}>
                  {ENTITY_STATUS_LABELS[e.status]}
                </Badge>
              </div>
              <h3 className="mt-3 font-display text-xl">{e.name}</h3>
              <p className="text-sm text-muted">{ENTITY_KIND_LABELS[e.kind]}</p>
              <p className="mt-2 text-sm text-subtle">{e.activite}</p>
              <p className="mt-3 text-xs text-subtle">
                {e.forme}
                {e.ifu ? ` · IFU ${e.ifu}` : " · IFU à obtenir"}
                {" · "}
                {REGIME_LABELS[e.regime]}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setActiveEntity(e.id)}>
                  Filtrer le tableau
                </Button>
                <Button
                  size="iconSm"
                  variant="ghost"
                  aria-label="Modifier l'activité"
                  onClick={() => setEditing(e)}
                >
                  <Pencil />
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <form onSubmit={save} className="grid gap-4">
        <Card className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h2 className="font-display text-lg">Identité de la holding</h2>
            <p className="text-sm text-muted">Fiche Azaka Group — IFU, RCCM, régime et parité.</p>
          </div>
          <div className="sm:col-span-2">
            <Field label="Raison sociale" htmlFor="name">
              <Input id="name" name="name" defaultValue={company.name} required />
            </Field>
          </div>
          <Field label="Forme juridique" htmlFor="forme">
            <NativeSelect id="forme" name="forme" defaultValue={company.forme}>
              {Object.entries(FORME_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Régime fiscal" htmlFor="regime">
            <NativeSelect id="regime" name="regime" defaultValue={company.regime}>
              {Object.entries(REGIME_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="IFU" htmlFor="ifu">
            <Input id="ifu" name="ifu" defaultValue={company.ifu} />
          </Field>
          <Field label="RCCM" htmlFor="rccm">
            <Input id="rccm" name="rccm" defaultValue={company.rccm} />
          </Field>
          <Field label="Adresse" htmlFor="adresse">
            <Input id="adresse" name="adresse" defaultValue={company.adresse} />
          </Field>
          <Field label="Ville" htmlFor="ville">
            <Input id="ville" name="ville" defaultValue={company.ville} />
          </Field>
          <Field label="Téléphone" htmlFor="telephone">
            <Input id="telephone" name="telephone" defaultValue={company.telephone} />
          </Field>
          <Field label="E-mail" htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={company.email} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Activité" htmlFor="activite">
              <Textarea id="activite" name="activite" defaultValue={company.activite} />
            </Field>
          </div>
        </Card>

        <Card className="grid gap-4 sm:grid-cols-2">
          <Field label="Exercice" htmlFor="exercice">
            <Input
              id="exercice"
              name="exercice"
              type="number"
              defaultValue={company.exercice}
            />
          </Field>
          <Field label="Capital social (F CFA)" htmlFor="capitalXof">
            <Input
              id="capitalXof"
              name="capitalXof"
              defaultValue={company.capitalXof}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Taux EUR → XOF"
              htmlFor="tauxChange"
              hint={`Parité officielle BCEAO : ${formatParite(PARITE_EUR_XOF)}. Modifiable si vous suivez un cours de caisse.`}
            >
              <Input
                id="tauxChange"
                name="tauxChange"
                defaultValue={company.tauxChange}
              />
            </Field>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit">Enregistrer la fiche</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetDemo();
              toast.success("Données de démonstration Azaka Group restaurées.");
            }}
          >
            Restaurer l'exemple Azaka
          </Button>
        </div>
      </form>

      <EntityDialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        initial={editing}
      />
    </>
  );
}

function EntityDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Entity | null;
}) {
  const upsertEntity = useFinance((s) => s.upsertEntity);
  const [form, setForm] = useState<Entity | null>(initial);

  useEffect(() => {
    if (open) setForm(initial ? { ...initial } : null);
  }, [open, initial]);

  if (!form) return null;

  function patch<K extends keyof Entity>(key: K, value: Entity[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    upsertEntity(form);
    toast.success("Activité mise à jour.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={`Modifier ${form.name}`} description="Identité et régime de l'activité.">
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Nom" htmlFor="ent-name">
            <Input
              id="ent-name"
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
              required
            />
          </Field>
          <Field label="Statut" htmlFor="ent-st">
            <NativeSelect
              id="ent-st"
              value={form.status}
              onChange={(e) => patch("status", e.target.value as EntityStatus)}
            >
              {Object.entries(ENTITY_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Forme" htmlFor="ent-forme">
            <NativeSelect
              id="ent-forme"
              value={form.forme}
              onChange={(e) => patch("forme", e.target.value as FormeJuridique)}
            >
              {Object.entries(FORME_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Régime" htmlFor="ent-reg">
            <NativeSelect
              id="ent-reg"
              value={form.regime}
              onChange={(e) => patch("regime", e.target.value as RegimeFiscal)}
            >
              {Object.entries(REGIME_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="IFU" htmlFor="ent-ifu">
            <Input id="ent-ifu" value={form.ifu} onChange={(e) => patch("ifu", e.target.value)} />
          </Field>
          <Field label="RCCM" htmlFor="ent-rccm">
            <Input
              id="ent-rccm"
              value={form.rccm}
              onChange={(e) => patch("rccm", e.target.value)}
            />
          </Field>
          <Field label="Activité" htmlFor="ent-act">
            <Textarea
              id="ent-act"
              value={form.activite}
              onChange={(e) => patch("activite", e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

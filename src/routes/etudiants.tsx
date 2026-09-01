import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, Pencil, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, PeriodSelect } from "@/components/app-shell";
import { Money } from "@/components/money-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import {
  EID,
  FEE_PERIOD_LABELS,
  PAYMENT_LABELS,
  PROGRAMS,
  STUDENT_STATUS_LABELS,
} from "@/lib/categories";
import { forEntity, inPeriod, periodLabel } from "@/lib/fiscal";
import { parseAmount, splitTax } from "@/lib/money";
import { useFinance } from "@/lib/store";
import { dueFees, paidFees, periodLabelFr, studentName, studentTotals } from "@/lib/students";
import type {
  Contribution,
  Currency,
  FeePeriod,
  PaymentMethod,
  Student,
  StudentStatus,
} from "@/lib/types";
import { uid } from "@/lib/utils";

export const Route = createFileRoute("/etudiants")({ component: StudentsPage });

function StudentsPage() {
  const students = useFinance((s) => s.students);
  const contributions = useFinance((s) => s.contributions);
  const period = useFinance((s) => s.period);
  const activeEntityId = useFinance((s) => s.activeEntityId);
  const entities = useFinance((s) => s.entities);
  const display = useFinance((s) => s.display);
  const rate = useFinance((s) => s.company.tauxChange);
  const removeStudent = useFinance((s) => s.removeStudent);
  const setActiveEntity = useFinance((s) => s.setActiveEntity);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [program, setProgram] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [paying, setPaying] = useState<{ student: Student; contribution?: Contribution } | null>(
    null,
  );

  const scopedStudents = useMemo(() => {
    const eid =
      activeEntityId === "all" || activeEntityId === EID.edu ? EID.edu : activeEntityId;
    return forEntity(students, eid);
  }, [students, activeEntityId]);

  const scopedContrib = useMemo(
    () => contributions.filter((c) => scopedStudents.some((s) => s.id === c.studentId)),
    [contributions, scopedStudents],
  );

  const rows = useMemo(() => {
    return scopedStudents
      .filter((s) => (status === "all" ? true : s.status === status))
      .filter((s) => (program === "all" ? true : s.program === program))
      .filter((s) => {
        if (!q.trim()) return true;
        const hay = `${s.firstName} ${s.lastName} ${s.phone} ${s.email} ${s.cohort}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName, "fr"));
  }, [scopedStudents, status, program, q]);

  const totals = useMemo(
    () => studentTotals(scopedStudents, scopedContrib, period),
    [scopedStudents, scopedContrib, period],
  );

  const relances = useMemo(() => {
    return scopedContrib
      .filter((c) => c.status === "due" && inPeriod(c.date, period))
      .map((c) => ({
        contribution: c,
        student: scopedStudents.find((s) => s.id === c.studentId),
      }))
      .filter((x): x is { contribution: Contribution; student: Student } => !!x.student)
      .sort((a, b) => a.contribution.date.localeCompare(b.contribution.date));
  }, [scopedContrib, scopedStudents, period]);

  const eduOnly = activeEntityId === "all" || activeEntityId === EID.edu;
  const other = entities.find((e) => e.id === activeEntityId);

  if (!eduOnly) {
    return (
      <>
        <PageHeader
          kicker="Azakaedu Code"
          title="Étudiants"
          description="Le suivi des promotions et des cotisations appartient à Azakaedu Code."
        />
        <Card className="py-16 text-center">
          <p className="font-display text-xl">Pas d’étudiants sur {other?.name}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Les cotisations de formation sont encaissées par Azakaedu Code. Basculez d’activité
            pour les suivre.
          </p>
          <Button className="mt-6" onClick={() => setActiveEntity(EID.edu)}>
            Voir Azakaedu Code
          </Button>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Azakaedu Code"
        title="Étudiants"
        description={`Promotions, cotisations et relances · ${periodLabel(period)}`}
        action={
          <>
            <PeriodSelect />
            <Button onClick={() => setCreating(true)}>
              <UserPlus /> Nouvel étudiant
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Mini label="Effectif actif" value={`${totals.actifs}`} hint={`${scopedStudents.length} au total`} />
        <MiniMoney label="Cotisations encaissées" xof={totals.paid} hint={periodLabel(period)} />
        <MiniMoney label="Cotisations dues" xof={totals.due} hint={`${relances.length} relance${relances.length > 1 ? "s" : ""}`} />
        <Mini
          label="Taux d'encaissement"
          value={
            totals.paid + totals.due > 0
              ? `${Math.round((totals.paid / (totals.paid + totals.due)) * 100)} %`
              : "—"
          }
          hint="Payé / (payé + dû)"
        />
      </div>

      {relances.length > 0 ? (
        <Card className="mt-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg">Relances</h2>
              <p className="text-sm text-muted">Cotisations dues sur la période</p>
            </div>
            <Money xof={totals.due} rate={rate} display={display} size="sm" />
          </div>
          <ul className="divide-y divide-line">
            {relances.map(({ student, contribution }) => (
              <li
                key={contribution.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{studentName(student)}</p>
                  <p className="text-xs text-subtle">
                    {contribution.periodLabel} · {student.program}
                    {contribution.notes ? ` · ${contribution.notes}` : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Money
                    xof={contribution.ttcXof - contribution.paidXof}
                    rate={rate}
                    display={display}
                    size="sm"
                    className="text-right"
                  />
                  <Button
                    size="sm"
                    onClick={() => setPaying({ student, contribution })}
                  >
                    <Banknote /> Encaisser
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="mt-5 mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input
            className="pl-9"
            placeholder="Nom, téléphone, promo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <NativeSelect
          className="sm:w-44"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Statut"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(STUDENT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          className="sm:w-52"
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          aria-label="Programme"
        >
          <option value="all">Tous les programmes</option>
          {PROGRAMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </NativeSelect>
        <Button className="sm:hidden" onClick={() => setCreating(true)}>
          <Plus /> Ajouter
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <p className="font-display text-xl">Aucun étudiant</p>
          <p className="mt-2 text-sm text-muted">
            {q || status !== "all" || program !== "all"
              ? "Aucun résultat pour ces filtres."
              : "Ajoutez un premier étudiant à suivre."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((st) => {
            const paid = paidFees(st.id, scopedContrib, period);
            const due = dueFees(st.id, scopedContrib, period);
            return (
              <article
                key={st.id}
                className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(28,25,21,0.06)] sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-medium">{studentName(st)}</h3>
                      <Badge
                        tone={
                          st.status === "actif"
                            ? "ok"
                            : st.status === "suspendu"
                              ? "warn"
                              : st.status === "abandon"
                                ? "danger"
                                : "cover"
                        }
                      >
                        {STUDENT_STATUS_LABELS[st.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {st.program} · {st.cohort}
                    </p>
                    <p className="text-xs text-subtle">
                      {st.phone}
                      {st.email ? ` · ${st.email}` : ""}
                      {" · "}
                      {FEE_PERIOD_LABELS[st.feePeriod]}{" "}
                      {st.feeXof.toLocaleString("fr-FR")} F CFA
                    </p>
                  </div>
                  <div className="grid min-w-0 grid-cols-2 gap-4 sm:text-right">
                    <div>
                      <p className="text-xs text-muted">Encaissé</p>
                      <Money xof={paid} rate={rate} display={display} size="sm" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Dû</p>
                      <Money xof={due} rate={rate} display={display} size="sm" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaying({ student: st })}
                  >
                    <Banknote /> Encaisser
                  </Button>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label="Modifier"
                    onClick={() => setEditing(st)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label="Supprimer"
                    onClick={() => {
                      removeStudent(st.id);
                      toast.success(`${studentName(st)} retiré du suivi.`);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-subtle">
        Chaque encaissement crée une recette « Cotisations de formation » (706F) dans{" "}
        <Link to="/recettes" className="font-medium text-cover">
          Recettes
        </Link>
        .
      </p>

      <StudentDialog open={creating} onOpenChange={setCreating} />
      <StudentDialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        initial={editing}
      />
      <CollectDialog
        open={!!paying}
        onOpenChange={(v) => {
          if (!v) setPaying(null);
        }}
        student={paying?.student ?? null}
        contribution={paying?.contribution}
      />
    </>
  );
}

function Mini({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-2xl font-medium tracking-tight">{value}</p>
      {hint ? <p className="mt-2 text-xs text-subtle">{hint}</p> : null}
    </Card>
  );
}

function MiniMoney({ label, xof, hint }: { label: string; xof: number; hint?: string }) {
  const display = useFinance((s) => s.display);
  const rate = useFinance((s) => s.company.tauxChange);
  return (
    <Card className="p-4">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <Money xof={xof} rate={rate} display={display} size="lg" className="mt-2" />
      {hint ? <p className="mt-2 text-xs text-subtle">{hint}</p> : null}
    </Card>
  );
}

function StudentDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Student | null;
}) {
  const upsertStudent = useFinance((s) => s.upsertStudent);
  const upsertContribution = useFinance((s) => s.upsertContribution);
  const accounts = useFinance((s) => s.accounts);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    program: PROGRAMS[0],
    cohort: "Promo 2026-A",
    enrolledAt: new Date().toISOString().slice(0, 10),
    status: "actif" as StudentStatus,
    feeXof: "75000",
    feePeriod: "mois" as FeePeriod,
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        firstName: initial.firstName,
        lastName: initial.lastName,
        phone: initial.phone,
        email: initial.email,
        program: initial.program,
        cohort: initial.cohort,
        enrolledAt: initial.enrolledAt,
        status: initial.status,
        feeXof: String(initial.feeXof),
        feePeriod: initial.feePeriod,
        notes: initial.notes,
      });
    } else {
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        program: PROGRAMS[0],
        cohort: "Promo 2026-A",
        enrolledAt: new Date().toISOString().slice(0, 10),
        status: "actif",
        feeXof: "75000",
        feePeriod: "mois",
        notes: "",
      });
    }
  }, [open, initial]);

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Indiquez le nom de l'étudiant.");
      return;
    }
    const fee = parseAmount(form.feeXof) || 0;
    const id = initial?.id ?? uid("st");
    upsertStudent({
      id,
      entityId: EID.edu,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      program: form.program,
      cohort: form.cohort.trim() || "Promo",
      enrolledAt: form.enrolledAt,
      status: form.status,
      feeXof: fee,
      feePeriod: form.feePeriod,
      notes: form.notes,
    });
    if (!initial && fee > 0) {
      const { ht, tva, ttc } = splitTax(fee, 0, "ht");
      const acc =
        accounts.find((a) => a.entityId === EID.edu && a.type === "mobile_money") ??
        accounts.find((a) => a.entityId === EID.edu);
      upsertContribution({
        studentId: id,
        entityId: EID.edu,
        date: form.enrolledAt,
        periodLabel:
          form.feePeriod === "formation"
            ? "Forfait formation"
            : periodLabelFr(form.enrolledAt),
        enteredAmount: fee,
        enteredCurrency: "XOF",
        htXof: ht,
        tvaRate: 0,
        tvaXof: tva,
        ttcXof: ttc,
        paidXof: 0,
        payment: "mobile_money",
        accountId: acc?.id ?? "acc-edu-momo",
        status: "due",
        notes: "Première échéance",
      });
    }
    toast.success(initial ? "Fiche mise à jour." : "Étudiant ajouté.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        wide
        title={initial ? "Modifier l'étudiant" : "Nouvel étudiant"}
        description="Fiche de suivi Azakaedu Code — la cotisation peut être encaissée ensuite."
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" htmlFor="st-fn">
            <Input
              id="st-fn"
              value={form.firstName}
              onChange={(e) => patch("firstName", e.target.value)}
              required
            />
          </Field>
          <Field label="Nom" htmlFor="st-ln">
            <Input
              id="st-ln"
              value={form.lastName}
              onChange={(e) => patch("lastName", e.target.value)}
              required
            />
          </Field>
          <Field label="Téléphone" htmlFor="st-ph">
            <Input
              id="st-ph"
              value={form.phone}
              onChange={(e) => patch("phone", e.target.value)}
              placeholder="+229 01 …"
            />
          </Field>
          <Field label="E-mail" htmlFor="st-em">
            <Input
              id="st-em"
              type="email"
              value={form.email}
              onChange={(e) => patch("email", e.target.value)}
            />
          </Field>
          <Field label="Programme" htmlFor="st-pr">
            <NativeSelect
              id="st-pr"
              value={form.program}
              onChange={(e) => patch("program", e.target.value)}
            >
              {PROGRAMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Promotion" htmlFor="st-co">
            <Input
              id="st-co"
              value={form.cohort}
              onChange={(e) => patch("cohort", e.target.value)}
            />
          </Field>
          <Field label="Date d'inscription" htmlFor="st-en">
            <Input
              id="st-en"
              type="date"
              value={form.enrolledAt}
              onChange={(e) => patch("enrolledAt", e.target.value)}
              required
            />
          </Field>
          <Field label="Statut" htmlFor="st-st">
            <NativeSelect
              id="st-st"
              value={form.status}
              onChange={(e) => patch("status", e.target.value as StudentStatus)}
            >
              {Object.entries(STUDENT_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Cotisation (F CFA)" htmlFor="st-fee">
            <Input
              id="st-fee"
              inputMode="decimal"
              value={form.feeXof}
              onChange={(e) => patch("feeXof", e.target.value)}
            />
          </Field>
          <Field label="Périodicité" htmlFor="st-per">
            <NativeSelect
              id="st-per"
              value={form.feePeriod}
              onChange={(e) => patch("feePeriod", e.target.value as FeePeriod)}
            >
              {Object.entries(FEE_PERIOD_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes" htmlFor="st-notes">
              <Textarea
                id="st-notes"
                value={form.notes}
                onChange={(e) => patch("notes", e.target.value)}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{initial ? "Enregistrer" : "Ajouter"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CollectDialog({
  open,
  onOpenChange,
  student,
  contribution,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: Student | null;
  contribution?: Contribution;
}) {
  const collectFee = useFinance((s) => s.collectFee);
  const accounts = useFinance((s) => s.accounts);
  const eduAccounts = accounts.filter((a) => a.entityId === EID.edu);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("XOF");
  const [payment, setPayment] = useState<PaymentMethod>("mobile_money");
  const [accountId, setAccountId] = useState("acc-edu-momo");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !student) return;
    const today = new Date().toISOString().slice(0, 10);
    const accs = accounts.filter((a) => a.entityId === EID.edu);
    setDate(contribution?.date ?? today);
    setPeriod(
      contribution?.periodLabel ??
        (student.feePeriod === "formation" ? "Forfait formation" : periodLabelFr(today)),
    );
    setAmount(String(contribution?.enteredAmount ?? student.feeXof));
    setCurrency(contribution?.enteredCurrency ?? "XOF");
    setPayment(contribution?.payment ?? "mobile_money");
    setAccountId(
      contribution?.accountId ??
        accs.find((a) => a.type === "mobile_money")?.id ??
        accs[0]?.id ??
        "acc-edu-momo",
    );
    setNotes(contribution?.notes ?? "");
  }, [open, student, contribution, accounts]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    const amt = parseAmount(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Montant invalide.");
      return;
    }
    collectFee({
      contributionId: contribution?.id,
      studentId: student.id,
      date,
      periodLabel: period.trim() || periodLabelFr(date),
      enteredAmount: amt,
      enteredCurrency: currency,
      payment,
      accountId,
      notes,
    });
    toast.success(`Cotisation encaissée — ${studentName(student)}.`);
    onOpenChange(false);
  }

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Encaisser — ${studentName(student)}`}
        description="Crée une recette 706F sur Azakaedu Code, en F CFA ou en euros."
      >
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Période" htmlFor="cot-per">
            <Input
              id="cot-per"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Août 2026"
              required
            />
          </Field>
          <Field label="Date d'encaissement" htmlFor="cot-date">
            <Input
              id="cot-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Montant" htmlFor="cot-amt">
              <Input
                id="cot-amt"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Field>
            <Field label="Devise" htmlFor="cot-cur">
              <NativeSelect
                id="cot-cur"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                <option value="XOF">F CFA</option>
                <option value="EUR">Euro</option>
              </NativeSelect>
            </Field>
          </div>
          <Field label="Règlement" htmlFor="cot-pay">
            <NativeSelect
              id="cot-pay"
              value={payment}
              onChange={(e) => setPayment(e.target.value as PaymentMethod)}
            >
              {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Compte" htmlFor="cot-acc">
            <NativeSelect
              id="cot-acc"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {eduAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Notes" htmlFor="cot-notes">
            <Textarea
              id="cot-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Encaisser</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

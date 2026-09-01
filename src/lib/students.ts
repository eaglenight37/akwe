import { inPeriod, periodBounds } from "./fiscal";
import type { Contribution, Period, Student } from "./types";

export const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function studentName(s: Student): string {
  return `${s.firstName} ${s.lastName}`;
}

export function periodLabelFr(date: string): string {
  const [y, m] = date.split("-").map(Number);
  if (!y || !m) return date;
  return `${MONTHS_FR[m - 1]} ${y}`;
}

export function monthsDue(student: Student, period: Period): number {
  if (student.feePeriod === "formation") {
    return inPeriod(student.enrolledAt, period) ? 1 : 0;
  }
  const enrolled = new Date(`${student.enrolledAt}T00:00:00`);
  const { from, to } = periodBounds(period);
  const start = enrolled > from ? enrolled : from;
  if (start > to) return 0;
  const months =
    (to.getFullYear() - start.getFullYear()) * 12 +
    (to.getMonth() - start.getMonth()) +
    1;
  if (student.feePeriod === "trimestre") return Math.max(0, Math.ceil(months / 3));
  return Math.max(0, months);
}

export function expectedFees(student: Student, period: Period): number {
  return student.feeXof * monthsDue(student, period);
}

export function paidFees(
  studentId: string,
  contributions: Contribution[],
  period: Period,
): number {
  return contributions
    .filter(
      (c) =>
        c.studentId === studentId &&
        c.status !== "due" &&
        inPeriod(c.date, period),
    )
    .reduce((s, c) => s + c.paidXof, 0);
}

export function dueFees(
  studentId: string,
  contributions: Contribution[],
  period: Period,
): number {
  return contributions
    .filter(
      (c) =>
        c.studentId === studentId &&
        c.status === "due" &&
        inPeriod(c.date, period),
    )
    .reduce((s, c) => s + (c.ttcXof - c.paidXof), 0);
}

export function studentTotals(
  students: Student[],
  contributions: Contribution[],
  period: Period,
) {
  const paid = students.reduce(
    (s, st) => s + paidFees(st.id, contributions, period),
    0,
  );
  const due = students.reduce(
    (s, st) => s + dueFees(st.id, contributions, period),
    0,
  );
  const expected = students.reduce((s, st) => s + expectedFees(st, period), 0);
  return { paid, due, expected, actifs: students.filter((s) => s.status === "actif").length };
}

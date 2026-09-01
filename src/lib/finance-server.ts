import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { createDemoState } from "@/lib/seed";
import type { AppState } from "@/lib/types";

function asState(raw: unknown): AppState | null {
  if (typeof raw === "string") {
    try {
      return asState(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<AppState>;
  if (!s.company || typeof s.company.name !== "string") return null;
  if (!Array.isArray(s.entities) || !Array.isArray(s.transactions)) return null;
  return s as AppState;
}

function payload(state: AppState): string {
  return JSON.stringify(state);
}

export const loadFinance = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((seed: unknown) => seed)
  .handler(async ({ context, data: seed }) => {
    const sql = await getSql();
    const rows = await sql<{ state: unknown }>`
      select state from finance_state where user_id = ${context.userId}
    `;
    const existing = asState(rows[0]?.state);
    if (existing) return existing;
    const initial = asState(seed) ?? createDemoState();
    await sql.query(
      `insert into finance_state (user_id, state) values ($1, $2::jsonb)
       on conflict (user_id) do nothing`,
      [context.userId, payload(initial)],
    );
    return initial;
  });

export const saveFinance = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const state = asState(raw);
    if (!state) throw new Error("État financier invalide");
    return state;
  })
  .handler(async ({ context, data: state }) => {
    const sql = await getSql();
    await sql.query(
      `insert into finance_state (user_id, state) values ($1, $2::jsonb)
       on conflict (user_id) do update
         set state = excluded.state, updated_at = now()`,
      [context.userId, payload(state)],
    );
    return { ok: true as const };
  });

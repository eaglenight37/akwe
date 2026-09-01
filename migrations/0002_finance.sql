-- Per-user Akwɛ snapshot (JSON). Scoped by Better Auth user id (text).
create table if not exists finance_state (
  user_id    text primary key,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

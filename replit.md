# SOS Mulher

A premium full-stack mobile safety app for women in vulnerable situations, built with Expo + PostgreSQL.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 on port 8080, paths under `/api`
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Mobile: Expo (React Native + Expo Router)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB tables: `users`, `emergencyContacts`, `communityPosts`, `settings`, `alerts`, `alertNotifications`
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for API)
- `lib/api-client-react/src/` — generated React Query hooks
- `lib/api-zod/src/` — generated Zod schemas for server validation
- `artifacts/api-server/src/`
  - `models/` — Class-based models: `UserModel`, `AlertModel`
  - `services/` — Business logic: `AuthService`, `AlertService`
  - `controllers/` — HTTP handlers: `alertController`, `authController`
  - `routes/` — Express routes: health, users, contacts, posts, settings, alerts, auth
- `artifacts/mobile/app/` — Expo Router screens
  - `onboarding.tsx` — 3-step onboarding with CPF field, gender selector, anti-male redirect
  - `restricted.tsx` — "Acesso Restrito" screen (shown to "Homem" gender registrations)
  - `(tabs)/index.tsx` — SOS Dashboard (1.5s long-press → POST /api/alerts, check-in accordion)
  - `(tabs)/history.tsx` — Real alert history from DB (useListUserAlerts)
  - `(tabs)/community.tsx` — Community feed
  - `(tabs)/contacts.tsx` — Emergency contacts + official helplines
  - `(tabs)/profile.tsx` — Profile + settings accordions (persisted to DB)
- `artifacts/mobile/constants/colors.ts` — Dark theme tokens
- `artifacts/mobile/hooks/useColors.ts` — Always returns dark theme

## Architecture decisions

- **Always dark theme**: `useColors()` hook always returns the dark palette (`#1c1c1e` bg, `#2c2c2e` cards, `#e63946` crimson). No system-light-mode fallback.
- **Contract-first API**: OpenAPI spec → Orval codegen → typed React Query hooks. Add endpoints to `openapi.yaml` first, then run codegen.
- **Class-Based MVC backend**: Models → Services → Controllers → Routes pattern. Models wrap Drizzle queries, Services contain business logic, Controllers handle HTTP I/O.
- **Settings table**: All toggle/timer/security settings persist to the `settings` DB table (upsert on every change). No localStorage for settings.
- **UserContext**: Stores only `userId` + `userName` in AsyncStorage for session persistence; all other user data is fetched from DB.
- **5-tab custom tab bar**: Custom `tabBar` prop with elevated SOS center button. Tab order: Histórico | Comunidade | SOS | Contatos | Perfil.
- **queryKey required**: TanStack Query v5 requires explicit `queryKey` in `UseQueryOptions`. Always pass `queryKey: getXxxQueryKey(...)` alongside `enabled` in hook options.
- **Anti-male register rule**: POST /api/users with `gender: "Homem"` returns 403 `{error:"restricted",redirect:"/acesso-restrito"}`. Frontend redirects to `/restricted` screen.
- **SOS Two-Phase Escalation**: Phase 1 (POST /api/alerts) creates alert + simulates SMS to all contacts → status `sms_sent`. Phase 2 (setTimeout) simulates cloud calls after timerDuration → status `calling_cloud`. Phase 3 (PUT /api/alerts/:id/webhook/respond) resolves with digit "1" → status `resolved_by_contact`.
- **PostgreSQL not MySQL**: We use Replit's built-in PostgreSQL (functionally equivalent to the university's MySQL spec). Drizzle ORM handles the schema.
- **New Zod schemas in controllers**: Controllers import `CreateAlertBody`, `WebhookRespondBody`, `RecoverAccountBody` from `@workspace/api-zod` (generated). Do NOT use `zod/v4` directly in `artifacts/api-server` — it's not a direct dependency there.

## Product

- Onboarding: 3-step (intro → disclaimer → profile with CPF + gender selector Mulher/Não-binária/Homem)
- If gender = "Homem" → redirect to "Acesso Restrito" screen (no DB record created)
- SOS Dashboard: greeting + "SOS MULHER" badge, GPS/contacts status cards, large glowing SOS button (1.5s hold → creates real DB alert), check-in accordion
- Histórico: Real alert history from DB with status badges (pending/sms_sent/calling_cloud/resolved_by_contact)
- Comunidade: Community feed with chronological posts from DB
- Contatos: Official helplines (180/190/192) + up to 5 custom contacts from DB
- Perfil: Avatar card + 4 accordions (Dados Pessoais, Permissões, Segurança Avançada, Temporizador) — all persisted to DB settings table

## API Endpoints

### Auth
- `POST /api/auth/recover` — Account recovery by email (returns simulated token)

### Users
- `POST /api/users` — Create user (enforces anti-male rule, saves CPF)
- `GET /api/users/:userId` — Get user
- `PATCH /api/users/:userId` — Update user
- `POST /api/users/:userId/complete-onboarding` — Mark onboarding complete

### Alerts (SOS)
- `POST /api/alerts` — Create alert + Phase 1 SMS simulation
- `GET /api/alerts/user/:userId` — List user's alerts
- `PUT /api/alerts/:alertId/webhook/respond` — Phase 3 webhook (digit "1" resolves)
- `PUT /api/alerts/:alertId/resolve` — Manual resolve

### Contacts, Posts, Settings (existing)
- See OpenAPI spec for full list

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any DB schema change: run `pnpm --filter @workspace/db run push`, then `pnpm --filter @workspace/api-spec run codegen`, then `pnpm run typecheck:libs`. If push fails (TTY issue), use `psql "$DATABASE_URL" -c "..."` to apply changes directly.
- `lib/api-zod/src/index.ts` must only export `./generated/api` (no `./generated/types`) — set `indexFiles: false` in orval zod config
- Do NOT run `pnpm dev` at workspace root; use workflow restart
- Metro cache: if module resolution errors occur after codegen, delete `artifacts/mobile/.expo` and restart the mobile workflow
- `useColors()` always returns dark theme — intentional, not a bug
- Controllers in `artifacts/api-server` must import Zod schemas from `@workspace/api-zod`, NOT from `zod/v4` directly (zod is not a direct dep of api-server)
- `drizzle-kit push` requires interactive TTY — if running non-interactively, use `psql "$DATABASE_URL"` to apply DDL directly

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

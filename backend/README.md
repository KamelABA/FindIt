# FindIt – Backend

REST API for FindIt: **Node.js + Express 5**, database **Supabase (PostgreSQL)**.

The browser never talks to Supabase directly. Every table has Row Level Security on with no
policies, so only this server (which holds the secret key) can read or write data.

## 1. Create the database (once)

In the Supabase dashboard → **SQL Editor** → New query:

1. paste [`supabase/schema.sql`](supabase/schema.sql) → **Run** (tables, indexes, security)
2. paste [`supabase/seed.sql`](supabase/seed.sql) → **Run** (categories, example users, items, claims)

Both files can be run again safely: after pulling a new version, run them again to upgrade the database without losing data.

## 2. Run the API

```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env  → then fill in the keys
npm run dev               # http://localhost:5000/api
```

Needs Node 20.6 or newer (`.env` is read with `node --env-file`).

| `.env` variable | Meaning |
|---|---|
| `SUPABASE_URL` | `https://<project-id>.supabase.co` |
| `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_…`). Server only, never in the frontend or in git |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key. Not used yet, kept for the login work |
| `CORS_ORIGINS` | Frontend URLs allowed to call the API, comma-separated |
| `TEMP_EMAIL_LOGIN` | `true` = temporary admin access by email (see below). `false` in production |

## Database

| Table | Content |
|---|---|
| `users` | `full_name`, `email` (unique), `phone`, **`is_admin`**, `student_number`, `faculty`, `id_card_url` (uploaded student ID card), `registration_status` (pending / approved / rejected), `is_suspended`, `suspended_at` |
| `categories` | `slug`, `name_en`, `name_ar`, `sort_order` |
| `items` | lost / found publications: `type`, `category`, `location`, `event_date`, `images[]`, `moderation_status` (pending / approved / rejected), `lifecycle_status` (open / resolved / archived), `resolved_at`, `archived_at`, `is_active`, `publisher_id` |
| `claims` | "this is mine" requests: `item_id`, `claimant_id`, `message` (ownership explanation), `evidence_urls[]`, `status` (pending / approved / rejected / completed), `completed_at` |
| `activity_logs` | every admin action: `admin_id`, `action` (e.g. `item.approve`), `target_type`, `target_id`, `target_label`, `details` (reason, edited fields…), `created_at` |

The function `admin_stats(p_weeks)` computes the dashboard statistics in the database
(only the backend may call it).

A publication is **public** only when it is `approved`, `is_active` and `open`.
Completing a claim (`claim.complete`) marks its item `resolved`.

### Admins

An admin is a row of `users` with `is_admin = true`. Change it by hand in Supabase →
**Table Editor → users**. The example admin from `seed.sql` is `admin@findit.dz`.
Admin rights are never changed from the dashboard, and an admin account can't be suspended
from it (remove `is_admin` first). A suspended admin loses access to the dashboard.

### Temporary admin sign-in (until login / password exist)

The dashboard (`/admin` in the frontend) asks for an email and sends it in the `X-User-Email`
header. The API accepts it only if that account has `is_admin = true` and is not suspended.
This is **not secure** (knowing an admin email is enough), so it works only with `TEMP_EMAIL_LOGIN=true`.

When login is added: in `src/middleware/auth.js`, find the user from the session / token instead
of the email header and keep the `is_admin` / `is_suspended` checks; in the frontend, replace the
session in `src/pages/admin/AdminLayout.jsx` and delete `AccessForm.jsx`.
The registration form (Rafika) should save `student_number`, `faculty` and `id_card_url` and leave
`registration_status = 'pending'`: the admin approves or rejects it from the Users page.

## Endpoints

Public (only approved, active and open items are ever returned):

| Method | Route | Answer |
|---|---|---|
| GET | `/api/health` | `{ ok: true }` |
| GET | `/api/items?q=&category=&type=lost\|found&limit=20` | `{ data: Item[] }`, newest first |
| GET | `/api/items/:id` | `{ data: Item }`, 404 if missing / not approved / hidden / resolved / archived |
| GET | `/api/categories` | `{ data: Category[] }` |

Admin (header `X-User-Email` of an admin account). Lists are paged:
`?page=1&page_size=20` → `{ data, total, page, page_size }`.
Every action that changes data is written to `activity_logs`; actions accept an optional
`{ "note": "reason" }` body, saved with the log.

| Method | Route | Body / answer |
|---|---|---|
| GET | `/api/admin/me` | the admin account |
| GET | `/api/admin/stats?weeks=12` | `{ totals, period: { items, claims, users, recovered, weekly[], by_category[] } }` |
| GET | `/api/admin/items?type=&status=&lifecycle=&category=&q=` | all items, any status (paged) |
| GET | `/api/admin/items/:id` | the item with its claims |
| PATCH | `/api/admin/items/:id` | edit `{ title?, description?, type?, category?, location?, event_date? }` |
| POST | `/api/admin/items/:id/approve` · `reject` · `resolve` · `archive` · `reopen` | the updated item |
| POST | `/api/admin/items/archive-old` | `{ days = 30 }` → archives open items older than that |
| DELETE | `/api/admin/items/:id` | 204 (its claims are deleted too) |
| GET | `/api/admin/claims?status=&q=` | claims with item and claimant (paged) |
| GET | `/api/admin/claims/:id` | one claim, with evidence |
| POST | `/api/admin/claims/:id/approve` · `reject` · `complete` · `reopen` | the updated claim (409 if the move isn't allowed) |
| GET | `/api/admin/users?q=&status=&suspended=&role=admin\|student` | users (paged) |
| GET | `/api/admin/users/:id` | user, ID card, counters, latest publications |
| POST | `/api/admin/users/:id/approve` · `reject` · `suspend` · `unsuspend` | the updated user |
| GET | `/api/admin/logs?action=&admin_id=&q=` | activity logs (paged). `action` = `item.approve` or a group: `item`, `claim`, `user` |

Errors are `{ "error": "message" }` with the HTTP status (400, 401, 403, 404, 409, 500).

Item shape (what the frontend's `normalizeItem` reads):

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "type": "lost | found",
  "category": "electronics | personal | documents | clothing | university | accessories | other",
  "location": "string",
  "event_date": "YYYY-MM-DD",
  "images": ["url"],
  "moderation_status": "pending | approved | rejected",
  "lifecycle_status": "open | resolved | archived",
  "is_active": true,
  "resolved_at": "ISO date | null",
  "archived_at": "ISO date | null",
  "created_at": "ISO date",
  "updated_at": "ISO date",
  "publisher": { "id": "uuid", "name": "string", "email": "string", "phone": "string | null" }
}
```

## Files

| Path | Role |
|---|---|
| `src/server.js` | starts the server |
| `src/app.js` | Express app: CORS, JSON, routes, errors |
| `src/config.js` | reads `.env` |
| `src/lib/supabase.js` | Supabase client (secret key) |
| `src/lib/http.js` | `HttpError`, validation, search filter, paging |
| `src/lib/items.js` | item columns and response shape |
| `src/lib/activity.js` | `logActivity()`: writes the activity log |
| `src/middleware/auth.js` | `requireAdmin` (temporary email check + `is_admin` + not suspended) |
| `src/middleware/errors.js` | 404 and error responses |
| `src/routes/items.js`, `categories.js` | public endpoints |
| `src/routes/admin/` | `index.js` (guard), `stats.js`, `items.js`, `claims.js`, `users.js`, `logs.js` |
| `supabase/schema.sql`, `supabase/seed.sql` | database structure and example data (both safe to run again) |

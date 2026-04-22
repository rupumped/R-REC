# REX Web App

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 3 (SSR + serverless API routes) |
| UI | Vue 3, Tailwind CSS, Chart.js |
| Auth | nuxt-auth-utils (encrypted session cookies) |
| Database | Neon (serverless Postgres) + Drizzle ORM |
| File storage | Cloudflare R2 (presigned PUT, browser-direct) |
| Deployment | Vercel (serverless) |
| Blockchain data | Public JSON files on Polygon; polygonscan links |

---

## Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) project
- A [Cloudflare R2](https://dash.cloudflare.com/) bucket with public access enabled
- A [Vercel](https://vercel.com) account

---

## Local development

### 1. Configure environment

Copy `.env.example` to `.env` and fill in every value:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon connection string (`postgresql://...`) |
| `NUXT_SESSION_PASSWORD` | ≥32-char random string for cookie encryption |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public base URL for the bucket (e.g. `https://pub-xxx.r2.dev`) |
| `NUXT_PUBLIC_COMPANIES_URL` | URL to `companies.json` |
| `NUXT_PUBLIC_CONTRACTS_URL` | URL to `contracts.json` |
| `RETURN_WALLET` | Lowercase address of the REX return/settlement wallet |

Generate a session password:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Push the database schema

```bash
npm run db:push
```

This applies the Drizzle schema to your Neon database without needing a migration file.

### 3. Create the first admin user

```bash
DATABASE_URL="..." \
ADMIN_USERNAME="admin" \
ADMIN_EMAIL="admin@yourorg.com" \
ADMIN_PASSWORD="a-strong-password-12+" \
npm run seed:admin
```

This inserts the first `isAdmin=true` user. Subsequent users are created via the Admin → Users page in the app.

### 4. Start the dev server

```bash
npm run dev
```

Navigate to `http://localhost:3000/login` and sign in with the credentials you seeded.

---

## Neon setup

1. Create a project at [console.neon.tech](https://console.neon.tech).
2. Copy the **connection string** (pooled endpoint is fine for serverless).
3. Set it as `DATABASE_URL` in `.env`.
4. Run `npm run db:push` — Drizzle will create all tables automatically.

### Viewing data

```bash
npm run db:studio   # Opens Drizzle Studio at localhost:4983
```

---

## Cloudflare R2 setup

1. Go to **Cloudflare Dashboard → R2 → Create bucket**.
2. Enable **Public access** (allows the `R2_PUBLIC_URL` base URL to serve files).
3. Under **Manage R2 API tokens**, create a token with **Object Read & Write** permission scoped to your bucket.
4. Note the **Account ID**, **Access Key ID**, and **Secret Access Key**.
5. The public URL is shown in the bucket settings under "Public bucket URL".

Files are never routed through Vercel — the client receives a presigned PUT URL and uploads directly to R2.

---

## Axiom logging

Server-side request and error logs are sent to [Axiom](https://axiom.co) via `@axiomhq/pino`. This is optional — if the env vars are absent, logs fall back to stdout only.

| Variable | Description |
|---|---|
| `AXIOM_TOKEN` | Axiom API token with `ingest` permission |
| `AXIOM_DATASET` | Axiom dataset name to write logs into |

### Local development

Leave `AXIOM_TOKEN` and `AXIOM_DATASET` unset — the logger will write to stdout. No Axiom account is required for local dev.

### Production

Add both variables in the Vercel dashboard (**Settings → Environment Variables**). Logs will appear in the configured dataset in real time.

> **Note:** These variables are read directly from `process.env` at module load time and bypass Nuxt's `runtimeConfig` layer — do **not** prefix them with `NUXT_`.

---

## Vercel deployment

### One-time setup

```bash
npm i -g vercel
vercel login
vercel link        # Link to your Vercel project
```

### Set environment variables

In the Vercel dashboard (**Settings → Environment Variables**) add every variable from `.env.example`.

> **Important:** `NUXT_SESSION_PASSWORD` must be the same on every deployment — rotating it invalidates all active sessions.

### Deploy

```bash
vercel --prod
```

Or push to `main` — Vercel auto-deploys on merge.

### Nuxt preset

Vercel is detected automatically by Nuxt 3. No `nuxt.config.ts` changes are needed. API routes deploy as serverless functions; static assets are served from the CDN edge.

---

## Database migrations

After changing `server/db/schema.ts`:

```bash
npm run db:generate   # Generate a migration file
npm run db:migrate    # Apply pending migrations (CI/CD safe)
```

For rapid prototyping in development you can skip migration files and use:

```bash
npm run db:push       # Pushes schema directly (destructive changes prompt for confirmation)
```

---

## Public data files

`companies.json` and `contracts.json` are fetched client-side from the URLs set in `NUXT_PUBLIC_COMPANIES_URL` / `NUXT_PUBLIC_CONTRACTS_URL`. These are typically served from the same R2 bucket or a CDN. They are **not** stored in this repository.

For local development you can serve them from `public/`:

```bash
cp /path/to/companies.json public/companies.json
cp /path/to/contracts.json public/contracts.json
```

Then set:
```
NUXT_PUBLIC_COMPANIES_URL=http://localhost:3000/companies.json
NUXT_PUBLIC_CONTRACTS_URL=http://localhost:3000/contracts.json
```

---

## Project structure

```
webapp/
├── assets/css/main.css          # Global styles, OKLCH design tokens
├── components/
│   ├── admin/                   # Admin UI (OnboardingReview, OrdersQueue, CreateUser)
│   ├── buyer/                   # Buyer UI (GoalsPanel, OrderPanel)
│   ├── dashboard/               # Shared dashboard (HeaderBar, AssetsTable, ActivityTable…)
│   ├── generator/               # Generator UI (GenerationChart)
│   ├── icons/                   # Inline SVG icon components
│   └── onboarding/              # Onboarding form sub-components (DocUpload, PhotoUpload)
├── layouts/
│   ├── default.vue              # App shell with sidebar nav
│   └── auth.vue                 # Centred login layout
├── middleware/
│   ├── auth.global.ts           # Redirect unauthenticated → /login
│   └── admin.ts                 # Named middleware: redirect non-admin → /dashboard
├── pages/
│   ├── login.vue
│   ├── dashboard/
│   │   ├── index.vue            # Shared portfolio dashboard
│   │   ├── generator.vue        # Generation chart + onboarding history
│   │   ├── buyer.vue            # Goals + order placement
│   │   └── admin/               # Admin sub-pages
│   └── onboarding/index.vue     # 6-step generator onboarding form
├── scripts/
│   └── seed-admin.ts            # First-admin-user seeder (run locally)
├── server/
│   ├── api/                     # Nuxt server API routes
│   ├── db/
│   │   ├── schema.ts            # Drizzle table definitions
│   │   └── index.ts             # DB client singleton
│   └── utils/
│       ├── auth.ts              # requireAuth / requireAdmin / requireGenerator / requireBuyer
│       └── r2.ts                # Presigned PUT helper
├── stores/
│   ├── auth.ts                  # Session state + login/logout
│   ├── contracts.ts             # Public blockchain data + derived computeds
│   └── generation.ts            # Generation time-series store
├── .env.example
├── drizzle.config.ts
├── nuxt.config.ts
├── tailwind.config.ts
└── package.json
```

---

## User roles

| Role | Access |
|---|---|
| **Admin** | Create users, review onboarding submissions, execute/cancel orders, view all data |
| **Generator** | Submit onboarding, view own generation chart and holdings |
| **Buyer** | Place buy/sell orders, set Scope 1/2/3 goals, view holdings |

A single user account can hold multiple roles (e.g. a company that both generates and buys RECs). Roles are assigned by an admin at account creation or via the Users management page.

---

## License

GNU GPLv3 in parent folder
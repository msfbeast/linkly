# Gather

Gather is a link shortener, link-in-bio and storefront platform for creators, built around affiliate links (Amazon, Flipkart). It's live at [gather.link](https://gather.link) and [links.trak.in](https://links.trak.in).

- **Short links** with click analytics (country, city, device, referrer), QR codes, scheduling, passwords and expiry
- **Bio pages** with 25 templates, blocks (gallery, map, app stack, tip jar) and custom domains
- **Storefronts** selling digital products, paid through Razorpay
- **Affiliate tagging:** Amazon and Flipkart links are cleaned and tagged automatically, with app deep links on mobile
- **Teams** with roles (owner, admin, editor, viewer) and invites
- **REST API** (`/api/v1/links`) with API keys and rate limiting

## Stack

| Part | Tech |
| --- | --- |
| Frontend | React 19, Vite, Tailwind 4, React Router |
| API | Vercel serverless and edge functions in `api/` |
| Database and auth | Supabase (Postgres, RLS, storage) |
| Redirect cache | Vercel KV |
| Click analytics | Upstash QStash queue → `api/queue/process-click` |
| Rate limiting | Upstash Ratelimit (custom domains, API) |
| Payments | Razorpay |
| Email | Resend |
| AI | Gemini, server-side only (`api/ai/*`) |

## How a click works

1. `/r/:code` (or `/:code` on a custom domain or `links.trak.in`) goes to the edge function `api/r/[code].ts`.
2. It reads the link from Vercel KV, falling back to Supabase on a miss and refilling the cache.
3. The click is stored with a hashed IP and the link's click count is incremented, in the background after the redirect is sent (`api/_lib/clickStore.ts`). With `CLICK_QUEUE=qstash` it goes through QStash and `api/queue/process-click` instead, falling back to a direct write if publishing fails.
4. Password-protected or scheduled links go to `/unlock/:code`. Mobile visitors go through `/open/…` so the link opens outside in-app browsers.

`api/link/sync` keeps KV in sync when a link is created or edited.

## Running locally

**Prerequisites:** Node.js 20+, a Supabase project, and the [Vercel CLI](https://vercel.com/docs/cli) for the API routes.

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
```

- **Frontend only:** `npm run dev` starts Vite on <http://localhost:3000>. The `api/` routes don't run under plain Vite, so redirects, payments, email and AI features won't work.
- **Full app:** `vercel dev` serves the frontend and the `api/` functions together. Link the project first with `vercel link`; `vercel env pull .env.local` fetches the env vars.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck, production build, then generate `dist/sitemap.xml` |
| `npm test` | Unit and property tests (Vitest) |
| `npm run test:e2e` | Playwright end-to-end tests |

## Environment variables

`.env.example` lists them all. Anything prefixed `VITE_` is bundled into the browser code and is public. **Never put a secret in a `VITE_` variable.**

**Client (public)**

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase project. The server reads these too |
| `VITE_RAZORPAY_KEY_ID` | Razorpay publishable key for checkout |
| `VITE_GOOGLE_API_KEY` | Google Maps (map block) |
| `VITE_APP_DOMAIN` | Main app domain, if not `gather.link` |
| `VITE_FEATURE_*` | Feature flags, see below |

**Server (secret)**

| Variable | Purpose |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side database access. Required by most API routes |
| `NEXT_PUBLIC_APP_URL` | Public app URL, used in redirects and email links |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay API |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies `api/webhooks/razorpay`. The webhook rejects everything without it |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Transactional email |
| `CLICK_QUEUE` | Optional. `qstash` to queue clicks through QStash; otherwise they're stored directly |
| `QSTASH_URL`, `QSTASH_TOKEN` | Publishing click events (only with `CLICK_QUEUE=qstash`) |
| `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | Verifying queued click events (only with `CLICK_QUEUE=qstash`) |
| `IP_HASH_SALT` | Secret for hashing visitor IPs. The value lives in Supabase Vault (`ip_hash_salt`); set the same value here and in the `track-click` edge function's secrets so every click path hashes a visitor the same way |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Vercel KV redirect cache. Set automatically when KV is linked in Vercel |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis for rate limiting |
| `GEMINI_API_KEY` | AI features (`api/ai/*`) |
| `JINA_API_KEY` | Optional. Better product-page extraction |
| `CRON_SECRET` | Protects the daily guest-link cleanup cron |

## Feature flags

`utils/featureFlags.ts` holds features that are built but switched off. Set the variable to `"true"` to turn one on:

| Flag | Default |
| --- | --- |
| `VITE_FEATURE_AGENCY` | off |
| `VITE_FEATURE_AB_TESTING` | off |
| `VITE_FEATURE_RAZORPAY` | on |

## Database

The schema lives in Supabase. SQL changes are in [`migrations/`](migrations/README.md) and are applied by hand in the Supabase SQL editor. **Merging a PR does not apply them**, so a PR that adds a migration should say so. The live database is the source of truth; [`schema/baseline.sql`](schema/README.md) is a complete, CI-checked snapshot of it for rebuilding from scratch.

Security-relevant rules are enforced in the database, not only in the app. For example, triggers stop users from changing their own plan or role, or activating a custom domain without a DNS check.

## Deployment

Pushes to `main` deploy to Vercel, and each PR gets a preview deployment. GitHub Actions (`.github/workflows/ci.yml`) runs the typecheck, unit tests and a build on every PR and on `main`. `vercel.json` defines the `/r/:code` rewrite, the SPA fallback and the daily cron. `middleware.ts` routes custom domains and the hybrid `links.trak.in` domain.

## Project layout

```
api/            Vercel functions (redirects, payments, webhooks, AI, email, public API)
components/     React components, incl. bio-templates/ and storefront-templates/
pages/          Route-level pages
services/       Client data layer (Supabase repositories, analytics, auth)
utils/          Shared helpers (affiliate tagging, deep links, feature flags, domains)
migrations/     Database SQL (changes)
schema/         Full schema baseline and its CI check
supabase/       Supabase edge function (track-click)
scripts/        One-off maintenance scripts (KV sync, re-tagging links)
middleware.ts   Edge middleware: custom domains, rate limiting
```

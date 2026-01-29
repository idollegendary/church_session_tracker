# Session Tracker

Minimal session-tracking app scaffold using Next.js (App Router), TypeScript, Supabase, Tailwind, zustand, react-hook-form, zod, dayjs, recharts, and Sentry.

Quick start

1. Copy `.env.example` to `.env.local` and fill values.
2. Install dependencies: `npm install`.
3. Run dev: `npm run dev`.

Docker (local)

```bash
docker compose up --build
```

Vercel

- Link repository to Vercel dashboard and set environment variables.
- Alternatively set `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` in GitHub Secrets and the included workflow will deploy on push.

Supabase

- Run SQL in `supabase/migrations/001_init.sql` to create `sessions` table and RLS policies.

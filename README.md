# DataSprint 95

DataSprint 95 is a production-ready, mobile-friendly 95-day data science learning tracker. It includes a structured syllabus, direct learning resources, daily focus tools, analytics, email authentication, password recovery, and cloud-synced progress.

## Stack

- Next.js 16 and React 19
- Tailwind CSS 4
- Supabase Auth for email sign-up, sign-in, and password recovery
- Neon Postgres for persisted learning progress
- Vercel-ready deployment configuration

## Local development

Use Node.js 22.13 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add these values to `.env.local`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Never commit `.env.local` or production credentials.

## Quality checks

```bash
npm run lint
npm test
```

`npm test` creates a production Next.js build and runs the product-level test suite.

## Deploy to Vercel

1. Import `Yathar-co/ds95` in Vercel.
2. Keep the detected framework preset as **Next.js**.
3. Add `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Vercel project environment variables.
4. Deploy.
5. In Supabase, open **Authentication → URL Configuration**. Set the Site URL to the production domain and add the Vercel preview/production URLs to the allowed Redirect URLs.

For the custom domain, add `ds95.xyz` in Vercel and use `https://ds95.xyz` as the Supabase Site URL after DNS is connected.

## Authentication notes

Supabase owns passwords and email recovery; DataSprint never stores user passwords. Password reset links return to the app with a secure recovery session, where the user can choose a new password.

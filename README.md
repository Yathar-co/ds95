# DS95

DS95 is a production-ready, mobile-friendly AI learning system. A learner chooses any subject, a concrete outcome and their current experience; DS95 generates an account-specific 95-day syllabus with 8 modules, 40 subtopics, direct GeeksforGeeks articles where relevant, daily work and 3 proof-of-learning projects. The app also includes focus tools, analytics, email authentication, password recovery, browser IDE workspaces and cloud-synced progress.

Existing accounts without an AI path keep the original Data Science curriculum and all of their progress. Creating a new path resets curriculum and project completion but preserves saved Lab files.

## Product documentation

The public `/documentation` route contains the complete feature guide with screenshots, runtime notes, data-persistence details and troubleshooting. A matching offline PDF is available at `/docs/datasprint95-complete-guide.pdf`.

To regenerate the PDF after documentation changes, install `reportlab`, `Pillow` and `pypdf`, then run:

```bash
python3 scripts/build_docs_pdf.py
```

## Stack

- Next.js 16 and React 19
- Tailwind CSS 4
- Supabase Auth for email sign-up, sign-in, and password recovery
- Neon Postgres for persisted learning progress
- Groq Chat Completions with strict Structured Outputs and Compound web search for syllabus generation and resource research
- Vercel-ready deployment configuration
- Pyodide, WebR and PGlite browser runtimes, sandboxed HTML/CSS previews, and authenticated Judge0 compiler execution

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
GROQ_API_KEY=gsk_YOUR_GROQ_API_KEY
GROQ_SYLLABUS_MODEL=openai/gpt-oss-120b
GROQ_RESEARCH_MODEL=groq/compound
JUDGE0_API_URL=https://ce.judge0.com
# JUDGE0_API_KEY=YOUR_SELF_HOSTED_JUDGE0_TOKEN
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
3. Add `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the server-only `GROQ_API_KEY` in the Vercel project environment variables. The Groq model variables and `JUDGE0_API_URL` are optional. Add `JUDGE0_API_KEY` when using an authenticated self-hosted Judge0 instance.
4. Deploy.
5. In Supabase, open **Authentication → URL Configuration**. Set the Site URL to the production domain and add the Vercel preview/production URLs to the allowed Redirect URLs.

For the custom domain, add `ds95.xyz` in Vercel and use `https://ds95.xyz` as the Supabase Site URL after DNS is connected.

## Authentication notes

Supabase owns passwords and email recovery; DS95 never stores user passwords. Password reset links return to the app with a secure recovery session, where the user can choose a new password.

## AI roadmap safety

- The learning-path endpoint requires a valid Supabase bearer token.
- The Groq key is server-only and never exposed to the browser.
- Structured Outputs constrain the generated program to 8 modules, 5 subtopics per module and 3 projects.
- A separate Groq Compound research pass restricts web search to `geeksforgeeks.org` for subtopic resources.
- A resource is shown only when it is a direct HTTPS GeeksforGeeks article URL present in the returned web-search sources. Search pages, other domains and unverified URLs are rejected.
- If GeeksforGeeks does not cover a subject, the syllabus remains usable and the UI explicitly says that no relevant GFG guide was found.

## Multi-language Lab safety

- The Lab stores source files per authenticated account and accepts 24 language types.
- Python, R and PostgreSQL execute locally. HTML and CSS use an isolated iframe preview.
- The remaining compiler languages are sent through the authenticated `/api/execute` route to the configured Judge0 service. Never place secrets in remotely executed code.
- Remote submissions are limited to 25 KB, four CPU seconds, eight wall-clock seconds, 192 MB of memory, no network access and ten runs per account per minute.
- For dependable production capacity, configure a controlled Judge0 deployment rather than relying permanently on the shared public CE host.

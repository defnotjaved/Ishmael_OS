# Ishmael HQ

Ishmael HQ is a personal and family life operating system built with Next.js, React 19, TypeScript, Tailwind CSS v4, Supabase, and Recharts.

Core domains:

- finances
- goals
- roadmaps
- tasks
- habits
- achievements
- AI planning
- integrations

The app uses the App Router, server components by default, Supabase auth, and live database-backed dashboards instead of mock-only UI.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with the project secrets required by your environment.

Expected variables include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- Google OAuth client credentials
- GitHub OAuth client credentials

3. Start the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Verification

Every code change should pass the full verification gate before it is treated as complete:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Delivery workflow

- Verify changes locally before commit or push.
- After verification passes, commit the change set and push it to the configured GitHub remote.
- Do not push unverified work.
- Keep local-only tooling and secret files out of the repo.

## Current feature set

- Dashboard at `/`
- Finances and transaction entry
- Goals list, create, detail, and edit flows
- AI advisor daily planner
- Google and GitHub integrations
- Auth pages and OAuth callbacks
- Reports dashboard at `/reports`

## Notes for agents

- Read `AGENTS.md` before making changes.
- This repo uses a newer Next.js release with local docs under `node_modules/next/dist/docs/`.
- Follow the existing server/client component boundaries and shared UI primitives in `src/components/ui`.

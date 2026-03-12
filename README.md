# Munch

Munch is an AI image workflow app built for creators who want a cleaner path from idea to output.

It combines:

- a template-driven creation flow
- a studio-style generation history
- an admin console for template management
- a cloud-ready user asset library
- pluggable image providers and optional LLM prompt compilation

The current codebase is designed to run locally with a fallback data layer, and to scale into a hosted setup with Supabase, object storage, and third-party model providers such as Kie.

## Status

`Munch` is currently an open development project in active iteration.

What works today:

- homepage template discovery with masonry gallery
- login flow and protected routes
- studio page for generation history and result review
- admin template management
- seed-based template import pipeline
- freeform prompt mode with optional `Thinking` compilation
- image provider integration through Kie
- local fallback storage for development

What is still evolving:

- production-grade cloud asset storage
- richer team/admin workflows
- long-term generated image persistence
- broader provider support and model routing policies

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand
- SWR
- Supabase
- Inngest

## Project Structure

- `src/app` — App Router pages and API routes
- `src/components` — product UI, admin UI, gallery, studio, auth
- `src/lib` — provider clients, auth, persistence, adapters
- `src/stores` — client stores
- `scripts/seed-data` — source-of-truth seed templates
- `supabase/migrations` — database migrations

## Quick Start

### Requirements

- Node.js 22+
- pnpm 9+

### Install

```bash
pnpm install
```

### Configure environment

Copy `.env.example` to `.env.local` and fill the values you need.

Key groups:

- Supabase
- Kie image generation
- optional LLM compilation
- Inngest

### Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
pnpm build
pnpm start
```

## Local Development Modes

Munch supports two modes:

### 1. Local fallback mode

If Supabase is not configured, the app uses local JSON and filesystem fallback under `.munch/`.

This is useful for:

- UI development
- template seeding
- local demos

### 2. Supabase mode

If Supabase environment variables are present, the app uses:

- Postgres for data
- Supabase Auth
- Supabase Storage for persistent cloud assets

## Template Workflow

Templates can be added in two ways:

### Admin UI

Use the admin console to create or edit templates manually.

### Seed pipeline

Add a new file under `scripts/seed-data/`, export it from `scripts/seed-data/index.ts`, then run:

```bash
npm run seed
```

This project uses the seed pipeline as the preferred way to turn raw prompt specs into structured templates.

## Scripts

- `pnpm dev` — run local dev server
- `pnpm build` — build for production
- `pnpm start` — run production build
- `pnpm lint` — run ESLint
- `pnpm typecheck` — run TypeScript type checks
- `npm run seed` — import/update seed templates

## Deployment Direction

Recommended production setup:

- Tencent Cloud Hong Kong for application hosting
- TencentDB for PostgreSQL
- COS for user-uploaded assets and generated images
- Kie for image generation
- optional LLM compilation through compatible chat endpoints

See [Tencent-Cloud-HK-Deployment-Checklist.md](./Tencent-Cloud-HK-Deployment-Checklist.md).

## Open Source Notes

The repository is being prepared for public open-source release.

Before public launch, maintainers should make sure:

- the repository is pushed to a public GitHub repo
- local runtime data remains ignored
- real secrets are never committed
- licensing and contribution rules are visible

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

See [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)

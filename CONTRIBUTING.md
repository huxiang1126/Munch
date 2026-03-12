# Contributing to Munch

Thanks for contributing.

## Before You Start

- Use Node.js 22+
- Use `pnpm`
- Never commit real secrets
- Keep local runtime data out of Git

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Quality Checks

Before opening a PR, run:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Branching

Use short, focused branches for each change.

Examples:

- `feature/studio-refinement`
- `fix/template-ratio`
- `docs/open-source-readiness`

## What We Accept

- bug fixes
- UI polish
- provider integrations
- admin improvements
- asset library work
- prompt/template system improvements
- documentation

## Template Contributions

Seed templates are the preferred source of truth.

To add a new template:

1. add a file under `scripts/seed-data/`
2. export it from `scripts/seed-data/index.ts`
3. run:

```bash
npm run seed
```

When creating a seed template, keep the structure clear:

- `skill_prompt`
- `base_prompt`
- `variables`
- sensible model defaults
- sensible credit multiplier

## Pull Request Expectations

Please keep pull requests:

- small enough to review
- technically focused
- documented when behavior changes

If a change affects product behavior, include:

- what changed
- how it was tested
- any rollout risk

## Design and UX

Munch is a product-facing app, not a developer dashboard.

When contributing UI:

- prefer intentional, polished layouts
- avoid noisy controls
- preserve the current product tone
- keep mobile and desktop behavior usable

## Reporting Bugs

Open an issue with:

- expected behavior
- actual behavior
- reproduction steps
- screenshots if relevant

## Security

If the issue is security-sensitive, do not open a public issue first.

Use the process in [SECURITY.md](./SECURITY.md).

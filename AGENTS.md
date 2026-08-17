# AGENTS.md

Admin console for DIAL: a single Next.js App Router app (`apps/ai-dial-admin`) in an Nx workspace,
managing models, applications, deployments, evaluation, and analytics against two backend services.

Stack, commands, architecture, and conventions live in `openspec/config.yaml` — read it before
designing or implementing. Coding rules live in `.claude/rules/` and load themselves for the files you
touch; don't read them preemptively.

## Gotchas

Things that cost time or fail silently if you don't know them:

- **This codebase is heavily patterned.** Entity views, grids, server actions, and modals all have an
  established shape. A change that is locally correct but invents its own shape is a review failure.
  Read how a sibling entity does it first.
- **`@/` resolves from `apps/ai-dial-admin/`**, so vitest must run from that directory or the alias
  won't resolve.
- **`npm run test` always runs with coverage.** While iterating use
  `npx vitest run <file> -t "<pattern>"`; save the full run for a final gate.
- **Test mocks are centralized in `apps/ai-dial-admin/test-setup.tsx`**, and its mocked `t()` returns
  the i18n key as-is — so component tests assert keys, not translated text. Add missing mocks there,
  not inline in a spec.
- **`console.error` / `console.warn` are silenced globally in tests**, so React warnings never surface
  in output.
- **The `.cursor/` and `.github/instructions|skills` entries are generated copies of `.claude/`
  files** — `scripts/agent-mirrors.mjs` maps each source to its mirrors. Edit only the `.claude` file;
  pre-commit regenerates and stages the copies for you. `npm run sync:agent-mirrors` does it by hand,
  and `npm run validate:agent-docs` fails on a drifted copy, because a stale copy silently feeds that
  tool an old rule. They were symlinks until Windows clones — where git writes the link target as
  plain text instead — broke them.
- **Analytics is one master spec** — `openspec/specs/analytics/spec.md`. Don't create per-feature
  analytics specs.
- **Pre-commit runs lint-staged plus the agent-config validator; pre-push runs the suite.** Don't skip
  hooks.

## Hard constraints

- **Never read `.env*.local`.** A `PreToolUse` hook blocks it. New variables go into `.env.template`
  as commented entries.
- **Don't post to GitHub** — issues, PR comments, review replies — without the user explicitly asking
  for that specific action. Implementing a fix is not authorization to reply.

## Finding things

- What a capability is specified to do → `openspec/specs/<capability>/spec.md` (`openspec list --specs`
  to find it). Why it was built that way → the archived change under `openspec/changes/archive/`;
  `proposal.md` holds the alternatives, `design.md` the accepted tradeoff.
- Which commit/PR area owns a set of files → `.claude/reference/areas.md`
- What ui-kit offers and its real props → the `ai-dial-ui-kit` MCP server (`searchEntity`,
  `getEntityDetails`, `getMigrationGuides`), not a grep through `node_modules`

## Skills

- Committing, pushing, opening a PR → `git-commit`
- Filing a GitHub issue → `create-ticket`
- Verifying a change in a real browser → `spec-browser-verify`
- Polishing release notes for a tag → `release-notes`

Check `.claude/skills/` for the current set — it grows, and a skill's own `description` says when to
reach for it.

Non-trivial work goes through OpenSpec: explore → propose → apply → archive. `openspec/config.yaml`
holds the artifact-quality rules — notably that tasks stay PR-sized, never include
manual-verification steps, and that for browser-observable acceptance criteria you **ask** before
adding a verification task.

When a change alters behavior a spec or a doc under `docs/` describes, update it in the same change.

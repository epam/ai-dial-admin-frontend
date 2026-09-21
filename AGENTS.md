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
- **Two typecheck gates, both blocking, both at zero.** `npm run typecheck`
  (`tsc -p tsconfig.app.json`) covers app source; `npm run typecheck:specs`
  (`tsc -p tsconfig.spec.json`) covers `*.spec.ts(x)` plus `test-setup.tsx`. Both run in
  `.husky/pre-commit` and in the blocking CI `typecheck` job. A green test run still says nothing about
  types — vitest strips them through esbuild and eslint ignores spec files — so the spec project is the
  only thing that catches a fixture drifting from its production type. Keep it at zero: the 726 errors it
  started with took ten PRs to clear.
- **Test mocks are centralized in `apps/ai-dial-admin/test-setup.tsx`**, and its mocked `t()` returns
  the i18n key as-is — so component tests assert keys, not translated text. Add missing mocks there,
  not inline in a spec.
- **`console.error` / `console.warn` are silenced globally in tests**, so React warnings never surface
  in output.
- **The `.cursor/rules` and `.github/instructions` entries are generated from `.claude/` sources** —
  `scripts/agent-mirrors.mjs` maps each one. Edit only the `.claude` file; pre-commit regenerates and
  stages the mirrors, `npm run sync:agent-mirrors` does it by hand, and `npm run validate:agent-docs`
  fails on drift. Cursor gets a stub (`@` reference, no duplicated body); Copilot gets a full copy,
  because `applyTo` only exists in `*.instructions.md` and that file type does not expand references.
  They were symlinks until Windows clones — where git writes the link target as plain text — broke them.
- **Skills need no mirror.** Cursor loads `.claude/skills/` as a compatibility path and Copilot reads
  it as a default project skills location, so both see the canonical files. The `openspec-*` entries
  under `.cursor/skills` and `.github/skills` are different — the openspec CLI generates a distinct
  variant per tool and owns them.
- **Analytics is a root index plus nine sub-capabilities** under `openspec/specs/analytics/` —
  `query-builder`, `query-viewer`, `saved-queries`, `tables`, `sessions-listing`,
  `session-trace-listing`, `session-trace-detail`, `pipelines`, `evaluators`. Address one as
  `analytics/<sub>`. `analytics/spec.md` is the index: it carries only what every Analytics page
  shares, plus a routing table naming what each sub-capability answers — add a row when you add one.
  Never create a top-level `analytics-*` spec folder.
- **Analytics archives keep only `proposal.md` and `design.md`** — archiving a change whose deltas
  touch `analytics/*` deletes its `tasks.md` and `specs/` delta, because the delta is already folded
  into the consolidated specs. Analytics-only; every other capability keeps the stock layout.
- **Pre-commit runs lint-staged, the agent-config validator and both typechecks; pre-push runs the
  suite.** Don't skip hooks.

## Hard constraints

- **Never read or write `.env*.local`.** A `PreToolUse` hook blocks it. New variables go into
  `.env.template` as commented entries; if an existing local value must change, name the variable and
  let the user edit their own file. The hook also refuses two things whose target it cannot see in the
  command text, because a repo-wide rename once edited `.env.local` through exactly that gap: an
  **in-place write over a runtime-built path list** (`xargs perl -pi`, `find -exec sed -i`,
  `perl -i $(…)`), and a **recursive content search** over a directory that holds an env file. Both
  clear once you exclude env files where the list is built — `--exclude='.env*'`, `! -name '.env*'`,
  `| grep -v '\.env'` — which is the fix, not a workaround; `grep -rl` (names only) is never blocked.
  A trailing `# env-guard: reviewed` waives a blind write you have inspected. Regression suite:
  `bash .claude/hooks/tests/block-env-local-access.test.sh`.
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

## Context

See proposal.md — Why for motivation and the error counts. What shapes the approach here is which of the
existing checks already sees a type error, because that decides what the new target has to cover:

| Check                    | Sees a type error in…                                        |
| ------------------------ | ------------------------------------------------------------ |
| `npm run format`         | nothing — prettier only                                      |
| `npm run lint`           | nothing; `*.spec.ts(x)` are in `ignores` and no typed rules   |
| `npm run test`           | nothing — esbuild strips types                                |
| `next build` (docker CI) | source reachable from a route, plus the generated route types |

So the uncovered area is exactly: every test file, and every source file no route reaches.

## Goals / Non-Goals

**Goals:**

- `npm run typecheck` exits non-zero on a type error in app source, and blocks a push.
- The app project starts and stays at zero errors.
- The spec project's real error count becomes visible locally in one command, without gating on it.

**Non-Goals:**

- See proposal.md — Non-goals (spec-project cleanup, a CI job, restoring the context fields).
- Type-aware ESLint rules. A second type-aware pass over the same files would double the cost for
  overlapping findings.

## Decisions

**Gate on pre-push, not CI.** Chosen by the user on 2026-09-08 over "CI + pre-push" and "CI only".
`.husky/pre-push` already runs the suite, so the typecheck joins a hook developers cannot miss, and it
fails in ~7 s instead of a 3-5 min CI round trip. Trade-off accepted knowingly: `git push --no-verify`
bypasses it, and a PR whose author bypassed the hook is not stopped by anything. Revisit by adding a
`typecheck` job to `pr.yml` — the target is already there, so that is a five-line follow-up.

**Typecheck the app project only; keep the spec project measurable but ungated.** The spec project's 725
errors across 154 files cannot land as one reviewable PR, and a gate that always fails is the state this
change exists to end. `tsconfig.spec.json` gets only the `types` fix, so `tsc -p tsconfig.spec.json` is a
one-command progress meter for the follow-up change.

**`@testing-library/jest-dom/vitest`, not the bare package name.** The bare name resolves to `jest.d.ts`,
which augments `namespace jest` and carries `/// <reference types="jest" />`; `@types/jest` is not
installed, so the reference fails and the matchers stay unknown. The `/vitest` subpath augments vitest's
own `Assertion` interface. This one line is what turns 4 163 errors into 726, and the deletions below take it to 725.

**Drop `.next/types` from `tsconfig.app.json`'s `include`.** Those generated route validators are build
output: they survive a route rename and then fail against routes that no longer exist — 40 of the 249
errors measured came from a stale `dist/apps/ai-dial-admin/.next/types`. `next build` type-checks them
through `tsconfig.json`, which is where they belong. The target therefore covers source, not build output.

**Extend `exclude` to the `.tsx` spec forms.** The existing list held only `**/*.spec.ts` and
`**/*.test.ts`, so 186 component-test errors leaked into the app project and made its number look ten
times worse than its real 15. With `types` narrowed to `["node"]`, the app project no longer pulls jest-dom
either.

**Delete the three dead files rather than fix them.** `ExportGrid.tsx`, `BulkButtons.tsx` and
`src/components/SchemeRenderer/` are imported by no file in the repository. `ExportGrid.tsx` calls
`bulkSelectedData` / `setBulkSelectedData`, which `AssetsFolderContext` no longer has; fixing it would mean
re-adding fields to a shared context for a component nothing renders. `SchemeRenderer` was last touched
2025-09-08, `ExportGrid` 2026-02-12. `ExportAssets/export.ts` is live and tested — only the component goes.

## Risks / Trade-offs

- **`--no-verify` skips the gate** → accepted above; the CI job stays a five-line follow-up.
- **Pre-push gets slower** → cold run measured at 7.2 s, and `incremental: true` writes
  `tsconfig.app.tsbuildinfo` (already covered by `*.tsbuildinfo` in `.gitignore`) so repeat runs are
  cheaper. The suite it precedes takes minutes.
- **Deleting `SchemeRenderer` removes `tests/utils.spec.ts`** → coverage thresholds (40/40/50/50 in
  `vitest.config.ts`) must still pass; the final quality task re-runs the full suite with coverage.
- **A route-type regression now surfaces only in `next build`** → unchanged from today: nothing but
  `next build` ever checked those files, and the docker job in `pr.yml` still runs it.

## Why

The Vitest suite is unreliable in two different ways, and only one of them is understood.

**CI: the test step fails without saying why.** The `release / test / code_checks` job (`epam/ai-dial-ci` `node_test.yml`, which runs `npm run test`) intermittently fails. Three sampled failures — runs `38551948722`, `38575852823` (the `release` job, which runs the same step) and `38582533640`, all on 2026-10-14 — look identical:

- the log ends at `RUN v4.1.11` / `Coverage enabled with v8`, then `NX Running target test … failed`;
- there is no `❌ <test name>` line, no `Vitest run failed: N failed test modules` line (both are printed by `InlineReporter` in `vitest-reporter.ts`), no dots, no coverage summary, no error of any kind;
- the step ran 17–19 min before failing, while passing runs of the same step took 11–17 min (e.g. `38583863246`: 11m 19s). Re-running the same branch passed.

So the CI failures are **not** attributable to a `waitFor` or a test timeout from the logs we have. The test step is a single `--runInBand` process under a 4 GB heap cap covering ~1,220 spec files with v8 coverage; a silent end with no reporter output points at the process being killed or the output being lost, not at an assertion. This needs a diagnosis before anyone picks fixes.

**Locally: timing-fragile tests.** A full run shows a shifting set of ~25–31 failures across ~11–13 files, all passing when re-run in isolation. Nothing gives the suite headroom — no `testTimeout`, no `asyncUtilTimeout`, no retry — and two idioms make it worse:

- **`waitFor` as a settle barrier** — `await waitFor(() => expect(mock).toHaveBeenCalled())` followed by synchronous `getBy*` assertions (302 sites). A mock having been called says nothing about React having re-rendered, so these pass on a fast machine and fail on a slow one. Another 55 sites wrap a single `getBy*` that should be `findBy*`, and 235 block-form `waitFor`s mix unrelated assertions.
- **Real-time sleeps for "nothing happened"** — `setTimeout(30–100)` followed by a not-called assertion (`EntitiesConsumptionTree`, `UsageLog/List`, `base-api`). Slow, and proves nothing if the call lands late.

At least 12 specs outside `components/Grid` are also heavy only because they mount real AG Grid + ui-kit + Monaco to check something that isn't the grid (`Runs/Compare`, `ActivityAudit/List`, `Telemetry`), although `testing.md` §4 already says to mock heavy children and ~40 sibling specs stub `GridView`. Those are the 2–3 s tests closest to the 5 s default timeout, and they are also what makes a single-process run take 11–17 min.

The existing rule was not enough: it says "mock heavy children" and "query by role" but is silent on how to wait, so each author reinvented the `waitFor(mock called)` shape.

## What Changes

- **Make CI failures diagnosable first.** Repo-side only (the workflow is owned by `epam/ai-dial-ci`): in `vitest.config.ts`/the `test` script, add reporters that survive a bad exit when `CI`/`GITHUB_ACTIONS` is set (`github-actions` annotations, a JUnit/JSON file), print failure detail from `InlineReporter` even when the run ends abnormally, and record memory use (`--logHeapUsage`). Re-run until a failure shows its cause (OOM kill vs. runner loss vs. test), then record the finding in `design.md`.
- **Config headroom** in `vitest.config.ts` and `test-setup.tsx`: `testTimeout`/`hookTimeout`, RTL `asyncUtilTimeout`, remove the dead `threads: false` option (a Vitest v1-era key; the installed version is 4.1.x), and decide pool/worker and heap settings from the diagnosis. Retry policy for CI is decided there too.
- **Expand `.claude/rules/testing.md`** with a new §9 "Async, timing & stability": how to wait (`findBy*` / one-condition `waitFor` on the visible result), banned shapes (settle-barrier `waitFor(mock called)`, real-time sleeps, per-call timeout bumps, `waitFor` around actions or multiple unrelated assertions), fake-timer and `userEvent` rules, a "stub `GridView` unless the test is about the grid" requirement with the exact mock, a per-test time budget, and a pre-finish checklist. §4.5 and §8 point to it. Mirrors regenerate via `npm run sync:agent-mirrors`.
- **A spec-only lint guard**: a `lint:specs` ESLint config (specs are ignored by the main config) that errors on the two banned shapes — `waitFor(() => expect(<mock>).toHaveBeenCalled…)` and real `setTimeout`. Wired into lint-staged for spec files. It is switched on once the migration below has removed every violation, so it needs no baseline.
- **Codemod-assisted migration of every flagged spec, one commit per feature area**: replace barrier `waitFor`s with an await on the visible result, convert single-`getBy` `waitFor`s to `findBy*`, split block-form `waitFor`s, replace sleeps with fake timers, stub `GridView` where the spec isn't about the grid. Areas, by `waitFor` count: `Analytics`, `Runs`, `TestSuites`/`Datasets`, `Telemetry`, the rest.
- **Fix the Windows pre-push path**: the `test` script's inline `NODE_OPTIONS=` prefix does not run under cmd.exe, so the hook dies before running any test on Windows.

**Delivery: one PR.** All of the above lands together, as ordered commits (diagnostics → config → migration by area → lint guard on → close-out) so the PR can be reviewed commit by commit. This deliberately departs from the repo's "tasks stay PR-sized" guidance in `openspec/config.yaml`; the size and the single all-or-nothing merge are called out under Risk.

No production code changes.

## Capabilities

### New Capabilities

None. This is test-infrastructure and tooling work; testing conventions live in `.claude/rules/testing.md`, not in `openspec/specs/`.

### Modified Capabilities

None. No product behaviour changes.

## Impact

- **Config**: `apps/ai-dial-admin/vitest.config.ts`, `apps/ai-dial-admin/vitest-reporter.ts`, `apps/ai-dial-admin/test-setup.tsx`, root `package.json` (`test` script).
- **Rules**: `.claude/rules/testing.md` (and the generated `.cursor/rules` and `.github/instructions` mirrors).
- **Specs**: the ~100–150 spec files with the flagged idioms, migrated per area. Highest first: `Analytics/Pipelines` (`PipelineDetailView`, `use-enrich-form`), `Analytics/SessionsTrace`, `TestSuites/TestCases`, `Runs/Compare`, `TestSuites/Metrics`, `Datasets/TestCases`, `Telemetry`.
- **Risk**: the PR touches on the order of 100–150 spec files and cannot be partly reverted once squash-merged; raising timeouts globally makes a genuine hang fail more slowly; a migrated test can lose coverage if the replacement assertion is weaker than the barrier it replaces; and if the CI failure turns out to be memory, no amount of `waitFor` cleanup fixes it — which is why diagnosis comes first. Mitigation is migrating per area with each file re-run in isolation and under the full suite.
- **Hooks**: both typecheck gates (`typecheck`, `typecheck:specs`) must stay at zero across every migration PR.

## Non-goals

- Rewriting or removing tests for coverage reasons, or changing the coverage thresholds.
- Switching test runner, DOM environment (jsdom) or Testing Library.
- Adding tests to `pr.yml` — whether PRs should run the suite is a separate decision.
- Fixing flakiness by retries alone; retry is at most a safety net on top of the fixes.
- Changes to `epam/ai-dial-ci` itself, which is owned outside this repo. Anything the diagnosis needs from it (a different runner size, a timeout input) is raised upstream.

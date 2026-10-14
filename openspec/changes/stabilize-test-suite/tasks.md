One PR, delivered as ordered commits (group = commit or small set of commits; see `design.md` D5a). No browser-observable acceptance criteria and no spec deltas: this change touches test tooling and spec files only, so there is no `spec-browser-verify` task. Tests for the new tooling are in 1.4 and 6.3; the migration is its own verification (each area commit re-runs the files it touches).

## 1. Diagnostics and the Windows fix (no test behaviour changes)

- [x] 1.1 Add `scripts/run-tests.mjs`: set `NODE_OPTIONS=--max-old-space-size=4096` itself, spawn `nx run-many -t test --runInBand --coverage` with stdio forwarded unchanged, print exit code **and signal** on exit, print `os.totalmem()`/`os.freemem()` at start and end, and in CI (`GITHUB_ACTIONS`) sample the child tree's RSS every 30 s. Exit with the child's code.
- [x] 1.2 Point root `package.json` `test` at the script (`node scripts/run-tests.mjs`) so the inline `NODE_OPTIONS=` prefix is gone and `npm run test` runs under `cmd.exe`; keep forwarding extra args.
- [x] 1.3 In `apps/ai-dial-admin/vitest.config.ts`, when `GITHUB_ACTIONS` is set add the `github-actions` reporter and a `json` (or `junit`) reporter with `outputFile`, and set `logHeapUsage: true`; keep `InlineReporter` as the console reporter. Remove the dead `threads: false`.
- [x] 1.4 Add `scripts/run-tests.spec.mjs` (exit code and signal are reported and forwarded; heap flag; tree RSS parsing) following `scripts/validate-agent-docs.spec.mjs`, with a `test:scripts` npm script. `InlineReporter` needs no change: it already covers unhandled errors and failed-run summaries (`src/tests/vitest-reporter.spec.ts`).
- [x] 1.5 Update `AGENTS.md` and `openspec/config.yaml` only where they describe how `npm run test` runs (the inline `NODE_OPTIONS` prefix, "always runs with coverage"); run `npm run validate:agent-docs`.

## 2. Find the CI cause (needs the user's go-ahead to push and to spend CI minutes)

- [ ] 2.1 Commit a throwaway workflow, triggered by `push` to this branch, running the D2 matrix — current config, `--maxWorkers=2`, `--maxWorkers=1`, coverage off — × 10 repeats with the group 1 instrumentation on.
- [ ] 2.2 Read the results (exit signals, RSS ramp, JSON/JUnit failures), write them into `design.md` → "Findings", pick the settings by the D2 decision rule, then delete the workflow in the next commit.

## 3. Config headroom and CI settings

- [x] 3.1 In `vitest.config.ts` set `testTimeout: 15_000` and `hookTimeout: 15_000`; in `apps/ai-dial-admin/test-setup.tsx` add `configure({ asyncUtilTimeout: 4_000 })` from `@testing-library/react`.
- [ ] 3.2 Apply the worker / heap / coverage-reporter settings chosen in 2.2 (for example `maxWorkers`, dropping the `html` coverage reporter under `GITHUB_ACTIONS`), each with a one-line comment naming the finding it came from. Leave `retry` off.

## 4. Migrate specs, one commit per area (each commit: every touched file passes alone, twice, and with `--sequence.shuffle`; `npm run typecheck:specs` stays at zero; the slowest test per file is within the `testing.md` §9.6 budget or commented)

- [ ] 4.1 `Analytics/Pipelines` (e.g. `PipelineDetailView.spec.tsx` 42 `waitFor`s, `Enrich/use-enrich-form.spec.ts` 28): replace barriers by awaiting the visible result, convert single-`getBy` waits to `findBy*`, split block-form waits.
- [ ] 4.2 `Analytics/SessionsTrace` (`SessionsTraceView.spec.tsx`, `SessionValueFilter.spec.tsx`).
- [ ] 4.3 `Analytics/QueryBuilder` (`QueryBuilder.spec.tsx`, the 2.9 s "→ JSON" case first), applying `testing.md` §9.4/§9.5 (stub heavy children, `paste` over `type`).
- [ ] 4.4 Remaining `Analytics/*` folders.
- [ ] 4.5 `Assets` (45 barriers).
- [ ] 4.6 `TestSuites` and `Datasets` (`TestCases/tests/TestCasesList.spec.tsx` including its 50 ms sleep, `Metrics.spec.tsx`, `RequestTemplate/tests/TryOut*.spec.tsx`).
- [ ] 4.7 `Runs` (`Compare/tests/CompareView.spec.tsx`, `Compare/ExecutionResults/tests/ExecutionResultsTab.spec.tsx`): move to the stubbed `GridView`, keeping one real-grid spec for the grid itself.
- [ ] 4.8 Everything else with a flagged idiom: `Telemetry` (`EntitiesConsumptionTree.spec.tsx` 30 ms sleep → fake timers), `UsageLog/List/tests/List.spec.tsx` (three 50 ms sleeps), `EntityListView`, `ExportConfig`, `ImportConfig`, `SourceField`, `EntityHeaderControls`, `Common`, and `src/server/tests/base-api.spec.ts` (real sleeps → fake timers).
- [ ] 4.9 Move the 12 real-`GridView` specs outside `components/Grid` that are not about grid behaviour onto the stubbed path from `testing.md` §9.4.

## 5. Lint guard on, at zero

- [ ] 5.1 Add `eslint.specs.config.mjs` enabling only `no-restricted-syntax` for spec files, with esquery selectors for `waitFor(() => expect(<call>).toHaveBeenCalled…)` and for any `setTimeout` call, each message linking `.claude/rules/testing.md` §9.1 / §9.3. Add the `lint:specs` script and a lint-staged entry for `*.spec.{ts,tsx}`.
- [ ] 5.2 Run `npm run lint:specs` and confirm zero errors across the tree with no overrides; confirm a deliberately added violation fails, then remove it.

## 6. Close out

- [ ] 6.1 Add `RuleTester` specs for the selectors: the settle-barrier and `setTimeout` shapes are reported; `findBy*`, a last-statement `vi.waitFor`, and `vi.advanceTimersByTimeAsync` are not.
- [ ] 6.2 Re-read `testing.md` §9 against what the lint messages and the migration settled on (for example the §9.1 last-statement exception) and fix any drift; run `npm run sync:agent-mirrors` and `npm run validate:agent-docs`.
- [ ] 6.3 Run all code quality checks as the final gate: `npm run lint`, `npm run lint:specs`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the full `npm run test`; then confirm three consecutive green runs of the CI command (through `scripts/run-tests.mjs`) before merge.

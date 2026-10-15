## Context

Two separate problems share one symptom ("the tests are flaky"), and they need different fixes.

**CI (`npm run test` in `epam/ai-dial-ci` `node_test.yml`, also inside the `release` job).** Three sampled failures (`38551948722`, `38575852823`, `38582533640`) end at `Coverage enabled with v8` → `NX … failed`, with no test failure line, no `Vitest run failed` summary from `InlineReporter`, and no error. Failed steps ran 17–19 min; passing ones 11–17 min. The command is `NODE_OPTIONS=--max-old-space-size=4096 nx run-many -t test --runInBand --coverage`.

Facts about that command that matter:

- `--runInBand` is an Nx flag (one task at a time across projects). With a single project it does nothing for Vitest.
- Vitest 4's default pool is `forks` with several workers in parallel; the `threads: false` in `vitest.config.ts` is a v1-era key and is ignored. So the "serial single process" picture is wrong: there are N worker processes plus the main process that merges v8 coverage for ~3,000 source files.
- `NODE_OPTIONS` is inherited by every worker, so the 4 GB cap is **per process**, not a total. Several workers plus the coverage merge can exceed a runner's RAM without any one process hitting its own cap, and the kernel's OOM killer prints nothing into the job log.
- Failures are not reproducible from the logs; the same branch re-run passed.

**Locally.** The full run shows a shifting 25–31 failing tests that pass alone. The idioms behind it were measured: 858 `waitFor`, of which 302 are `waitFor(() => expect(mock).toHaveBeenCalled…)` barriers, 55 single-`getBy` waits, 235 block-form waits; ~10 real sleeps; no `testTimeout`/`asyncUtilTimeout`. The work is concentrated: `Analytics` holds 345 of the 858 `waitFor`s and 152 of the 302 barriers.

Constraints: the workflow file is owned by `epam/ai-dial-ci`, so every CI-side fix must live in this repo's `package.json`, `vitest.config.ts`, `vitest-reporter.ts`, `test-setup.tsx` or scripts. `npm run test` must stay the single entry point (CI and the pre-push hook call it). Both typecheck gates stay at zero. Tests may not be removed to gain speed.

## Goals / Non-Goals

**Goals:**

- A CI failure always says what failed: a test, a worker crash, or a killed process.
- The suite passes N consecutive CI-equivalent runs, with a failure rate the team can state.
- Timing-fragile idioms are removed where they are frequent, and cannot be re-introduced unnoticed.
- `npm run test` works on Windows, macOS and Linux.

**Non-Goals:**

- Changing the runner, the DOM environment, or the coverage thresholds.
- Retrying our way to green.
- Editing `epam/ai-dial-ci`, or adding the suite to `pr.yml` (separate decision).
- Rewriting tests that do not use a flagged idiom.

## Decisions

### D1. Observability first, fixes second

The CI cause is unknown, so no fix is chosen from guesswork. The first PR changes no behaviour of any test; it makes the next failure legible.

- **A `scripts/run-tests.mjs` entry point** that `npm run test` calls. It sets `NODE_OPTIONS` itself (solving the Windows `cmd.exe` problem as a side effect), spawns the same `nx run-many -t test --runInBand --coverage` command, and on exit prints the exit code **and the signal** (`SIGKILL` = OOM kill), plus `os.totalmem()/freemem()` at start and end. In CI it also samples RSS of the child tree every 30 s so a memory ramp is visible in the log.
- **Reporters when `GITHUB_ACTIONS` is set**: add Vitest's `github-actions` reporter and a `json`/`junit` reporter writing to a file. A failed test then appears as an annotation, and the file survives for inspection. `InlineReporter` stays the console reporter.
- **`logHeapUsage: true`** in CI, so each test file's heap is logged.
- **`InlineReporter` is left as is.** It already prints each failed test and, in `onTestRunEnd`, unhandled errors and a failed-run summary. If the process is killed `onTestRunEnd` never runs, which is the case the wrapper covers from outside.

*Alternatives:* adding `cross-env` just for the prefix (fixes Windows, adds no diagnostics); editing the CI workflow (not ours); guessing at `--maxWorkers`/heap now (could mask the cause and leave the next failure as silent as the last).

### D2. Hypotheses, and the experiment that separates them

| # | Hypothesis | Evidence for | What would confirm it |
|---|---|---|---|
| H1 | Memory: N forked workers, each allowed 4 GB, plus coverage merge exceed runner RAM; the OOM killer ends a process silently | silent end, no reporter output, longer-than-usual run, passes on re-run | exit signal `SIGKILL`; RSS ramp in the sampled log |
| H2 | A worker crashes or hangs and the run dies without a final report | no summary line | `Worker exited unexpectedly` in the JSON/JUnit file |
| H3 | A real test failure whose output nx loses when the child is torn down | nx shows captured output only | `github-actions` annotations or the JSON file name a test |
| H4 | Runner infrastructure | would have shown as a cancelled/lost job, not a `Test` step failure | rejected by the step conclusion |

**Experiment — not runnable from this PR.** The planned matrix of {current config, `--maxWorkers=2`, `--maxWorkers=1`, coverage off} × 10 repeats needs a workflow file, and the author of this change has no rights to create or update workflows. A throwaway copy is kept outside the repo (scratchpad `diagnose-tests.yml`) for anyone with `workflow` rights to run from a fork or branch; its results would go into "Findings". Without it the cause is established the cheaper way: the D1 instrumentation is on `development` after this PR merges, and the **next real CI failure** names itself (exit signal, RSS ramp, JSON/annotations). Until then the worker/heap/coverage settings (task 3.2) are not changed — only the timeout headroom is.

**Decision rule:** pick the smallest change that gives zero failures across the repeats, preferring fewer workers over a larger heap, and a lighter coverage reporter set in CI (drop `html`, which writes a page per source file) over fewer workers. Record the result in this document's "Findings" before changing defaults.

### D3. Timeout headroom

`testTimeout: 15_000`, `hookTimeout: 15_000`, and `configure({ asyncUtilTimeout: 4_000 })` in `test-setup.tsx`. Measured: the slowest tests are 2.7–3.4 s in isolation on an idle machine against a 5 s limit; 15 s gives ~4x, and 4 s for `findBy*`/`waitFor` gives ~4x over the 1 s default. Remove the dead `threads: false`.

*Alternatives:* much larger values (hides hangs); separate local and CI values (two behaviours to reason about, and the failure mode we are chasing is CI-only anyway); per-test overrides (the rule in `testing.md` §9 rule 2 forbids them).

**Retry is off.** `retry` re-runs a failed test and reports it green, which would hide both genuine regressions and the very failures we are trying to name. It stays out until after D1/D2, and is reconsidered only if a measured residual rate remains.

### D4. Banned idioms get a lint guard, not just prose

`.claude/rules/testing.md` §9 tells authors what to do, but §4.5 already said "mock heavy children" and 12 specs outside `components/Grid` still render the real grid, so prose alone is not enough. The main ESLint config ignores all specs (`**/**.spec.ts(x)`), and un-ignoring them would surface unrelated rules. Instead:

- A separate `eslint.specs.config.mjs` and a `lint:specs` script, lint-staged for `*.spec.{ts,tsx}`. It enables only `no-restricted-syntax` with esquery selectors for (a) `waitFor(() => expect(<call>).toHaveBeenCalled*(…))` and (b) any `setTimeout` call in a spec, with a message pointing at `testing.md` §9 rule 1/§9 rule 3. It does not use `eslint-plugin-testing-library`, to avoid a new dependency; its `prefer-find-by` and `no-wait-for-*` rules are an option if the two selectors prove too narrow.
- **No baseline.** Because the whole migration ships in the same PR, the rule is turned on in the last commit, after the migration has removed every violation, and starts at zero errors. (With per-area PRs this would have needed a directory-level override file deleted one area at a time; that machinery is not worth building for a single PR.) It is added *after* the migration in commit order so every intermediate commit still lints clean.

*Alternatives:* a `warn`-level rule (ignored in practice); a codemod only (cannot stop regressions); a grep in `validate:agent-docs` (not parsed code, false positives on strings and comments).

### D5. Migration is one commit per area, semi-automatic, and verified by behaviour

Order by payoff, one commit each: `Analytics` (345 `waitFor`, 152 barriers, 40 single-`getBy`) split into its sub-folders (`Pipelines`, `SessionsTrace`, `QueryBuilder`, rest); then `Assets`, `TestSuites` + `Datasets`, `Runs`, then the rest in one PR (`Telemetry`, `UsageLog`, `EntityListView`, `ExportConfig`, …).

A script (kept under the scratchpad, not committed) lists candidate sites; the rewrite is by hand per site because the replacement depends on what the next assertion needs (§9 rule 1). Mechanical-only cases are done directly: single-`getBy` waits → `await screen.findBy*`; empty-callback waits removed. The "was this barrier covering a real wait?" question is answered by running the file with the barrier deleted and a deliberately slowed mock; a test that still passes needed no barrier.

Each area commit must show: every touched file green alone, green twice, green with `--sequence.shuffle`, and no test lost or its assertions weakened (the diff is reviewed for assertions, not for waits). Real-grid specs are moved to the stubbed `GridView` per `testing.md` §9 rule 5 in the same commit as their area, except one genuine grid spec per grid.

### D5a. Everything ships as one PR

Decided by the user. Consequences, and how they are handled:

- **Review size.** ~100–150 spec files. Commits are ordered and self-contained, each area commit is reviewable alone, and the diff to review is assertions, not waits (D5). Diagnostics and config come first and touch no tests, so they can be read first.
- **No CI experiment in this PR** (no rights to push workflow files): diagnostics ship first, worker/heap/coverage tuning waits for a real failure or for someone with rights to run the matrix (D2).
- **Squash-merge loses commit granularity.** After merge a partial revert is not possible; reverting means the whole PR. Mitigation: every touched spec passes alone, twice and shuffled; the full local run matches the known baseline; and the first post-merge CI run carries the new diagnostics. (A pre-merge CI gate is not possible: `pr.yml` does not run tests.)
- **PR title** follows the repo's conventional-commit title check, e.g. `test: stabilize the test suite (...)`.

*Alternatives:* a single repo-wide codemod (the replacement cannot be inferred); migrating only the files that flaked (the set shifts every run); one PR per area (rejected by the user for this change).

### D6. Rule file is the contract

`testing.md` §9 is already written and mirrored. This change keeps it the single description of the idioms, so D4's lint messages and review comments link to it rather than restating it. If D1 shows a memory cause, §9 gets no new content; the fix belongs to config.

## Risks / Trade-offs

- **The CI cause is not a test at all** → D1/D2 find it before any migration is justified by it; migration is still justified by the local flakiness evidence, and the proposal says so.
- **Longer timeouts hide a hang** → a hang still fails, just at 15 s.
- **A migrated test passes for the wrong reason** (the barrier it removed was covering a real wait, or the new `findBy` asserts less) → D5's verification step and review-by-assertions.
- **One big PR is hard to review and all-or-nothing** → ordered commits, per-area verification, diagnostics/config first, and a full-run-matches-baseline check before merge (D5a).
- **The wrapper script hides nx output or changes exit codes** → it forwards stdio unchanged and exits with the child's code; it has its own spec.

## Migration Plan

One branch, one PR, these commits in order:

1. Diagnostics (`run-tests.mjs`, CI reporters, `logHeapUsage`) and the Windows fix. No test changes.
2. Config headroom (timeouts). Worker/heap/coverage tuning is deferred until the cause is known (D2).
3. (Reserved — was the CI experiment.)
4. Migration by area, one commit each: `Analytics` (sub-folders), `Assets`, `TestSuites` + `Datasets`, `Runs`, the rest.
5. Turn on `lint:specs` (zero errors by construction).
6. Close-out: `testing.md` re-read, mirrors, notes.

Before merge: the full local run matches the known baseline and every migrated spec passes alone, twice and shuffled. Rollback after squash-merge is the whole PR; config changes are values in two files and the lint is a script plus a lint-staged entry, so a forward fix of any one of them is small.

## Findings

_Empty until the D2 experiment has run._

## Open Questions

- Should `lint:specs` also run in `pr.yml`? It is cheap and would stop a bad spec before pre-push, but adds a PR job (the proposal keeps *test* execution out of `pr.yml`).
- Is a runner with more memory available through an `epam/ai-dial-ci` input? Only relevant if D2 confirms H1 and fewer workers is too slow.
- Is an 11–17 min suite acceptable once it is stable, or is a target needed (which would justify sharding)? Not decided here.

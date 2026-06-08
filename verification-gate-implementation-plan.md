# Implementation Plan: Spec Verification Gate

A sub-agent that verifies a feature's **acceptance-critical, browser-observable behavior** against its spec before the work is considered done, and returns a structured report to the orchestrating agent.

> **Read this whole file first, then start with Phase 0 (repo discovery). Adapt all paths, languages, and commands to what you find in the repo — the examples below assume a TypeScript/Node app with Playwright, but match the repo's actual conventions.**

---

## 1. What we are building

A verification gate, not a generic test writer. Given a spec (OpenSpec-style `Requirement` + `Scenario` blocks in WHEN/THEN form), the gate:

1. Selects the requirements whose acceptance criteria are observable in a browser.
2. Generates Playwright tests for them.
3. Runs them with the Playwright **test runner** (the runner is the judge).
4. Returns a structured report keyed by requirement ID, including what it could **not** verify.

The orchestrating agent uses the report to decide whether the task is done. The gate never makes that call itself.

## 2. Non-negotiable principles (keep these even in the MVP)

These are cheap to honor and they are the entire reason the gate produces real signal instead of synthetic green:

- **The runner is the judge.** Verdicts come from concrete Playwright assertions executed by `playwright test`. The model NEVER decides pass/fail at runtime, and NEVER reports "looks fine" from a screenshot. Every verdict is backed by an artifact (assertion result, screenshot, or trace) that a human could re-inspect.
- **Determinism.** Generated tests are written to disk as files and reused verbatim. A verification run is fully deterministic and involves no model call. The only non-deterministic step — test generation — is quarantined: generate to files, freeze, reuse, regenerate only on explicit request.
- **Honest coverage boundary.** The gate never rounds "my checks passed" up to "task done." It reports what it verified, what it could not verify, and why. The done-call belongs to the orchestrating agent.

## 3. Division of labor

- **Model (expensive, used at generation/triage time only):** read the spec, select acceptance-critical browser-verifiable scenarios, translate intent into concrete checks, author Playwright test files, and on failure diagnose whether it's a real defect, a setup problem, or flake.
- **Runner (cheap, deterministic, used at run time):** execute assertions, emit pass/fail, capture screenshots and traces.

Test authoring may use the **Playwright MCP** to explore the live app (find semantic locators, confirm states). But the committed verification path is always generated spec files run by `playwright test` — never live MCP driving as the source of the verdict.

## 4. Verdict categories

Every scenario gets exactly one verdict:

- `pass` — assertion passed.
- `fail` — the element was found but the behavior is wrong (assertion failed).
- `blocked` — the gate could not verify it: the element could not be located via a **semantic locator** (`getByRole` / `getByLabel` / `getByText`), or the required precondition state could not be reached. This is reported honestly, not forced into a brittle selector. (Note: a `blocked` from a missing role/label is, for free, a signal that the UI is not addressable/accessible — surface it, don't hide it.)
- `skipped` — not browser-verifiable (e.g. "passwords MUST be hashed with bcrypt" is a unit/integration concern). Recorded with a reason so coverage stays honest.

## 5. Pipeline (MVP spine)

1. **Parse** the spec → extract requirements and scenarios, each with a stable ID.
2. **Filter** (model) → classify each scenario as E2E-verifiable or not; `skipped` ones carry a reason.
3. **Generate** (model) → for each E2E scenario, author a Playwright test using semantic locators; write it to the generated-tests directory. Login/setup is handled inline (see §7).
4. **Run** (runner) → `playwright test`; the runner judges pass/fail and captures evidence.
5. **Report** → map runner output to the report schema in §8, keyed by requirement ID; return to the orchestrating agent.

---

## Phase 0 — Repo discovery (do this before writing any code)

Inspect the repository and record findings; everything downstream adapts to these:

- [ ] **Spec location & format.** Find where specs live (e.g. `openspec/specs/`, `openspec/changes/*/specs/`). Confirm the `Requirement` / `Scenario` (WHEN/THEN) structure and how requirement IDs are derived. If a change is being verified, note whether to read the delta only or also the consolidated spec.
- [ ] **App & dev server.** How the app is built/served, the base URL, and the command to start it (from `package.json` scripts, README, Docker, etc.).
- [ ] **Language & test conventions.** TypeScript vs JS vs other; existing test framework; whether Playwright is already a dependency.
- [ ] **Auth flow.** How a user logs in (route, fields, credentials/test account, any test-mode bypass or seed endpoint).
- [ ] **Existing Playwright setup**, if any (`playwright.config.*`, existing `e2e/` dir) to extend rather than duplicate.

Output a short `DISCOVERY.md` (scratch, not committed) summarizing the above so the next phases are concrete.

## Phase 1 — Harness skeleton (stable frame)

Build the scaffolding the generated tests run inside. This is written once and rarely changes.

- [ ] `playwright.config.ts` — base URL, single browser project (chromium) for MVP, `testDir` pointing at the generated-tests directory, retries off, trace + screenshot on failure.
- [ ] Directory layout, e.g.:
  - `verification/` — harness root
  - `verification/generated/` — generated test files (**gitignored**, regenerable, not a maintained artifact)
  - `verification/report/` — emitted report + evidence (gitignored)
  - `verification/setup/` — shared setup (inline login lives here for MVP)
- [ ] Shared setup — an inline login helper invoked from a `beforeEach` (no fixtures module, no `storageState` yet — see §9).
- [ ] **Custom reporter / wrapper** — turns Playwright's result output into the report schema in §8, keyed by requirement ID, with verdict category and evidence paths.
- [ ] **Entrypoint** — a single command the orchestrating agent invokes to run the gate and get the report (e.g. `npm run verify` → runs `playwright test` → writes `verification/report/report.json`).

## Phase 2 — Spec parsing + scenario selection

- [ ] Parser that reads the spec(s) and yields a list of `{ requirement_id, scenario_id, given/when/then text }`.
- [ ] Selection step (model-driven): mark each scenario `e2e` or `skipped(reason)`. Acceptance-critical = the user-facing behavior that proves the spec's intent is realized.
- [ ] Emit an intermediate plan (scratch) listing, per scenario: precondition, action, expected assertion, and the verdict-relevant locator strategy. This makes the model's interpretation auditable **before** any browser work.

## Phase 3 — Test generation

- [ ] For each `e2e` scenario, generate one Playwright test that:
  - uses semantic locators only (`getByRole`, `getByLabel`, `getByText`) so that an un-addressable element surfaces as `blocked`, not a brittle pass;
  - sets up WHILE / IF states deterministically via `page.route` (delay a response to observe an in-progress state; return an error status to exercise a failure path);
  - tags the test with its `requirement_id` / `scenario_id` so results map back.
- [ ] Write tests into `verification/generated/`. Regeneration is an explicit action; existing files are reused verbatim between runs.
- [ ] On a `blocked` outcome, report the locator/error as-is. (Do not classify the cause further in the MVP.)

## Phase 4 — Run + report

- [ ] Wire the entrypoint to run `playwright test` and produce `verification/report/report.json` per §8.
- [ ] Ensure failures attach evidence (screenshot + trace paths).
- [ ] Produce the coverage summary and the explicit "outside boundary — confirm separately" list.

---

## 8. Report schema (output contract)

```json
{
  "spec_ref": "openspec/changes/<change-id>/specs/...",
  "gate_status": "green | red",
  "gate_note": "green = every browser-verifiable acceptance criterion passed. This is NOT a 'task done' verdict; the orchestrating agent decides done using the boundary below.",
  "summary": {
    "acceptance_critical_total": 0,
    "passed": 0,
    "failed": 0,
    "blocked": 0,
    "skipped_not_e2e": 0
  },
  "outside_boundary": [
    { "requirement_id": "REQ-X", "reason": "not browser-observable (e.g. server-side hashing) — confirm via other means" }
  ],
  "findings": [
    {
      "requirement_id": "REQ-2",
      "scenario_id": "REQ-2.1",
      "description": "Valid credentials redirect to the dashboard within 3s",
      "verdict": "pass | fail | blocked | skipped",
      "test_ref": "verification/generated/req-2-1.spec.ts",
      "reason": "for blocked/skipped: why",
      "evidence": {
        "assertion": "expect(page).toHaveURL('/dashboard')",
        "screenshot": "verification/report/req-2-1.png",
        "trace": "verification/report/req-2-1.zip",
        "error": "for fail/blocked: runner error message"
      }
    }
  ]
}
```

`gate_status` answers only "did everything I could verify pass." `outside_boundary` is what makes the boundary honest.

## 9. Explicitly OUT OF SCOPE for the MVP

Do **not** build these now. The architecture leaves clean seams for each later:

- **Accessibility / axe-core (WAI-ARIA) layer.** Not built. The worst a11y issues already surface for free as `blocked` from semantic locators. Later: add axe as a new check type.
- **Fixtures module + `storageState`.** Login is inline in `beforeEach` for now. Later: extract login to a fixtures helper and cache auth via `storageState`, keyed by the auth flow (not by feature specs).
- **Content-addressed cache with per-requirement hashing.** Not built. Generated tests live on disk and are regenerated explicitly. Later: add hashing in front of the on-disk files for automatic, granular invalidation.
- **`blocked`-cause classification** (a11y vs unreached-state). Just report the error for now.
- **Incremental `verify(requirement_ids)` selective re-run.** Re-run the full suite for now (it's the runner, so it's cheap). Requirement IDs are already in the report, so selective re-run slots in later as a filter.

## 10. Acceptance criteria for this implementation

- [ ] `npm run verify` (or repo equivalent) runs end to end and writes a valid `report.json` per §8.
- [ ] A deliberately broken behavior produces a `fail` with a screenshot + trace; the same run repeated produces an identical verdict (determinism).
- [ ] An element with no semantic role/label produces `blocked`, not a fake pass and not a crash.
- [ ] A non-browser-verifiable requirement appears under `outside_boundary`, not as a `fail`.
- [ ] No model call occurs during a plain verification run — generation and run are separate steps.
- [ ] Generated tests and reports are gitignored; the spec files are untouched.

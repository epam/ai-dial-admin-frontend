---
name: spec-browser-verify
description: Verify an OpenSpec change's browser-observable acceptance scenarios against the live local app. Reads the change's delta + affected consolidated specs, builds a VerificationRequest, spawns the spec-verification-gate sub-agent (which drives the Playwright MCP), and reports verdicts back. Additive to the OpenSpec workflow — it reads specs but never modifies opsx artifacts, config, or code, and never makes the "done" call. Use when the user wants to verify a change works in the browser, or to retest specific scenarios after a fix.
alwaysApply: false
metadata:
  author: project
  version: "1.0"
---

Verify a change's browser-observable acceptance behavior against the running local
app, then return the verdicts to the caller.

This skill **integrates with** the OpenSpec workflow; it does not override it. It
reads spec files under `openspec/` but never writes to them, never edits
`openspec/config.yaml` or any `opsx`/`openspec-*` skill or command, and never
modifies application code. It also never decides whether the task is "done" — it
reports what passed, failed, was blocked, or is out of browser scope, and hands
that back to the caller (you, or the orchestrating `/opsx:apply` agent).

**Input**: Optionally a change name. Optionally a subset of `scenario_id`s to run
(for a targeted retest — e.g. "retest the failed ones"). If no change is given,
infer from context or prompt for selection.

## Prerequisites

- The local stack (frontend + backend + MCP backend) is **already running** at the
  base URL (default `http://localhost:4200`). This skill does not start it.
- The instance runs with **auth disabled**. If the gate hits a login wall it will
  report the affected scenarios as `blocked` — it will not automate OAuth.
- The Playwright MCP server is connected (the gate uses it to drive the browser).

## Steps

1. **Select the change**

   If a name is provided, use it. Otherwise infer from conversation context, or run
   `openspec list --json` (read-only) and use the **AskUserQuestion tool** to let
   the user pick. Announce: "Verifying change: <name>".

2. **Read the specs (read-only)**

   - Delta specs: `openspec/changes/<name>/specs/**/spec.md`.
   - Affected consolidated specs: for each capability touched by the deltas, also
     read `openspec/specs/<capability>/spec.md` to catch regressions in existing
     requirements of those capabilities.

   Never write to these files.

3. **Build the `VerificationRequest`**

   Parse each `### Requirement:` and its `#### Scenario:` (WHEN/THEN/AND) blocks.
   For each scenario:
   - Derive a stable id: `<capability>/<requirement-slug>` for `requirement_id` and
     `<capability>/<scenario-slug>` for `scenario_id` (kebab-case the heading text).
   - Classify it: **browser-observable** (UI behavior a user can see — validation,
     enabled/disabled states, errors, navigation, rendered content) vs **not**
     (server-side hashing, persistence internals, etc.).
   - Include browser-observable scenarios in `scenarios[]` with `given`/`when`/`then`
     taken from the spec text, an inferred `entry_path` (locale-prefixed, e.g.
     `/en/<entity>`), and optional `hints.locators` when the role/label is obvious.
   - Leave non-browser scenarios OUT of `scenarios[]`; list them in your summary as
     "outside browser scope — confirm separately" so coverage stays honest.

   For a **retest**, include only the requested `scenario_id`s.

   The shape (matches the gate's input contract):

   ```json
   {
     "spec_ref": "openspec/changes/<name>/specs/<cap>/spec.md",
     "base_url": "http://localhost:4200",
     "preconditions": { "auth": "disabled", "stack": "assumed running" },
     "scenarios": [
       {
         "requirement_id": "<cap>/<req-slug>",
         "scenario_id": "<cap>/<scenario-slug>",
         "description": "…",
         "entry_path": "/en/<entity>",
         "given": "…", "when": "…", "then": "…",
         "hints": { "locators": ["getByRole('button', { name: 'Save' })"] }
       }
     ]
   }
   ```

4. **Spawn the verification gate**

   Use the **Agent tool** with `subagent_type: "spec-verification-gate"`, passing the
   `VerificationRequest` JSON as the prompt. The gate drives the Playwright MCP in
   its own context and returns a `VerificationReport` as its final message. Do not
   drive the browser yourself — keep the snapshot-heavy work in the sub-agent.

5. **Present the report**

   Summarize the returned `VerificationReport` for the caller:
   - `gate_status` (green/red) and the `summary` counts.
   - Each `fail` and `blocked` with its `expected` vs `observed`, `reason`, and
     `fix_hint`.
   - The list of `scenario_id`s with `retest: true` — the exact set to re-send after
     a fix.
   - The "outside browser scope" list from step 3.

   Do **not** mark any task complete, edit specs, or change code. Hand the verdicts
   back; the caller decides what to fix and whether to continue.

## Selective retest

To retest after a fix, re-invoke with only the failing `scenario_id`s (or
"retest the failed scenarios" — reuse the previous report's `retest: true` set).
Step 3 builds a subset `VerificationRequest`; the gate marks the run
`meta.partial = true`. Never re-run the full suite for a targeted retest.

## Output

```
## Browser verification: <change-name>

**Gate status:** red
**Scenarios:** 6 total — 4 pass, 1 fail, 1 blocked

### Fail
- <cap>/save-blocked-while-invalid
  expected: Save disabled while name has a forbidden char
  observed: Save button is enabled
  fix hint: <actionable note>

### Blocked
- <cap>/edit-panel-marks-invalid-on-load
  reason: could not locate the Display Name field by role/label

### Outside browser scope (confirm separately)
- <cap>/duplicate-name-check (server-side validation)

**Retest set:** save-blocked-while-invalid, edit-panel-marks-invalid-on-load
```

## Guardrails

- **Additive, never override**: read `openspec/` specs only; never edit specs,
  `config.yaml`, opsx/openspec-* skills or commands, or application code.
- **Never make the done-call**: report verdicts; the caller decides.
- **Honest boundary**: non-browser scenarios are reported as out-of-scope, not as
  `fail` and not silently dropped.
- **Keep browser work in the gate**: spawn the sub-agent; don't drive the MCP here.
- **Targeted retest only**: when retesting, send just the requested scenarios.
- **Fail fast on environment**: if the gate reports everything `blocked` due to an
  unreachable app or a login wall, surface that as a setup problem, not a defect.

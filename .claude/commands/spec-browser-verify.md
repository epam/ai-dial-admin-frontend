---
name: "Spec Browser Verify"
description: Verify an OpenSpec change's browser-observable scenarios against the live local app (integrates with, does not override, the opsx workflow)
category: Verification
tags: [verification, openspec, playwright, browser]
---

Verify a change's browser-observable acceptance scenarios against the running local
app, and report the verdicts.

**Input**: Optionally a change name (e.g. `/spec-browser-verify app-route-name-validation`).
Optionally a retest scope (e.g. `/spec-browser-verify <change> --retest-failed` or a
list of `scenario_id`s). If omitted, infer the change from context or prompt for it.

**Action**: Use the **spec-browser-verify** skill. It reads the change's delta +
affected consolidated specs, builds a `VerificationRequest`, spawns the
`spec-verification-gate` sub-agent (which drives the Playwright MCP against the live
app), and presents the returned verdicts plus the retest set.

**Notes**
- The local stack must already be running (default `http://localhost:4200`) with auth
  disabled. The skill does not start the stack and does not automate OAuth.
- This is **additive** to OpenSpec: it reads specs but never edits them,
  `openspec/config.yaml`, the `opsx`/`openspec-*` skills/commands, or application code,
  and never makes the "done" call — it reports, you decide.

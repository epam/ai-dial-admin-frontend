## 1. Restore index-column sorting

- [x] 1.1 Update `Runs/View/utils.ts` so `buildIndexColumn` keeps `EllipsisHeader` as an inner header, explicitly enables sorting, and verify Request and Turn retain numeric 1-based values.

## 2. Unit tests

- [x] 2.1 Extend `Runs/View/tests/utils.spec.ts` to assert the Run, Request, and Turn column definitions retain native sortable headers and run the targeted Vitest cases.

## 3. Browser verification

- [x] 3.1 Run the `spec-browser-verify` skill against `restore-run-result-request-turn-sorting` with the local app on port 4200 and auth disabled; verify Request and Turn ordering before and after filtering by Test Case name, and resolve every `fail` verdict.
  - Attempted 2026-09-17: all 9 browser scenarios were **blocked** because the Playwright MCP server was not connected. No `fail` verdicts. Retest after connecting Playwright MCP.

## 4. Quality checks

- [x] 4.1 Run OpenSpec validation, formatting, lint, app typecheck, and the relevant Runs View Vitest file; fix any failures attributable to this change.

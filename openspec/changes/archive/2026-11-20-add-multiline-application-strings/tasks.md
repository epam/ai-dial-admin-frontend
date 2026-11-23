## 1. String editor

- [x] 1.1 Create a reusable raw-string input and multiline popup under `apps/ai-dial-admin/src/components/Common/`, composing `InputPopup`, ui-kit `Popup` and a textarea that fills the available bounded popup body; implement draft initialization, Apply, Cancel/close/Escape, and unchanged-value preservation.
- [x] 1.2 Implement safe read-only previews for values containing line breaks, immediate inline editing for single-line values, required styling, accessible labels, focus behavior, unique popup portal IDs, and read-only permissions; keep any changes to `Common/InputPopup` compatible with existing consumers.

## 2. Parameters table integration

- [x] 2.1 Add a string-specific AG Grid cell renderer under `apps/ai-dial-admin/src/components/Grid/CellRenderers/`, wiring parent changes, grid cell state, required indication, and row identity without losing multiline content.
- [x] 2.2 Update `apps/ai-dial-admin/src/components/Applications/ParametersTab/utils.ts` and, if needed, `TableView.tsx` to select the renderer for named string rows and preserve skip-refresh, other type renderers, schema constraints, pending-key behavior, and application Save/Discard.

## 3. Automated tests

- [x] 3.1 Add component tests for all new and updated controls: inline edits, multiline preview, full-value popup, whitespace and trailing newline preservation, no-op CRLF Apply, arbitrary text, empty and required values, Apply/Cancel/close/Escape, read-only behavior, keyboard access, and shared input regressions.
- [x] 3.2 Add tests for the renderer and Parameters table covering string selection for user and schema rows, other types and pending keys, multiple-row isolation, grid synchronization/focus, type transitions, Save/Discard, and entity/asset property map updates. Retain at least one test with the real grid.

## 4. Final quality checks

- [x] 4.1 Run targeted tests, `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the full `npm run test` suite; resolve or report failures.

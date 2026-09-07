## 1. Reading a large result value

- [x] 1.1 Add the tooltip and preview thresholds to `constants/analytics/query-builder.ts`, and `isFullValueNeeded` / `previewOf` to `utils/result.ts`
- [x] 1.2 Give result columns their own `tooltipValueGetter` returning the rendered text, and only below the threshold — the shared grid's default reads the raw value and its renderer drops anything that is not a string
- [x] 1.3 Add `Result/ResultValueDialog.tsx`: the value in a read-only Monaco editor via the shared `beautifyValue`, with close and copy in the footer; Monaco is used directly because the shared `JsonEditorBase` installs a JSON schema requiring an object at the root
- [x] 1.4 Add `Result/ResultValueCell.tsx`: plain text below the threshold, preview plus a named control above it, mounting the dialog only while open
- [x] 1.5 Attach the cell renderer in `Result/ResultArea.tsx`, leaving the column builder a pure description of the columns
- [x] 1.6 Add the two labels to `constants/i18n.ts` and `locales/en.ts`

## 2. Tests

- [x] 2.1 Unit tests for the thresholds and for the tooltip getter offering an object's text below the threshold and nothing above it
- [x] 2.2 Component tests for the cell and its dialog: plain text below the threshold, the named control above it, the dialog named by its column, JSON text shown indented, copy and close side by side, copy placing the shown text on the clipboard, and closing from the footer

## 3. Quality checks

- [x] 3.1 Run `npm run lint`, `npm run format`, and `npm run test`, and fix everything they report

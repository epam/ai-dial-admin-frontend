## 1. Recover the stash

- [x] 1.1 Write `git stash show -p stash@{2}` to a scratch file outside the repo and apply it with `git apply --exclude=` for `Runs/Details/RowDetails/models.ts`, `Runs/View/RowDetails/PivotValueCell.tsx`, `openspec/specs/analytics-bottom-drawer/spec.md`, `openspec/specs/run-compare-row-details/spec.md` and the two spec files under `Runs/View/RowDetails/tests/` that conflict; verify `git apply` exits 0, the `FieldCompare/` files, `src/utils/text-diff.ts`, `src/models/text-diff.ts` and `metric-field-info.ts` exist, and `git stash list` still shows `stash@{2}`.
- [x] 1.2 Hand-merge `Runs/Details/RowDetails/models.ts`: add `MetricFieldInfo` and `primaryInfo` / `secondaryInfo` on `RowDetailField` without disturbing the filter types added by the previous change; verify `npm run typecheck` reports errors only in `PivotValueCell.tsx`.
- [x] 1.3 Hand-merge `Runs/View/RowDetails/PivotValueCell.tsx` as an interim: metric field opens `ScoreCompareModal` with `SINGLE_RUN_COLUMNS`, other fields keep `FullscreenValueViewer`; verify `npm run typecheck` passes.
- [x] 1.4 `git mv` `Runs/Compare/ExecutionResults/FieldCompare/*` (components, utils, constants, models and `tests/`) to `Runs/Details/ValuePopups/`, rename `ScoreCompareModal` → `ScoreModal` and `ScoreCompareColumn` → `ScoreColumn`, keep `FieldCompareModal` in `Runs/Compare/ExecutionResults/RowCompareDetails/`, and update every import; verify `npm run typecheck` and `npm run typecheck:specs` pass and the moved specs run green.
- [x] 1.5 Replace `DialPopup`, `DialGhostIconButton` and `DialEllipsisTooltip` in the recovered components with `Popup`, `GhostIconButton` and `EllipsisTooltip` (check props with the ui-kit MCP server); verify a repo-wide search finds no `Dial*` usage and the recovered specs still pass.

## 2. Restyle the popups

- [x] 2.1 Read the Figma variables and geometry for the score frames (`1383:30101`, `1383:30115`, `1383:30136`, `1383:30162`) and the text frame (`1383:28585`) with `get_design_context`; record chip colours for Error / 0 / 1 and the popup widths, and change `ValuePopups/constants.ts` only where the recovered values differ; verify `ScoreChip.spec.tsx` asserts the chosen classes for an error, a 0 and a 1.
- [x] 2.2 Restyle `ScoreModal`, `ScoreColumn` and `MetricInfoCard` to the frames (800 px, metric name title, Score card, `reason` open, `logs` collapsed, size label and Copy); drop the fullscreen button and its handlers so no card has one, in a single run or a comparison; verify `MetricInfoCard.spec.tsx` and `FieldCompareModal.spec.tsx` assert there is no fullscreen button.
- [x] 2.3 Restyle `Runs/View/RowDetails/FullscreenValueViewer.tsx` to the 724 px text frame (field label title, close button, `font-mono` pre-wrapped scrolling body), keeping JSON pretty-printing; verify `FullscreenValueViewer.spec.tsx` still passes and a plain string renders unchanged.
- [x] 2.4 Create `Runs/View/RowDetails/RunValueModal.tsx`: metric field → `ScoreModal` with `SINGLE_RUN_COLUMNS` and no fullscreen handler, any other field → `FullscreenValueViewer`; verify with the spec in 4.2.

## 3. Cells

- [x] 3.1 Side panel: make `ExpandableValueCell.tsx` always render the whole-cell button (drop the `isOverflowing` gate), show the icon on hover and focus, and call `onOpen(field)`; in `ExecutionRowDetailTable.tsx` keep the selected field and render `RunValueModal`; verify with the specs in 4.2.
- [x] 3.2 Create `Runs/Details/RowDetails/use-fitted-line-clamp.ts` (a `ResizeObserver` that computes `floor(height / lineHeight)` and returns the inline clamp style) and a `FieldValue` variant that uses it; verify with the hook spec in 4.2.
- [x] 3.3 Bottom pivot: add an `isTruncated` prop to `PivotValueCell.tsx` that selects the fitted-clamp variant instead of scrolling, show the icon on focus as well as hover, open `RunValueModal` for single run, and pass `isTruncated` from `ExecutionRowDetailPivotTable.tsx` only; verify the Compare pivot spec passes unchanged.
- [x] 3.4 Compare: confirm `CompareRowDetailTable.tsx` and `CompareRowDetailPivotTable.tsx` open `FieldCompareModal` (score popup for metric fields, the text diff otherwise) with the run labels and `hasComparedMatch`; verify the recovered Compare specs and `CompareRowDetailPivotTable.spec.tsx` pass.

## 4. Tests

- [x] 4.1 Update every spec that moved or changed with the recovered code (`ValuePopups/tests/*`, `run-field-values.spec.ts`, `metric-field-info.spec.ts`, `BottomDrawer/tests/utils.spec.ts`, `row-detail-sections.spec.ts`, `text-diff.spec.ts`) so each asserts i18n keys and role queries per `.claude/rules/testing.md`; verify `npx vitest run src/components/Runs src/utils` passes from `apps/ai-dial-admin/`.
- [x] 4.2 Add specs for new and changed code: `RunValueModal.spec.tsx` (metric → one-column score popup, other → text popup, failed metric → `Error` chip), `use-fitted-line-clamp.spec.ts` (mocked observer and metrics), `ExpandableValueCell.spec.tsx` (short value, status cell and score cell are buttons; Enter/Space opens), `ExecutionRowDetailTable.spec.tsx` (a click opens the right popup), `PivotValueCell.spec.tsx` (`isTruncated` clamps instead of scrolling, the default still scrolls), and `FieldCompareModal.spec.tsx` where not already covered; verify each runs green on its own.

## 5. Specs, docs and quality

- [x] 5.1 Update `docs/` if any page describes the value popups (search first, excluding `.env*`); verify `npm run validate:agent-docs` and `openspec validate redesign-run-value-popups --strict` pass.
- [x] 5.2 Run `npm run lint`, `npm run lint:specs`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full `npm run test`; verify all pass and the exit-code/signal line from `scripts/run-tests.mjs` shows success.

<!-- No browser-verification task: the user declined it. The UI scenarios (hover icon, fit-to-height truncation, popup contents and styling) are covered by the component specs in group 4 only; visual fidelity against the Figma frames is reviewed by hand in code review. The stash is intentionally not dropped by any task. -->

## Context

BE (`ai-dial-admin-evaluation-framework-backend`) exposes:

- `overallScore`: sealed `OverallScoreDefinition` — `mean` | `weighted_mean` | `custom_function`
- `testCaseOverallScore`: Mean / WeightedMean only (`custom_function` → 400); drives Phase-2 per-test-case `score`/`passed`
- `overallScoreThreshold`: optional 0–1; snapshotted for `passed`

FE today only models `overallScore` + `overallScoreThreshold` and edits them live in a right-hand `ScoreSettings` panel even when there are zero metrics.

## Goals / Non-Goals

**Goals:** Match the Metrics redesign (empty state without score chrome; card + Edit modal); persist nested Test Case Score on the BE field when Overall is ROC AUC / `custom_function`.

**Non-Goals:** BE changes; changing Phase-3 analytics consumers; inventing a nested field inside `overallScore` instead of `testCaseOverallScore`.

## Decisions

1. **Use `testCaseOverallScore`, not a nested property on `overallScore`.** Matches BE contract and Phase-2 resolution (`testCaseOverallScore` ?? non-`custom_function` `overallScore`).
2. **Draft-then-Apply in the Edit modal.** Clone suite into modal local state; Apply calls parent `onChange` once. Wrap modal body in a nested `SaveValidationContextProvider` so weight/threshold validation does not block the suite Save button while the modal is open.
3. **Clear `testCaseOverallScore` for Mean / Weighted mean overall.** Per-row scoring then falls back to `overallScore`. For Specific function, default nested score to Mean on first select if unset; Require a valid Mean/WeightedMean before Apply.
4. **Threshold enable switch.** Off clears `overallScoreThreshold`; on shows the existing number input (0–1).
5. **Layout.** When `metrics.length === 0`, render only the metrics empty state (no score card/sidebar). When metrics exist, show an Overall Score card (summary + Edit) above or beside the metrics list — prefer a full-width card above the metrics list so the empty state stays a single column.

## Risks / Trade-offs

- **[Risk]** Suites already saved with `custom_function` and no `testCaseOverallScore` have null per-row scores until the user opens Edit and Applies a nested definition. → Acceptable; BE documents this; card can hint that Test Case Score is unset.
- **[Risk]** Nested `SaveValidationContextProvider` must wrap only modal content. → Confirmed by React context nearest-provider semantics.

## Migration Plan

None. Existing suites without `testCaseOverallScore` keep current BE fallback behavior until edited.

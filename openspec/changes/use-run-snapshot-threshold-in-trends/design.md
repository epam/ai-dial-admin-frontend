# Design

## Context

The Trends loader fetches `Run` objects through the structured-query runs listing. The run snapshot
contains the threshold captured at run start, but the query did not project it and the row mapper did
not restore it to `Run.suiteSnapshot`. Downstream KPI and Test Cases components consequently
received the selected suite's editable threshold. This makes
historical run results change meaning when suite settings are edited.

## Goals / Non-Goals

**Goals:**
- Keep each run's snapshot threshold available through the Trends data model.
- Make threshold-dependent KPI and Test Cases behavior use the threshold associated with the
  run being displayed.
- Preserve the shared aggregate request and existing per-case `passed` outcomes.

**Non-Goals:**
- Change the backend API, run snapshot format, or structured-query shape.
- Change the Overall Score Trend chart's single suite-level threshold reference line.
- Recalculate per-case pass outcomes from score values in the browser.

## Decisions

1. **Project and carry the snapshot threshold.** Select the run entity's
   `overall_score_threshold` field in the structured query and map it into
   `Run.suiteSnapshot.overallScoreThreshold`. Then map that value into the Trends run point when
   `parseTrendsData` joins run metadata. A missing snapshot threshold means unset; never substitute
   the currently selected suite value. The query projection is required because the Trends loader
   relies on this shared runs query.

2. **Parse aggregate rows and empty-run fallbacks per run.** Determine whether a run is
   thresholded from its own point. Thresholded runs use `passed` to split SUCCESS counts into
   above/below, with unscored SUCCESS counts in Error or N/A. Unthresholded runs treat every
   SUCCESS count as Completed. Empty aggregate runs compare their run-level overall score only
   with that run's snapshot threshold.

3. **Keep the UI threshold local to the displayed run.** The pass-rate title/footer and overall
   score glyph/tooltip use the latest run's threshold. Each Test Cases bar tooltip uses that bar's
   threshold; the Latest Run gauge uses the latest run's threshold. The Test Cases legend covers
   the categories present in the window, including both Completed and threshold categories when
   runs have mixed snapshot settings.

4. **Leave the Overall Score Trend reference line unchanged.** It is a single suite-level
   reference across the chart, while this change corrects run-specific result presentation. A
   per-run threshold visualization on that chart would be a separate design change.

## Risks / Trade-offs

- Runs with no snapshot threshold will display as unthresholded even if the current suite has a
  threshold. This may leave older incomplete snapshots without a threshold label, but falling back
  to the current setting would misstate historical behavior.
- A pass-rate delta can compare adjacent runs executed with different thresholds. Each rate remains
  faithful to its run; the threshold shown on the card is the latest run's threshold.

## Migration Plan

No migration is required. The implementation reads the existing run snapshot and keeps the
current Trends aggregate API unchanged.

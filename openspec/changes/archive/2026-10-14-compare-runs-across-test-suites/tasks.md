## 1. Candidate runs across same-dataset suites

- [x] 1.1 Add `CompareCandidateRun` (`Run` plus `testSuiteName`) to `components/Runs/Compare/models.ts` and use it for the candidate list in `getSelectableCompareRuns`, `SelectCompareRunModal`, `useCompareRunLauncher` and `CompareView`; verify `npm run typecheck` passes
- [x] 1.2 Add `fetchCompareCandidateRuns` to `components/Runs/Compare/utils.ts`: read the opened run's suite for `datasetId`, list the dataset's other suites with `getDatasetTestSuites`, fetch completed runs per suite in parallel tagged with the suite name, own suite first, falling back to the own suite on no dataset or any lookup failure; verify `tests/utils.spec.ts` covers sibling listing, the status filter, no dataset, and lookup failure
- [x] 1.3 Switch `useCompareRunLauncher` and `CompareView` from `fetchSuiteCompletedRuns` to `fetchCompareCandidateRuns`; verify `tests/useCompareRunLauncher.spec.tsx` covers same-dataset runs labelled by suite and the no-dataset path

## 2. Picker column

- [x] 2.1 Add the leading `testSuiteName` column to `COMPARE_RUN_PICKER_COLUMN` in `constants/grid-columns/grid-columns.tsx`, falling back to `testSuiteId`; verify `constants/grid-columns/tests/grid-columns.spec.ts` asserts the new column order and the fallback

## 3. Compare Summary per-run suite

- [x] 3.1 Return `primaryTestSuite` and `comparedTestSuite` from `use-summary-overview-data.ts`, each loaded from its own run, and pass both through `SummaryOverviewTab` to `Header`; verify `Summary/tests/use-summary-overview-data.spec.ts` covers two runs of different suites
- [x] 3.2 Update `Summary/Header.tsx` to use each run's own suite as its deployment-link fallback, show one Test Suite field for a shared suite and a `DualRunField` with a link per entry for different suites, falling back to the suite id; verify the new `Summary/tests/Header.spec.tsx` covers shared, different, and not-yet-loaded cases

## 4. Specs

- [x] 4.1 Run `openspec validate compare-runs-across-test-suites --strict` and confirm the deltas for `eval-runs-list` and `run-summary-deployment-link` still match the shipped behaviour

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full `npm run test`; verify all pass with no errors

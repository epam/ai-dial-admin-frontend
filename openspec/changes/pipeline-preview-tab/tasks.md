## 1. Contract, server action and types

- [x] 1.1 Add `models/analytics/pipeline-preview.ts` with the response interfaces (`PipelinePreview`, `PreviewColumn`, `PreviewNote`) and the enums `PreviewNoteCode`, `PreviewNoteSeverity`, `PreviewColumnRole`, mirroring the service's closed sets; an unrecognised code stays representable
- [x] 1.2 Add a `previewPipeline(name)` method to the analytics API class in `server/analytics/` that posts to `/v1/pipelines/{name}/preview` with no body and returns the service's error `code` and message untouched
- [x] 1.3 Add the `previewPipeline` server action to `app/[lang]/pipelines/actions.ts`, authenticated like its siblings, returning the error envelope for 403, 422 and 503 to be told apart
- [x] 1.4 Check one live response against the types before building on them, and record any field the DTO describes but does not return in design.md's open question

## 2. Run state

- [x] 2.1 Add `Preview/use-pipeline-preview.ts`: last success, last failure, in-flight flag, the generation at the time of the run, `run()`; never runs on mount, keeps the last success through a failed run
- [x] 2.2 Add `Preview/preview-notes.ts`: code to i18n title and banner variant, warnings-first stable ordering, unknown-code fallback, and the success line as a pure function of notes, enabled state and kind
- [x] 2.3 Add `Preview/preview-columns.ts`: header text from role, type, target type and byte size, and the `N groups` / `N of M groups` / `N sample rows` chip text

## 3. Result presentation

- [x] 3.1 Add the `Preview` entry to `EntityViewTab` and a `previewTab` factory in `utils/tabs/utils.ts`, and place it second in the strip built by `PipelineDetailFrame.tsx`, gated on full admin and `analyticsEnabled`
- [x] 3.2 Add `Preview/PipelinePreview.tsx` (first-visit state, run control, in-flight state) and `Preview/PreviewRunBar.tsx` (count chips, caption, group chip with the previous key)
- [x] 3.3 Add `Preview/PreviewGrid.tsx` with a custom header component and `NULL` cells, following `components.md` §11 and `a11y.md` (named headers, no `break-all`, `DialEllipsisTooltip` for cut values)
- [x] 3.4 Add `Preview/PreviewNotes.tsx` and the empty states (`No data yet`, `No matching rows`, `No group found`, held by an enrichment), with the cause for `no_matching_rows` taken from whether the saved declaration carries a filter
- [x] 3.5 Add `Preview/PreviewStatement.tsx` (formatted with `QueryBuilder/utils/sql-format.ts`, copied raw, expanded state exposed) and `Preview/PreviewOutputs.tsx` (declared outputs, outputs without a description flagged) built from the saved declaration

## 4. Failure, access and staleness states

- [x] 4.1 Add `Preview/PreviewError.tsx` for validation, budget (remedy per kind), generic with code, and storage-unavailable, each with its action
- [x] 4.2 Add the no-access state for the 403 family: an explanation, the column named where the service names one, no run control
- [x] 4.3 Add the "Open …" navigation: a section-key callback on `PipelineDetailFrame` that selects `Properties` and focuses the section heading without touching the draft
- [x] 4.4 Add the unsaved-edit banner with `Run on saved version` and no save or discard control, and the stale-generation banner with the dimmed result removed from tab and reading order; withhold the success line from a result that is not current
- [x] 4.5 Add the run-completion live region, separate from the run control's own label

## 5. Strings

- [x] 5.1 Add the `PipelinePreviewI18nKey` enum in `constants/i18n.ts` and the English strings in `locales/en.ts` for every title, state, banner, chip and action in the spec

## 6. Tests

- [x] 6.1 Unit tests for `preview-notes.ts` and `preview-columns.ts`: ordering, unknown code, success line per kind and enabled state, chip text for each count case
- [x] 6.2 Hook test for `use-pipeline-preview.ts`: no run on mount, success replaces, failure keeps the earlier success, in-flight keeps the previous result, generation recorded
- [x] 6.3 Component tests for the tab: first visit, run, result for each of the four kinds, notes, empty states, group chip with and without a previous key, Statement copy and Outputs, each failure state and its actions, access state with no run control, unsaved-edit banner with no save control, success line withheld from a result that is not current, singular chips, stale banner
- [x] 6.4 Update the existing `PipelineDetailFrame` tests for the new tab order and the withheld Preview tab for a non-admin and with analytics disabled
- [x] 6.5 Action and API tests for `previewPipeline`: no body sent, error envelope passed through

## 7. Browser verification

- [x] 7.1 Run the `spec-browser-verify` skill against this change's scenarios: it builds the verification request from the delta and spawns `spec-verification-gate` against the running local app via Playwright (needs the local stack with authorization off and a working ADAS); resolve every `fail` verdict before the change is complete

## 8. Quality checks

- [x] 8.1 Run `npm run lint`, `npm run format`, `npm run typecheck` and `npm run typecheck:specs`, each at zero
- [x] 8.2 Run the full `npm run test` suite and fix any failure

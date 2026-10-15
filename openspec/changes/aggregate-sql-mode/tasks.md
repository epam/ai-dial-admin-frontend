## 1. Wire and DTO

- [x] 1.1 Add `sql?: string` to `CreatePipelineDto` in `apps/ai-dial-admin/src/models/analytics/pipeline.ts`; confirm `Pipeline` inherits it and that no read-only list drops it.
- [x] 1.2 In `utils/analytics/pipeline-dto.ts`, make `buildPipelineDto` prune by mode for an aggregate (SQL: drop `group_by`, `measures`, `filter`; Form: drop `sql`), add `sql` to the enrich-side pruning, and drop a blank `sql` from the body (design D1, D2).
- [x] 1.3 Check that `toPipelineDraft` keeps `sql` and that the JSON editor seed shows it with no form member beside it for a SQL-mode pipeline.

## 2. Form state

- [x] 2.1 In `Aggregate/use-aggregate-form.ts`, derive the active mode from `draft.sql`, add `onModeChange` that sets `sql: ''` and clears the form members or deletes `sql`, and expose whether the mode being left holds authored content.
- [x] 2.2 Find where the "at least one measure" gate is enforced (`PipelineDetailFrame` / `use-aggregate-form`) and apply it to Form mode only (design D5). Finding: the console enforces no such gate (the form hook's own spec pins that a declaration with no measure is not withheld), so nothing to change.

## 3. Components

- [x] 3.1 Add `Aggregate/AggregateModeSwitch.tsx`: the Form/SQL choice as a ui-kit `RadioGroup` (row orientation), named by its label.
- [x] 3.2 Add the discard confirmation (`ConfirmationPopup`, pattern of `Common/PausePipelinePopup.tsx`), opened only when the mode being left has authored content.
- [x] 3.3 Add `Aggregate/SqlDeclarationEditor.tsx`: monospaced textarea, accessible name, caption stating the accepted shape (one `INSERT INTO <target> (…) SELECT …`), `spellCheck={false}`, no validation and no rewriting of the value (design D3).
- [x] 3.4 In `Aggregate/AggregateSection.tsx`, render the switcher, then either the group keys and measures sections or the SQL editor; keep `PipelineSharedFields` and `CronField` in both modes, with the filter hidden in SQL mode through an `isFilterHidden` prop on `PipelineSharedFields` (spec: the filter belongs to Form mode). Hide the source-field load error in SQL mode if nothing in that mode uses it.
- [x] 3.5 Check the Preview panel for affordances that target the absent group-keys anchor in SQL mode and hide them there (design D6).
- [x] 3.6 Add i18n keys to `AnalyticsPipelinesI18nKey` and `locales/en.ts` for the switcher, its two options, the confirm title/body, the editor label and caption.

## 4. Tests

- [x] 4.1 `utils/analytics/tests/pipeline-dto.spec.ts`: SQL mode sends `sql` and none of `group_by`/`measures`/`filter`; Form mode sends no `sql`; blank/whitespace `sql` is not sent; a multi-line statement is sent unchanged; enrich is untouched.
- [x] 4.2 `Aggregate/tests/use-aggregate-form.spec.ts`: mode derives from `sql`; switching clears the other mode's members; the measure gate is Form-only; the has-content flag.
- [x] 4.3 Component specs for `PipelineSharedFields` (filter hidden or shown), `AggregateModeSwitch`, the confirm flow and `SqlDeclarationEditor`; the section's wiring and the JSON-editor round trip are left to the 6.1 browser run. Query by role and accessible name, per `.claude/rules/testing.md`.

## 5. Specs and docs

- [x] 5.1 Fold the delta into `openspec/specs/analytics/pipelines/spec.md` through the archive step; `docs/` holds no page describing the aggregate section, so there is nothing to update there.

## 6. Browser verification

- [x] 6.1 Run the `spec-browser-verify` skill against this change's scenarios on the local app (auth disabled, analytics enabled): mode choice on open, mode switch with and without confirm, SQL editor save and refusal message, request body exclusivity. Resolve every `fail` verdict before the change is complete.

## 7. Quality checks

- [x] 7.1 Run lint, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the affected specs with `npx vitest run` from `apps/ai-dial-admin/`; finish with the full `npm run test`.

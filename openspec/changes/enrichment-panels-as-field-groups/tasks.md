## 1. Field descriptions in the shared rows

- [x] 1.1 Add optional `description` to `SpanFieldDescriptor` (`models/analytics/sessions-trace.ts`) and fill it from the schema field in `groupSchemaFields` (`utils/analytics/session-column-catalog.ts`)
- [x] 1.2 Render `FieldCaveat` beside the label in `SpanFactRow` and `SpanObjectFactRow` when a description is present, passed through `SpanGroupPanel`

## 2. Enrichment groups and projection

- [x] 2.1 Stop dropping object, array and map columns in `enrichmentColumnsOf`; build the panel's groups as `SpanFieldGroup[]` with `type` and `description`, untagged fields under `UNTAGGED_SPAN_FIELD_TAG`, keeping the declared-order / appearance / `system`-last ordering (`utils/analytics/session-insights.ts`, `SessionEnrichmentPanel` model)
- [x] 2.2 Set the Title role field and the summary field aside in `enrichmentPanelsOf` before the groups are built, and decide "has a value" in `sessionInsightsState` through `isSpanFieldEmpty`
- [x] 2.3 Confirm `buildSessionDetailQuery` now projects the non-scalar enrichment fields through `enrichmentPanelsOf` (`utils/analytics/sessions-queries.ts`)

## 3. Enrichment title

- [x] 3.1 Rename `getEnrichmentTagOrders` to `getEnrichmentDefinitions` returning tag order and description per namespace from the existing `getTable` read (`app/[lang]/sessions/actions.ts`), and pass the description onto the panel model in `app/[lang]/sessions/[id]/page.tsx`
- [x] 3.2 Give `SessionDetailPanel` an optional `hint` shown as a ui-kit `Tooltip` on a focusable title and make `source` optional; enrichment panels in `SessionDetailRail` pass the description and no source

## 4. Panel presentation

- [x] 4.1 Render `SessionEnrichmentPanel` as the summary paragraph followed by `SpanFieldsSection` (`isRecord`), unframed in `SessionDetailRail`; delete any helper left without a caller (`SessionTermList` stays: `SessionFieldRows` still uses it)

## 4b. Rail order and feedback

- [x] 4b.1 Render the enrichment panels after the usage, metadata and feedback panels in `SessionDetailRail`
- [x] 4b.3 Render no feedback panel in `SessionDetailRail` when the source has no rating enrichment
- [x] 4b.2 In `SessionFeedbackPanel`, state the no-ratings text instead of zero counts when the session carries no rating and no rated response

## 5. Tests

- [x] 5.1 Update and add unit tests: `groupSchemaFields` descriptions, `enrichmentColumnsOf` / `enrichmentPanelsOf` keeping non-scalar fields and ordering, `sessionInsightsState` with an empty array, `buildSessionDetailQuery` projection, `getEnrichmentDefinitions`, the `SessionDetailPanel` title hint and optional source, `SpanFactRow` / `SpanObjectFactRow` hints, `SessionEnrichmentPanel` rendering lists, objects, unavailable values and the excluded heading field

## 6. Browser verification

- [x] 6.1 Run the `spec-browser-verify` skill for this change against the running local app (auth disabled) on a session whose base table carries an enrichment with list-valued and described fields; resolve every `fail` verdict before continuing

## 7. Quality gate

- [x] 7.1 Run lint, prettier, `npm run typecheck`, `npm run typecheck:specs` and the full test suite

## Why

Authoring a saved query is the expensive part — picking a source, building filters and aggregations,
choosing a result view and chart. Today the only way to produce a variant of an existing query is to
create an empty one and rebuild that work by hand. This bites hardest on common-scope queries, which a
non-administrator can read but never edit: the team's query is right there, and the only path to "the
same thing, but filtered to my project" is to reconstruct it from scratch.

## What Changes

- The Queries grid's row actions menu gains a **Duplicate** action alongside Open in new tab, Edit, and
  Delete, using the shared `getDuplicateOperation` declaration already used by Test Suites, Datasets,
  Images, and Containers.
- Duplicate opens a modal seeded from the source query, reusing the existing `QueryProperties` field set
  (name, description, tag, and — for full administrators only — scope), exactly as Create and Edit do.
  The name is pre-filled with the source's name plus a copy suffix.
- Submitting creates a **new** saved query whose body, time intent, result view, and chart are carried
  over from the source unchanged; only the metadata comes from the modal. On success the browser
  navigates to the new query's page, matching Create.
- Unlike Edit and Delete, Duplicate is **not** gated by scope write permission. A caller who cannot write
  a common query may still duplicate it; the copy is forced to personal scope for that caller, because
  the service permits common writes only to full administrators. For a full administrator the copy
  defaults to the source's own scope.
- The Queries list's empty state drops its description line ("Create a query to name it, come back to
  it, and share it with your team."), leaving the "No Queries" title alone. The `NoQueriesDescription`
  key had no other caller and is removed with it. The spec requires an empty state, not a description,
  so no requirement changes.
- No new server action and no new backend endpoint. `analytics-data-access-service` exposes no clone
  operation on `/v1/saved-queries`, and none is needed: the copy is an ordinary `POST` assembled by the
  existing `toMetadataUpdateRequest` helper, which already carries a stored body, time intent, and chart
  across while replacing metadata.

### Non-goals

- No backend clone endpoint, and no change to the saved-query storage contract or API layer.
- No name-uniqueness check. `saved_query.name` carries no unique constraint, so two queries may share a
  name; adding a client-side pre-flight would invent a rule the service does not have. This is a
  deliberate divergence from the Datasets duplicate flow, which checks because its service does enforce
  uniqueness.
- No duplicate control on the query's own `/queries/{id}` page. This change is scoped to the listing's
  row menu; adding the second surface is a separate, additive step.
- No bulk or multi-row duplication.
- No pre-validation of the copied body. A body the service will now refuse (a source table since
  dropped, a literal since marked sensitive) fails at create and is reported through the existing
  machine-error-code path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: adds a "Duplicate a query" requirement covering the row action, the modal's field set and
  seeding, the copy's payload, and success/failure handling. Amends "Queries list page" so the row
  actions menu includes Duplicate, and amends "Scope-based permission gating for saved queries" to state
  that Duplicate is exempt from the common-scope write gate and what scope the copy takes.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Queries/Modals/` — new `DuplicateQuery.tsx`, a near-twin of
  the existing `EditQuery.tsx`, plus its co-located spec.
- `apps/ai-dial-admin/src/components/Analytics/Queries/List/QueriesList.tsx` — one more entry in the
  action column and the modal's open state; its existing spec gains cases.
- `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/saved-query.ts` —
  `toMetadataUpdateRequest` gains a second caller whose intent is not "update". Its name and doc comment
  need to reflect that it assembles a metadata-replacing payload for both a replace and a copy.
- `apps/ai-dial-admin/src/utils/entities/duplicate-entity.ts` and `src/constants/i18n.ts` /
  `src/locales/en.ts` — a `DuplicateI18nKey.Query` entry and its string, so the shared
  `getCloneTitle(view, t)` resolves a title for `ApplicationRoute.AnalyticsQueries`; and the removal of
  `QueriesI18nKey.NoQueriesDescription`, which the empty state was its only caller for.
- No change to `src/app/[lang]/queries/actions.ts`, `src/server/`, or any backend contract.
- Shared surfaces touched are additive only: `duplicateEntityMap` gains a key, no existing entry changes,
  and no other entity's duplicate flow is affected.

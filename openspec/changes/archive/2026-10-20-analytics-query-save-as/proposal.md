## Why

A user who edits a stored query and wants to keep both the original and the edited variant has no way to
do it from the query page: Save overwrites the source, and Duplicate lives only in the Queries grid,
where it copies the **stored** body, not the edits on screen. On a common query a non-administrator
cannot save at all, so the edits are lost unless re-authored elsewhere.

## What Changes

- While a query page holds unsaved changes, the toolbar offers **Save as** next to Discard and Save.
- Save as opens a modal with the same metadata fields as create, duplicate, and edit, seeded the way
  Duplicate seeds it: the source's name plus a copy suffix, its description and tag, and its scope — or
  the personal scope for a caller who may not write the common one.
- Submitting creates a **new** saved query from the page's live payload (body, time intent, result
  view, chart configuration) with the modal's metadata. The user stays on the source page with the
  edits still unsaved there, and a success notification links to the new query. The source query is
  left unchanged on the server.
- Save as is offered even where Save is not — on a common query the caller may not write — because it
  writes nothing the caller cannot own.
- Failures follow the existing machine-error-code rules; the modal stays open with the entered values.

## Non-goals

- No Save as on a page without unsaved changes — the grid's Duplicate already covers copying a stored
  query unchanged.
- No Save as on the standalone builder route, which has no stored query; that page has no save flow.
- No change to Save, Discard, or Duplicate behaviour beyond one shared fix: a write that fails in
  transport (a raw 500, a dropped connection) now reports an error and re-enables its button in Save,
  Save as, and Duplicate alike, instead of leaving it stuck with nothing reported.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/saved-queries`: adds a Save as requirement to the query page's unsaved-changes controls.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/QueryBuilder.tsx` — toolbar button and modal
  mount.
- `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/use-saved-query-page.tsx` — exposes the
  live payload under new metadata and the modal's open state.
- `apps/ai-dial-admin/src/components/Analytics/Queries/Modals/DuplicateQuery.tsx` — reused for Save as
  with a caller-supplied request; the grid's Duplicate keeps its current behaviour.
- `ChangedEntityButtons` (shared) is used through its existing `children` slot; it is not modified.
- `src/models/notification.ts` — `description` widens from `string` to `ReactNode` so a body can carry
  a link; the renderer and every existing caller are unaffected.
- i18n: a button label and a modal header. No API change — create goes through the existing `createSavedQuery`
  server action against the analytics-data-access-service.

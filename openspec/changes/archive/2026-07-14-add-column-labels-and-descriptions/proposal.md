# Add analytics column labels and descriptions

## Why

Analytics columns are shown everywhere by their exposed identifier (`total_money`, `deployment_id`), which reads poorly in the Query Builder's field pickers and gives users no hint what a column means. The analytics backend now carries richer per-column metadata: a long-form `description` (already merged) and a short human-friendly display `display_name` (backend change `add-label-field`, merging imminently — treated as shipped by this change). Both are returned by the schema-discovery endpoint (`GET /v1/queries/entities/schema/{name}`) and the table-management endpoints, and the seeded system tables get backfilled labels, so the data is there — the frontend just drops it on the floor: the models type only `name/type/source/tag` and no UI surface renders or edits the new fields.

## What Changes

- **Models**: `AnalyticsEntityField` and `AnalyticsTableColumn` gain optional `display_name` and `description`; `AnalyticsSchemaPatch` gains `set_display_name` and `redescribe` op lists. (`sensitive` stays untyped — out of scope.) No transform layer exists — backend JSON is cast directly to these models in `analytics-data-api.ts`, so model additions are sufficient wiring.
- **Query Builder display (display only — queries always serialize the raw `name`)**:
  - Field-picker option rows in `CategorizedFieldDropdown` render the display label (`label ?? name`) as primary text, the `description` as a secondary line when present, and the type right-aligned (mirroring the existing function name + hint two-line pattern).
  - Dropdown search matches against label as well as name.
  - Chips and collapsed summaries across Select / Aggregates / Group by / Filters / Having / Sort show the display label too (e.g. "sum of Total money spend"), via a shared lookup helper.
  - Result grid headers and SQL completions are explicitly **not** touched.
- **Tables detail page**:
  - The columns grid gains Label and Description columns (long values truncated with an accessible ellipsis tooltip).
  - The per-column Rename and Retag actions collapse into a single **Edit** action opening a unified edit modal with four fields: Column name (rename), Label (set_display_name), Tag (retag), Description (redescribe). Submit diffs the form against the original column and sends **one** combined schema patch containing only the changed ops; when a rename is included, the metadata ops reference the post-rename name (the backend resolves retag/set_display_name against post-op exposed names).
  - Per-field semantics follow the backend contract: name must be non-blank; blank label/tag/description means "clear the value". The name input is disabled for grain-key, ordering-key, and `_`-prefixed system columns (rename is rejected for those; metadata stays editable).
  - The inline name-cell rename in the grid stays as-is. System tables remain fully read-only.

## Non-goals

- No `sensitive` flag in frontend models or UI.
- No label/description mapping in the query-results grid headers and no description in SQL editor completions.
- No label/description inputs in the create-table / add-columns column-row editor (create-time metadata entry can follow later; this change covers display plus post-creation editing).
- No changes to query serialization, JSON view, or SQL view — they always use the raw field `name`.

## Capabilities

### Modified Capability

- `analytics` (master spec `openspec/specs/analytics/spec.md`): the categorized-field-dropdown/builder-sections requirement gains label/description rendering and label-aware search; the table-detail column-schema-management requirement gains Label/Description grid columns and the unified Edit modal with combined patches; the system-tables requirement wording follows the action rename (edit instead of rename/retag).

## Dependencies / sequencing

- **Archive `redesign-query-builder-page` first**: this change's delta modifies the "Builder sections use section blocks with categorized field dropdowns and collapsible items" requirement that only enters the master spec when that change is archived.
- **Backend `display_name` field** (`worktree-add-label-field` branch): merging imminently; the FE ships now — `display_name` is optional everywhere and the UI falls back to `name`, so display degrades gracefully until the merge. The `set_display_name` op only works after the merge (before it, Spring silently ignores the unknown patch key — a success toast over a no-op — hence merge-before-release).
- **Backend `redescribe` op**: confirmed with the BE team but not yet landed; assumed to mirror `set_display_name` exactly (blank clears, resolves against post-op names). The description field in the edit modal carries the same silent-no-op caveat until it lands.

## Impact

- **Models**: `src/models/analytics/entity.ts`, `src/models/analytics/table.ts`, `src/models/analytics/query-builder.ts` (`FieldOption`).
- **Query Builder**: `Common/CategorizedFieldDropdown.tsx` (option row rendering), `utils/fields.ts` (`fieldsToOptions`, search matching, display-name helper), chip/summary call sites in `Select/SelectProjection.tsx`, `Aggregate/Aggregates.tsx`, `Aggregate/GroupBySection.tsx`, `Sort/SortKeys.tsx`, `Filter/FilterCondition.tsx`.
- **Tables**: `Tables/TableDetailView.tsx` (grid columns, action menu, modal wiring), a new feature-local edit-column popup component, `Tables/utils.ts` (diff-based patch builder).
- **i18n**: new keys for Label / Description column headers and the edit modal (reusing shared keys where they exist).
- **Tests**: unit tests for the patch-builder and field-display helpers; component tests for the dropdown rendering, chip labels, grid columns, and edit-modal flows.

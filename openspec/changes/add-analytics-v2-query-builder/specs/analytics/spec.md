## MODIFIED Requirements

### Requirement: Query Builder and Tables pages render no content

The Tables page (`app/[lang]/tables/page.tsx`) SHALL render no visible content in this iteration (return `null` or an equivalent empty render) and perform no data fetching. The Query Builder page is no longer empty; its behavior is defined by the Query Builder requirements below.

#### Scenario: Tables route resolves and renders nothing

- **WHEN** the user navigates to `/tables`
- **THEN** the route resolves without error
- **AND** the page renders no visible content

## ADDED Requirements

### Requirement: Query Builder page layout

The Query Builder page (`app/[lang]/query-builder/page.tsx`) SHALL present two side-by-side sections: on the left a query builder form, and on the right a live JSON preview of the structured query followed by the query result. The right section SHALL remain visible while the left builder is scrolled. Base form controls (buttons, selectors, inputs, checkboxes, radio groups) SHALL come from the DIAL UI Kit, and the result SHALL be displayed with the app's grid stack.

#### Scenario: Two-section layout renders

- **WHEN** the user opens `/query-builder`
- **THEN** a builder form is shown on the left
- **AND** a JSON preview and a result area are shown on the right

### Requirement: Source selection and default schema load

On load the page SHALL fetch the queryable entities, select the first entity by default, and automatically load that entity's schema (no manual "Load schema" action). The Source section SHALL show an entity selector and, once a schema is loaded, a field-count status. Changing the selected entity SHALL load the newly selected entity's schema and reset builder selections (filter, select, group-by, buckets, aggregates, having, sort, distinct) that may reference stale fields. Entities and schemas SHALL be retrieved via server actions delegating to `analyticsV2Api` (`getEntities`, `getEntitySchema`), not by client-side calls to the service.

#### Scenario: First entity schema loads by default

- **WHEN** the page loads and the entities list is non-empty
- **THEN** the first entity is selected
- **AND** its schema is loaded without any manual action
- **AND** the builder sections become usable

#### Scenario: Changing entity reloads schema and resets selections

- **WHEN** the user selects a different entity
- **THEN** the new entity's schema is loaded
- **AND** builder selections that referenced the previous schema's fields are cleared

#### Scenario: Entities fail to load

- **WHEN** the entities request fails
- **THEN** an error is surfaced to the user
- **AND** the builder does not present stale fields

### Requirement: Complex entities load a detailed schema

When the selected entity is complex (`complex: true`), the Source section SHALL require an instance id whose parameter name is the entity's `schemaIdField` (defaulting to `id`), and the schema SHALL be loaded from the detailed-schema endpoint. The client `AnalyticsV2Api` SHALL provide a method issuing `GET /v1/queries/entities/schema/{name}/detailed?{schemaIdField}={id}` with the entity name, the id-field parameter name, and the id value all URL-encoded. Simple entities SHALL continue to use the base schema endpoint and SHALL NOT require an instance id.

#### Scenario: Detailed schema requested for a complex entity

- **WHEN** a complex entity is selected and an instance id is provided
- **THEN** the schema is loaded via `GET /v1/queries/entities/schema/{name}/detailed?{schemaIdField}={id}`
- **AND** the builder uses the returned fields

#### Scenario: Complex entity without an instance id

- **WHEN** a complex entity is selected and no instance id is provided
- **THEN** the user is prompted to supply the required id
- **AND** no detailed schema request is issued

### Requirement: Schema preview popup

The Source section SHALL provide a "Schema preview" action that opens a popup displaying the loaded schema. The popup SHALL default to a grid view with the columns Field, Type, Family, Source, and Tag, where Family is derived from the field name (the substring before the first `:`, or `column` when the name contains no `:`) and Tag shows a placeholder when absent. The popup SHALL provide a toggle that switches the display between the grid view and the raw schema JSON.

#### Scenario: Schema preview opens as a grid

- **WHEN** the user activates "Schema preview" with a schema loaded
- **THEN** a popup shows the fields in a grid with Field, Type, Family, Source, and Tag columns

#### Scenario: Toggle to JSON view

- **WHEN** the schema preview popup is open and the user toggles to JSON
- **THEN** the popup shows the raw schema JSON
- **AND** toggling back returns to the grid view

### Requirement: Query mode and DISTINCT

The builder SHALL let the user choose the query mode — `row` (projection) or `aggregate` (group + metrics) — via a radio group, and toggle `SELECT DISTINCT`. Selecting `row` SHALL show the projection (Select) section and hide the aggregate sections; selecting `aggregate` SHALL show the Group by, Time bucket, Aggregate, and Having sections and hide the projection section. Enabling DISTINCT SHALL set `distinct: true` on the serialized query; disabling it SHALL omit `distinct`.

#### Scenario: Switching to aggregate mode swaps sections

- **WHEN** the user selects `aggregate` mode
- **THEN** the Group by, Time bucket, Aggregate, and Having sections are shown
- **AND** the projection (Select) section is hidden

#### Scenario: DISTINCT toggles the serialized flag

- **WHEN** the user enables SELECT DISTINCT
- **THEN** the JSON preview includes `"distinct": true`

### Requirement: Filter (WHERE) builder with nested groups

The Filter section SHALL let the user build a recursive WHERE tree. Each group SHALL expose a logical operator selector (AND / OR / NOT) and actions to add a condition, add a nested group, and (for non-root groups) remove itself. Each condition SHALL expose a field selector (from the loaded schema), an operator selector (`eq`, `ne`, `co`, `nc`, `lt`, `gt`, `le`, `ge`, `in`), a value input, a value-type selector, and a remove action. For `eq`/`ne` the condition SHALL offer an "is null" option that, when set, serializes the right operand as a null value (`value_type: null`) and hides the value input. For the `in` operator the value SHALL be entered as comma-separated tokens and serialize to an array expression of value expressions (empty tokens dropped). Empty groups and fieldless conditions SHALL be omitted from the serialized query; a `not` group SHALL wrap its single child, or an `and` of its children.

#### Scenario: Nested group with a condition serializes

- **WHEN** the root group is AND with one condition `field eq value` and one nested OR group
- **THEN** the JSON preview shows a `filter` with `op: "and"` whose args include the predicate and the nested `op: "or"` group
- **AND** groups with no conditions are omitted

#### Scenario: is-null predicate

- **WHEN** a condition uses `eq` with "is null" enabled
- **THEN** the value input is hidden
- **AND** the predicate's right operand serializes as `{ "type": "value", "value_type": "null", "value": null }`

#### Scenario: in-operator builds an array

- **WHEN** a condition uses `in` with value `a, b, c`
- **THEN** the predicate's right operand serializes as an array expression with three value items

### Requirement: Row-mode projection

In `row` mode the Select section SHALL present the schema fields as a checkbox grid. Checked fields SHALL serialize to `select` as field-expression output columns, in selection order. When no field is checked, `select` SHALL be omitted (the query returns the default projection).

#### Scenario: Selected fields become projection columns

- **WHEN** the user checks two fields in row mode
- **THEN** the JSON preview `select` contains a field-expression output column for each checked field

#### Scenario: No projection omits select

- **WHEN** no field is checked in row mode
- **THEN** the JSON preview has no `select` key

### Requirement: Projection field selection filtered by tag

The row-mode Select (projection) section SHALL render, above the field checkboxes, a tag filter offering one checkbox per distinct tag present on the loaded schema's fields (deduped, with fields lacking a tag grouped under an "untagged" option). When one or more tags are selected, only fields whose tag is among the selected tags SHALL be shown in the grid below; when no tag is selected, all fields SHALL be shown. The tag filter SHALL affect only field visibility and MUST NOT change which fields are selected — a field already selected SHALL remain part of the query even while hidden by the tag filter. The tag selection SHALL reset when the schema changes. The aggregate Group by grid is not affected by this requirement.

#### Scenario: Tag filter narrows the visible fields

- **WHEN** the schema has fields tagged `identity`, `system`, and `lineage`, and the user checks the `lineage` tag
- **THEN** only fields tagged `lineage` are shown in the field grid
- **AND** all distinct tags remain available as filter checkboxes

#### Scenario: No tag selected shows all fields

- **WHEN** no tag checkbox is selected
- **THEN** every field in the schema is shown in the grid

#### Scenario: Hidden selected field stays in the query

- **WHEN** a field is checked and the user then applies a tag filter that excludes that field
- **THEN** the field is not shown in the grid
- **AND** the field remains in the serialized query (still selected)

### Requirement: Aggregate-mode group by, time buckets, and metrics

In `aggregate` mode the builder SHALL support: a Group by checkbox grid of schema fields; zero or more `date_bin` time buckets, each with an amount, a unit (`second`, `minute`, `hour`, `day`, `week`), a source timestamp/date field, and an alias; and zero or more aggregate metrics, each with a function (`count`, `sum`, `avg`, `min`, `max`), an optional field argument, an optional `distinct` flag, and an alias. The serialized query SHALL place group-by field projections, aliased `date_bin` function columns, and aliased aggregate function columns into `select`, and SHALL list the checked group-by fields plus the active bucket aliases in `group_by`.

#### Scenario: Aggregate select and group_by are built

- **WHEN** the user checks a group-by field and adds a `sum` aggregate over a field with alias `total`
- **THEN** `select` includes the group-by field column and a `sum` function column aliased `total`
- **AND** `group_by` includes the checked group-by field

#### Scenario: Time bucket becomes a date_bin column

- **WHEN** the user adds a time bucket of 5 minutes over a timestamp field with alias `bucket`
- **THEN** `select` includes a `date_bin` function column aliased `bucket`
- **AND** `group_by` includes `bucket`

### Requirement: Aggregate-mode HAVING builder

In `aggregate` mode the builder SHALL provide a Having section using the same nested group/condition builder as the Filter section, but whose selectable fields are the aggregate output names — the checked group-by fields, the bucket aliases, and the aggregate aliases. The built tree SHALL serialize to the query's `having` node under the same rules as the filter tree.

#### Scenario: Having references an aggregate alias

- **WHEN** an aggregate is aliased `total` and the user adds a Having condition `total gt 100`
- **THEN** the field selector for that condition offers `total`
- **AND** the JSON preview includes a `having` node with that predicate

### Requirement: Sort keys

The Sort section SHALL let the user add, edit, and remove sort keys, each with a field, a direction (`asc` / `desc`), and an optional nulls ordering (default / nulls first / nulls last). In `row` mode the field options SHALL be the schema fields; in `aggregate` mode they SHALL be the aggregate output names. Fieldless sort keys SHALL be omitted, and `sort` SHALL be omitted entirely when no valid key remains; the nulls ordering SHALL be omitted when left at default.

#### Scenario: Sort key serializes

- **WHEN** the user adds a sort key on a field with direction `desc`
- **THEN** the JSON preview `sort` contains an item with that field and `dir: "desc"`

#### Scenario: Fieldless sort key is omitted

- **WHEN** a sort key has no field selected
- **THEN** it does not appear in the serialized `sort`

### Requirement: Paging

The Page section SHALL provide an "include page" toggle and a paging strategy selector (`offset` or `cursor`). For `offset` the controls SHALL be offset, limit, and an `include_total` toggle; for `cursor` the controls SHALL be a cursor value and a limit. The serialized `page` object SHALL match the selected strategy, and SHALL be omitted entirely when "include page" is off.

#### Scenario: Offset paging serializes

- **WHEN** "include page" is on with strategy `offset`, offset `0`, limit `25`, include_total off
- **THEN** `page` is `{ "type": "offset", "offset": 0, "limit": 25, "include_total": false }`

#### Scenario: Paging omitted when disabled

- **WHEN** "include page" is off
- **THEN** the serialized query has no `page` key

### Requirement: Live JSON preview and copy

The right section SHALL render the current serialized `StructuredQuery` as read-only JSON that updates live as the builder changes, and SHALL provide a Copy action that copies the JSON to the clipboard. Before a schema is loaded the preview MAY show a placeholder note instead of a query.

#### Scenario: Preview updates on edit

- **WHEN** the user changes any builder control
- **THEN** the JSON preview reflects the change without a manual refresh

#### Scenario: Copy places JSON on the clipboard

- **WHEN** the user activates Copy
- **THEN** the previewed JSON is written to the clipboard
- **AND** a brief confirmation is shown

### Requirement: Aggregate validation warnings

While in `aggregate` mode the builder SHALL surface non-blocking warnings when: any aggregate lacks an alias; any time bucket lacks a source field or an alias; or the query has no group-by, buckets, or aggregates. The warnings SHALL clear when the conditions are resolved and SHALL NOT prevent running the query.

#### Scenario: Missing aggregate alias warns

- **WHEN** in aggregate mode an aggregate has no alias
- **THEN** a warning states that every aggregate needs an alias

#### Scenario: Warnings clear when resolved

- **WHEN** the aggregate gains an alias
- **THEN** the corresponding warning is no longer shown

### Requirement: Run query and result grid

The right section SHALL provide a Run action that executes the current query against `/v1/queries/execute` through a server action delegating to `analyticsV2Api.execute`. On success the result SHALL be shown as a grid whose columns are derived from the returned result (the result's declared columns when present, otherwise the union of keys across the returned rows), with object/array cell values stringified, and a meta line stating the row count (and the total when the response includes one). An empty result SHALL show an empty-state message. A failed run SHALL surface an error via the app's notification convention and SHALL NOT replace a previously shown result with a broken grid. Run SHALL be disabled until a schema is loaded.

#### Scenario: Successful run renders a result grid

- **WHEN** the user runs a valid query that returns rows
- **THEN** the rows are shown in a grid with a column per result column
- **AND** a meta line shows the row count

#### Scenario: Empty result

- **WHEN** a run returns no rows
- **THEN** an empty-state message is shown instead of a grid

#### Scenario: Failed run surfaces an error

- **WHEN** a run fails
- **THEN** an error notification is shown
- **AND** the previous result (if any) is not replaced by a broken grid

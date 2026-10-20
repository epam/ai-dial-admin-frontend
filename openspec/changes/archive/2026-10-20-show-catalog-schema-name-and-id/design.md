## Context

The picker has two halves that share one filter: an inline selection (`CatalogSchemaField`) and a
browse modal with a grid. `identify-catalog-schema-options-by-id` (archived 2026-10-08) reduced both
to the `$id`; before it, the inline half read `label` = `dial:catalogDisplayName`,
`description` = `$id` (#4750), which is the shape this change restores. See proposal.md — Why.

ui-kit's `SelectOption` has an optional `description`, and `DialSelect` renders it under the label in
the open list. The closed trigger renders the selected option's label only.

## Goals / Non-Goals

**Goals:**
- The inline selection reads as name over `$id`, so a named schema is recognisable and a same-named
  pair is still told apart.

**Non-Goals:**
- Any change to `SelectCatalogSchemaModal` or its grid columns.
- Enforcing display-name uniqueness anywhere (see D2).

## Decisions

### D1 — Label is the display name, description is the `$id`

Each option is `{ value: $id, label: name, description: $id }`; a schema with no display name is
`{ value: $id, label: $id }` with no description, so the `$id` is not printed twice. The leading
"None" entry and the filtering helper are untouched.

Alternative: label = `$id`, description = name. Rejected: the name is what a person scans for, and the
`$id` is long and shares a long prefix across schemas, which is what made the bare list unreadable.

### D2 — No uniqueness check on the display name

The `$id` is the unique key and what `catalog_schema_id` stores. Core does not require unique display
names, so a check here would refuse input the backend accepts, and it would leave every already-saved
duplicate in place. The description line makes duplicates harmless instead of forbidden.

### D3 — The closed field needs no extra work

Checked while implementing: the closed `DialSelect` trigger renders the selected option's label and,
beside it in secondary text, its description, and its accessible name is both ("Model card
https://host/model-card"). So a picked schema keeps its `$id` visible and two same-named schemas
stay distinguishable after selection. The ui-kit reference text says the trigger shows the label
only; the rendered output says otherwise, and the spec for the field follows the rendered output.
`customSelectedValue` is therefore not used.

## Risks / Trade-offs

- A long `$id` beside the name can crowd the closed field → the trigger truncates the label
  (`truncate`) and keeps the `$id` in view, as the control already does for any option with a
  description.
- This partly reverses a change made two weeks earlier on the evidence of one stand, where schemas
  were named after their kind → the description keeps the `$id` on every option, so the case that
  motivated it (several "Interceptor" rows) stays distinguishable.
- The read-only view of `DialSelectField` prints the label only → unchanged from before the earlier
  change and outside this spec.

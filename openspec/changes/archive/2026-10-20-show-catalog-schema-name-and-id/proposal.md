## Why

`identify-catalog-schema-options-by-id` cut the inline catalog-schema selection down to the `$id`
alone, on the premise that a display name "distinguishes nothing" because a schema is named after the
kind it describes. That premise holds for the schemas on one stand, not as a rule: a display name is
text an author wrote, and it is the part a person actually reads. QA reopened #4740 for exactly this
— a list of bare URIs gives no way to tell which schema is which without opening "Browse".

## What Changes

- In the inline catalog-schema selection, each option's label is the schema's display name and its
  description is the `$id`. A schema with no display name shows its `$id` once, as the label.
- The `$id` stays the value stored and the tie-breaker: it is unique, so two schemas sharing a
  display name remain distinguishable by the description beneath each.
- The picker's rule "identify a schema by its `$id` and nothing else" narrows to the browse grid's
  filtered view, where the single `$id` column is unchanged.

## Capabilities

### Modified Capabilities

- `catalog-properties-editing`: the picker's identification rule no longer covers the inline
  selection. The grid keeps the `$id` alone; the inline selection reads display name over `$id`.

## Non-goals

- A uniqueness check on the display name. Core does not require unique names, a new check would
  reject what the backend accepts, and it would not touch schemas already saved with a shared name.
- Adding the entity kind to an option. Under the filter it is the same on every row.
- The browse grid, in either its filtered or its relaxed view.
- The catalog-schema Properties tab and `dial:catalogDisplayName` as a model field.

## Impact

- `apps/ai-dial-admin/src/components/CatalogProperties/CatalogSchemaField.tsx` and
  `tests/CatalogSchemaField.spec.tsx`.
- Spec: `catalog-properties-editing`.
- Partly reverses the inline half of the archived change
  `2026-10-08-identify-catalog-schema-options-by-id`, and restores the option shape #4750 introduced
  (`label` = display name, `description` = `$id`).

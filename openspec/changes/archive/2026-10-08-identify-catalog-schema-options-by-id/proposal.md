## Why

`filter-catalog-schema-picker-by-entity-type` reduced the browse grid to the schema's `$id` but left
the inline selection showing the display name with the `$id` beneath it. On a real interceptor that
reads as three options all starting with the word "Interceptor", because a catalog schema is
normally named after the entity kind it describes — the one thing a list already filtered to that
kind cannot be telling the reader.

## What Changes

- Identify each option in the inline catalog-schema selection by its `$id` alone, matching the
  filtered grid. The display name is no longer rendered there.
- The relaxed "show all" grid keeps the display name and the entity-kind column, where both vary and
  the kind is what the reader went there to see.

## Capabilities

### Modified Capabilities

- `catalog-properties-editing`: the picker's identification rule now covers both halves — the grid
  and the inline selection — rather than the grid alone.

## Non-goals

- The "show all" grid. Its three columns are unchanged.
- The catalog-schema Properties tab, where `dial:catalogDisplayName` is the field being edited and
  stays visible.
- Dropping `dial:catalogDisplayName` from the model, the listing, or Core's contract. It is still
  read, still stored, and still shown wherever it distinguishes something.

## Impact

- `apps/ai-dial-admin/src/components/CatalogProperties/CatalogSchemaField.tsx` and its spec.
- Spec: `catalog-properties-editing`.
- No API, dependency, or environment change. Follows #4892.

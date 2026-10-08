# Design

## Context

The picker has two halves that must agree: an inline selection on the deployment's Properties tab and
a browse modal with a grid. `filter-catalog-schema-picker-by-entity-type` made both filter through
the same helper, but changed only the grid's columns to the `$id` alone. The inline half kept
`label` = `dial:catalogDisplayName`, `description` = `$id`.

Observed on a real interceptor: the dropdown lists `Interceptor https://.../catalog-schemas/intercept…`
and, as the pinned current selection, `Model https://.../catalog-schemas/model`. The names carry no
information the filter has not already given.

## Decisions

### D1 — One identification rule for both halves

Each option's text becomes the `$id`. The reasoning the grid already used applies unchanged here:
display names are not unique, so the `$id` is the only text that tells two options apart. What the
screenshot added is that the names are not merely redundant but actively repetitive — schemas are
named after the kind they describe, so a filtered list repeats one word down its length.

The alternative was to keep the name and drop the `$id`. Rejected: two schemas may share a name, and
the `$id` is what the deployment actually stores in `catalog_schema_id`, so it is the value an
administrator cross-references against configuration.

### D2 — The relaxed grid keeps both

With the filter off, the kind varies and is the reason to be in that view, and the name is then a
genuine label rather than an echo of the filter. Nothing changes there, so this change touches no
column set.

### D3 — Where the display name still belongs

`dial:catalogDisplayName` remains required by Core's catalog meta-schema and editable on the
catalog-schema Properties tab. It is not removed from the model, the listing, or anything a catalog
renders — this change is about one control's presentation, and the `CatalogSchemaOption` type keeps
the field.

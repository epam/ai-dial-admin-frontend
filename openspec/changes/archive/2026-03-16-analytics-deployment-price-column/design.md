## Context

The Analytics dashboard has a Money card showing total cost and two breakdown tables (entities, projects) showing per-row costs. The Money card queries `sum(deployment_price)` while breakdown tables query `sum(price)`. These are different fields in the analytics dataset, causing totals to not match. Users want to see both price dimensions.

## Goals / Non-Goals

**Goals:**
- Align the Money card with breakdown tables by using the same `price` field
- Add `deployment_price` as a visible column in both consumption tables
- Use labels "Price" and "Deployment Price"

**Non-Goals:**
- Changing traces or conversations detail views
- Adding i18n for the new column header (follow existing pattern — current headers like "Money" are not i18n'd)
- Backend changes

## Decisions

### Use `price` for Money card total
The Money card will use `sum(price)` instead of `sum(deployment_price)`. This aligns with what the breakdown tables already sum, making the total consistent. Users who want deployment-level costs can see them in the new column.

### Add deployment_price as additional expression in consumption queries
Both `ENTITY_CONSUMPTION_QUERY` and `PROJECT_CONSUMPTION_QUERY` will add `sum(deployment_price) as deployment_price` to their expressions. This requires no backend changes — the field already exists in the analytics dataset.

### Column placement
The "Deployment Price" column will be placed after the existing "Price" (cost) column in the grid, keeping money-related columns adjacent.

## Risks / Trade-offs

- **Wider tables**: Adding a column increases horizontal space usage. Mitigation: consumption tables already handle overflow via AG Grid's scrolling.
- **Data availability**: If `deployment_price` is null/missing for some rows, the column may show empty values. This is acceptable — it reflects reality.

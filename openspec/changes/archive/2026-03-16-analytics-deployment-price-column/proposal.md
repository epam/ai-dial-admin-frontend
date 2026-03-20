## Why

The Analytics dashboard Money card uses `sum(deployment_price)` while the entity and project consumption breakdown tables use `sum(price)`. These are different fields, causing the total money value to not match the sum of rows in the breakdown tables. Additionally, users need visibility into both price dimensions (base price and deployment-level price) to understand cost breakdowns.

## What Changes

- **Money card query**: Change from `sum(deployment_price)` to `sum(price)` so the total matches the breakdown tables
- **Entity consumption table**: Add a "Deployment Price" column using `sum(deployment_price)`
- **Project consumption table**: Add a "Deployment Price" column using `sum(deployment_price)`
- **Grid column config**: Add "Deployment Price" column definition for consumption tables

## Non-goals

- Changing the traces or conversations detail views
- Renaming existing "Price" labels
- Backend pricing model changes

## Capabilities

### New Capabilities
- `analytics-deployment-price`: Add deployment price visibility to analytics consumption tables and fix money card field alignment

### Modified Capabilities

## Impact

- `apps/ai-dial-admin/src/constants/telemetry.tsx` — Query definitions (MONEY_QUERY, ENTITY_CONSUMPTION_QUERY, PROJECT_CONSUMPTION_QUERY)
- `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` — Grid column definitions for consumption tables
- No API or dependency changes — only frontend query and display adjustments

## 1. Query Changes

- [x] 1.1 In `apps/ai-dial-admin/src/constants/telemetry.tsx`, change `MONEY_QUERY` from `sum(deployment_price)` to `sum(price)`
- [x] 1.2 In `apps/ai-dial-admin/src/constants/telemetry.tsx`, add `sum(deployment_price) as deployment_price` to `ENTITY_CONSUMPTION_QUERY` expressions
- [x] 1.3 In `apps/ai-dial-admin/src/constants/telemetry.tsx`, add `sum(deployment_price) as deployment_price` to `PROJECT_CONSUMPTION_QUERY` expressions

## 2. Grid Column Configuration

- [x] 2.1 In `apps/ai-dial-admin/src/constants/telemetry.tsx`, add `deployment_price` to `TELEMETRY_GRID_HEADERS_MAP` mapping it to a display key (e.g., `deployment_cost`)
- [x] 2.2 In `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx`, add a "Deployment Price" column definition to the consumption grid columns using `priceColumn('Deployment Price')`, placed after the existing cost column

## 3. Verification

- [x] 3.1 Run lint and type checks (`nx lint ai-dial-admin` and `nx typecheck ai-dial-admin`)
- [x] 3.2 Run existing tests (`nx test ai-dial-admin`)

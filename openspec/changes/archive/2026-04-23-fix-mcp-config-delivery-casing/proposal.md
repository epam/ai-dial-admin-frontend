## Why

The `ApplicationMCPConfigDelivery` enum has lowercase values ('meta', 'header') that work correctly for Applications (DialApplication). However, App Runners (DialApplicationScheme) require uppercase values ('META', 'HEADER') per backend schema requirements. Currently, the frontend uses the same lowercase enum for both entity types, causing App Runner MCP config delivery values to be rejected or misinterpreted by the backend.

## What Changes

- **Keep single UI enum** — `ApplicationMCPConfigDelivery` remains lowercase ('meta', 'header') as the source of truth for UI display and selection
- **Add server-side transformation** — new utility function `transformApplicationSchemeForServer` in app runner actions layer that converts `dial:mcpConfigDelivery` from lowercase to uppercase before sending to backend
- **Apply transformation** — integrate transformation in `createApplicationScheme`, `updateApplicationScheme`, and `updateCoreRunner` actions

## Capabilities

### Modified Capabilities

- `application-runner-save`: App runner create/update now casts MCP config delivery values to uppercase before API submission

## Impact

### Code
- **Modified files**:
  - `src/app/[lang]/application-runners/actions.ts` — add `transformApplicationSchemeForServer` utility, apply in create/update/updateCoreRunner actions
- **No UI changes** — existing components continue using lowercase enum

### APIs consumed (already defined)
- `POST /api/v1/application-types` — accepts uppercase 'META' | 'HEADER' for MCP config delivery
- `PUT /api/v1/application-types/{id}` — same uppercase requirement

### Non-goals
- Changing the `ApplicationMCPConfigDelivery` enum values — they remain lowercase for UI consistency
- Adding separate enums for Application vs App Runner — one enum is preferred for maintainability
- Backend changes — backend already handles uppercase correctly

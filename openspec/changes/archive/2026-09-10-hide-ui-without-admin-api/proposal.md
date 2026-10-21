## Why

The admin backend (`ai-dial-admin-backend`) is being phased out step by step, and the frontend is
migrating call by call to Core/deployment-manager APIs (see the archived `migrate-publications-to-core-api`
and `unlink-app-runner-assets-from-admin-be` changes). Several menu groups, menu actions, and the footer
still depend entirely on the admin backend and have no migrated equivalent yet. Before that backend can be
retired, deployments that no longer configure `DIAL_ADMIN_API_URL` need those unsupported surfaces hidden
instead of rendering broken pages or issuing calls to a host that no longer exists.

## What Changes

- Add a feature flag, `featureFlags.adminApiEnabled`, derived from `DIAL_ADMIN_API_URL` being present
  (mirrors the existing `evaluationEnabled` / `DIAL_EVAL_API_URL` pattern).
- When `adminApiEnabled` is `false`:
  - Hide the "Entities", "Builders", "Access Management", and "Audit" menu groups in full — Audit is
    hidden entirely (Dashboard, Activity, and Usage Log together), not just its Activity item.
  - Hide the "Import config" and "Export config" menu actions.
  - Hide the Footer, and stop polling `checkAppStatus` / `checkCoreVersion` (both call the admin backend).
  - Redirect direct URL navigation to every route owned by the hidden groups/actions
    (`/models`, `/applications`, `/interceptors`, `/toolsets`, `/routes`, `/adapters`,
    `/application-runners`, `/interceptor-templates`, `/roles`, `/keys`, `/activity-audit`,
    `/dashboard`, `/usage-log`, `/import-config`, `/export-config`, and their `[id]` / `[id]/[subId]`
    sub-routes) to `/home`, before any admin-backend call is issued.
- No backend/API-call removal in this change — only UI visibility and route guarding. Removing the
  underlying `admin-backend`-bound API calls is a later step.

## Capabilities

### New Capabilities

- `admin-api-availability`: the `adminApiEnabled` feature flag itself, the menu-action visibility
  (Import/Export config), the Footer/status-polling suppression, and the direct-URL redirect guard for
  every route owned by the hidden groups/actions.

### Modified Capabilities

- `menu-group-visibility`: extend the composition rules to the four additional gated groups (Entities,
  Builders, Access Management, and Audit — hidden in full, not just its Activity item), all gated by
  `featureFlags.adminApiEnabled`, composing independently of the existing Deployments/Evaluation gates.

## Impact

- `apps/ai-dial-admin/src/models/feature-flags.ts` — new `adminApiEnabled` field.
- `apps/ai-dial-admin/src/app/[lang]/layout.tsx` — compute the flag from `process.env.DIAL_ADMIN_API_URL`.
- `apps/ai-dial-admin/src/components/Menu/menu-configuration.tsx` — filter the three groups + Activity
  Audit item.
- `apps/ai-dial-admin/src/components/Menu/MenuContent/MenuContent.tsx` — hide Import/Export actions.
- `apps/ai-dial-admin/src/components/Content/Content.tsx` — hide Footer, skip status/version polling.
- Route guards added to the `page.tsx` files under `models`, `applications`, `interceptors`, `toolsets`,
  `routes`, `adapters`, `application-runners`, `interceptor-templates`, `roles`, `keys`,
  `activity-audit`, `dashboard`, `usage-log`, `import-config`, `export-config` (including their `[id]` /
  `[id]/[subId]` variants).
- No API surface, dependency, or database changes.

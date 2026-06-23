## Why

Rolling back a **Delete** of a container deployment or image definition that had secure environment values throws an Internal Server Error (Issue #3700). The current frontend recreates the deleted entity by building a client-side create request from the revision snapshot. That snapshot returns secure env values masked as `null`; the deployment-manager create path converts the null secret to an empty string and provisions an invalid Kubernetes secret, which fails downstream with a 500.

The backend already solves this correctly. Its rollback endpoint resurrects a currently-deleted entity (`resurrect()`), restores config from audit history, and **nulls sensitive values server-side** so the operator re-supplies them before deploy — exactly the intended behavior. The frontend just calls the wrong endpoint for the Delete case.

## What Changes

- Route the `Delete`-activity rollback through the deployment-manager **rollback endpoint** (`POST /{id}/revision/{R}/rollback`), the same endpoint already used for `Update`. The backend resurrects the deleted entity and handles secure values safely.
- Stop building and POSTing a client-side create request for the Delete case.
- **Remove** the now-dead `build-create-body-from-snapshot` mapper, its tests, and the `getDeploymentRevisionDetails` fetch in the Delete branch.
- Post-rollback navigation for the Delete case SHALL use the **resurrected entity's id returned by the rollback response** — image definitions are resurrected with a new backend-assigned id; containers keep their id (name-keyed).
- The `Delete`→resurrect path is **not** gated by the lifecycle pre-check (the entity is currently deleted, so it has no live status to block on).

## Non-goals

- Restoring the real secret values on rollback — they remain server-nulled by design; the operator re-supplies them.
- Changing the `Create`→delete or `Update`→rollback dispatch behavior.
- Any backend change — the backend already supports deleted-entity resurrection via rollback.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `deployment-entity-rollback`: the `Delete` dispatch changes from "recreate via the create endpoint with a mapped snapshot DTO" to "call the rollback endpoint for the entity at revision `R`"; the snapshot-to-create-DTO mapper requirement is removed; the lifecycle pre-check explicitly does not gate the Delete path; and post-rollback navigation for Delete reads the recreated entity's id from the rollback response.

## Impact

- `src/utils/audit/get-deployment-rollback-request.ts` — Delete branch rewritten to call the rollback action.
- `src/utils/audit/build-create-body-from-snapshot.ts` + its spec — removed.
- `src/utils/audit/get-deployment-rollback-request.spec.ts` — Delete-case assertions updated.
- `src/utils/audit/get-rollback-navigation.ts` — Delete navigation reads the rollback response entity id.
- `src/utils/audit/deployment-lifecycle-check.ts` — confirm Delete is not gated.
- Backend: none. Fixes Issue #3700 (`POST /create` → `POST /rollback`).

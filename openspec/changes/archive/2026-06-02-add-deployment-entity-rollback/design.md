## Context

Admin/config entities already support per-entity rollback from the audit UI via `rollbackEntityPerRevision` (used by `AuditView`) and `rollbackEntityPerType` (used by the audit `List`). Both pick an inverse operation from the activity type and either call entity create/update/delete actions or re-PUT a fetched snapshot.

Deployment-manager entities — container deployments (`*Deployment`), image definitions (`*ImageDefinition`), and the singleton `ImageBuildDomainWhitelist` — have audit history and rich diff views (`activity-audit-deployments-view`, `activity-audit-deployments-detail`) but rollback was **deliberately suppressed**: `getDeploymentActivityAuditColumns` renders only `Open in new tab`, and `AuditView` hides the Resource Rollback button for the eleven deployment-manager resource types.

The deployment-manager backend now provides per-resource rollback (`POST /{id}/revision/{revision}/rollback`) with Envers point-in-time semantics. The supporting frontend plumbing already exists: `getActivityAuditDetailData` fetches the snapshot at `revision` and `revision − 1`; `getRevisionRouteForEntityType` maps all deployment-manager types to `/revision/` routes; `containersApi`/`imagesApi`/`globalFirewallApi` expose create/update/delete and `getRevisionDetails`; and the diff layer (`generate-diffs.ts`) confirms snapshots arrive as the **nested entity shape**, not a flattened audit record.

## Goals / Non-Goals

**Goals:**
- Let admins revert a single deployment-manager entity to the state immediately before a chosen audit activity, from both the Deployments audit list and the audit detail view.
- Reuse the existing activity-type dispatch model so the new path mirrors `get-rollback-request.ts`.
- Delegate the in-place case to the backend rollback endpoint so Envers point-in-time semantics, immutable-field preservation, sensitive-value nulling, and build-status reset all happen server-side.
- Guide the user away from rollbacks the backend will reject for lifecycle reasons (active deployment / building image) before the request is sent.

**Non-Goals:**
- System-wide rollback (`SystemRollback.tsx`) — unchanged.
- Admin/config entity rollback — unchanged.
- Pre-checking the `Create`→DELETE path for active deployments — backend owns that rule.
- Restoring masked secure env values on recreate, or auto re-deploying after rollback.

## Decisions

### D1: Dispatch by activity type, targeting `R = activity.revision − 1`

"Rollback" from an audit entry means **undo this activity** — restore the entity to the state immediately before it. That state is the snapshot at `revision − 1`, which mirrors the existing admin model and the snapshot `getActivityAuditDetailData` already fetches as `previousRevision`.

| Activity type | Meaning at `R` | Strategy |
|---|---|---|
| `Update` | existed at `R`, exists now | `POST /{id}/revision/{R}/rollback` (backend endpoint) |
| `Create` | did not exist at `R`, exists now | `DELETE /{id}` |
| `Delete` | existed at `R`, deleted since | recreate via `POST` create, body = mapped `R` snapshot |

*Alternative considered:* a live state-probe (fetch current existence + snapshot-at-`R`, choose from the 2×2 matrix) to be robust against intervening activities. Rejected: the audit UI always acts on one specific activity, the activity type already encodes the transition, and probing adds fetches and ambiguity ("which revision is R?"). The type-driven model is consistent with the shipped admin path.

### D2: Delegate the `Update` case to the backend rollback endpoint, not a client-side re-PUT

The admin path re-PUTs the previous snapshot. Deployment-manager entities can't: the backend must preserve immutable fields (`id`, `name`, `serviceName`, `status`, `url`, timestamps), null sensitive env values, reset image build status, and resolve the target via Envers point-in-time (latest revision ≤ `R`). So the `Update` case calls the dedicated endpoint and lets the server compute the result. Three new server methods:

- `containersApi.rollbackContainer(id, revision)` → `POST /deployments/{id}/revision/{revision}/rollback`
- `imagesApi.rollbackImage(id, revision)` → `POST /images/definitions/{id}/revision/{revision}/rollback`
- `globalFirewallApi.rollbackWhitelist(revision)` → `POST /global-whitelist/image-build/revision/{revision}/rollback` (no id; singleton; full replacement, backend no-ops if the multiset already matches).

### D3: `$type`-aware snapshot→create-DTO mapper for the recreate (`Delete`) case

The `R` snapshot is the nested entity, but is **not** directly create-able. The diff layer's display hidden-key sets (`CONTAINER_HIDDEN_KEYS`, `IMAGE_HIDDEN_KEYS`) strip `$type` — which the create DTO **requires** (`Container.$type`, `source.$type`). So the mapper is a separate concern from display hiding:

- **Keep:** `$type`, `source` (raw — not the diff-normalized `normalizeImageSource` form), `metadata.envs`, `resources`, `scaling`, `command`, `args`, `allowedDomains`, `probeProperties`, `nodePool*`, `name`, `displayName`, version/build config.
- **Drop:** `id`, `createdAt`, `updatedAt`, and runtime fields `status`, `url`, `author`.
- Masked/null secure env values pass through; `createContainer` already applies `encodeVariables`, which only base64-encodes present values.

Lives in `build-create-body-from-snapshot.ts` with unit tests, branching on the resource family.

*Alternative considered:* reuse the display hidden-key sets. Rejected — they strip `$type`, producing an invalid create body.

### D4: Lifecycle pre-check gate — split by entry point

The backend returns **400** when a deployment is active (`PENDING/RUNNING/CRASHED/STOPPING`) or an image is `BUILDING`/`BUILD_SUCCESSFUL`. The activity record does not carry live status, so the gate needs a current-state fetch (`GET /deployments/{id}` / `GET /images/definitions/{id}`). The whitelist has no lifecycle constraint and is never gated.

- **`AuditView` (single entity):** fetch current state on load; if blocked, render the Resource Rollback control disabled with an explanatory tooltip (e.g. "Undeploy before rolling back" / "Image is building"). One fetch, clean UX.
- **List (Deployments view):** a per-row fetch across an infinite-scroll grid is too expensive/racy, so the gate is deferred to the confirmation modal — on modal open, fetch current state; if blocked, show the explanation and disable the confirm button.

This gate applies only to the `Update`→rollback path (and is moot for whitelist). The `Create`→DELETE path is not gated (D1 / Non-Goals).

### D5: Re-enable affordances by reversing the two suppression requirements

`getDeploymentActivityAuditColumns` gains the existing `getResourceRollbackOperation` row action (parent/aggregate rows excluded, as in the Config view). `AuditView` renders the Resource Rollback button for deployment-manager types, routed through the new `get-deployment-rollback-request.ts` dispatch instead of `rollbackEntityPerRevision`. The system-level header rollback button stays hidden in the Deployments view.

## Risks / Trade-offs

- **Snapshot may carry unexpected runtime fields** → the mapper (D3) drops `status`/`url`/`author` defensively.
- **Source-shape divergence on recreate** (MCP-registry synthetic `$type`, collapsed `imageDefinition*`) → use the raw snapshot `source`, never the display-normalized form; cover MCP/internal-image sources in mapper tests.
- **Pre-check adds a fetch and can race** (entity status changes between check and submit) → gate is advisory UX; the backend 400 remains the source of truth and is surfaced as an error toast if it slips through.
- **Stale list after rollback** → on success, follow the existing pattern: redirect to the audit list / entity page and let the next datasource call refresh; show a success notification keyed by resource type.
- **Recreate loses secure env values** → expected per backend spec; the success message should hint that secure values need re-supplying before deploy.

## Open Questions

- Should the recreate (`Delete`) path also pre-check anything, or is surfacing the backend response sufficient? (Current decision: no pre-check.)

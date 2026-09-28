## Context

See `proposal.md` — Why. Requirements live in `specs/run-summary-deployment-link/spec.md`.

Call sites that historically listed all deployments then `.find()`’d one id:

- `DeploymentExternalLink` (lists + admin catalog)
- Test Suite Properties Open (unfiltered list + admin catalog)
- Method tab `selectedApplication` (unfiltered list)
- Conversations Properties agent link (admin catalog list)

The eval backend ships `GET /api/v1/deployments/all/**` (polymorphic `Deployment` with `$type`).
Navigation without catalog falls back to `$type` and the `applications/` prefix path in
`resolveDeploymentNavigationTarget`.

## Goals / Non-Goals

**Goals:**

- At most one network call per feature (or zero when type is stored / MCP) for Run Summary link,
  Properties Open, Method tab selected application, and Conversations agent link.
- Keep typed `getDeployment` for Methods / create wizard method loading; leave
  `useUtilityDeployments` / `getAllDeployments` available for any remaining callers.

**Non-Goals:**

- Caching Compare’s two independent lookups.
- Changing admin utility or deployment-manager deployment APIs.
- Mapping by-id responses into synthetic catalog records with separate `reference` vs `application`.

## Decisions

### 1. Eval `getDeploymentById` via `TestSuitesApi`, not UtilityApi / ContainersApi

The new endpoint lives on `DIAL_EVAL_API_URL` and returns the same `Deployment` shape as typed
`getDeployment`. Admin catalog list and deployment-manager `GET /deployments/{id}` are different
hosts and DTOs.

URL: `` `${DEPLOYMENTS_URL}/all/${id}` `` — id path segments left unencoded, matching typed get.

### 2. Keep `useDeploymentType` + slim `resolveDeploymentType`

Only replace the body of `resolveDeploymentType` with `getDeploymentById` → `$type`. The hook’s
short-circuit when `deploymentRef.type` is set stays. Properties reuses the same hook.

### 3. Drop catalog from Run Summary, Properties Open, and Conversations agent link

Pass `[]` into `resolveDeploymentNavigationTarget` (or equivalent `$type`-based path in
`getAgentLinkForConversation`). Type + `applications/` prefix replaces catalog fields.

### 4. Method tab: typed get when type known, by-id when not

`ChangeMethodModal` needs a full `Deployment` (routes). When `deploymentRef.type` is present, call
`getDeployment(id, type)` (same as Methods). When type is missing, call `getDeploymentById(id)` —
same DTO, one round-trip. Do not load the unfiltered list.

### 5. Conversations: eval by-id for `model.id`

Conversation agent id is treated as the deployment id. Fetch via `getDeploymentById`; build the
locale-prefixed URL from `$type` + `deploymentId`. Keep catalog-record overload in
`getAgentLinkForConversation` for any remaining catalog callers / tests.

### 6. Miss → hide control / empty link (no toast)

`BaseApi.get` returns `null` on failure. UI hides the link or opens an empty URL only when the
caller already did so with a missing catalog match — prefer empty string / no navigation.

## Risks / Trade-offs

- **Published assets with catalog-only path mapping** → Open may route via Applications / Models by
  type instead of Assets when `id` is not an `applications/` path. Accepted until catalog fields
  exist on the by-id DTO.
- **Compare with two missing types** → two by-id calls. Acceptable vs previous six+ calls.
- **Slash-containing IDs** → trailing-wildcard backend; client must not over-encode path segments.

## Migration Plan

Additive frontend change behind the already-shipped eval endpoint. Rollback is revert. No feature
flag.

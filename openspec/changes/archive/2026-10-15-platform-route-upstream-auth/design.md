## Context

DIAL Core 0.49.0 added `Upstream.authType`, with `API_KEY` as the default and `BEARER` as the alternative header form. The same Core `Upstream` DTO is used by models, global routes, and application routes, but Core evaluates the field only for top-level routes. Assets > Routes writes those global routes directly to Core; the admin-backend entity pages, platform models, application routes, and App Runner routes are not in scope.

Core treats upstream keys as write-only. A route read therefore preserves `authType` but contains no existing key. This makes a normal browser-side clone of a Bearer route invalid: the copy has `BEARER` with no key. Current platform-route writes also lack the empty-secret stripping used for platform models.

## Goals / Non-Goals

**Goals:**

- Represent Core's two upstream authentication modes without changing the default wire behavior for existing routes.
- Offer the setting only where Core executes it: Assets > Routes.
- Preserve valid saved Bearer secrets when editing an existing route.
- Let an administrator create a valid Bearer route duplicate by explicitly supplying replacement keys.
- Keep failed duplicate navigation and notification behavior correct.

**Non-Goals:**

- Add `authType` UI to entity-backed routes/models, platform models, application routes, App Runners, or interface overrides.
- Retrieve, display, persist in browser state beyond the modal lifetime, or silently copy source upstream credentials.
- Replace Core's authoritative write validation or add a Core server-side clone API.

## Decisions

### 1. Use a Core-aligned enum in the shared upstream transport model

Add an `UpstreamAuthType` enum (`API_KEY`, `BEARER`) and optional `authType` to `DialModelEndpoint`. The model is shared because both `DialRoute` and platform route resources already reuse it. Optionality retains compatibility with stored resources that predate Core 0.49.0; Core interprets an omitted field as `API_KEY`.

**Alternative considered:** a route-only endpoint type. This would duplicate the otherwise shared upstream structure and complicate route resource typing for a field Core accepts on its common DTO.

### 2. Gate the shared editor by an explicit route capability

`UpstreamEndpoints`/`Endpoint` will receive a capability prop from the caller and render the authentication selector only when Assets > Routes enables it. The generic editor does not infer Core semantics solely from the endpoint type.

**Alternative considered:** render the selector for every consumer of `DialModelEndpoint`. This would advertise a no-op setting for models and application-owned routes, whose Core execution paths ignore it.

### 3. Treat Core as authoritative for existing write-only Bearer credentials

A displayed blank key is ambiguous: it can mean either no key exists or Core withheld an existing secret. The editor therefore requires a key only when a new upstream is configured as `BEARER` or an existing upstream changes from `API_KEY`/unset to `BEARER`. An unchanged stored Bearer upstream may save with its blank displayed key; payload normalization omits that empty value so Core restores and validates its stored secret.

**Alternative considered:** require a visible key for every Bearer upstream. This would make any unrelated edit to an existing valid Bearer route impossible.

### 4. Collect replacement keys during Bearer-route duplication

The route duplicate modal will detect each Bearer upstream in a platform route clone and render a labelled password input for it. Submission remains disabled until every such key is non-empty. The component injects the supplied values into the clone's matching upstream entries immediately before invoking the existing duplicate callback. Modal-local key state is discarded when the modal closes.

**Alternative considered:** reset Bearer upstreams to `API_KEY` or remove them on duplicate. Either silently changes routing behavior and does not meet the requested copy semantics.

**Alternative considered:** copy encrypted secrets without asking the user. The frontend cannot access them safely; this requires an unavailable Core server-side clone operation.

### 5. Normalize platform-route secrets on every create and update

The platform route action will use the existing `stripEmptyUpstreamSecrets` helper, as platform models already do. This omits blank `key` and `secretExtraData` fields while retaining non-empty duplicate keys and all regular route fields.

**Alternative considered:** special-case duplicate calls. Empty-secret normalization is a general platform-route write invariant, so it belongs at the action payload boundary.

## Risks / Trade-offs

- **A user must know and re-enter every Bearer credential to duplicate a route** → This is necessary to keep source secrets write-only; the modal identifies every affected upstream before submission.
- **Client validation cannot establish whether an unchanged blank Bearer key exists in Core** → Preserve the field omission and rely on Core's post-restoration validation for this case.
- **The shared editor could leak the control to unsupported consumers** → Use an explicit opt-in and cover all four current callers with component tests.
- **A failed duplicate could still navigate if its action response is misclassified** → Assert that the generic duplicate flow redirects only on an explicit successful response, and surface the returned Core error otherwise.

## Migration Plan

1. Deploy the frontend change after or alongside DIAL Core 0.49.0 support.
2. Existing routes without `authType` remain unchanged and continue to use Core's `API_KEY` default.
3. Existing Bearer routes become editable and duplicable only with newly supplied duplicate credentials; no secret migration is required.
4. Rollback is safe for stored `authType`: an older frontend does not modify the field and Core continues to accept it.

## Open Questions

- None. The confirmed product decision is to request replacement keys in the duplicate modal rather than add a Core secure-copy operation.

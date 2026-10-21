## Context

`getConfigEntityOptions` composes the API-written and configuration-file populations served by DIAL Core for Core-backed picker options. The config-file branch currently substitutes a successful empty result when `DIAL_ADMIN_API_URL` is unset, even though `configFileApi.listNames` uses DIAL Core rather than the admin backend. This contradicts the intended union and hides valid Core configuration-file entities in deployments that do not run the admin backend.

## Goals / Non-Goals

**Goals:**

- Make the picker-option union include both DIAL Core populations regardless of `DIAL_ADMIN_API_URL`.
- Retain concurrent reads and the existing conversion of individual read failures into partial-result failures.
- Establish focused coverage for an unset admin-backend URL.

**Non-Goals:**

- Change any actual admin-backend call or its feature gating.
- Change entity option shape, union precedence, or handling of metadata reads.
- Add browser-level verification for this server-side read contract.

## Decisions

### Remove the environment gate from the config-file branch

`getConfigEntityOptions` will always pass `configFileApi.listNames(token, type)` through `toFailureOnThrow`, alongside the existing metadata read. This aligns the implementation with the source of both populations: DIAL Core.

**Alternative considered:** Preserve the gate and special-case only picker callers. This would duplicate the environment-dependent behavior and continue to describe a Core operation as an admin-backend dependency, so it is rejected.

### Treat an unavailable config-file listing as an ordinary partial failure

When the always-issued config-file read rejects or returns a failure, `unionConfigEntityOptions` will retain the successful API-written population and expose the failure using its existing contract.

**Alternative considered:** Continue converting the missing URL case to a successful empty population. This would hide an unavailable Core population and lets picker options diverge from references Core accepts, so it is rejected.

## Risks / Trade-offs

- [DIAL Core does not expose the config-file route in a deployment without the admin backend] → The read now reports the existing partial-failure signal rather than silently hiding the population; focused tests cover that behavior.
- [Tests accidentally retain process environment state] → Use explicit environment stubbing and restoration in focused server-read tests.

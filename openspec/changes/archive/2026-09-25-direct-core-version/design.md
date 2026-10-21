## Context

`UtilityApi.getCoreVersion` calls the Admin backend's `GET /api/v1/version/core` endpoint, which returns configuration-related version state: auto-detected, default, and manually-set versions. In Core-only deployments, `DIAL_ADMIN_API_URL` is absent, so that endpoint is unavailable. The Core API already provides the current version as a plain-text response at authenticated `GET /version`.

The shared `Content` component owns the periodic Core-version fetch and passes the result to `Footer`. `Footer` already has a Core-only rendering path, but the fetch is currently skipped whenever the Admin API is disabled.

## Goals / Non-Goals

**Goals:**

- Retrieve the current Core version directly from `DIAL_CORE_API_URL` in Core-only deployments.
- Keep the public server-action result compatible with the `CoreVersions` state consumed by `Content` and `Footer`.
- Preserve Admin-backed version display, configuration, and editing without changing their API contract.
- Follow existing `CoreApi` request handling and token authentication patterns.

**Non-Goals:**

- Moving the Admin backend's version auto-detection, default selection, manual override, normalization, retry, or cache behavior into the frontend.
- Adding a Core endpoint or altering Core or Admin-backend contracts.
- Showing the version editor or allowing version changes when the Admin API is absent.

## Decisions

### Represent the direct-Core result as detected version state

`CoreUtilityApi` SHALL request the Core relative route `version` with `Accept: text/plain` and return the plain version string or `null` on request failure, consistent with `UtilityApi.getBeVersion`.

The existing `getCoreVersions` action SHALL select its API client from `DIAL_ADMIN_API_URL`:

- With Admin API configured, delegate unchanged to `UtilityApi.getCoreVersion`.
- Without it, call `CoreUtilityApi.getCoreVersion` and adapt a successful string into `{ autoDetectedVersion: version }`; return an empty Core-version result when Core does not supply a version.

This keeps the established `Content` state and `getCoreVersionElement` contract intact while truthfully conveying that Core returned the current value. Returning a separate `string` shape to the client would require parallel state and display paths for a single footer value.

### Keep polling at the Content boundary in both deployment modes

`Content` SHALL request the Core version on mount and every existing version-check interval regardless of `adminApiEnabled`. The Admin API check remains around Admin-only backend-version and process-status polling.

This keeps direct-Core traffic server-side through the existing protected-request/server-action pipeline and avoids exposing Core host configuration to the browser.

### Retain Core-only footer as display-only

The existing `isOnlyFE` footer branch SHALL display the adapted Core version and SHALL NOT mount the version-edit control or modal. The Admin-backed branch remains unchanged.

## Risks / Trade-offs

- [Core `/version` request fails or returns no usable value] → The UI receives no detected version and retains the existing absent-value footer behavior; no false version is shown.
- [Core returns a format different from the Admin backend's normalized version] → Display the value Core reports directly; normalization remains Admin-backend-only and is outside this migration's scope.
- [Polling runs in Core-only mode] → One authenticated version request is made per current 60-second interval, matching the existing Admin-backed refresh cadence.
- [Feature-flag tests assume version polling requires Admin API] → Update focused `Content` tests to assert direct-Core polling while retaining the Admin-only assertions for backend version and process status.

## Migration Plan

No data migration or deployment sequencing is required. The change uses the existing Core `/version` endpoint and only changes the frontend's client selection when `DIAL_ADMIN_API_URL` is absent. Rollback consists of reverting the frontend change.

## Open Questions

None.

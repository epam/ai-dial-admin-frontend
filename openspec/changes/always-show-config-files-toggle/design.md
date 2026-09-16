## Context

`config-file-entity-views` (PR #4536) exposes Core's config-file entity population through a
`showConfigFiles` toggle on seven covered views. The entire mechanism downstream of the toggle —
`ConfigFileListSwap`, `useConfigFileEntityList`, the `configFileApi` server actions (hosted at
`DIAL_CORE_API_URL`), and the `configFile=true` detail-page branch — is independent of
`featureFlags.adminApiEnabled`. The only place the flag gates the feature is the toggle component's
own early return (`ConfigFilesToggle.tsx:20`).

## Goals / Non-Goals

**Goals:**

- Render the `showConfigFiles` toggle on the seven covered views whether or not the admin backend is
  configured, so an admin with the admin API available can also browse Core's config-file population.

**Non-Goals:**

- Mounting the toggle on catalog-level list pages (no wiring exists there; separate change if ever
  wanted).
- Changing the swap, fetch, or detail-page behavior — all already flag-agnostic.
- Resetting `showConfigFiles` when the admin API's availability changes.

## Decisions

**Remove the gate inside `ConfigFilesToggle`, not at the mount sites.** The early return is the
single place `adminApiEnabled` gates this feature; all nine mount points (eight `PageList`s'
`headerExtra` + `BaseAssetList`'s covered-view branch) render the component unconditionally and stay
uniform. Gating at mount sites would duplicate the condition nine times and re-introduce exactly the
kind of per-page drift the shared component exists to prevent. Alternative rejected: passing a
`isVisible` prop — same duplication, plus a new prop for a condition the component can already read
from context.

**Leave persistence semantics untouched.** `showConfigFiles` stays a plain localStorage-persisted
boolean; it is not reset when `adminApiEnabled` flips. The toggle renders in both list states'
headers, so a user who lands in config-file mode always has the control in view to switch back.

## Risks / Trade-offs

- [A user toggles on with the admin API configured and every covered view shows the names-only
  config-file list until they toggle back] → Accepted: same stickiness the toggle already has
  without the admin API; the control is visible in the config-file list's own header to revert.
- [Users mistake the config-file list for the editable admin-backend list] → Mitigated by existing
  behavior: the config-file list is names-only, its rows navigate with `configFile=true`, and those
  detail pages render read-only — the read-only signal is already part of the shipped UX.

## Why

On Assets > Platform > Roles, the Entities tab's `+Add` button can only attach models to a role's `limits` map.
Applications are deployments too and Core keys their limits in the same map, so an administrator has no way to
give an application a limits entry from this screen (epam/ai-dial-admin-frontend#5243). It is also the first
step toward application cost limits, which are blocked on the backend contract and not part of this change.

## What Changes

- Replace the Entities tab's single `+Add` button with a dropdown button offering **Add models** and
  **Add applications**.
- **Add models** opens the existing `AddEntitiesGrid` popup, unchanged.
- **Add applications** opens a new multi-select popup built on `EntitySelectManager` (the folder-tree picker
  `ContextFilesPicker` already uses in multi-select mode), with an application type backed by the existing
  `AppsFolderProvider` / `useAppsFolder`.
- `EntitySelectManager` loads the root folders its picker type declares: Skill and File keep their single `public/`
  root, Application declares three (`file/`, `platform/`, `public/`).
- Each picked application becomes a key in `role.limits` with an empty limits object, using the same write path as
  models (`addModelLimits`). The key depends on where the application was picked from:
  - from the `file/` or `platform/` root: its `name`;
  - from the `public/` root: `applications/{path}`.
- A pick whose key already exists in `limits` is skipped silently; the existing entry keeps its limits.
- Read-only admins still see no add control.

Paths per root (read from the tree code): `file/` rows have `path = name`, `platform/` rows `platform/{name}`,
`public/` rows `public/...`, so only a `public/` pick gets the `applications/` prefix.

## Non-goals

- Cost-limit columns or inputs for applications (#5243's wider scope; waits on the backend contract).
- Telling models and applications apart in the Entities grid. Limits are stored as plain names, so no type column
  or icon is added.
- Changes to the legacy Entities > Roles surface.
- Changing what `EntitySelectManager` reports: it keeps returning `row.path` only, and the key is derived from it.
- Filtering already-added applications out of the tree (the tree can't; duplicates are skipped on apply).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-roles`: the Entities tab gains an add-applications action. The requirement that the add popup offers
  only models is narrowed to the Add models action, and the one-row-per-model Entities grid wording is widened to
  cover application entries keyed in `limits`.

## Impact

- `components/Assets/Platform/Roles/Entities.tsx` (dropdown, second popup), `utils.ts` (application key derivation,
  reuse of `addModelLimits`), new application picker popup component alongside it.
- `components/Common/EntitySelectInput/` — new `EntitySelectType.Application` config in `constants.ts` / `models.ts`.
  Shared with the Skill and File pickers, so their behavior must stay unchanged.
- i18n keys for the dropdown options and the popup header (`ButtonsI18nKey` / `RolesI18nKey`; reuse existing
  labels where present).
- Tests: `Roles/tests/Entities.spec.tsx`, `utils.spec.ts`, `EntitySelectInput` specs.
- No server actions, API routes or backend contracts change.

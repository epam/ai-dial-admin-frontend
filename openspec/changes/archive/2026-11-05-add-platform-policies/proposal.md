## Why

DIAL Core (epam/ai-dial-core#2152, merged) added the two record kinds of the spending-limits model — the
**policy** (what a budget covers and how much it allows) and the **policy assignment** (who a policy
reaches, in which cost object) — behind an admin-only API. The admin console has no surface for them, so
operators can only manage them with raw HTTP or `/v1/admin/apply`. Core stores these records but does not
enforce them yet, so the console needs the base lifecycle now; enforcement and cross-entity wiring land
separately.

## What Changes

- Add a `POLICIES_ENABLED` environment variable, **off by default**, that controls the whole feature
  while Core does not enforce policies yet. Unset or falsy: both menu items are absent and both
  `/platform-policies*` and `/platform-policy-assignments*` routes answer 404. It is exposed as
  `FeatureFlags.policiesEnabled`, read by one getter so the layout and the pages cannot disagree.
- Add two **Governance** menu items, `Policies` and `Policy Assignments`, after `Interceptors` and before
  `Approvals`, shown only when `POLICIES_ENABLED` is on.
- **BREAKING:** remove the `catalogEnabled` feature flag. The `catalog` token of `DISABLE_MENU_ITEMS` stops
  hiding the Core-direct (`Platform*`) menu items and the `platform` bucket root, which are now always
  offered (the `platform` root is still withheld in unit mode, as before). A deployment that set `catalog`
  to hide them sees them after upgrading, and the token needs no configuring any more.
- Add a `Policies` platform resource under `Assets/Platform/Policies/`: list, create, properties form,
  a dedicated **Subjects** tab, JSON editor, update, delete, bulk delete, duplicate.
- Add a `Policy Assignments` platform resource under `Assets/Platform/PolicyAssignments/`: same
  surface, with a policy selector and the cost object derived from the folder it is created in.
- Both resources are **folder-nested by one level** (the cost object), unlike the flat Routes/Roles
  resources: a policy is global (`<name>`) or project-scoped (`<costObject>/<name>`); an assignment is
  always `<costObject>/<id>`.
- Read and write directly through Core (`/v1/policies/platform/...`, `/v1/policy_assignments/platform/...`,
  listing via `/v1/metadata/...`), with ETag on writes, as the other platform resources do.
- Surface Core's own 400/409 validation messages through the standard notification path; the client
  adds only required-field checks.

### Non-goals

- No enforcement, budget display, or usage tracking, and no link from models, applications, roles or
  keys to policies — a later, separate change.
- No UI for the fields Core rejects as "not supported yet": `attachedTo`, `harness`, `broker`,
  `packages`, and `per` other than `["subject"]`. They are omitted from the form and from payloads.
- No client-side re-implementation of Core's validation (V1–V11, priority ties, expiry rules).
- No admin-backend involvement and no config-file population view.
- No flag finer than one switch: the two entities are enabled or disabled together, and the server
  actions are not separately gated (Core authorizes admin-only writes itself).

## Capabilities

### New Capabilities

- `platform-policies`: the `POLICIES_ENABLED` switch, the `Governance > Policies` menu entry, the one-level folder-nested list, the
  create modal, the Properties and Subjects tabs, JSON editing, and update/delete/duplicate semantics
  over Core's `policies/platform` resource.
- `platform-policy-assignments`: the `Governance > Policy Assignments` menu entry, the cost-object
  folder-bound create flow, the policy selector, the Properties and Subjects tabs, and
  update/delete/duplicate semantics over Core's `policy_assignments/platform` resource.

### Modified Capabilities

- `platform-applications`, `platform-toolsets`: the `platform` root of the Assets grid is no longer
  conditional on Catalog.
- `config-file-entity-views`: the three-root listing for Applications and Toolsets no longer depends on Catalog.
- `container-core-assets`: the Core create modal always offers the `platform` and `public` roots.
- `projects`: the menu entry is shown unconditionally, with no mention of a `catalog` token.

## Impact

- **New code:** `src/components/Assets/Platform/Policies/**`, `.../PolicyAssignments/**`,
  `src/app/[lang]/platform-policies/**`, `src/app/[lang]/platform-policy-assignments/**`,
  `src/models/dial/policy.ts`, two folder contexts in `src/context/assets/`.
- **Shared code touched (switch-statement wiring, flagged because each is read by every platform
  resource):** `types/routes.ts`, `types/resource-type.ts`, `Menu/menu-configuration.tsx`,
  `Menu/menu-item-icons.tsx`, `Assets/utils.ts`, `Assets/BaseAssetList/utils.tsx`,
  `Assets/Modals/*`, `Breadcrumbs/constants.ts`, `server/core/asset-metadata.ts`,
  `AssetFolderProviders.tsx`, `utils/tabs/utils.ts`, `utils/entities/{create,update,duplicate}-entity.ts`,
  `constants/i18n.ts`, `locales/en.ts`.
- **Configuration:** `catalogEnabled` is removed from `FeatureFlags` and `[lang]/layout.tsx`; the `catalog`
  token of `DISABLE_MENU_ITEMS` no longer has an effect. New `POLICIES_ENABLED` (default `false`), read through
  `src/utils/env/get-policies-toggle.ts` and added to `FeatureFlags`, `[lang]/layout.tsx`, and
  `test-setup.tsx` / the menu specs' flag fixtures. Existing deployments are unaffected until it is set.
- **API:** Core only — no admin-backend contract. Requires a Core build containing #2152.
- **Docs:** `.env.template`, the `README.md` environment table, and `docs/INFRA-CHANGELOG.md` (0.23.0,
  `Added` for `POLICIES_ENABLED`, `Removed` for the `catalog` token), as the other preview flags are
  documented; `docs/MENU-DOCUMENTATION.md` stops describing the token.

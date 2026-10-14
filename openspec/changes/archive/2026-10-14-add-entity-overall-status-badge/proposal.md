## Why

DIAL Core reports a read-only overall validity (`status`: `valid` | `invalid`, plus `validationWarnings`
for admins) on platform entities, and the frontend already relocates it into `_metadata`. Today only
`InvalidModelBanner` surfaces it, and only for models — every other platform entity (applications,
toolsets, interceptors, translators, routes, roles, keys, app runners, catalog schemas) can be rejected
by Core and left unserved with no sign of it in the entity header.

The header also needs a general status-pill component: run statuses (completed / failed / running /
stopped) are planned to reuse the same visual, so it must not be hard-wired to valid/invalid.

## What Changes

- Add a generic `StatusBadge` component: pill (`px-2 py-0.5`, `rounded-[120px]`), leading 6px filled dot
  with `gap-1` to the label, variant-driven colours, and an optional trailing 16px info icon that
  reveals a hint on hover and keyboard focus.
- Add an overall-status mapper from `_metadata.status` / `_metadata.validationWarnings` to badge props:
  `valid` → Valid (no hint); `invalid` → Invalid, hint = the warnings as `field: message` joined with
  `; ` (the same text `InvalidModelBanner` builds today, extracted into one shared util). No hint → no
  info icon. Any other or missing status → nothing rendered.
- Render the badge in the entity header, above the id with `gap-2`, through one shared id block used by
  both `SimpleEntityHeader` (every platform view) and `AssetHeader`. Entities without `_metadata.status`
  — public applications, public toolsets, prompts — render nothing and do not shift layout.
- New i18n keys for the Valid and Invalid labels and the info icon's accessible name.

Non-goals:

- No changes to `CoreSyncStatusBadge`, `TableStatusBadge`, or the BE `validityState` / `ValidityStatus`
  components. The sync badge and the overall badge never appear together (sync is admin-backend entities;
  overall status is Core entities), so they share the slot without coordination.
- No completed / failed / running / stopped variants and no Runs adoption — the variant lookup is shaped
  to accept them later.
- No Core changes: public applications and toolsets get no badge until Core serves `status` for them.
- `InvalidModelBanner` stays; it only switches to the shared warnings-text util.

## Capabilities

### New Capabilities
- `entity-overall-status-badge`: header status pill driven by `_metadata.status`, its visual contract,
  hint behaviour, and when it is shown; includes the generic `StatusBadge` contract that future run
  statuses extend.

### Modified Capabilities
<!-- None: no existing spec's requirements change. -->

## Impact

- New: `components/Common/StatusBadge/` (component, variant config, models/constants), overall-status
  mapper + warnings-text util, shared header id block.
- Edited: `EntityHeaderControls/SimpleHeader.tsx`, `EntityHeaderControls/AssetHeader.tsx`,
  `Assets/Platform/Models/InvalidModelBanner.tsx` (reuse util), `constants/i18n.ts`, `locales/en.ts`.
- Tokens only, no hex: the dot is `bg-[currentColor]`, inheriting the pill's text color; pill uses
  `bg-success`/`text-success` and `bg-error`/`text-error`.
- Tests colocated with the new components; header specs updated for the new block.

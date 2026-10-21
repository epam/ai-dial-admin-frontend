## Why

The analytics table access panel picks its role names from the admin backend's `/roles` list — a
source that is both wrong and closing. It is wrong because DIAL Core keeps roles in **two**
populations (API-written resources under `roles/platform/`, and roles declared in Core's
configuration file) and the admin backend serves neither directly; a role that exists only as an
`Assets > Roles` resource, or only in Core's config file, cannot be granted on a table at all today.
It is closing because that backend is being retired, and this is the last role picker in the app
still sitting on it — every Platform/Assets picker already reads Core.

The picker also drops what it cannot match. Its options come from one catalog, and a closed select
renders only the values that match an option — so a grant naming a role outside that catalog is
invisible in the panel and is dropped by the next unrelated edit, silently revoking access that is
still in effect. Every other role surface in this application guards against exactly that by deriving
what it shows from the grants themselves.

## What Changes

- `getRoles()` in `app/[lang]/tables/actions.ts` stops calling `rolesApi.getRolesList` and reads
  Core's two role populations through the existing `readConfigEntities` reader, which issues both
  requests concurrently, merges them by bare name with an API-written role superseding a
  config-file role of the same name, and degrades to whichever population it could read.
- `TableAccessPanel` keeps its two `DialSelectField multiple` controls — selection stays closed, with
  no typed entry — but builds their options as the union of the Core catalog and the names the table
  already grants, so a grant outside the catalog is shown as selected and survives a save.
- Options are sorted alphabetically, independently of the order Core's two populations were read in.
- **BREAKING**: none. The wire contract (`TableAccess { write: string[]; modify: string[] }`) and the
  stored values (bare role names) are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the "Full-admin per-table role management panel" requirement currently names
  `RolesApi.getRolesList` as the option source and says nothing about ordering or about a grant the
  catalog does not contain. It changes to Core's merged role catalog as the source, alphabetical
  option order, and options that always include the roles the table already grants.

## Impact

- `apps/ai-dial-admin/src/app/[lang]/tables/actions.ts` — `getRoles()` re-pointed at
  `readConfigEntities`; its return type becomes the `ConfigEntityRow` shape the reader produces.
- `apps/ai-dial-admin/src/components/Analytics/Tables/TableAccessPanel.tsx` — option source, the
  union with the loaded grants, and sorting.
- `apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableAccessPanel.spec.tsx` — new cases for
  ordering and for the out-of-catalog grant; the existing `DialSelectField` checkbox mock still
  describes the rendered control and is kept.
- `openspec/specs/analytics/spec.md` — one modified requirement.
- No change to `RolesApi`, to `readConfigEntities`, to any shared control, or to any other surface
  that reads roles.

## Non-goals

- Migrating the remaining `rolesApi.getRolesList` callers (Entities pages: models, applications,
  routes, toolsets, keys, app runners, roles, export-config). Those move with the admin backend's own
  retirement; bundling them here would spread one change across eight unrelated surfaces.
- Hand-typed role entry. The analytics service matches provider role names as the identity provider
  issues them, so a role with no DIAL role resource behind it would in principle be a valid grant —
  but offering free text on a permissions surface trades a typo for a silently ineffective grant, and
  the roles in use are expected to be configured in Core. Selection stays closed.
- Showing which population a suggested role came from. The reader carries `origin`, but the panel
  writes a bare name either way, so the distinction has no consequence a user could act on here.
- Any change to how the analytics service evaluates access, or to the Connect panel's rendering of
  the `write` list.

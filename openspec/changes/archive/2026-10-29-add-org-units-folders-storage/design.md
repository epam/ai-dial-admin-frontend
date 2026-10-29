## Context

Folders Storage (`components/FoldersStorage/*`) pairs a lazy folder tree (`FolderList` →
`DialFoldersTree`, fed by `RuleFolderContext`) with `FolderInfo`, which edits one folder's read rules
as a draft (`originalRules` / `editableRules`, Save/Discard through `ChangedEntityButtons`). The draft
resets whenever `filePath` changes — selecting another folder silently discards it.

Core is adding org units (PRs #2137–#2165, contract in core `docs/org-units.md`). Facts the design
depends on:

- Units are recorded `public/` folders, at most 4 levels, created only under `public` or another unit.
  Core's folder listings carry **no** unit marker; the unit list is a separate call.
- Inside a unit, roles decide access and folder rules grant nothing; core drops rules sent there.
  The nearest unit above a folder owns it, so subfolders (`models`) of a unit are still "inside".
- Unit CRUD and role-assignment writes are caller-token calls to core; DIAL admins can do all of it.
  `404` on any `/v1/org-units` call means the feature is off.
- `path` is the unit id in the API (decoded); `folder` is the url-encoded folder with trailing slash.
  The handoff says: read `folder`, never build it.

Scope is Folders Storage for DIAL admins only.

## Goals / Non-Goals

**Goals:**
- Show which folders are units, and which folders sit inside one.
- Create, rename and remove units; manage a unit's role assignments.
- Keep the page byte-for-byte equivalent in behaviour when units are off or a folder is under no unit.
- Look like the existing page: reuse its layout, the rules card/chip look, `ChangedEntityButtons`.

**Non-Goals:**
- Role-aware navigation, non-admin access, content-page permissions (see proposal).
- Copy roles from parent; warning on leaving unsaved role edits.

## Decisions

### D1. Unit data lives in one shared `OrgUnitsContext`, loaded once

A new provider in `layout.tsx`, above `RuleFolderProvider` and `AssetFolderProviders`, exposes `units` (map
keyed by `folder`, decoded for lookup), `unitsStatus` (`idle | loading | ready | disabled | error`),
`groupClaim`, `refreshUnits()` and `getOwningUnit(path)` (longest `folder` prefix of `path`). Every folder
context and file manager reads it through `useOrgUnits()`; nothing is copied into the per-entity contexts.

Loaded with one `GET /v1/org-units/public?recursive=true` the first time a consumer calls `ensureUnits()`
(Folders Storage on its first tree fetch, `FileManager` on mount), and re-fetched after create/rename/remove. `404` → `disabled` (every unit control hidden, page as today);
other failure → `error` (inline "Units can't be loaded right now. Try again." with a retry, tree still
usable but unit-aware panels are not shown as if the folder were a plain one — the panel shows the error
instead of the rules editor).

*Why a shared context rather than `RuleFolderContext`:* the content-page file managers are fed by a dozen
per-entity contexts built by `createFolderContext`; copying the unit map into each would repeat the fetch and the
status handling. One provider means one call, one status and one place to refresh. It costs a mount in
`layout.tsx` and a mock in `test-setup.tsx`.
*Alternative rejected:* per-folder `GET …/{unit}` on selection — N calls and no way to mark the tree.

### D2. Ownership is a prefix lookup on `folder`, never a path build

`getOwningUnit` compares the selected node's `path` against stored `folder` values (both normalised with
`addTrailingSlash`, decoded the same way). Pure helper in `utils/` (`utils.md`), unit-tested for: exact
unit, subfolder, sibling plain folder, unit-named prefix collision (`public/Acme/Risk2/` vs
`public/Acme/Risk/`), and no unit.

### D3. `FolderInfo` becomes a thin switch over three bodies

```
selected folder
  ├─ unitsStatus = error ─────────► load-error state
  ├─ owning unit = none ──────────► RulesList (unchanged, draft + Save/Discard as today)
  └─ owning unit = U ─────────────► UnitHeader actions + UnitRolesCard (draft + Save/Discard)
```

The rules draft state stays where it is; the roles draft is a sibling hook (`use-unit-roles-draft`)
mounted only for unit bodies. Both reset on `filePath` change. This keeps the existing rules path
untouched and satisfies "leave old functionality alone".

A subfolder inside a unit (not itself a unit) shows a read-only note ("Covered by <unit>'s roles") with a
link-style action to select the unit — not an empty rules editor (rules would be dropped silently).

### D4. Roles card = per-role rows with holder chips, edited as a draft

Data: `GET …/roles` (cached per unit selection) + `GET …/role-assignments`. Draft model is a list of
assignments with a local state each: `stored` | `added` | `removed`. Save computes the diff and issues
`POST` for added and `DELETE` for removed, sequentially; then reloads assignments from core.

- **Partial failure:** stop at the first failure, reload from core, show core's message in a notification;
  the draft is replaced by what core now holds (no rollback, no hidden retry). Simple and truthful.
- **Same role + same subject** is idempotent in core, so a retry after a partial failure is safe.
- **Chips:** classify subjects with a pure `classifySubject(subject, groupClaim)`: `EQUAL` on `email`
  or a target containing `@` → person; `EQUAL` on the configured group claim → group; `TRUE` → everyone
  signed in; `EQUAL` on `roles` → DIAL role; anything else → raw chip `source = targets`, removable.
- **Add control per role:** person (email), group (name), everyone — "everyone" only offered for roles
  where it makes sense is a product call, not blocked here; core validates.
- **Validation (client, before Save):** non-blank, ≤256 chars, no control characters, `@` shape not
  enforced beyond chip classification. Core remains authoritative; its 400 message is shown.
- **`403` on `role-assignments`/`roles`:** hide the card. For DIAL admins this should not occur; it is
  handled so a mis-scoped token degrades rather than breaks.

*Alternative rejected:* save each chip immediately — fewer states, but diverges from the page's
Save/Discard convention and gives a user no way to review a multi-change edit.

### D5. Group claim from configuration

One new server-side env variable, `ORG_UNITS_GROUP_CLAIM`, holding a **single** claim name (a name or a
dotted path such as `realm_access.roles`), default `groups`. It is read in `layout.tsx` and handed to
`RuleFolderProvider` as a prop, the same path `PUBLICATION_FILTERS` already takes into `attributes`, so no
new client-config mechanism is introduced. It is documented as a commented entry in `.env.template` and a
row in the README's environment table. Used only by `classifySubject` and by the "add group" control, which
writes `{source: <claim>, function: EQUAL, targets: [name]}`.

*Alternatives rejected:* reusing `PUBLICATION_FILTERS` (its default has no groups claim and it changes the
meaning of an existing variable); a comma-separated list with a source picker (more UI for a mixed-claim case
nobody has asked for); a free-form source field per holder (nothing then defines what a "group" is, and a
wrong claim is stored without an error). A list can be added later without changing stored data.

### D6. Unit lifecycle lives in the panel header; the tree stays action-free

`folder-list-tree` forbids context menus/row actions in the tree and this change keeps that. Placement:
**New unit** button in the page header (creates under the selected unit, or under `public` when the
selection is `public/` or a plain folder directly under it), plus the same action in the unit panel header;
**Rename** and **Remove unit** in the unit panel header only.

- **New unit** is disabled with the handoff's tooltips when the selection is a plain folder not under
  `public` directly ("Units can only be created at the top of the shared space or in another unit.") or a
  level-4 unit ("Units can be at most 4 levels deep."). Level is computed from `folder`'s segment count.
  Core stays authoritative (404/409 shown inline on the field).
- **Rename** edits `displayName` only. Move, Rename and Delete are disabled on units and on folders that
  contain units in the content-page file managers (D9).
- **Remove unit** is one flow: the dialog lists the sub-units affected; it calls `DELETE …?recursive=true`.
  Core refuses non-empty units with a 409 naming up to three items; that message is shown in the dialog
  and the user deletes content with today's folder delete, then retries. This change does not delete
  content for the user.
- After any lifecycle call the context refreshes units and re-selects the nearest surviving folder.

### D7. Core client shape follows `CorePublicationsApi`

New `server/entities/core-org-units-api.ts` extending `CoreApi` (host `DIAL_CORE_API_URL`), exported from
`app/api/api.ts`, with server actions in `app/[lang]/folders-storage/actions.ts` (token via
`getUserToken`, response as `ServerActionResponse`). Paths are encoded per segment with `encodeCorePath`.
Error mapping (404/400/403/409/5xx → field error, hidden control, message) is a pure function in
`utils/` so the dialogs and the card share it. Core's responses are typed in `models/dial/org-unit.ts`;
delete answers `{removed: string[]}` for units but `{removed: string}` for an assignment — typed separately.

### D8. Tree marker — a per-node icon, added upstream first

`DialFoldersTree` (`@epam/ai-dial-react-file-manager` 0.4.0-dev.12) has no way to draw a different icon per
row: the icon is drawn inside the ui-kit's `FileName` from `type` alone, `sharedByMePaths` only adds a badge
and feeds menu actions, and `renderItemActions` shows on hover only. Decision, agreed with the maintainer
who owns all three repos: extend the libraries rather than reach into the tree's internals.

- **ui-kit:** `FileName` (`src/components/New/FileName/FileName.tsx`) gains `icon?: ReactNode`, which
  **replaces** the type icon (the shared badge and the loading spinner behave as today; with `icon` set the
  default icon is not rendered).
- **file-manager:** `DialFoldersTree` gains `getItemIcon?: (item: DialFile) => ReactNode | undefined`.
  Returning a node replaces that row's icon; returning `undefined` keeps today's rendering, so existing
  consumers are unaffected. It is passed through `DialFileManagerItemName` to `FileName`. Scope is the
  folders tree only; the prop is named and typed so the grid and other name cells can adopt it later.
- **file-manager, full component:** `DialFileManager` gains `gridOptions.getItemIcon` (grid and compact list name
  cells); its navigation tree already takes `treeOptions.getItemIcon`.
- **admin panel:** one `UnitFolderIcon` — tabler `IconSitemap` (an organisation structure, not a building) in the
  neutral `text-secondary` token, 20px, `aria-hidden` — is returned by `FolderList` and by the content-page
  `FileManager` (tree and grid) for folders that are a unit `folder`, and `undefined` otherwise or when no
  units are loaded. Neutral grey keeps it distinct from the blue folder icon and legible on both themes.

This change cannot start its tree work until both libraries are released and the admin app's pinned
versions are bumped by the maintainer. Until then the tasks that do not touch the tree can proceed, and if
the release slips the fallback is the panel-header badge alone (the spec's marker scenarios would then be
deferred, not dropped).

### D9. Content-page guards through a per-item action restriction

Core refuses folder moves, any move that changes a resource's owning unit, and a unit's folder name never changes,
so the content-page file managers offer actions that can only fail. `FileManager` computes, for each folder, a
restriction reason when it is a unit or contains a unit (`isUnitFolder` / `containsUnit` over the shared map)
and passes it as `getItemActionRestriction(file, action)` for `Move`, `Rename` and `Delete`. The file-manager
disables the action in the grid context menu, the tree menu and the bulk toolbar and shows the reason, so the
user learns why before clicking rather than from a 409.

*Alternative rejected:* swallowing the action in `onMoveToFiles` / `onDeleteFiles` — the buttons stay clickable,
rename has no handler to guard, and the explanation arrives after the click.

The library prop ships first (same release-and-bump cycle as D8). With units off, not yet loaded or errored, the
callback returns `undefined` for everything, so pages behave as today.

### D10. Accessibility and styling

Roles card sections are `role="group"` + `aria-label` per role (a11y.md "grouping"); holder chips are
removable buttons with an `aria-label` naming the holder; Save feedback uses the existing notification
live region; any unit marker is `aria-hidden` with the "unit" text exposed in the row's accessible name or
the panel header. Colors only through tokens; icons from `@tabler/icons-react`.

## Risks / Trade-offs

- **Core PRs are unmerged** → Keep the API client, models and `classifySubject` behind one module so a
  contract change is a local edit; re-check `docs/org-units.md` on the merged branch before apply.
- **Tree marker waits on two library releases** → D8; the feature stays usable with the panel-header badge if they slip.
- **Silent discard of unsaved role edits on selection change** → matches the rules editor today and was
  chosen for simplicity; a later guard would cover both editors at once.
- **Partial Save failure** → reload-from-core, no rollback; acceptable because assignments are
  independent and idempotent.
- **Remove unit cannot clear content** → the user needs two steps; core's 409 names the blocking items.
- **`FolderList`/context are shared** → new members optional; asset contexts' specs must still pass.

## Migration Plan

No data migration. Ship behind core's `orgUnits.enabled`: off → 404 → `disabled`, page unchanged. Rollback
is reverting the change; nothing is persisted by the panel.

## Open Questions

1. Should "everyone signed in" be offered for every role, or hidden for `admin`? (Core allows it.)

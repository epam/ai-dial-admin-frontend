## Why

DIAL Core is adding **org units**: shared-space (`public/`) folders that core records as units, where
roles — not folder read rules — decide who reads, edits and approves
(epam/ai-dial-core #2137, #2138, #2162, #2163, #2164, #2165; contract in core's `docs/org-units.md`).
Folders Storage is the admin page where DIAL admins manage `public/` folders and their read rules, but it
has no notion of a unit: an admin cannot create one, cannot tell a unit from a plain folder, and would
edit read rules that core silently drops inside a unit.

## What Changes

- Add a core client for the Units API (`/v1/org-units/public…`): list (recursive), create, rename
  (`displayName` only), delete (optionally recursive), list roles, list/add/remove role assignments.
- A shared `OrgUnitsContext` loads the unit map once (`GET …?recursive=true`), keyed by each unit's `folder`,
  and exposes it with a "nearest owning unit" lookup to every folder context and page (Folders Storage and the
  content-page file managers alike). A 404 means units are off and hides every unit control;
  a 5xx surfaces "Units can't be loaded right now" and never renders units as plain folders.
- The folder tree marks unit nodes (the handoff's ◆). Plain folders look as today.
- The details panel (`FolderInfo`) shows, for the selected folder:
  - under no unit → the rules editor, unchanged;
  - a unit, or a folder inside one → a **roles card** instead of the rules editor.
- Roles card: roles from `GET …/roles` (so config-defined roles appear without a panel change), one row
  per role with holder chips (person / group / everyone / DIAL role / raw `source = targets` for subjects
  the panel does not recognise), add and remove holders. Edits are a local draft saved with Save / Discard
  (`ChangedEntityButtons`), the same mechanism as the rules editor; selecting another folder discards an
  unsaved draft, as it does for rules today.
- Panel header actions on a unit: **New unit** (also at the top of the shared space), **Rename**
  (`displayName`), **Remove unit** (one flow listing affected sub-units; core's 409 names up to three
  blocking items). Core's 400/404/409 messages map to the handoff's field errors.
- Content-page file managers (files, prompts, applications, toolsets, conversations, skills) disable **Move,
  Rename and Delete** on a unit folder and on any folder that contains a unit, with a reason beside the action
  (the folder name is part of every item's address, and Remove unit is the way to delete a unit).
- The group-claim name (`groups`, `realm_access.roles`, …) comes from a new environment variable, documented
  as a commented entry in `.env.template`.
- Access stays **DIAL admins only**; no role-aware navigation.

## Capabilities

### New Capabilities
- `org-units-folders-storage`: unit awareness on the Folders Storage page — unit map and ownership lookup,
  unit lifecycle (create, rename, remove), the roles card and its draft/save behaviour, rules editor
  hidden inside units, status-code handling, and the Units API client contract.

### Modified Capabilities
- `folder-list-tree`: tree rows for unit folders carry a unit marker; the "no folder actions in the tree"
  requirement stays — all unit actions live in the details panel.

## Impact

- **Code:** new `src/server/` Units API client and server actions under
  `src/app/[lang]/folders-storage/`; a new `src/context/OrgUnitsContext.tsx` mounted in `layout.tsx` above the
  folder providers; `src/components/Common/FileManager/FileManager.tsx` (the shared content-page file manager); `src/components/FoldersStorage/*`, `src/components/Common/FolderList/FolderList.tsx`;
  new models under `src/models/dial/`; i18n keys in `src/constants/i18n.ts` / `src/locales/en.ts`;
  `.env.template`.
- **Shared surface:** `FolderList` and `FileManager` are shared by every asset page — the unit marker and the
  action guards must be inert when units are off, not loaded, or the folder is under no unit.
- **Dependencies:** the unit marker needs a per-row icon in `DialFoldersTree`. That means a new `icon` prop on
  the ui-kit's `FileName` and a new `getItemIcon` prop on the file-manager's tree, both of which the
  maintainer is adding and releasing first; the admin app then bumps `@epam/ai-dial-ui-kit` and
  `@epam/ai-dial-react-file-manager`. Tree work starts after that bump. The action guards need a second
  file-manager addition, `getItemActionRestriction` (per-item reason that disables Move, Rename and Delete in
  the grid menu, tree menu and bulk toolbar); that work waits for its own release and bump.
- **Backend:** requires core with `orgUnits.enabled`; with it off the page behaves exactly as today.
  The PRs are unmerged, so the contract may shift in review.

## Non-goals

- "Copy roles from parent" in New unit.
- Content-page permission views (`?permissions=true`), Approvals changes, role-aware menus, and
  the admin-backend access level for non-admins.
- DIAL Chat changes.
- Warning on unsaved role edits when changing selection (same silent discard as rules today).
- Moving or renaming a unit's folder; roles inheritance to child units (core does not inherit either).

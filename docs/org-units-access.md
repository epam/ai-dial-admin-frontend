# Org-units access

What a signed-in user sees and can do, driven by DIAL Core's `GET /v1/user/role-assignments`. The spec is
`openspec/specs/user-org-units-access/spec.md`.

## Modes

| Mode   | When                                                                                  | Result                                      |
| ------ | ------------------------------------------------------------------------------------- | ------------------------------------------- |
| FULL   | `adminAccess` is `FULL`, authentication is off, or Core answers `404` (org units off) | Today's admin panel, unchanged              |
| UNIT   | `adminAccess` is `NONE` and the caller has at least one unit                          | Reduced panel, scoped to the caller's units |
| DENIED | `NONE` with no units, or the access read failed                                       | 403 page                                    |

`READ_ONLY` is declared for later; Core does not send it yet, so `isReadOnlyAdmin` is false for now.

## Menu in unit mode

A section is shown when the caller holds `read` on its namespace in any unit.

| Menu item                         | Namespace needed   |
| --------------------------------- | ------------------ |
| Applications                      | `applications`     |
| Toolsets                          | `toolsets`         |
| Prompts                           | `prompts`          |
| Files                             | `files`            |
| Skills                            | `skills`           |
| Projects                          | `projects`         |
| Conversations                     | `conversations`    |
| Approvals (all publication lists) | `publications`     |
| Folders Storage                   | `role-assignments` |

Hidden in unit mode: Models, Interceptors, Roles, Keys, Routes, Translators, Catalog schemas, App runners,
Entities, Analytics, Import/Export and System properties.

## Abilities in unit mode

The owning unit of a path is the unit with the longest `folder` prefix match at a segment boundary.

| Ability                                                                               | Needs                                                                         |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Create, edit, delete in Applications, Toolsets, Prompts, Files, Skills, Conversations | `write` on that namespace in the owning unit; otherwise the view is read-only |
| Approve or reject a publication                                                       | `read` and `write` on `publications` in every unit the request touches        |
| Roles card on a unit                                                                  | `read` on `role-assignments` shows it; `write` enables changes                |
| Rename or remove a unit                                                               | `write` on `org-units` there                                                  |
| Create a top-level unit                                                               | Not available                                                                 |
| Folder rules editor                                                                   | Read-only                                                                     |
| Interceptors and user roles                                                           | Read-only, even with `write`                                                  |

## Dependency pickers

Admin-only reads are made only when `adminAccess` is `FULL`, not by testing for unit mode, so a denied access
read never falls back to them.

| Picker or read                                        | Full admin                                   | Everyone else                                 |
| ----------------------------------------------------- | -------------------------------------------- | --------------------------------------------- |
| Runners                                               | Config file, platform runners, admin backend | `GET /v1/application_type_schemas/schemas`    |
| Models                                                | Config file                                  | `GET /openai/models`                          |
| Applications                                          | Config file                                  | `GET /openai/applications`                    |
| Runner details                                        | Config-file read                             | `GET /v1/application_type_schemas/schema?id=` |
| Translators, roles, interceptors, global interceptors | Core configuration                           | Skipped                                       |
| File tree roots                                       | `file`, `platform`, `public`                 | `public` only                                 |

The `/openai/*` lists hold exactly the deployments Core accepts as a dependency from the caller, so they are
the valid choices. A failed list read leaves that picker empty and shows the option-list-unavailable warning.

## Known gaps

- Deleting a publication request is not gated by unit permissions.
- The `file` root still loads for the Applications and Toolsets detail views in unit mode.
- Platform and Entities pages are hidden only through the menu; direct URLs are not guarded.
- A unit user cannot re-save an application whose existing dependencies or interceptors they cannot use, even
  when only the display name changed. Core is expected to check only references a write adds.
- Whether unit users see the user roles field at all is a product decision.

## Where it lives

| Concern                           | Location                                                              |
| --------------------------------- | --------------------------------------------------------------------- |
| Access read and cache             | `src/server/user-access.ts`, `src/utils/auth/user-access.ts`          |
| Admin gate for server pages       | `isFullAdminCaller()` in `src/server/user-access.ts`                  |
| Context flags                     | `src/context/AppContext.tsx`                                          |
| Permission checks and menu filter | `src/utils/org-units/`                                                |
| Detail views read-only            | `src/hooks/use-entity-read-only-at.ts`                                |
| Caller-scoped picker reads        | `src/server/config-entities/read-caller-options.ts`, `CoreUtilityApi` |
| File roots                        | `src/utils/files/root-folder.ts`                                      |

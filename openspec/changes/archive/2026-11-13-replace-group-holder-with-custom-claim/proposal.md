## Why

The role-assignment editor on an org unit can add a holder as Email, Group, Role or Everyone. "Group" is a claim
whose name is fixed per deployment by `ORG_UNITS_GROUP_CLAIM`, so an admin can only target one extra claim and
only after an ops change. Identity providers expose many claims (`department`, `realm_access.roles`, `tenant`), and
the editor should let an admin target any of them directly instead of reconfiguring the app.

## What Changes

- **BREAKING** Remove the Group holder kind and the `ORG_UNITS_GROUP_CLAIM` environment variable. The variable is
  dropped from `.env.template` and the README, and the `groupClaim` value is removed from `OrgUnitsContext` and the
  `UnitInfo` → `UnitRolesCard` → `AddHolderForm` props.
- Add a **Custom claim** holder kind (`SubjectKind.CLAIM`, icon `IconBraces`) offered third, after Email and Role
  and before Everyone.
- Choosing Custom claim shows a Key input and a Value input instead of the single value input. The saved subject
  is `claimsPredicate` / `EQUAL` on the entered key with the entered value as its target.
- A holder of that kind renders as `{icon} {key}={value}`; the other kinds keep `{icon} {value}`.
- Existing assignments on a configured group claim (default `groups`) keep working and now render as Custom claim
  chips (`groups=eng`).
- Email recognition narrows to the `email` source. The current rule also treats any other source with an `@` in a
  target as an email, which would misread a custom claim such as `upn=a@b.com` as a person.
- Keys that already have their own kind (`email`, `roles`, `sub`) are refused as a custom key, so a saved
  assignment never re-classifies as another kind after a reload.
- Read-only users see the same chips without remove buttons and without the add form, as today.

## Non-goals

- Making other entity views (applications, toolsets, prompts, conversations, projects) read-only when the owning
  unit grants only `read`. That is a separate change.
- Editing or merging multi-target assignments, or supporting predicate functions other than `EQUAL` and `TRUE`.
- Any change to the Units API contract or to how Core evaluates claims.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `org-units-folders-storage`: the "Group claim is configured" requirement is removed, the unit context no longer
  holds a group claim, and the holder form and chip requirements gain the Custom claim kind (key and value input,
  `key=value` label, reserved keys, email recognition).

## Impact

- Code: `utils/org-units/subjects.ts` (`classifySubject`, `buildSubject`, validators), `models/dial/org-unit.ts`
  (`SubjectKind`), `components/FoldersStorage/` (`AddHolderForm`, `UnitRolesCard`, `UnitInfo`, `SubjectKindIcon`),
  `context/OrgUnitsContext.tsx`, `app/[lang]/layout.tsx`, `locales/en.ts` and the `FoldersI18nKey` enum.
- Config and docs: `.env.template`, `README.md` environment table, `docs/INFRA-CHANGELOG.md`.
- Tests: `subjects.spec.ts`, `UnitRolesCard.spec.tsx`, `OrgUnitsContext.spec.tsx`, `FolderInfo.spec.tsx`,
  `FolderList.spec.tsx`, `FileManager.spec.tsx` and the org-units mock in `test-setup.tsx`.
- Deployments that set `ORG_UNITS_GROUP_CLAIM` can leave it in place; it is ignored. Release notes list the removal
  under Deployment Changes.

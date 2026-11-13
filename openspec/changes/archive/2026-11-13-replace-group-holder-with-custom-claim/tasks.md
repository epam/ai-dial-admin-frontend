## 1. Subject model and helpers

- [x] 1.1 In `apps/ai-dial-admin/src/models/dial/org-unit.ts`, replace `SubjectKind.GROUP` with `SubjectKind.CLAIM`.
- [x] 1.2 In `apps/ai-dial-admin/src/utils/org-units/subjects.ts`, drop the `groupClaim` parameter from
  `classifySubject` and classify by source only: `email` → PERSON, `roles` → DIAL_ROLE, `TRUE` on `sub` with no
  targets → EVERYONE, any other `EQUAL` source → CLAIM with label `${source}=${targets joined}`, else RAW. Remove the
  `@` heuristic.
- [x] 1.3 In the same file, change `buildSubject` to `(kind, value, claimKey?)`: CLAIM builds `EQUAL` on the trimmed key
  and throws without one. Export `RESERVED_CLAIM_KEYS` (`email`, `roles`, `sub`) and an `isValidClaimKey` helper that
  applies `isValidHolderValue` and refuses a reserved key.

## 2. Add-holder form and chips

- [x] 2.1 In `SubjectKindIcon.tsx`, map `CLAIM` to `IconBraces` and remove the Group case and the `IconUsers` import.
- [x] 2.2 In `AddHolderForm.tsx`, drop the `groupClaim` prop, set `ADDABLE_KINDS` to Email, Role, Custom claim,
  Everyone, add `claimKey` state, render the Key input before the Value input for CLAIM only, validate both, show
  `HolderInvalid` or the reserved-key message once a field has content, and clear both inputs after Add.
- [x] 2.3 In `UnitRolesCard.tsx` and `UnitInfo.tsx`, drop the `groupClaim` prop and its use in `classifySubject`.
- [x] 2.4 In `constants/i18n.ts` and `locales/en.ts`, remove `HolderGroup` and `HolderGroupPlaceholder` and add
  `HolderClaim`, `HolderClaimKey`, `HolderClaimValue` and `HolderClaimKeyReserved`.

## 3. Remove the group claim setting

- [x] 3.1 In `context/OrgUnitsContext.tsx`, remove `groupClaim` from the context type, value and provider props, and
  the `DEFAULT_GROUP_CLAIM` constant.
- [x] 3.2 In `app/[lang]/layout.tsx`, stop passing `groupClaim` to `OrgUnitsProvider` and stop reading
  `ORG_UNITS_GROUP_CLAIM`.
- [x] 3.3 Remove `ORG_UNITS_GROUP_CLAIM` from `.env.template` and the README environment table.
- [x] 3.4 Add a `### Removed` entry under the latest section of `docs/INFRA-CHANGELOG.md` saying the variable is no
  longer read and can be dropped from deployment values.

## 4. Specs

- [ ] 4.1 After the change is applied and synced, edit the Purpose line of
  `openspec/specs/org-units-folders-storage/spec.md` to drop "the group-claim setting" (a delta cannot change it).

## 5. Tests

- [x] 5.1 Update `utils/org-units/tests/subjects.spec.ts`: classification of each kind including a former `groups`
  assignment, `upn=a@b.com` as CLAIM, multiple targets and RAW; `buildSubject` for CLAIM with trimming and a missing
  key; `isValidClaimKey` with blank, over-length, control characters, `email`, `roles`, `sub` and `Email`.
- [x] 5.2 Update `components/FoldersStorage/tests/UnitRolesCard.spec.tsx`: option order and the absence of Group,
  two inputs for Custom claim and one for Email and Role, Add disabled until both are valid, the reserved-key error,
  the `onAdd` subject for a trimmed dotted key, inputs cleared after Add, the `key=value` chip, and the read-only case
  (chip without a remove button, no form).
- [x] 5.3 Remove `groupClaim` from the org-units mocks in `test-setup.tsx`, `OrgUnitsContext.spec.tsx`,
  `FolderInfo.spec.tsx`, `FolderList.spec.tsx` and `FileManager.spec.tsx`, and drop the group-claim case from the
  context spec.
- [x] 5.4 Check `use-unit-roles-draft.spec.ts` still passes unchanged; add a case that re-adding the same custom claim
  holder does not duplicate it only if none covers it.

## 6. Quality checks

- [ ] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the affected specs
  (`npx vitest run` from `apps/ai-dial-admin/`), then the full `npm run test`, and fix every failure.

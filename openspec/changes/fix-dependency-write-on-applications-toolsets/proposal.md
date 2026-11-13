## Why

The Add/Edit dependency modal accepts Write on `applications` and `toolsets` targets and keeps `Add`
enabled. Core rejects the combination ("No write on applications and toolsets") only at Save, with a
400 that names a row index, and the offending entry stays in the draft for the user to hunt down.
`application-resource-dependencies` says the UI validates a dependency with the same rules Core applies
at write time; this rule is missing from `validate-dependency.ts` (issue #5534).

## What Changes

- The modal's validation rejects Write access when the decoded first segment of the target path is
  `applications` or `toolsets`. The error shows under **Access**, names the type, and keeps the confirm
  button disabled.
- Write stays offered on every root. It is not hidden or disabled, and it is never unticked for the user.
- Read on `applications` and `toolsets`, and Write on `files`, `prompts`, `conversations` and `skills`,
  are unchanged.
- A new i18n key carries the message.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `application-resource-dependencies`: the requirement "Dependency validation mirrors Core" gains the
  rule that Write is not a valid right on `applications` and `toolsets` targets, plus a scenario.

## Non-goals

- Reporting a Core 400 on Save differently, or removing the rejected row from the draft. Core stays
  authoritative and errors keep going through the normal save notification.
- Hiding or auto-clearing Write when the path changes (option C in the exploration).
- Any change to path rules, link ID rules, or the `SHARE` right.

## Impact

- `apps/ai-dial-admin/src/components/Assets/Entities/Apps/ResourceDependencies/utils/validate-dependency.ts`
  and its spec.
- `ResourceDependenciesI18nKey` in `src/constants/i18n.ts` and the matching entry in `src/locales/en.ts`.
- `DependencyModal.tsx` reads `errors.access`, so it needs no change. `DependenciesGrid.tsx` also imports
  from `validate-dependency`; check that any use there stays correct.

**Open question:** the Core rule is assumed to apply per type regardless of bucket, so
`applications/{current-user}/x` is rejected too. Confirm against Core's `resource-dependencies` spec
before implementing.

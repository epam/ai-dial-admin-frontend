## Why

`Assets > Platform > Roles`' Sharing tab (`components/Assets/Platform/Roles/Sharing.tsx`) reuses
`Entities > Roles`' `SharingType` enum, `sharingDefaults`, and `getDefaultPlaceholder`/`isResetToDefaultHidden`
verbatim. Those were built for the admin-backend's `DialRoleShare` shape, whose resource-type keys are
lowercase (`application`, `tool_set`, ...). But Core's `Role.share` map is keyed by
`ResourceTypes.name()` — the Java enum's uppercase name (`APPLICATION`, `TOOL_SET`, ...) — so this
surface has been reading and writing the wrong map keys since it was introduced: every default
placeholder, reset-to-default computation, and persisted override for this grid operates on data that
was never actually there. GitHub issue #4353 ("Reset to default limits for one entity changes another
entity's Expiration time") is a symptom of this — the grid's per-row state was never grounded in real
data to begin with.

DIAL Core has also added two new shareable resource types since this surface was built
(`CREDENTIALS`, `SKILL`), and defines its own default limits (`ShareResourceLimit`) that this surface
doesn't match: Core defaults an unset field to the sentinel `-1`, and gives `TOOL_SET` the same
max-users default (`10`) as `APPLICATION` — neither of which the current UI reflects.

## What Changes

- Introduce a platform-specific resource-type source of truth (uppercase names matching
  `ResourceTypes.name()`: `APPLICATION`, `TOOL_SET`, `PROMPT`, `FILE`, `CONVERSATION`, `CREDENTIALS`,
  `SKILL`) used only by `Assets/Platform/Roles`, separate from `Entities > Roles`' lowercase
  `SharingType`.
- Add a platform-specific default-limits map matching Core's `ShareService.DEFAULT_LIMITS`: max users
  `10` for `APPLICATION`, `TOOL_SET`, `CREDENTIALS`, `SKILL`; unspecified for `CONVERSATION`, `FILE`,
  `PROMPT`; invitation TTL `72` for all seven.
- Treat Core's `-1` sentinel (its "unset" default for both `max_accepted_users` and `invitation_ttl`)
  as absent when reading a role's `share` map — shown as an empty input with the default placeholder,
  not as a literal `-1`.
- Fix `applySharingChange` to delete an individual field from a sharing-type entry when the user
  clears it, rather than writing `''`/`0` — mirroring the sibling `CostLimits.tsx`'s
  `onChangeToken` pattern (delete the key when the value is empty, only ever write a literal `0` when
  the user types it). A left-over empty string on a primitive Core field currently gets silently
  coerced to `0` on the wire.
- Add `CREDENTIALS` and `SKILL` as sharing rows, with a `Menu.Credentials` label (no i18n key exists
  yet; `Menu.Skills` already does).
- Rewrite `components/Assets/Platform/Roles/tests/utils.spec.ts`, which currently asserts the
  lowercase keys and a fixed count of 5 types — every assertion there encodes the bug being fixed.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `platform-roles`: the "Role asset Properties tab" requirement's sharing-grid behavior changes —
  resource-type keys, default values, `-1`-as-unset handling, per-field clearing, and the addition of
  two new shareable resource types.

## Impact

- `apps/ai-dial-admin/src/components/Assets/Platform/Roles/Sharing.tsx`
- `apps/ai-dial-admin/src/components/Assets/Platform/Roles/utils.ts` (`getAssetSharingData`,
  `applySharingChange`, `toCoreShareField`)
- New platform-only resource-type/defaults modules (constants + models), not shared with
  `components/Roles/types.ts` / `constants.ts` / `utils.ts` (`Entities > Roles` stays untouched — its
  admin-backend-shaped `DialRoleShare`/`SharingType`/`sharingDefaults` are correct for that surface).
- `apps/ai-dial-admin/src/constants/i18n.ts` / `locales/en.ts` — new `Menu.Credentials` key.
- `apps/ai-dial-admin/src/components/Assets/Platform/Roles/tests/utils.spec.ts` — rewritten.
- No admin-backend or API-route changes; this is a client-only correction against Core's existing
  `Role`/`ShareResourceLimit` wire shape.

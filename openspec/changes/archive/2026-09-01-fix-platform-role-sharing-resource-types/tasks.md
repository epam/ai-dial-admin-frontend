## 1. Platform-only resource-type model

- [x] 1.1 Add `apps/ai-dial-admin/src/components/Assets/Platform/Roles/models.ts` (or `types.ts`, per
      `code-standards.md`'s types/interfaces placement) with `PlatformSharingType` enum:
      `APPLICATION`, `TOOL_SET`, `PROMPT`, `FILE`, `CONVERSATION`, `CREDENTIALS`, `SKILL` — values
      matching Core's `ResourceTypes.name()` exactly (uppercase, `SKILL` singular).
- [x] 1.2 Add `platformSharingDefaults` (`Record<PlatformSharingType, ...>`) to
      `Assets/Platform/Roles/constants.ts`, matching Core's `ShareService.DEFAULT_LIMITS`: max users
      `'10'` for `APPLICATION`/`TOOL_SET`/`CREDENTIALS`/`SKILL`, `''` for `PROMPT`/`FILE`/`CONVERSATION`;
      invitation TTL `'72'` for all seven.
- [x] 1.3 Add `platformSharingTypeLabels` (`Record<PlatformSharingType, MenuI18nKey>`) to the same file,
      reusing existing `MenuI18nKey.Applications/Toolsets/Prompts/Files/Conversations/Skills`.
- [x] 1.4 Add `MenuI18nKey.Credentials = 'Menu.Credentials'` to `constants/i18n.ts` and the matching
      `Menu.Credentials: 'Credentials'` entry to `locales/en.ts`.

## 2. Fix the read/write path in `Assets/Platform/Roles/utils.ts`

- [x] 2.1 Update `getAssetSharingData` to iterate `PlatformSharingType`'s seven values instead of the
      lowercase `SharingType` import, and to treat both `invitation_ttl === -1` and
      `max_accepted_users === -1` as absent (in addition to the existing `!= null` check), so those
      rows fall through to the default placeholder.
- [x] 2.2 Update `applySharingChange` to delete the individual field from the sharing-type entry when
      the incoming value is `''`/`null`/`undefined`, rather than assigning the empty value — mirroring
      `CostLimits.tsx`'s `onChangeToken` — and to drop the whole entry once it has no fields left
      (replacing the current "every field is blank" check with an emptiness check on the entry itself).
- [x] 2.3 Remove the now-unused import of `SharingType` from `@/src/components/Roles/types` in this
      file; leave `Entities > Roles`' own `components/Roles/**` untouched.

## 3. Wire the platform Sharing component to the new model

- [x] 3.1 In `Assets/Platform/Roles/Sharing.tsx`, replace the `getDefaultPlaceholder`/
      `isResetToDefaultHidden` imports from `@/src/components/Roles/utils` with platform-local
      equivalents built against `platformSharingDefaults` (same signatures/contract
      `SHARING_COLUMNS`/`getResetOperation` already expect).
- [x] 3.2 Update `SHARING_COLUMNS`'s type-column `formatType` usage (or pass a platform-local label
      lookup) so the Type column renders via `platformSharingTypeLabels` for this surface instead of
      `Entities > Roles`' `sharingTypes` map.

## 4. Tests

- [x] 4.1 Rewrite `components/Assets/Platform/Roles/tests/utils.spec.ts` for the corrected contract:
      uppercase keys, seven types (including `CREDENTIALS`/`SKILL`), `-1`-as-unset on both fields, and
      per-field delete on clear (a cleared field disappears from the entry while a sibling field with a
      value is preserved; the whole entry is dropped only once no fields remain).
- [x] 4.2 Add/update a component test for `Sharing.tsx` covering: the Toolset row's default `10`
      max-users placeholder, the Credentials/Skills rows appearing, and a `-1`-valued stored field
      rendering as empty with its placeholder — per `.claude/rules/testing.md`'s `getByRole` query
      convention.

## 5. Quality gate

- [x] 5.1 Run `npm run lint`, `npm run format`, and the full `npm run test` suite from
      `apps/ai-dial-admin/` and fix any failures.

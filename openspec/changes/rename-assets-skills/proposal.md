## Why

`AssetsSkills` carries a redundant prefix: unlike `AssetsApplications` and `AssetsToolsets`, Skills
has no World-A config-entity counterpart (`Skills` is not taken), so the `Assets` qualifier adds
noise without disambiguating anything. The same inconsistency applies to the URL (`/assets-skills`
vs `/prompts`, `/conversations`, `/files`) and makes the route harder to discover and reference.

## What Changes

- **BREAKING** Rename `ApplicationRoute.AssetsSkills` → `ApplicationRoute.Skills` in
  `src/types/routes.ts`, and change the enum value from `'/assets-skills'` to `'/skills'`.
- Rename the app route directory `src/app/[lang]/assets-skills/` → `src/app/[lang]/skills/`
  (including the `[id]/` sub-directory).
- Update all callers of `ApplicationRoute.AssetsSkills` across source and test files.
- Update `MenuI18nKey` in `src/constants/i18n.ts` if an `AssetsSkills` key exists; rename
  it to `Skills` (or confirm `Skills` is already the correct key).
- Update all `@/src/app/[lang]/assets-skills/` import paths to `@/src/app/[lang]/skills/`.
- Rename `openspec/specs/assets-skills/` → `openspec/specs/skills/`.

## Capabilities

### New Capabilities

_None — this is a pure rename with no new behavior._

### Modified Capabilities

- `assets-skills`: rename spec directory to `skills` to match the new route; no requirement
  changes.

## Impact

- **`src/types/routes.ts`** — enum member and value.
- **`src/app/[lang]/assets-skills/`** — directory rename (page, actions, `[id]/` sub-route).
- **31 source and test files** referencing `AssetsSkills` or importing from `assets-skills/` —
  mechanical find-and-replace, no logic changes.
- **Navigation / deep links** — the public URL changes from `/assets-skills` to `/skills`;
  any bookmark or external link to the old path will break (no redirect configured).
- No API contract changes; the backend endpoint is independent of the frontend route name.

## Non-goals

- Renaming `AssetsApplications` or `AssetsToolsets` — separate decision deferred until the
  planned platform-migration of those entities.
- Adding a server-side redirect from `/assets-skills` to `/skills`.

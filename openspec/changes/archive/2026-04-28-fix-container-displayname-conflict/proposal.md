## Why

Issue #3080: when creating an entity from inside a Container (Application from Application Container, or Asset Toolset from MCP Container), the form shows a "Conflict with Display Name" error in cases where it should not — the Application Container path was firing on bare `name` collisions even when the user could disambiguate via version, and the MCP Container "Create as Asset" path had a race condition that caused validation to silently skip real duplicates because `useToolsetFolder.data` had not yet populated when `IdControl`'s mount-time check ran.

Both regressions surfaced after #3051 (`feat(application): support container source`) introduced the in-Container creation flows that reuse the standard create modals. Interceptor Container is not reproducible and out of scope.

## What Changes

- **Application Container → Create Application**: replace the `entityNames` prop source from `applications.map(a => a.name)` to `filterDisplayNamesWithVersions(applications)`, so the `displayName + displayVersion` pair feeds `getNamesConfigurations` and the existing version-disambiguation in `getDisplayNameError` works correctly. (Already applied in working tree at `app/[lang]/application-containers/[id]/page.tsx:67`; this proposal documents it.)
- **MCP Container → Create as Asset**: change `AssetsFolderContext`'s initial `data` state from `[]` to `null`, so `null` genuinely means "not fetched yet" (currently it overlaps with "fetched empty folder"). In `CreateAsset.tsx`, gate `<AssetProperties />` render on `folderContext?.data != null`, rendering `<DialLoader />` while the initial fetch is in-flight. Once data has actually arrived, `IdControl` mounts with the correct `names` list and validates the prefilled name correctly.
- **No edits** to `AssetProperties`, `DeploymentProperties`, `IdControl`, `getDisplayNameError`, `getAssetTemplate`, or any validation utility. Existing fallbacks (`folderData || []`, optional chaining inside `filterNames`) handle the `null` initial state without breakage.
- Out of scope: the underlying disjoint design where `IdControl`'s mount-time `validateName` has no `names` dependency and never re-runs when the list updates. That's a pre-existing weakness — separate cleanup ticket.

## Capabilities

_(none — this change restores intended behavior in two regressed flows; no system contracts are added or modified. Behavior details live in design.md and tasks.md.)_

## Impact

- **Code**:
  - `app/[lang]/application-containers/[id]/page.tsx` (working tree change, kept as-is)
  - `context/assets/AssetsFolderContext.tsx` — change one `useState` initial value from `[]` to `null`
  - `components/Assets/Deployments/CreateAsset.tsx` — gate `AssetProperties` render with `DialLoader` fallback while `data` is `null`
- **Cross-cutting risk** (the context state change): `AssetsFolderContext` is shared by Toolset, App, Prompt, and File folder contexts. Existing readers (`BaseAssetList`, `CreateAsset`, `FolderList`, etc.) all already handle `data` as nullable or fall back via `folderData || []` / `data || []` / optional chaining inside `filterNames`. Verified safe by inspection; needs a final grep before merge.
- **Tests**: `CreateAsset.spec.tsx` (if present) and any folder-context tests with snapshotted initial state. New tests are out of scope for this fix; behavior is verifiable via the issue's manual repro.
- **No API or schema changes.** No backend impact. No i18n changes.
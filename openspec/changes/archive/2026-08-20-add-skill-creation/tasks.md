## 1. Core API client: create endpoints

- [x] 1.1 Add `createSkill(token, path, name, description)` to `SkillsCoreApi`
      (`apps/ai-dial-admin/src/server/core/skills-core-api.ts`): builds the `SKILL.md` frontmatter
      from `name`/`description` (quoted YAML scalar for `description`, bare `name`), wraps it as a
      single-part `FormData` (mirroring `uploadSkillFile`'s construction), and sends a multipart
      `PUT` to `${CORE_SKILLS_URL}/{encodeCorePath(path)}` with no `If-Match` header (create-only).
- [x] 1.2 Add `createSkillFolder(token, path)` to `SkillsCoreApi`: `PUT` with no body to
      `${CORE_SKILLS_URL}/{encodeCorePath(path)}/` (trailing slash), matching `deleteSkillFolder`'s
      existing route construction.
- [x] 1.3 Unit tests for both new methods in
      `apps/ai-dial-admin/src/server/core/tests/skills-core-api.spec.ts`: request URL, method,
      absence of `If-Match` on `createSkill`, and the generated `SKILL.md` part's content for both a
      plain description and one containing a double quote/newline.

## 2. Server actions

- [x] 2.1 Add `createSkill(name: string, description: string, folderId: string)` to
      `apps/ai-dial-admin/src/app/[lang]/assets-skills/actions.ts`, following the existing
      `getUserToken` + delegate-to-client-method shape used by `getSkill`/`removeSkill`, calling the
      new `skillsCoreApi.createSkill`.
- [x] 2.2 Add `createSkillFolder(folderPath: string)` to the same file, calling
      `skillsCoreApi.createSkillFolder`.
- [x] 2.3 Unit tests in `apps/ai-dial-admin/src/app/[lang]/assets-skills/actions.spec.ts` for both new
      actions (success and failure `ServerActionResponse` shapes).

## 3. Toolbar: Create button with Folder and Skill options

- [x] 3.1 In `apps/ai-dial-admin/src/components/Assets/utils.ts`, add an `AssetsSkills` case to
      `getToolbarOptionLabels` returning `[...baseToolbarOptionLabels, { key: 'newItem', label:
      FileManagerI18nKey.Skill, icon: null }]` (add a `Skill` key to `FileManagerI18nKey`/`en.ts` if
      one doesn't already exist for this exact label). `FileManagerI18nKey.Skill`/`en.ts` entry
      already existed from the prior change, so no i18n addition was needed.
- [x] 3.2 Verify `getBulkActionsToolbarOptions`/`getGridActionLabels` need no change for this task
      group (they already scope Skills to delete-only, which stays true).

## 4. Folder creation wiring

- [x] 4.1 In `BaseAssetList.tsx`'s `handleCreateFolder`, add a branch for
      `view === ApplicationRoute.AssetsSkills` that calls the new `createSkillFolder` action directly
      with the folder path, instead of going through `getEmptyAsset`/`CreateAssetActionMap` — keep
      the existing generic branch for the other types unchanged.
- [x] 4.2 Confirmed: `FileManager.tsx`'s own `handleCreateFolder` (the `fetchFiles`/`setFilePath`/
      `expandedFolders` handling) branches on nothing type-specific — it only inspects the
      `ServerActionResponse` shape `BaseAssetList`'s `handleCreateFolder` returns, so the new Skill
      branch is picked up for free. Its `res.response.importResults` read is already a
      best-effort, possibly-`undefined` lookup for every other type too (their create responses
      don't carry `importResults` either) — no new risk introduced.

## 5. Skill creation modal

- [x] 5.1 Create `SkillCreateProperties` under `apps/ai-dial-admin/src/components/Assets/Skills/`:
      a `Name` field (required, `/^[a-z0-9-]+$/`, duplicate-checked against the `names` prop) and a
      `Description` field (required; wraps `DescriptionControl` or an equivalent, dispatching its own
      required-field validity since the generic control is optional-by-default). Both dispatch
      validity via `useSaveValidationContext`, matching `AssetProperties`/`AppRunnerCreateProperties`.
      Validates directly via `getErrorForName`'s `isDeploymentId` branch rather than through
      `IdControl`, since that control's duplicate-message wording is keyed off its `label` prop
      equalling "ID".
- [x] 5.2 Add a name-validation error message and placeholder to `EntityFieldsI18nKey`/
      `EntityPlaceholdersI18nKey`/`ErrorI18nKey` (or reuse existing `ContainerId`/`ForbiddenChars`
      keys if their copy fits) plus `en.ts` entries. Reused `ContainerId` (charset message) and
      `EntityFieldsI18nKey.name`/`EntityPlaceholdersI18nKey.Name` (already existed); added one new
      key, `ErrorI18nKey.SkillNameExists`, since neither existing duplicate-name message ("This ID
      already exists" / "This Display name already exists") fit a field labeled "Name".
- [x] 5.3 Wire `SkillCreateProperties` into `Properties.tsx`'s dispatch, before the `isAssetView`
      branch, mirroring the existing `ApplicationRoute.AssetsAppRunners` early-return.
- [x] 5.4 In `BaseAssetList.tsx`'s `handleCreateAsset`, add a branch for
      `view === ApplicationRoute.AssetsSkills` that calls the new `createSkill` action with
      `name`/`description`/`folderId` from the submitted entity, instead of
      `CreateAssetActionMap[view]` — keep the existing generic branch unchanged.
- [x] 5.5 Fix `CreateEntity.onCreate`'s post-create `newEntity` construction (design D5): for routes
      with no version concept (Skill), include `path: `${folderId}${name}`` alongside the existing
      `folderId`/`name`/`version`/`$id` fields so `getEntityPath`'s shared branch resolves the real
      path instead of falling back to a `__undefined` version suffix. Verify this doesn't change
      behavior for any route that already supplies a real `version`. Scoped the `path` addition to
      `route === ApplicationRoute.AssetsSkills` specifically (not "no version" generically) after
      finding `AssetsModels`/`AssetsAppRunners` — also version-less — already prefer an explicit
      `path` in `getEntityPath`'s own branch, so a generic condition would have changed their
      already-working behavior.
- [x] 5.6 Unit/component tests: `SkillCreateProperties` validation (name charset, duplicate name,
      required description, submit disabled/enabled states) and `BaseAssetList`'s new
      Skill-create/folder-create branches (existing test patterns in
      `apps/ai-dial-admin/src/components/Assets/Skills/tests/` and `BaseAssetList`'s own test
      suite).

## 6. Final checks

- [x] 6.1 Ran `npm run lint` (0 errors), `prettier --write` on every touched file, and the full
      `npm run test` suite from `apps/ai-dial-admin/`. Found and fixed one genuine regression: the
      pre-existing `Assets/Skills/tests/List.spec.tsx` asserted the old "no create" toolbar behavior
      this change reverses — updated to assert `Create > Folder` + `Create > Skill` instead. The
      full-suite run's other failures (different files across two consecutive runs: `Runs/Compare/
      ExecutionResults`, `Adapter`, `ApplicationRunners`, `Containers`, `TestSuites/Metrics`,
      `Analytics/Queries` — none touched by this change) all passed cleanly when re-run in isolation,
      confirming pre-existing flakiness under full-suite parallel load rather than a regression.

## 7. Post-implementation fixes (reported after using the feature)

- [x] 7.1 **Create modal title and success notification showed no entity label.** `createEntityMap`
      (`utils/entities/create-entity.ts`) had no `AssetsSkills` entry, so `getCreateEntityTitle`
      (the modal header) and `getCreateNotificationTitle`/`getCreateNotificationDescription` (the
      post-create toast) all resolved an `undefined` entity label. Added
      `CreateI18nKey.Skill`/`en.ts` text and the missing map entry.
- [x] 7.2 **Delete modal (`DeleteAssetsModal`) showed no title or description for Skills.**
      `getDeleteModalTitle`/`getDeleteModalDescription` (`Assets/Modals/utils.tsx`) — a separate map
      from the one `EntityView/Modals/Delete/utils.ts` already covers for Skills — had no
      `AssetsSkills` case in either switch. Added both, reusing the existing `FileManagerI18nKey.Skill`/
      `.Skills` copy already used elsewhere (e.g. the delete success notification), including the
      folder-aware description variant since Skills supports recursive folder delete.
- [x] 7.3 **Description had no visible required indicator.** `DescriptionControl` gained an optional
      `required` prop (default unset, so every other consumer is unaffected), passed through to its
      `labelProps` exactly like `DisplayNameControl` already does; `SkillCreateProperties` now passes
      `required`.
- [x] 7.4 **New folder wasn't created — double trailing slash in the request path.**
      `BaseAssetList.handleCreateFolder`'s Skill branch passed `newPath` (already carrying the single
      trailing slash every other type's folder-marker path uses) straight into `createSkillFolder`,
      whose Core API method appends its own trailing slash to build the grouping-folder route —
      producing `.../New%20folder%201//`, which Core doesn't resolve. Fixed by stripping the trailing
      slash before calling the action, matching `createSkillFolder`'s (and `deleteSkillFolder`'s)
      established no-trailing-slash-in, one-appended-out convention.
- [x] 7.5 Tests for all four fixes: `create-entity.spec.ts` (new file, `AssetsSkills` label
      resolution), `Assets/Modals/tests/utils.spec.tsx` (new `AssetsSkills` cases), `BaseControls/
      tests/Description.spec.tsx` (new file, required marker present/absent), and updated
      `Skills/tests/CreateProperties.spec.tsx` / `BaseAssetList/tests/skill-create.spec.tsx` for the
      required-marker query change and the corrected no-trailing-slash path assertion. `npm run lint`
      clean; all touched/new test files pass (39/39).
- [x] 7.6 **A skill created inside a nested folder was named `<folder><name>` with no separator.**
      `createSkill`'s `path = `${folderId}${name}`` assumed `folderId` always ends with a slash — true
      for the root default (`public/`) but not for a folder's own path once navigated into (no
      trailing slash), producing e.g. `New folder 1new-skill` instead of `New folder 1/new-skill`.
      Fixed using the existing `addTrailingSlash` util (`utils/url.ts`) rather than a new regex, in
      the `createSkill` server action. Added a test for a `folderId` with no trailing slash
      (`actions.spec.ts`) alongside the existing trailing-slash case.
- [x] 7.7 **Redirect to the newly created skill 404'd when created inside a nested folder — same
      missing-separator bug, in a second spot.** `CreateEntity.onCreate`'s own post-create `path`
      computation (design D5's fix) had the identical unguarded `${entity.folderId || ''}${entity.name
      || ''}` concatenation, so navigating into a skill created inside a folder hit
      `.../metadata/skills/public/New%20folder%201folder-s2/files` — the folder and skill name fused
      into one nonexistent resource. Fixed the same way as 7.6, with `addTrailingSlash`. Added a
      `CreateEntity.spec.tsx` test that mounts with a fake folder context whose `filePath` has no
      trailing slash and asserts the navigation target contains the correctly separated, encoded path.
- [x] 7.8 **A skill's file listing showed the full internal path instead of the bare file name
      (e.g. `SKILL.md` shown/previewed as `skills/public/New folder 1/folder-s1/files/SKILL.md`), only
      for a skill inside a folder needing encoding.** `getSkillFiles`'s prefix-stripping compared Core's
      encoded listing `url` (segment-by-segment percent-encoded, e.g. `%20` for a space) against a
      `prefix` built from the raw, undecoded `path` argument — for any path with an encodable
      character, the string comparison silently failed to match, so nothing was stripped and the whole
      url got decoded and shown as the "name" instead of just the relative file name. Fixed by building
      the prefix from `encodeCorePath(path)`, matching the listing's own encoding, mirroring the
      strip-while-encoded-then-decode order every other path helper in `publications/path.ts` already
      uses. Preview/download were consequently broken too, since both build their request from this
      same `file.name`. Added a regression test with an encodable (space-containing) path.
- [x] 7.9 **Delete-modal folder navigation didn't work for Skills, unlike Prompts/Toolsets/
      Applications.** Root-caused to `toSkillResourceInfo` (`skill-metadata.ts`): `parsePath` (behind
      `parseEncodedFolderPath`) unconditionally strips a trailing slash — correct for a skill *item*,
      whose marker is stored as a folder-shaped resource and so carries one despite being classified
      `ITEM`, but wrong for a genuine grouping *folder*. Every other asset type's folder rows keep
      their trailing slash (`parseEncodedVersionedPath` never strips it), and the generic delete-modal
      tree-navigation machinery (`DeleteAssetsModal`'s `pathMapping` → `fetchFiles` → `mergeFiles`,
      shared unmodified across all asset types) depends on that convention to match a folder's own row
      path against the path used to fetch and merge its children — Skills was the only type silently
      violating it. Fixed by re-adding the trailing slash specifically for `FOLDER` rows in
      `toSkillResourceInfo`, leaving item rows unaffected.

      This surfaced a second-order issue: `removeSkillFolderCore`'s nested-folder walk
      (`walkSkillFolder`) collects folder paths straight from `toSkillList`, so those paths now also
      carry a trailing slash — passed on to `createSkillFolder`/`deleteSkillFolder` (both of which
      build their route by appending their own trailing slash), this would have reintroduced the `//`
      bug from 7.4/7.6, just for folder *delete* this time. Fixed at the root by normalizing (stripping
      any trailing slash via the existing `removeTrailingSlash` util) inside both Core API methods
      themselves, rather than chasing every call site's convention individually — the same whack-a-mole
      pattern behind 7.4, 7.6, 7.7, and 7.8 all being separate instances of "does this path already end
      in a slash or not" ambiguity. Updated `skill-metadata.spec.ts` (new folder-vs-item trailing-slash
      cases) and `folders-core.spec.ts` (nested folder path now asserted with its trailing slash).
- [x] 7.10 Removed `SKILL.md`'s YAML-quoting/escaping logic (`toYamlQuotedScalar`) per explicit user
      request — `description` is now written as a bare YAML scalar, same as `name`. Design D4 updated
      to record this; `buildSkillManifest` and its tests in `skills-core-api.spec.ts` reverted to plain
      interpolation.

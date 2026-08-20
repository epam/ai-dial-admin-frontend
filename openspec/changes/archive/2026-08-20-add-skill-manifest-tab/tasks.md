## 1. Frontmatter parse/build util

- [x] 1.1 Add `apps/ai-dial-admin/src/utils/skill-manifest.ts` with `parseSkillManifest(content: string):
      { name: string; description: string; body: string }` (built on `gray-matter`'s `matter()`) and
      `buildSkillManifest({ name, description, body }: SkillManifestParts): string` (built on
      `matter.stringify()`), matching Core's `---`-delimited frontmatter format.
- [x] 1.2 Add unit tests for both functions: round-trip parse→build preserves an untouched `version`
      key; parse handles a body containing further `---` lines without misidentifying the frontmatter
      boundary; build produces a document Core's frontmatter regex/YAML parser would accept.

## 2. Skill Core API — read SKILL.md content

- [x] 2.1 Add `getSkillManifestContent(bucket, path)` to `apps/ai-dial-admin/src/server/core/skills-core-api.ts`
      calling `GET /v2/skills/{bucket}/{path}/files/SKILL.md`, returning raw text, and reporting a
      not-found result (not an unhandled throw) when the skill or its manifest doesn't resolve.
- [x] 2.2 Add a server action wrapping it (`assets-skills/actions.ts`, and the Publications equivalent),
      following the existing `{ success, data?, errorHeader?, errorMessage? }` return shape.
- [x] 2.3 Add unit tests for the new API method and server action(s), covering the not-found case.

## 3. Skill tab — shared UI

- [x] 3.1 Add `EntityViewTab.Skill` to `apps/ai-dial-admin/src/utils/tabs/utils.ts`, add it to the Skill
      branch of `getTabsForAsset` (after `propertiesTab`) and to `getSkillPublicationTabs` (after
      `propertiesTab`, before `permissionsTab`).
- [x] 3.2 Build the Skill tab body component (shared between Assets and Publications, alongside the
      existing shared `SkillDetails`): disabled `DialInput` for `Name`, `DescriptionControl` for
      `Description`, `MdEditor` (`readOnly={false}`) for the body — each wired to props rather than
      local state, so both call sites can bind their own staged state.
- [x] 3.3 Add component tests for the shared tab body: name renders disabled with the parsed value,
      description input is editable and calls its change handler, markdown editor shows the body and
      calls its change handler.

## 4. Assets > Skills detail view wiring

- [x] 4.1 In `apps/ai-dial-admin/src/components/Assets/Skills/View/View.tsx`, fetch the manifest content
      on first Skill-tab activation, parse it, and extend the existing staged-state shape with staged
      `description`/`body` (undefined until fetched), extending the dirty-check that shows Save/Discard.
- [x] 4.2 Wire Save to reassemble `{ name, description, body }` into `SKILL.md` via
      `buildSkillManifest` and write it through the existing per-file upload action, alongside any other
      staged file/folder changes; wire Discard to reset staged `description`/`body` to the last-fetched
      values.
- [x] 4.3 Surface a save failure (Core rejects invalid frontmatter) as an error notification, leaving the
      staged Skill-tab state intact.
- [x] 4.4 In the shared `apps/ai-dial-admin/src/components/Publications/Assets/Skill/SkillDetails.tsx`,
      filter `SKILL.md` out of `rowData`, remove the now-dead `SKILL_MANIFEST_FILE` case from
      `isRemoveActionHidden`, and remove the `name`/`description`/`version` `LabelledText`s.
- [x] 4.5 Add/update component tests: `SkillView`/`SkillAssetProperties` cover the new tab's Save/Discard
      wiring; `SkillDetails` tests cover `SKILL.md` absent from the grid and the removed `LabelledText`s.

## 5. Skill Publications properties view wiring

- [x] 5.1 In `apps/ai-dial-admin/src/components/Publications/Properties/SkillProperties.tsx`, fetch and
      parse the manifest on first Skill-tab activation, extend the publication's staged-files state with
      staged `description`/`body`, following the same dirty-check pattern as task 4.1.
- [x] 5.2 Wire the publication's existing save action to also write the reassembled `SKILL.md` when the
      Skill tab's fields are dirty, alongside other staged file changes; wire discard to reset them.
- [x] 5.3 Surface a save failure the same way as task 4.3.
- [x] 5.4 Add/update component tests for `SkillProperties` covering the new tab's staging/save/discard
      and the removed metadata `LabelledText`s (shared with task 4.5's `SkillDetails` coverage).

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, and the full `npm run test` suite from
      `apps/ai-dial-admin/`, and fix any failures.

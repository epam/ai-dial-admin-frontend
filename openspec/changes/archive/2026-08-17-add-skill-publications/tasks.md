Note: browser-observable scenarios in this change (menu order/navigation, list filtering, properties/
file-list rendering) were offered a dedicated `spec-browser-verify` task; the user declined it, so
verification here relies on unit/component tests only.

## 1. Resource-type foundations

- [x] 1.1 Add `SKILL = 'SKILL'` to `src/types/resource-type.ts`'s `ResourceType` enum.
- [x] 1.2 Add `SKILL = 'SKILL'` to `CoreResourceType` in `src/server/publications/models.ts`.
- [x] 1.3 Add a `SKILLS_PREFIX` constant to `src/constants/publications-core.ts` alongside the
      existing `*_PREFIX` constants, and add `[ResourceType.SKILL]: SKILLS_PREFIX` to
      `RESOURCE_TYPE_PREFIX`.
- [x] 1.4 Extend the existing `publications-core.ts` prefix-map test to cover the new `SKILLS_PREFIX`
      entry, rather than adding a duplicate test file. (No such test file existed; created
      `constants/tests/publications-core.spec.ts`.)

## 2. Models

- [x] 2.1 Add `PublicationSkill extends PublicationEntity { skillResource: DialSkillResource }` and
      `SkillPublication extends Publication { skillResources?: PublicationSkill[] }` to
      `src/models/dial/publications.ts`, mirroring `PublicationToolset`/`ToolsetPublication`.
- [x] 2.2 Add a `DialSkillResource` model (new `src/models/dial/resource.ts` addition or adjacent
      file, matching where `DialToolsetResource` lives) with `name`, `description`, `version`,
      `etag`, `path`, and `files: { name: string; size: number }[]`.

## 3. Publication resolver wiring

- [x] 3.1 Add `'skillResources'` to `PublicationResourceKey` and `'skillResource'` to
      `PublicationAssetKey` in `src/server/publications/resolver/types.ts`.
- [x] 3.2 Add a `[ResourceType.SKILL]` entry to `PUBLICATION_TYPE_REGISTRY` in
      `src/server/publications/resolver/registry.ts` (`prefix: SKILLS_PREFIX`,
      `resourceKey: 'skillResources'`, `assetKey: 'skillResource'`, `hasFiles: false`,
      `notFoundMessage`/`alreadyExistsMessage` matching the Toolset entry's phrasing for "Skill").
- [x] 3.3 Add `getSkillMetadata` to the `EnrichmentClients` interface in
      `src/server/publications/resolver/types.ts` (`(token, path) => Promise<SkillFolderMetadata | null>`),
      matching `getFileMetadata`'s shape.
- [x] 3.4 Create `src/server/publications/resolver/skill-resource.ts` with `enrichSkillResource`,
      mirroring `file-resource.ts`'s `enrichFileResource` (already-exists check on PENDING/non-DELETE,
      not-found issue on missing metadata, mapping the Core folder-metadata response into
      `PublicationSkill`).
- [x] 3.5 Wire the `ResourceType.SKILL` branch into `resolvePublication`'s per-resource loop in
      `resolve.ts` (alongside the existing `ResourceType.FILE` branch), calling
      `enrichSkillResource` instead of `enrichAssetResource`. (Extracted a small
      `enrichPrimaryResource` dispatcher to avoid a nested ternary across three branches.)
- [x] 3.6 Add `[CoreResourceType.SKILL]: ResourceType.SKILL` (and the inverse) to
      `CORE_RESOURCE_TYPE_TO_RESOURCE_TYPE` / `RESOURCE_TYPE_TO_CORE_RESOURCE_TYPE` in
      `src/server/publications/mappers.ts`, and append `CoreResourceType.SKILL` to the end of
      `RESOLUTION_ORDER`.
- [x] 3.7 Add a `skillResources` branch to the primary-type detection chain and the
      `UpdatablePublication` type union in `src/server/publications/update.ts`. Also (discovered
      during implementation): guarded `buildUpdatePlan`'s per-resource asset-PUT so `SKILL` recalculates
      its target URL like every non-FILE type but is never queued for `updateAsset` — Skill has no
      writable JSON body, and its real write path is Core's `/v2/skills` multipart API, not
      `/v1/{type}/...`. Queuing it would have made saving a Skill publication's folder/comment fail.
- [x] 3.8 Implement `getSkillMetadata` in the concrete `EnrichmentClients` wiring
      (`src/app/api/api.ts` / wherever `getFileMetadata` is implemented) calling
      `GET /v2/metadata/skills/{bucket}/{path}/` via the shared Core HTTP client, mapping the
      response into the shape `enrichSkillResource` expects. (New `SkillsCoreApi` in
      `src/server/core/skills-core-api.ts`, mirroring `FilesCoreApi`.)
- [x] 3.9 Unit test `enrichSkillResource` (found resource, not-found issue, already-exists issue on
      PENDING/non-DELETE) with a mocked `getSkillMetadata`, following the existing
      `file-resource.spec.ts` test structure. (No such file existed; new
      `resolver/tests/skill-resource.spec.ts`, styled after `url-resolver.spec.ts`.)
- [x] 3.10 Unit test the `mappers.ts` and `update.ts` additions (resolution order includes SKILL,
      primary-type detection recognizes `skillResources`). New `tests/mappers.spec.ts` and
      `tests/update.spec.ts` (neither existed before).

## 4. Server API

- [x] 4.1 Add `getPublicationSkillList(token)` to `CorePublicationsApi`
      (`src/server/entities/core-publications-api.ts`), calling `listByType(ResourceType.SKILL, token)`.
- [x] 4.2 Unit test `getPublicationSkillList` alongside the existing per-type list method tests in
      that file's test suite.

## 5. Routing

- [x] 5.1 Add `SkillPublications = '/skill-publications'` to `ApplicationRoute` in
      `src/types/routes.ts`.
- [x] 5.2 Create `src/app/[lang]/skill-publications/page.tsx`, cloning
      `toolset-publications/page.tsx`'s structure but calling `publicationsApi.getPublicationSkillList`
      and rendering `PublicationsList` with the Skill route. (Cloned File Publications' page instead —
      re-reading both templates showed the extra fetch mentioned below belongs to neither; File's page
      is the closer match since it has no toolset-auth `oAuthCode` handling either.)
- [x] 5.3 Create `src/app/[lang]/skill-publications/[id]/page.tsx`, cloning
      `toolset-publications/[id]/page.tsx`'s structure (calling `publicationsApi.getPublication` and
      rendering `PublicationView` with `view: ApplicationRoute.SkillPublications`), omitting the
      Toolset page's extra `applicationRunnersApi.getApplicationSchemesList` fetch (not applicable
      to Skill). (Correction: that extra fetch belongs to Application's `[id]/page.tsx`, not
      Toolset's — Toolset's only extra is `oAuthCode`, also not applicable to Skill. Cloned File's
      `[id]/page.tsx` instead, which has neither.) Also added the missed
      `[ApplicationRoute.SkillPublications]: UpdateI18nKey.Publication` entry to
      `utils/entities/update-entity.ts`'s `createEntityMap` — required for the generic save flow's
      notification title/description, and not called out in the proposal's Impact list.

## 6. Components

- [x] 6.1 Create `src/components/Publications/Assets/Skill/SkillDetails.tsx`: renders the skill's
      name/description/version (read-only) and a read-only file-list grid of
      `publication.skillResources?.[0].skillResource.files`, following `FilesDetails.tsx`'s
      structure but without the add-file button/input or `onRemoveAdded` wiring. (Built directly on
      `GridView` with a plain 2-column def rather than cloning `FilesList` — the spec requires no
      download action either, and `FilesList`'s actions assume real Core file-resource paths that
      skill-bundle files don't have.)
- [x] 6.2 Create `src/components/Publications/Properties/SkillProperties.tsx`, composing
      `BaseProperties` (with a `useSkillFolder`-equivalent context — reuse the existing generic
      folder context used by File if a dedicated Skill folder context doesn't already exist; if the
      publication has no folder-tree navigation need for Skill, use the same context File
      Publications use) and `SkillDetails`, following `FileProperties.tsx`'s shape. Reuses
      `useFileFolder`/`FileFolderProvider` directly, documented inline as a known simplification.
- [x] 6.3 Wire the `ApplicationRoute.SkillPublications` case into the Properties-tab dispatch in
      `src/components/Publications/View/TabsContent.tsx`, rendering `SkillProperties`.
- [x] 6.4 Confirm (per design.md's Non-Goals) that `View.tsx`'s Toolset-only auth-button memo and
      `InfoHeader.tsx`'s Toolset-only auth header branch need no Skill arm; leave both unchanged.
      Confirmed — no edit needed.

## 7. Tabs, menu, i18n, breadcrumbs, docs

- [x] 7.1 Add a `getSkillPublicationTabs(t)` function in `src/utils/tabs/utils.ts` (Properties tab
      only, matching what File Publications shows) and wire it into `getPublicationViewTabs`'s
      switch for `ApplicationRoute.SkillPublications`. (Included `permissionsTab` too — every other
      publication type has it, `PublicationPermissions` is fully generic, and rules-editing isn't
      part of the "no skill content editing" non-goal, so omitting it would be an arbitrary gap.)
- [x] 7.2 Add `MenuI18nKey.SkillPublications` to `src/constants/i18n.ts`, and a `Menu.SkillPublications`
      label in `src/locales/en.ts`.
- [x] 7.3 Add a Skill block to `PublicationsI18nKey` in `src/constants/i18n.ts` (approve/decline
      modal title/body/confirm keys, matching Toolset's six-key block) and the corresponding
      `Publications.Skill { ... }` block in `src/locales/en.ts`.
- [x] 7.4 Add the `{ key: MenuI18nKey.SkillPublications, href: ApplicationRoute.SkillPublications }`
      entry to the Approvals group's `items` array in `src/components/Menu/menu-configuration.tsx`,
      positioned last (after File Publications) — the resulting order matches Application, Toolset,
      Prompt, Conversation, File, Skill. (Also reordered the existing File/Conversation entries per
      the confirmed target order — today's order had File before Conversation.)
- [x] 7.5 Add a Skill branch to `getModalsTranslations` in `src/utils/publications.ts`, returning the
      new i18n keys for approve/decline modal copy.
- [x] 7.6 Add `ApplicationRoute.SkillPublications` entries to `listViewTitleMap`/`emptyDataTitleMap`
      in `src/components/ListView/constants.ts`.
- [x] 7.7 Add an `ApplicationRoute.SkillPublications` entry to `breadcrumbConfig` in
      `src/components/Breadcrumbs/constants.ts`, matching the Toolset/Application entries' shape.
- [x] 7.8 Add `ApplicationRoute.SkillPublications` to the publication-routes case group in
      `src/utils/open-in-new-tab.ts`'s URN-builder switch.
- [x] 7.9 Add a `SkillPublications` entry to `HELP_DOCUMENTATION_LINKS` in
      `src/constants/help-documentation-links.ts`, matching the Toolset entry's key shape.

## 8. Component tests

- [x] 8.1 Add a component test for `SkillDetails.tsx` (renders metadata fields, renders the file
      list, shows no add/remove/download actions).
- [x] 8.2 Add a component test for `SkillProperties.tsx` (renders `BaseProperties` + `SkillDetails`
      together).
- [x] 8.3 Add/extend a `TabsContent.tsx` test case covering the `ApplicationRoute.SkillPublications`
      branch rendering `SkillProperties`.
- [x] 8.4 Add/extend a `menu-configuration.tsx` test (or the menu-order test it's currently covered
      by, if one exists) asserting the Approvals items appear in the order Application, Toolset,
      Prompt, Conversation, File, Skill.

## 9. Quality gate

- [x] 9.1 Run `npm run lint`, `npm run format`, and `npm run test` (full coverage run) from the repo
      root and fix any failures introduced by this change. `eslint` on all touched/new files: 0
      errors. `prettier --write` on all touched/new files: only pre-existing/expected reflows, no
      logic changes. Full `vitest run --coverage`: 798/799 test files, 8502 passed / 4 skipped, 0
      failed (an initial run showed 22 failures across 9 unrelated files — AG Grid `waitFor` timing
      flakiness in e.g. `ExecutionResultsTab.spec.tsx` — that did not reproduce on a clean rerun and
      touch none of this change's files). Coverage gate passed (no threshold violations).

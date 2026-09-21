## 1. Type-level group split

- [x] 1.1 Remove `version`, `versions`, and `selectedVersions` from `DialPrompt` (`src/models/dial/prompt.ts`) and `version` from `DialConversation` (`src/models/dial/conversation.ts`); adjust `models/dial/publications.ts` (`PublicationPrompt`/`PublicationConversation`) accordingly
- [x] 1.2 Remove `ResourceType.PROMPT` and `ResourceType.CONVERSATION` from `VersionedResourceType` and `VERSIONED_RESOURCE_TYPES` in `src/constants/assets-core.ts`, updating the doc comment
- [x] 1.3 Narrow `AssetWithVersion` in `src/models/dial/deployment-asset.ts` to deployment assets (apps/toolsets) only, and resolve every type error the compiler surfaces in shared components by routing prompts/conversations through versionless branches (per design D4) — this task deliberately comes first so `npm run typecheck` enumerates the affected sites

## 2. Server pipeline

- [x] 2.1 `src/server/core/asset-api.ts`: `parsePathFields` stops splitting `__` for the versionless group (driven by `isVersioned`); put responses omit `version` for prompts/conversations; keep the prompt `withContentId` id recomputation, ensuring it never reintroduces a version
- [x] 2.2 `src/server/core/asset-metadata.ts`: `mergePrompt`/`mergeConversation` stop grafting `version` from the metadata URL; `metadataFields` stops the `__` split for the versionless group
- [x] 2.3 `src/app/[lang]/prompts/actions.ts`: `getPrompt` becomes path-based (`getPrompt(path, etag)`, mirroring `getConversation`), dropping `getAssetByNameVersion` usage for prompts (the helper stays for apps/toolsets)
- [x] 2.4 `src/server/assets/move.ts`: for the versionless group the destination name is `duplicateName` verbatim — no `extractVersionByPath` suffix graft (apps/toolsets/files keep current behavior)
- [x] 2.5 `src/server/prompts/exim.ts`: `PROMPT_ID_REGEX` becomes the versionless shape (`__` neither required nor forbidden in the name segment); `src/server/assets/import-destination.ts` + `src/server/assets/exim.ts` resolve prompt destinations without a version
- [x] 2.6 `src/server/publications/path.ts`, `resolver/registry.ts`, `resolver/resolve.ts`: prompt/conversation URLs parse via the folder-path shape (name = last segment, no `__` split) and enrich without a version
- [x] 2.7 `src/server/publications/update.ts`: target recalculation builds plain names for prompt/conversation resources; `src/app/api/api.ts` keeps PROMPT/CONVERSATION **out** of `RESOURCE_TYPES_STRIPPED_BEFORE_PUT` — their Core DTOs require `folderId` on the body (reproduced 400 when stripped), and the no-`version` guarantee is met by the models no longer carrying it (design D8 corrected accordingly)

## 3. Prompts feature (client)

- [x] 3.1 `src/app/[lang]/prompts/[id]/page.tsx`: fetch by path directly; remove the sibling-by-name listing that fed the version dropdown
- [x] 3.2 `src/components/Assets/Prompts/View/View.tsx`: remove `addNewVersion`/save-as-new-version, `CompareVersions` usage, and version state; move/export/delete flows use plain paths (`getListOfPathsToMove` stops matching by name)
- [x] 3.3 `src/components/Assets/Prompts/View/Properties.tsx`: remove the `VersionControl` shown in publication mode
- [x] 3.4 Create flow — `src/components/EntityListView/CreateEntity/CreateEntity.tsx` and `src/components/EntityMainProperties/Properties/AssetProperties.tsx`: prompts take the versionless branch (no `DEFAULT_NEW_ENTITY_VERSION` seed, no version validation), mirroring the platform-bucket `hideVersionField` carve-out
- [x] 3.5 `src/components/EntityListView/Import/utils.ts`: prompts stop parsing/editing/rewriting `name__version` in the import grid (`isErrorPromptNode`, `isInvalidJson`, `changeFilesMap` prompt branch); the editable Version column is dropped for prompts
- [x] 3.6 `src/components/EntityListView/HeaderButtons/utils.ts`: `getAssetIdByNameAndVersion` stops `__` join/split for prompts; `src/utils/open-in-new-tab.ts` `getEntityPath` stops appending `__${version}` for prompts/conversations
- [x] 3.7 `src/components/Publications/Assets/Prompt/{PromptsList.tsx,PromptDetails.tsx}`: remove version editing and the `updatePathWithNameAndVersion` path rebuild

## 4. Conversations feature (client)

- [x] 4.1 `src/components/Assets/Conversations/View/{View.tsx,utils.ts,Properties.tsx}` and `src/components/EntityHeaderControls/Wrappers/ConversationButtonsWrapper.tsx`: remove version state, the version dropdown, the version label row, and delete `getConversationPathWithVersion`/`getConversationVersions`
- [x] 4.2 `src/components/Assets/BaseAssetList/utils.tsx`: delete `enrichConversationWithVersion` and its call sites (`BaseAssetList.tsx`, `Assets/Modals/utils.tsx`)

## 5. Shared grid pipeline and UX

- [x] 5.1 `src/components/Assets/BaseAssetList/{BaseAssetList.tsx,utils.tsx}`: for the versionless route group — no Version column, no `getVersionsPerName` merging (each stored resource is its own row), selection state and expansion keyed by plain path, and export/delete/duplicate path building from the row's plain path
- [x] 5.2 `src/components/Assets/Deployments/DuplicateAsset.tsx`: prompts/conversations get new-entity duplication only — no "New Version" radio, no `VersionControl`, no `getInitialVersion`; name seeded by `getClonedEntityName`
- [x] 5.3 `src/components/Assets/Deployments/AssetVersionControl.tsx`, `src/components/EntityHeaderControls/Buttons/AssetChangedEntityButtons.tsx`, and `src/components/Assets/Modals/AddVersionModal.tsx`: version header/controls are not rendered for prompts/conversations (components stay for apps/toolsets)
- [x] 5.4 `src/components/Assets/Modals/{DeleteAssetsModal.tsx,utils.tsx}` and `src/components/EntityView/Modals/Delete/Delete.tsx`: version tags, the "All versions" option, and version-split etag matching are removed for prompts/conversations (stay for apps/toolsets)
- [x] 5.5 Delete prompt/conversation-only version code outright: `src/components/Assets/Modals/CompareVersions.tsx` (+ its spec), `src/utils/validation/version-error.ts` (+ its spec — already production-dead)
- [x] 5.6 `src/components/Assets/utils.ts`: delete/move notification toasts stop rendering `__${version}` for prompts/conversations (apps/toolsets unchanged); remove i18n keys left unused by both groups
- [x] 5.7 `src/utils/entities/versions.ts` and `src/utils/files/path.ts`: keep all helpers for the versioned group; remove prompt/conversation callers only

## 6. Tests

- [x] 6.1 Update prompt/conversation fixtures to versionless shapes: `src/app/[lang]/prompts/actions.spec.ts` (create writes plain `public/test`, move-duplicate uses the name verbatim, import doc ids without required suffix), `src/app/api/tests/publications-enrichment.spec.ts` (prompt/conversation assertions flip from "keeps `version`" to "strips `version`"; application assertions unchanged), `src/server/assets/tests/*`, `src/server/prompts/tests/*`, `src/server/publications/tests/*`
- [x] 6.2 Update component specs: `BaseAssetList` specs (no version column/merging for the versionless group), `EntityListView/Import` specs, conversations view specs, modals specs (`DuplicateAsset`, `DeleteAssetsModal`, `Delete`), `utils/entities/tests/versions.spec.ts` — app/toolset cases stay untouched as the regression guard that the versioned group didn't drift
- [x] 6.3 Add coverage for the new behavior: a name containing `__` (e.g. `foo__bar`) created, fetched, moved, and opened verbatim; an old exported id `prompts/public/foo__1.0` importing as a prompt named `foo__1.0`; a publication conversation named `foo__1.0` enriched with the name intact; a versionless put response omitting `version`

## 7. Final checks

- [x] 7.1 Sweep for leftover `__` parsing on prompt/conversation paths across `apps/ai-dial-admin/src` (grep for `__`-splitting in prompt/conversation code paths) and remove any missed site
- [x] 7.2 Check `docs/` for any description of prompt/conversation versioning and update it in this same change
- [x] 7.3 Run the full quality gate from `apps/ai-dial-admin/`: `npm run typecheck`, `npm run lint`, `npm run format`, `npm run test` (coverage run — save it for last), and `npm run typecheck:specs` to confirm no new spec-project errors were introduced

No browser-verification task: the user was asked and declined one; acceptance is covered by the unit/component suites above.

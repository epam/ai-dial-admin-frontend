## 1. Shared complex-resource client (Skills refactor, no behaviour change)

- [x] 1.1 Extract `ComplexResourceCoreApi(group, manifestFile)` in `apps/ai-dial-admin/src/server/core/` from `skills-core-api.ts` (metadata read, files listing, create, folder create/delete, manifest read, file upload/download/preview/delete, list, delete), and reduce `SkillsCoreApi` to a subclass binding `v2/skills`, `v2/metadata/skills` and `SKILL.md`
- [x] 1.2 Add group-neutral `parseManifest` / `buildManifest` (new util next to `utils/skill-manifest.ts`); make `skill-manifest.ts` export thin Skill wrappers with unchanged signatures
- [x] 1.3 Make `walkSkillFolder` / `removeSkillFolderCore` in `server/folders/folders-core.ts` group-parameterised, keeping Skill wrappers and their callers (`removeSkillFolder`, `BaseAssetList`) unchanged
- [x] 1.4 Re-run the full existing Skill spec set (`skills-core-api`, `skill-metadata`, `skills/actions`, `Skills/*`, `Publications` skill specs, `folders-core`, `skill-resource` resolver, `skill-manifest`, `frontmatter`) and fix regressions until green before any Project code
- [x] 1.5 Add unit tests for the shared client per group, the neutral manifest helpers (extra-key preservation, `---` injection, missing frontmatter) and the group-aware folder walk/delete (order, stop on failure)

## 2. Project server layer

- [x] 2.1 Add `ResourceType.PROJECT = 'PROJECT'` in `types/resource-type.ts`, and `PROJECT` entries (prefix `projects/`, `CORE_PROJECTS_URL`, `CORE_PROJECTS_METADATA_URL`) in `constants/publications-core.ts` and `constants/assets-core.ts`, covering the `Record<ResourceType, …>` totals
- [x] 2.2 Add `ProjectsCoreApi` subclass (`server/core/projects-core-api.ts`), `toProjectList` (`server/core/project-metadata.ts`) and the `projectsCoreApi` instance in `app/api/api.ts`; add `DialProjectResource` / `DialProjectFile` models in `models/dial/resource.ts`
- [x] 2.3 Add `getProjectContextLimits()` in `utils/env/` (extensions, file bytes, total bytes parsing and defaults) and the 100-file cap constant; document the three variables as commented entries in `.env.template` and the env docs under `docs/`
- [x] 2.4 Add `app/[lang]/projects/actions.ts` (get, list, create with generated `PROJECT.md`, create folder, delete, bulk delete, upload/delete file under `context/`, manifest read, move) and the `app/api/projects/download` route, with `ApiRoutes` entries
- [x] 2.5 Add unit tests for the Projects client, list mapper, env limits parsing, actions and the download route

## 3. Projects UI

- [x] 3.1 Add `ApplicationRoute.Projects`, `MenuI18nKey.Projects` after Skills in the Artifacts group of `menu-configuration.tsx`, a `menu-item-icons.tsx` icon, breadcrumbs, `is-view`, `open-in-new-tab`, delete/create/update i18n keys and en.ts strings
- [x] 3.2 Add `ProjectFolderContext`, register it in `AssetFolderProviders`, and wire `BaseAssetList` (`utils.tsx`, `constants.ts`, `types.ts`, `Assets/utils.ts`, `Assets/Modals/utils.tsx`, create/folder/bulk-delete/folder-delete branches) for `Projects`
- [x] 3.3 Add `Assets/Artifacts/Projects/List.tsx`, `CreateProperties.tsx` (Name + required Description, same name rules as Skill) and `app/[lang]/projects/{page,[id]/page}.tsx`, with the `CreateEntity` branch navigating to the new project
- [x] 3.4 Add the pure Context validation util (extension, per-file size, total size, file count, duplicate) and the controlled `ContextFiles` component (capacity meter, `Add` dropdown, dropzone, rejection list, attachment cards, `aria-live` status) styled like chat's `ProjectCreateForm`, per `.claude/rules/a11y.md`
- [x] 3.5 Add `Projects/View/{View,Properties}.tsx` (single Properties tab: info header, disabled Name, Description, markdown Instructions, Context; staged manifest and context changes applied on Save in order, stop on first failure; no folder field) and a `ProjectHeader` / buttons wrapper (Delete, or Save/Discard when changed)
- [x] 3.6 Add `PlatformSharingType.PROJECT` with defaults (TTL 72, max users 10) and label in `Assets/Platform/Roles/{models,constants,utils}.ts`
- [x] 3.7 Add unit and component tests for List, CreateProperties, View/Properties, Context validation and component, header wrapper, menu configuration and the Roles sharing row

## 4. Project publications

- [x] 4.1 Add `CoreResourceType.PROJECT` in `server/publications/models.ts`, the three `mappers.ts` tables and `RESOLUTION_ORDER` (SKILL → PROJECT), the `PublicationProject` / `ProjectPublication` models, the `project-resource.ts` resolver, the registry entry (`projectResources` / `projectResource`) and `PROJECT` handling in `resolve.ts` and `update.ts`; add `getProjectMetadata` to `EnrichmentClients`
- [x] 4.2 Add `ApplicationRoute.ProjectPublications` (an internal view key — Approvals stays one menu entry), the `utils/publications.ts` maps and `PublicationsI18nKey` strings, and the `getPublicationViewTabs` case with tabs (`Properties`, `Permissions`) in `utils/tabs/utils.ts`
- [x] 4.3 Create the dedicated `ComplexResourcePublicationView` for Skill and Project publications (moving the Skill staging out of `Publications/View/View.tsx`), render Project Properties with the shared Description/Instructions/Context components, and route `SkillPublications` and `ProjectPublications` to it
- [x] 4.4 Revert `Publications/View/View.tsx` and `TabsContent.tsx` to carry no Skill-specific state, leaving the other five types on the generic view
- [x] 4.5 Add unit and component tests for the resolver, mappers, update, list filtering, the new view (Skill parity and Project), and the generic view's Skill removal; keep existing Skill publication specs green

## 5. Specs and documentation

- [x] 5.1 Update `openspec` consolidated references that name Skills as the only complex resource where this change adds Projects, and add the env vars to the env docs and `docs/` upgrade notes if the repo's docs list them

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck` and `npm run typecheck:specs` and fix all findings
- [x] 6.2 Run the full test suite (`npm run test`) and fix failures, re-running any flaky unrelated file in isolation before attributing it to this change

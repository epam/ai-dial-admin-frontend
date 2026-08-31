## 1. Rename app route directory

- [x] 1.1 Rename `src/app/[lang]/assets-skills/` → `src/app/[lang]/skills/` (including the `[id]/` sub-directory)

## 2. Update ApplicationRoute enum (load-bearing step)

- [x] 2.1 In `src/types/routes.ts`, rename the enum member and value:
  `AssetsSkills = '/assets-skills'` → `Skills = '/skills'`

## 3. Fix TypeScript references (compiler-driven pass)

- [x] 3.1 Update `src/utils/is-view.ts`: rename `AssetsSkills` entry in the asset-view set
- [x] 3.2 Update `src/components/Breadcrumbs/constants.ts`: rename the `[ApplicationRoute.AssetsSkills]` key to `[ApplicationRoute.Skills]`
- [x] 3.3 Update `src/components/Breadcrumbs/utils.ts`: rename any `AssetsSkills` or `assets-skills` references
- [x] 3.4 Update `src/components/Menu/menu-configuration.tsx`: rename `AssetsSkills` reference in the Assets section entry
- [x] 3.5 Update `src/components/Assets/BaseAssetList/types.ts`: rename `AssetsSkills` in `BaseAssetRoute` / `CreateAssetRoute` union types
- [x] 3.6 Update `src/components/Assets/BaseAssetList/utils.tsx`: rename `AssetsSkills` keys in the action maps and update the `@/src/app/[lang]/assets-skills/actions` import path to `skills`
- [x] 3.7 Update `src/components/Assets/BaseAssetList/BaseAssetList.tsx`: rename `AssetsSkills` references
- [x] 3.8 Update `src/context/assets/SkillFolderContext.tsx`: update the `@/src/app/[lang]/assets-skills/actions` import path to `skills`
- [x] 3.9 Update `src/components/Assets/utils.ts`: rename `AssetsSkills` case arms
- [x] 3.10 Update `src/components/Assets/Modals/utils.tsx`: rename `AssetsSkills` case arms
- [x] 3.11 Update `src/components/Assets/Skills/List.tsx`, `View/View.tsx`, `View/Properties.tsx`: rename `AssetsSkills` references
- [x] 3.12 Update `src/components/Common/FileManager/utils.ts`: rename `AssetsSkills` entry
- [x] 3.13 Update `src/utils/entities/create-entity.ts` and `update-entity.ts`: rename `AssetsSkills` map entries
- [x] 3.14 Update `src/components/EntityView/Modals/Delete/utils.ts`: rename `AssetsSkills` entries in delete maps
- [x] 3.15 Update `src/utils/open-in-new-tab.ts`: rename the `AssetsSkills` case arm
- [x] 3.16 Update `src/utils/tabs/utils.ts`: rename `AssetsSkills` guard
- [x] 3.17 Update `src/components/EntityMainProperties/Properties/Properties.tsx`: rename `AssetsSkills` check
- [x] 3.18 Update `src/components/EntityListView/CreateEntity/CreateEntity.tsx`: rename `AssetsSkills` reference
- [x] 3.19 Update `src/components/Publications/View/View.tsx`: rename `AssetsSkills` reference

## 4. Update tests

- [x] 4.1 Update `src/app/[lang]/assets-skills/actions.spec.ts`: update import path and any `AssetsSkills` / `assets-skills` references
- [x] 4.2 Update `src/components/Menu/tests/menu-configuration.spec.ts`: replace `AssetsSkills` route references
- [x] 4.3 Update `src/components/Assets/BaseAssetList/tests/provider-wiring.spec.ts` and `skill-create.spec.tsx`: replace `AssetsSkills` / `assets-skills` references
- [x] 4.4 Update `src/components/Assets/Skills/tests/List.spec.tsx` and `CreateProperties.spec.tsx`: replace `AssetsSkills` references
- [x] 4.5 Update `src/components/Assets/Skills/View/tests/View.spec.tsx`: replace `AssetsSkills` references
- [x] 4.6 Update `src/components/Assets/Modals/tests/utils.spec.tsx`: replace `AssetsSkills` references
- [x] 4.7 Update `src/components/Assets/tests/utils.spec.ts`: replace `AssetsSkills` references
- [x] 4.8 Update `src/utils/entities/tests/create-entity.spec.ts`: replace `AssetsSkills` references
- [x] 4.9 Update `src/utils/tabs/tests/utils.spec.ts`: replace `AssetsSkills` references
- [x] 4.10 Update `src/components/EntityListView/CreateEntity/tests/CreateEntity.spec.tsx`: replace `AssetsSkills` references

## 5. Rename OpenSpec spec directory

- [x] 5.1 Rename `openspec/specs/assets-skills/` → `openspec/specs/skills/`

## 6. Browser verification

- [ ] 6.1 Run the `spec-browser-verify` skill for this change to verify the menu entry and navigation scenarios against the running app

## 7. Quality checks

- [x] 7.1 Run `npm run lint` from the repo root and resolve any issues
- [x] 7.2 Run `npx vitest run` from `apps/ai-dial-admin/` and resolve any failures

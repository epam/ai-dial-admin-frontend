## 1. Core resource identity handling

- [x] 1.1 Update `apps/ai-dial-admin/src/server/core/asset-metadata.ts` and its tests so App Runner and Catalog Schema merges preserve a declared body `$id`, retain the independent Core storage path/name, and use the decoded storage name only as a compatibility fallback for missing body IDs.
- [x] 1.2 Update `apps/ai-dial-admin/src/app/[lang]/platform-app-runners/actions.ts` and `apps/ai-dial-admin/src/app/[lang]/platform-catalog-schemas/actions.ts` so create addresses the supplied encoded storage name, while update/delete use the loaded `_metadata.path` and continue stripping Core projections from write payloads.
- [x] 1.3 Update shared flat-platform route, open-in-new-tab, and delete-key helpers in `apps/ai-dial-admin/src/components/Assets/BaseAssetList/` and `apps/ai-dial-admin/src/utils/open-in-new-tab.ts` to navigate and mutate using metadata storage paths rather than declared `$id`.

## 2. Platform schema authoring and immutability

- [x] 2.1 Extend `apps/ai-dial-admin/src/components/Assets/Platform/AppRunners/CreateProperties.tsx` and `apps/ai-dial-admin/src/components/Assets/Platform/CatalogSchemas/CreateProperties.tsx` with separate required storage `name` and declared `$id` inputs, matching established validation and accessible form-field patterns.
- [x] 2.2 Update Platform App Runner and Catalog Schema detail Properties views to display immutable storage name and declared `$id` as distinct values, and rename metadata-list identity columns to `Name` without adding per-row content reads.
- [x] 2.3 Add save-boundary validation in `apps/ai-dial-admin/src/components/Assets/Platform/AppRunners/View.tsx` and `apps/ai-dial-admin/src/components/Assets/Platform/CatalogSchemas/View.tsx` that blocks raw-JSON attempts to change an existing declared `$id` while preserving edits for correction.


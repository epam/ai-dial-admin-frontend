## 1. Action labels

- [x] 1.1 In `src/components/Assets/utils.ts`, make `getTreeActionLabels` return `addSibling`, `addChild`, `managePermissions` and `delete` for `ApplicationRoute.Skills` and `ApplicationRoute.Projects` (empty for read-only admins) and replace the stale "no folder-tree actions" comment. The two sets live in `src/components/Assets/constants.ts`.
- [x] 1.2 In the same file, make `getGridActionLabels` give those views the same four entries plus `openInNewTab`. The file manager builds each row's menu from this one set, showing `addSibling`, `addChild` and `managePermissions` on folder rows only and `openInNewTab` on item rows only, and add sibling / add child reuse the existing `onCreateFolder` flow, so `FileManager` and `BaseAssetList` need no new handler.

## 2. Tests

- [x] 2.1 Unit tests for `getTreeActionLabels` and `getGridActionLabels` in `src/components/Assets/tests/utils.spec.ts`: Skills and Projects return the folder entries, no rename or move, read-only admins get none. The Skills and Projects `List.spec.tsx` affordance tests are updated to the new sets.
- [x] 2.2 No handler was added, so no component test is needed.

## 3. Quality checks

- [x] 3.1 Run lint, format, `npm run typecheck`, `npm run typecheck:specs` and the affected tests; fix any failures.

## 1. Folder tree re-rooting

- [x] 1.1 Add `withRootOf` in `src/server/folders/folder-tree.ts`, which keeps a target tree's root and takes only the children of another tree. `toFolderTree` already drops item rows, so no separate row-to-node builder is needed.

## 2. Listing

- [x] 2.1 In `src/server/folders/folders-core.ts`, read the Skill and Project listings (`skillsCoreApi.listSkillMetadata`, `projectsCoreApi.listProjectMetadata` through `fetchAllPages` and `toFolderTree`) next to `ALL_TYPES`, each with `.catch(() => null)`, re-root them with `withRootOf`, and pass them into `mergeFolderTrees`. Leave `ALL_TYPES`, delete and move untouched. Comment that the extra calls go away once Core syncs folders across types.

## 3. Tests

- [x] 3.1 Unit test for `withRootOf` in `src/server/folders/tests/folder-tree.spec.ts`: root kept, item rows dropped, merge with the target root does not throw.
- [x] 3.2 `getFoldersCore` tests: a skills-only and a projects-only subfolder appear, resource rows are absent, a failing Skill or Project listing leaves the other folders, a folder shared with another type merges without an inconsistency error, and the skill listing follows `nextToken`.

## 4. Quality checks

- [x] 4.1 Run lint, format, `npm run typecheck`, `npm run typecheck:specs` and the affected tests; fix any failures.

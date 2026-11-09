## 1. Files folders read

- [x] 1.1 Add `getFileFolders(path)` to `src/app/[lang]/files/actions.ts`: page through `filesCoreApi.getFileMetadata(token, path, false, nextToken)`, keep `FOLDER` nodes only (drop files and the `.dial_folder` marker), return them as list rows; a rejected read resolves to `[]`
- [x] 1.2 Add pure `mergeFolderRows(own, fileFolders)` to `src/utils/files/folder.ts`: own rows first and unchanged, Files folders appended when their normalized (decoded, trailing-slash) path is not already present

## 2. Factory and contexts

- [x] 2.1 Add the optional folder-source argument to `createFolderContext` in `src/context/assets/AssetsFolderContext.tsx`; in `fetchByPath`, for paths under `public/` that are not file roots, run it in parallel with the type listing (`Promise.all`) and merge with `mergeFolderRows`; keep `undefined` from the type listing as `FetchFailed` and ignore a failed Files read
- [x] 2.2 Pass `getFileFolders` from `ToolsetsFolderContext`, `AppsFolderContext`, `SkillFolderContext`, `ProjectFolderContext`, `ConversationsFolderContext` and `PromptFolderContext`; leave `FileFolderContext` and the other asset contexts untouched
- [x] 2.3 Confirm the Applications `platform` root and config-file roots make no Files read

## 3. Tests

- [x] 3.1 Unit tests for `mergeFolderRows` (union, duplicate by path keeps own node, encoded vs decoded segment, empty inputs) in `src/utils/tests/`
- [x] 3.2 Action test for `getFileFolders`: mixed folders/files/marker response keeps only folders, multi-page response, rejected read returns `[]`
- [x] 3.3 Extend `src/context/assets/tests/AssetsFolderContext.spec.tsx`: Files-only folder appears, folder in both sources shown once, Files failure leaves the type's folders, type failure still sets the fetch error, no Files read for `platform`/file roots or when the option is absent
- [x] 3.4 Opt-in assertions in the six context specs (or one shared spec) that each passes the Files folder source and the others do not

## 4. Quality checks

- [x] 4.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full test suite; fix any failures

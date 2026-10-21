## Why

Issue #5128: the first time the Create Application / Create Toolset modal opens after a re-login, the
folder tree shows "No Folders" and the Properties area loads forever; closing and reopening works.
The folder context only records a failure when a fetch *returns* `undefined`; a fetch that *throws*
leaves the context empty, idle and error-free, which is exactly that state. Separately, the
empty-state auto-fetch in `FolderList` re-fires whenever the context value changes (including
`isFetchingFiles` flipping), so one open queues several identical server actions. Next.js runs
server actions serially, so the duplicates pile up behind each other.

## What Changes

- `createFolderContext` (`context/assets/AssetsFolderContext.tsx`): `fetchRoots`, `fetchFolder` and
  `fetchFolderHierarchy` treat a rejected fetch as a failed fetch and dispatch `FetchFailed`, so the
  existing load-error notification and the form render instead of an empty modal. A stale (non-latest)
  request still must not set the error.
- `FolderList` (`components/Common/FolderList/FolderList.tsx`): the empty-state auto-fetch no longer
  fires again while a fetch for the same roots is already in flight or has already been issued for
  this mount.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `folder-list-tree`: "Folder list keeps its loading, empty and fetch behavior" gains a requirement
  that a failed load surfaces as an error rather than an empty state, and that the empty-state
  auto-fetch is issued once rather than once per context update.

## Non-goals

- Finding out *why* the first server action after re-login throws (token/session refresh). If the
  duplicate-queue fix does not remove the trigger, that is a follow-up needing a network-level repro.
- Changing the file manager, Folders Storage page or `FilePath` fetch paths.
- Retrying failed fetches automatically.

## Impact

- Code: `AssetsFolderContext.tsx`, `FolderList.tsx` and their specs (`AssetsFolderContext.spec.tsx`,
  `FolderList.spec.tsx`).
- Shared: every one of the 14 `createFolderContext` providers and every `FolderList` consumer (Create
  Asset modal, Folders Storage, Rules popup). Rule folders use a different context and only share the
  `FolderList` change.
- No API, i18n or dependency changes (`FoldersI18nKey.LoadFolderError` already exists).

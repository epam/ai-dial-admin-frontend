## Why

On the Skills and Projects asset lists a folder has no context menu: hovering a folder row shows no three-dots button, and the folder tree offers no actions (issue #5306). Users can create and delete folders only from the toolbar and bulk selection, and cannot reach a folder's permissions at all, although Folders Storage now lists skill and project folders (change `add-skill-project-folders-to-folders-storage`).

## What Changes

- Folder rows and folder-tree nodes on the Skills and Projects lists get a context menu with **Add sibling**, **Add child**, **Manage permissions** and **Delete**.
- Add sibling and Add child create an empty grouping folder next to, or inside, the chosen folder through the existing folder-creation flow (`createSkillFolder` / `createProjectFolder`).
- Manage permissions opens Folders Storage on the folder (the existing `onManagePermissions` handler).
- Delete reuses the existing recursive folder delete (`removeSkillFolder` / `removeProjectFolder`) and its confirmation.
- The menu is hidden for read-only admins, as on the other asset lists.
- The stale comment in `getTreeActionLabels` claiming folder delete is not wired is corrected.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `skills`: the asset list's action requirement gains the folder context menu.
- `projects`: the same for the project list.

## Impact

- `src/components/Assets/utils.ts` (`getGridActionLabels`, `getTreeActionLabels`) and, if the ui-kit needs different wiring for add sibling / add child, `src/components/Common/FileManager/FileManager.tsx` and `src/components/Assets/BaseAssetList/BaseAssetList.tsx`.
- Other asset lists are unaffected: the changes are scoped to the Skills and Projects views.
- No new server actions.

## Non-goals

- Rename of skill and project folders (no Core support in `changeFolderCore` for these types yet).
- Move of folders, import and export.
- Actions on individual skill or project rows beyond what exists today.

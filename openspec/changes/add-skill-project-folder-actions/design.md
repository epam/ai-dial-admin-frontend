## Context

`FileManager` hands the ui-kit `DialFileManager` its menu entries through `gridOptions.actionLabels` (built by `getGridActionLabels`) and `treeOptions.actionLabels` (`getTreeActionLabels`). For Skills and Projects the tree set is empty and the grid set holds only `delete` and `openInNewTab`, neither of which fits a folder, so folder rows show no menu. The handlers already exist: `onManagePermissions` opens Folders Storage, `onDeleteFiles` runs the recursive skill/project folder delete, and `handleCreateFolder` creates grouping folders through `createSkillFolder` / `createProjectFolder`. The action keys `addSibling`, `addChild` and `managePermissions` already exist in `allActionLabels`.

## Goals / Non-Goals

**Goals:** the four folder actions on both views, wired to existing handlers, hidden for read-only admins.

**Non-Goals:** rename, move, import/export, new server actions.

## Decisions

1. **Select entries by key in the label functions.** For Skills and Projects, `getTreeActionLabels` returns the entries `addSibling`, `addChild`, `managePermissions` and `delete` (none for read-only admins), following the filter-by-key style the other views use. Alternative: a new per-view constant. Rejected: every other view already filters `allActionLabels` in these two functions.
2. **One grid set serves every row.** The file manager builds each row's menu from `gridOptions.actionLabels` and shows `addSibling`, `addChild` and `managePermissions` on folder rows only and `openInNewTab` on item rows only, so the grid set for these views is the folder actions plus `openInNewTab`.
3. **Add sibling / Add child go through the existing create-folder flow.** Add child targets the chosen folder, Add sibling its parent. The flow's name validation and depth limit apply unchanged.
4. **Delete keeps its dedicated path.** `onMultipleRemove` already routes folders to `removeSkillFolder` / `removeProjectFolder`; nothing changes there.

## Risks / Trade-offs

- Add sibling and add child go through the file manager's inline create flow into the existing `onCreateFolder`, as on the other asset lists; they are not browser-verified here.
- Deleting a folder is recursive over every skill or project inside it. The existing confirmation covers it; its wording for folders is checked during implementation.
- Folder rename stays unavailable until Core-backed rename exists for these types.

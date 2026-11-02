## Why

QA asked how a user changes the permissions of a role already assigned to a table, and concluded the only way is to remove the role and add it again. Editing exists — a click on a roles-grid row opens the role drawer pre-filled — but nothing on the page says the row can be clicked: the pointer stays an arrow and the row menu offers only Remove. The same Access tab also shows the Remove role confirmation with its details flush against the dialog's edge, unlike the Delete table confirmation.

## What Changes

- The roles grid's row menu offers **Edit** beside **Remove**; Edit opens the same role drawer as a click on the row, pre-filled for that role.
- A roles-grid row shows a pointer cursor, as the other clickable grids do.
- The Remove role confirmation lays its details and warning inside the dialog's padded content area, the way the Delete table confirmation does.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/tables`: a new requirement covers editing an assigned role from the roles grid. The dialog's padding is presentation only and changes no requirement.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Tables/access/AccessTab.tsx`, `RemoveRoleDialog.tsx`
- No new i18n key: the grid's Edit entry reuses the shared action-menu label.

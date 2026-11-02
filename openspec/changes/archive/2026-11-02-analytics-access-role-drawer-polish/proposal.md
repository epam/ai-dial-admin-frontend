## Why

QA found three problems in the Access tab's role drawer and roles table. A row-limit condition with an empty value counts as complete, so **Save role** stays enabled and the role is stored with a filter that matches no row. A role that lost **Read** still shows its old row filter in the Rows column as if it were its active read scope. And the "already holds" banner for **Read** sits inside the Read card while the banners for the other privileges are stacked together below the cards.

## What Changes

- A row-limit condition compared with a blank literal value, or an **is one of** condition with no non-blank item, counts as unfinished: the existing incomplete-conditions message shows and **Save role** / **Save row limit** stay disabled. An explicit null comparison stays complete.
- A role that has a stored row policy but does not hold **Read** shows **Cannot read rows** in the Rows column, followed by a muted note that the filter is kept and what it is. The policy stays stored and keeps applying by whatever path the role reads the table; the note stops presenting it as the role's read scope on this table.
- The drawer renders the "already holds" banners for Get, Read, Write and Modify together in one stack under the privilege cards, instead of putting the Read banner inside its card.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/tables`: three requirements change — "Access tab lists a table's roles" (the Rows column), "Row-limit editor" (what counts as an unfinished condition) and "Drawer reports grants that change nothing" (where the Read banner appears).

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Tables/access/` — `row-limit.ts`, `utils.ts`, `AccessTab.tsx`, `RemoveRoleDialog.tsx`, `RoleDrawer.tsx`, `PrivilegeCard.tsx` and their specs
- `apps/ai-dial-admin/src/constants/i18n.ts` and `apps/ai-dial-admin/src/locales/en.ts` — one string for the kept-filter note

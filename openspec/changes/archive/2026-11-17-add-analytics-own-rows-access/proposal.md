## Why

The analytics-data-access-service now lets a table be opened to every authenticated caller while each caller reads only its own rows: a `*` grantee in the read-side grant lists, and row-policy conditions that compare a column with a value of the caller (`caller.user_hash`, `caller.project`). The Access tab cannot express either, and a row policy holding a caller value — stored through the API — breaks the roles table's condition summary, which only knows fields, literals, arrays and function calls.

## What Changes

- The Access tab treats `*` as the **Everyone (all authenticated users)** grantee: offered in the role picker ahead of the catalog roles, labelled that way in the roles table, the drawer and the remove dialog, with **Write** and **Modify** locked because the service refuses them for it.
- Granting **Read** to Everyone with no row limit is warned about before saving: every caller then reads every row, and every other role's row limit on the table stops applying. The save stays allowed. When Everyone gets a row limit, the drawer stores the limit before the grants, so the table is never readable by everyone unconfined in between.
- The `lifts_row_policies` reason of `ineffective_grants` is a known reason; its message appears through the existing in-drawer warning banner.
- The row-limit editor offers a **Caller value** as the compared value of a condition — the caller's user hash or the caller's project — only for **Equals** / **Not equals** on a string column. It is stored as `{"type":"param","name":"caller.…"}`.
- The roles table's condition summary and the row-limit editor's two views read a stored condition that holds a caller value.
- The row-policy path percent-encodes the `*` role as `%2A`.
- An empty query result over a table that reports `rows_restricted` says that no rows match the caller's access, so a confined caller with no matching rows does not read it as a failure.

## Non-goals

- The SQL form of a row policy (`{"where": …}`): the editor keeps its visual and JSON views.
- Renaming or restyling the existing **Rows restricted** badge.
- Showing, on other roles' rows, that an unconfined Everyone grant lifts their row limits — the warning and the service's banner state it at the moment it is caused.
- The empty-result hint on Sessions, Dashboards and pipeline previews.
- Propagating a row limit to enrichment or aggregate tables; each derived table keeps its own Access tab.
- Client-side re-validation of what the service refuses: a `422` is passed through with its message.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/tables`: the Access tab gains the Everyone grantee, the unconfined-Everyone warning and save order, and the caller-value operand of the row-limit editor; the role drawer and row-limit editor requirements change accordingly.
- `analytics/query-viewer`: an empty result over a row-restricted table carries an access hint.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Tables/access/` — role drawer, roles grid, remove dialog, row-limit editor, their utils and models.
- `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Filter/` and `QueryBuilder/utils/` (`serialize.ts`, `deserialize.ts`, `state.ts`) — the shared filter-condition editor gains an operand kind that only the row-limit editor switches on; the Query Builder's own Filter section is unchanged in behavior.
- `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/ResultArea.tsx` — empty-result hint.
- `apps/ai-dial-admin/src/models/analytics/query.ts`, `query-builder.ts`, `table.ts`; `src/server/analytics/analytics-data-api.ts`; `src/locales/en.ts`, `src/constants/i18n.ts`.
- Backend contract: `PUT /v1/tables/{name}/access`, `GET|PUT|DELETE /v1/tables/{name}/row-policies[/{role}]`, `GET /v1/tables/{name}` of the analytics-data-access-service. All additive; no new endpoint.

## Follow-up: role-keyed access API

### Why

The analytics-data-access-service replaces the five grant lists and the row-policy endpoints with one access entry per role — `{privileges, rows, columns}` at `/v1/tables/{name}/access?role=<role>` — and removes the old calls. The Access tab is built on the removed calls, so it stops working against that service version. The same release adds what the first part of this change had to work around or could not do: a per-role optimistic lock, the warnings on every read instead of only in the response to a save, a flag saying whether the caller may manage access, column policies, and enrichment tables whose read access follows their source.

### What Changes

- **BREAKING (backend contract)**: the Access tab reads `GET /v1/tables/{name}/access` once and writes one role's whole entry with `PUT` / `DELETE /v1/tables/{name}/access?role=<role>`. The row-policy requests, the re-read of the lists before a save, and the two-request save with its **Save row limit** recovery are gone: grants, row limit and column limit of a role are stored together or not at all.
- A save sends the access `generation` it read. A role changed by someone else since is refused by the service; the drawer then says so and offers to reload the role instead of overwriting it. A busy table is reported and the save can be repeated.
- The Access tab is offered by `permissions.grant` of the table, not by the full-admin role.
- The service's warnings (`ineffective_grants`) are shown on every load of the tab: those of the Everyone entry as a banner above the roles table, those of any other role on its row. Two reasons are new: `lifts_column_policies` and `everyone_reads_all_rows`.
- Saving **Read** for Everyone with all rows asks for confirmation first and offers to set a row limit instead. The in-drawer warning stays.
- A role can be limited to some of the table's columns: a new drawer step, a **Columns** column in the roles table, and a **Columns restricted** badge for a caller the service reports as column-restricted.
- On an enrichment table the drawer offers **Write** and **Modify** only and says that read access, row limits and column limits are set on the source table.
- A note where a row or column limit is chosen says that tables built from this one by pipelines do not inherit the limit.

Superseded from the first part: the `%2A` path encoding (the role is a query value now) and the policy-before-grants save order for Everyone (one request stores both).

### Non-goals

- Listing the tables pipelines build from a table: a general note is enough.
- Dismissing a standing warning per table.
- A filter of the roles table by column limit.
- The SQL form of a row limit (`{"where": …}`): unchanged from the first part.
- Supporting a service version that still has the removed endpoints.

### Capabilities

- `analytics/tables`: the Access tab's requirements are restated over the role-keyed API; column limits, the enrichment rule, the standing warnings and the `grant`-based offer are added.

### Impact

- `apps/ai-dial-admin/src/components/Analytics/Tables/access/` — the hook, drawer, roles grid, remove dialog, utils and models; a new column-limit step.
- `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`, `TablesView.tsx`, `RowsRestrictedBadge.tsx`; `src/hooks/use-analytics-table-permissions.ts`.
- `src/models/analytics/table.ts`, `src/server/analytics/analytics-data-api.ts`, `src/app/[lang]/tables/actions.ts`, `src/locales/en.ts`, `src/constants/i18n.ts`.
- Backend contract: `GET /v1/tables/{name}/access`, `PUT|DELETE /v1/tables/{name}/access?role=`, `permissions.grant` and `permissions.columns_restricted` on `GET /v1/tables[/{name}]`. Requires the service release that carries the role-keyed access API; the two must be deployed together.

## Why

The analytics-data-access-service (ADAS) now enforces per-table security beyond the two role lists the
console manages today: five privilege grants per table (`get`, `read`, `sensitive`, `write`, `modify`)
and per-role **row policies** that confine which rows a role reads through every query surface. The
console still exposes only `write` / `modify` in a popup, so an admin cannot grant read access, cannot
hand out the sensitive-column clearance, and cannot restrict a role to its own projects — the two things
that decide who sees whose usage data. The `/access` contract is also a key-wise merge now, not the full
replace the current panel assumes.

## What Changes

- **Access tab** on the table detail page, next to Properties and Audit, replacing the *Manage access*
  header button and its popup. Shown to `FULL_ADMIN`, hidden when `GET /access` answers 403. It has its
  own URL.
- **Roles table** (one line per role): Get / Read / Write / Modify marks, with a lighter mark where the
  privilege is implied (Read and Modify include Get), a sensitive indicator, and the role's row limit
  ("All rows" / "Cannot read rows" / the filter). A role that has only a row policy is listed too.
- **Role drawer**, a new overlay component: pick a role from Core's role catalog, tick what it can do,
  decide on sensitive columns, and — once the role can read — choose all rows or a row limit. One
  **Save role** issues `PUT /access` and then `PUT` / `DELETE /row-policies/{role}`.
- **Row-limit editor** built on a core extracted from the Query Builder's filter section, so one tested
  condition tree serves both. A filter nested deeper than the visual editor holds opens as JSON.
- **Remove role** confirmation naming what is removed and warning that the role's users may then see
  every row.
- **Rows restricted** badge on the table detail header and the Tables catalog row, driven by
  `permissions.rows_restricted`. The filter itself is never shown to the confined user.
- **System tables** may now carry read-side grants and row policies; `write` and `modify` stay locked
  with the reason. (Today the panel is hidden for system tables altogether.)
- **Sensitive switch** in the column editor is locked with a reason when the caller lacks the clearance
  (`modify && sensitive`), instead of failing with 403 on save.
- **Result reporting**: server errors surface as notifications; grants the service reports as having no
  effect (`ineffective_grants`) render as an in-drawer banner using the service's own message.
- The table detail page's tab strip and header move to ui-kit 2.0: `Tabs`, the Delete table / Add columns / Add rows / Connect buttons, the JSON Editor switch and a labelled **Copy** button.
- While an `ACTIVE` table's definition is shown as JSON, the header offers only **Copy** and the JSON Editor switch.

## Capabilities

### New Capabilities
<!-- none: every requirement belongs to the sub-capability that owns the behaviour -->

### Modified Capabilities
- `analytics/tables`: replaces the *Full-admin per-table role management panel* with the Access tab, roles
  table, role drawer, row-limit editor and Remove role; extends the *capability model* and *per-table
  permissions* with `get` / `read` / `sensitive` / `rows_restricted`; changes *System-owned tables are
  read-only* so read-side grants and row policies stay manageable; extends the *detail tabs* from two to
  three; adds the Rows restricted badge and the sensitive-switch lock.

## Impact

- **Code**: `components/Analytics/Tables/` (`TableDetailView`, `TableAccessPanel` removed, new Access
  tab, drawer and role components, `EditColumnPopup`, `TablesView`, `TableStatusBadge`);
  `components/Analytics/QueryBuilder/Filter/` (core extracted); `hooks/use-analytics-table-permissions`;
  `models/analytics/table.ts` (`TablePermissions`, `TableAccess`, row-policy and `ineffective_grants`
  types); `app/[lang]/tables/actions.ts` and the analytics data API client (row-policy calls); a new
  shared drawer component; i18n keys.
- **Shared components**: the extracted filter core touches the Query Builder's Filter and Having
  sections. Their behaviour must not change.
- **Backend dependency**: an ADAS build that serves `/v1/tables/{name}/row-policies`,
  `permissions.rows_restricted` and the five-key `/access`. Not checked against the deployed dev stand.
- **Not affected**: Core role APIs (the role catalog read is unchanged), analytics config transfer.

## Non-goals

- Warning that a user's *other* roles may lift a confinement. ADAS does not expose its `roles-mapping`,
  and admins know the role model.
- Surfacing that a row policy does not propagate to derived (aggregate / enrichment) tables, or any
  handling of ADAS's `none` security mode.
- Showing or editing a row limit as a confined user; export/import of grants (ADAS writes none).
- Changing how roles are created or mapped in Core or in ADAS configuration.

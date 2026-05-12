## Context

The Activity Audit page (`/activity-audit`) is owned by `apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx`. Today it has a single datasource that calls `getActivities` → `activityAuditApi.getActivitiesList` against `DIAL_ADMIN_API_URL`. The page exposes a `View` dropdown (`Config | Asset`) backed by the user-facing view enum (renamed in this change to `ActivityAuditView` in `types/activity-audit.ts`), but only `Config` is functional today (`Asset` is disabled).

The deployment-manager backend (`ai-dial-admin-mcp-manager-backend`, feature spec `014-auditing`) exposes a shape-compatible `POST /api/v1/activities` endpoint at `DIAL_DEPLOYMENTS_API_URL`. The contract returns the same fields (`activityId`, `activityType`, `resourceType`, `resourceId`, `epochTimestampMs`, `initiatedAuthor`, `initiatedEmail`, `revision`) but covers a different resource taxonomy (deployments, image definitions, the image-build domain whitelist). The backend currently does NOT project the image's semantic `version` onto the activity DTO; a coordinated BE change is required.

Three integration points already exist that this change reuses unchanged:

- `BaseApi` infrastructure with per-host configuration in `src/app/api/api.ts`.
- The `getRequestFilters` + `FilterDto` plumbing used by `getActivities`.
- The AG Grid setup wrapped by `ListView` and `GridView`, including `infiniteGridOptions`, `RowExpanderCellRenderer`, `ChildrenActivityTypeCellRenderer`.

Stakeholders: frontend team (this change), deployment-manager-backend team (`version` field addition), audit detail-view team (follow-up spec).

## Goals / Non-Goals

**Goals:**

- Surface deployment-manager activities in the existing Activity Audit page through a new `Deployments` view option without forking the component.
- Reuse the existing AG Grid wrapper, time filter, reset-filters button, infinite scrolling, and request-filter plumbing.
- Keep the Config view's behavior 1:1 with what ships today.
- Treat the BE host swap as the only meaningful runtime difference between the two views; everything else (columns, label mapping, action menu, rollback visibility) flows from a single `isDeploymentsView` boolean.

**Non-Goals:**

- Rendering the audit detail / diff view for deployment activities (separate follow-up change). Until that lands, deployment rows show only an `Open in new tab` menu entry (visible affordance) but both that click and the row-body click are no-ops.
- Embedding the Audit tab inside container or image detail pages (separate follow-up change after detail view exists).
- Rollback for deployment activities (intentionally permanent — issue requirement #4).
- Introducing activity types beyond `Create | Update | Delete` (BE emits only these).
- Replacing the resource-type free-text filter with a select dropdown.
- Persisting the user's last `View` selection across page reloads.

## Decisions

### D1. Consolidate the view enum as `ActivityAuditView`; switch backends inside `gridDataSource`

Rename the existing `ACTIVITY_VIEW_TYPE` enum to `ActivityAuditView`, relocate it from `types/telemetry.ts` to `types/activity-audit.ts`, and add the `Deployments` member alongside the existing `Config` and disabled `Asset`. Keeping the View dropdown a single `DialSelect` avoids a parallel page route. The `gridDataSource` memo in `List.tsx` branches on `activityViewType` and selects the server action: `getActivities(...)` for `Config`, `getDeploymentActivities(...)` for `Deployments`.

Alternatives considered:

- A separate `/activity-audit/deployments` route. Rejected: would duplicate the list shell, time filter, view selector, and reset-filters wiring.
- Generic `getActivities(viewType, ...)` collapsing both APIs into one action. Rejected: would couple unrelated backends behind one function and lose typing fidelity on `ServerActionResponse` shapes.

### D2. Introduce a dedicated `DeploymentAuditApi` mirroring `ActivityAuditApi`

The two backends have separate hosts and may diverge over time (the deployment-manager activities API will not gain rollback or revisions endpoints in the foreseeable future). A sibling class extending `BaseApi` keeps the abstraction symmetric with how `ContainersApi`, `ImagesApi`, etc. already live under `src/server/deployments/`. The class only exposes `getActivitiesList` for now — no `getActivityById` until the detail view ships.

Alternatives considered:

- Extending `ActivityAuditApi` with an additional `host` param. Rejected: contradicts the established pattern in `api.ts` where one API class corresponds to one host.
- Adding `getActivityById` up front in anticipation of the detail view. Rejected: nothing consumes it today; introduce it alongside the follow-up detail spec so the surface area matches actual usage.

### D3. Extend `ActivityAuditResourceType` with 11 new members; use a flat singular-label map

Reusing the same enum gives `getFormattedResourceType` and any other code that already switches on resource type a single source of truth. The label mapping intentionally flattens:

- All four `*ImageDefinition` members → `Image`.
- `NimDeployment` and `InferenceDeployment` → `Model serving`.
- `ImageBuildDomainWhitelist` → `Global firewall`.
- Each `*Deployment` → `<Type> container` (singular, per issue requirement #3).

Flattening matches the side-menu groupings in the design mock and aligns with how the rest of the app refers to these entity classes (the `Images` page lists all four image types together, the `Model Servings` page covers NIM + Inference).

Alternatives considered:

- Distinct labels per subtype (`Adapter image`, `MCP image`, etc.). Rejected: contradicts the design and adds vocabulary not surfaced anywhere else in the app.
- A separate `DeploymentActivityResourceType` enum. Rejected: would force every downstream consumer (formatters, filter helpers) to handle two parallel types.

### D4. Single `ACTIVITY_AUDIT_COLUMNS(t, view, isSingleEntity?)` factory keyed by `ActivityAuditView`

Collapse the column logic into one factory that takes the view enum plus an optional `isSingleEntity` flag for the entity-tab embed. Per view:

- `Config` → expander, activityType, resourceType, resourceId, time, initiated, activityId, parentId.
- `Config` with `isSingleEntity=true` → activityType, time, initiated, activityId, parentId.
- `Deployments` → activityType, resourceType, resourceId, **version**, time, initiated, activityId, parentId (no expander).
- `Asset` → same as `Config` (currently disabled in UI; safe fallback).

The single factory keeps column composition in one place; conditional inclusion is expressed via `...(condition ? [col] : [])` spreads inside one array literal. `getActivityAuditColumns` (Config view, with rollback/view-details actions) and `getDeploymentActivityAuditColumns` (Deployments view, Open-in-new-tab only) are thin wrappers in `List/utils.tsx` that append the appropriate `ACTION_COLUMN`.

The `Parent ID` column appears in both Config and Deployments view for visual consistency. Deployment-manager activities never populate `parentActivityId`, so the cell renders empty.

Alternatives considered:

- Two separate exported factories (`ACTIVITY_AUDIT_COLUMNS` + `DEPLOYMENT_ACTIVITY_AUDIT_COLUMNS`). Rejected: the column sets are 80% identical; two factories duplicate spec/intent and drift over time.
- One factory but extracted column constants (`EXPANDER_COL`, `ACTIVITY_TYPE_COL`, …) composed by name. Rejected: more verbose than inline spreads for this small set of columns; harder to read at a glance.
- Boolean-flag bag (`{ forDeployments, showVersion, includeRollback, … }`). Rejected: hides the structural difference between views behind opaque knobs.

### D5. `Version` column reads `activity.version`; render empty when absent

Until the BE change lands, every row will display an empty string. The column header is still meaningful in the design's intent, and the FE has nowhere else to get the value from without an N+1 snapshot fetch.

Risk mitigation: the proposal explicitly calls the BE field a prerequisite. The FE change can still ship: when the field is null the column simply stays empty, matching the AG Grid default for null values, no broken rendering.

Alternatives considered:

- Display `revision` in the `Version` column. Rejected: `revision` is the Envers transaction number (`42`), not the image's semantic version (`1.0.0`). User confirmed this is unacceptable.
- Per-row snapshot fetch. Rejected: triggers N additional HTTP requests per page, breaks infinite scroll throughput.

### D6. Reset all AG Grid filters on view change; preserve time period and sort

User chose this behavior over partial-reset and keep-as-is options. Implementation: the `useEffect` listening on `activityViewType` calls `gridApi.setFilterModel(null)` plus triggers `gridApi.setGridOption('datasource', gridDataSource)` so the new view starts with a clean slate. The existing time period state lives outside the grid so it survives naturally. Sort is part of the column def (`sort: 'desc'` on `epochTimestampMs`) and is reapplied by the new column set.

Alternatives considered:

- Persist filters across switches. Rejected: a `resourceType` filter of `"Application"` from the Config view returns zero rows in the Deployments view (`ApplicationDeployment` is the substring-equivalent match, but only by coincidence) — confusing.
- Partial reset based on a per-column allow-list. Rejected: hidden policy that has to be explained.

### D7. Rollback affordances are hidden when `activityViewType === Deployments`; no code paths are deleted

The system-level `Rollback` button and the per-row rollback action are wrapped in conditionals against `activityViewType`. The rollback flow utilities (`utils/audit/get-rollback-request.ts`, `Rollback/SystemRollback.tsx`) and the underlying rollback modal stay untouched. This keeps the diff small and the Config behavior identical.

Alternatives considered:

- Move rollback into a sub-component injected only for Config. Rejected: over-refactors a working code path.

### D8. Open-in-new-tab visible in the row menu, but clicks are no-ops until the detail spec ships

The Deployments view renders a row action menu containing only `Open in new tab`. In this change the click handler short-circuits — no new tab, no navigation. Row-body clicks are also no-ops. The detail page (`src/app/[lang]/activity-audit/[id]/page.tsx`) stays admin-backend only. The follow-up change will wire the menu action (and the row body click) to a real detail experience.

This preserves the visual affordance the design calls for while preventing a known-bad navigation to a 404 page on a route that doesn't yet know about deployment activities.

Alternatives considered:

- Drop the action menu entirely. Rejected: users want the affordance visible to signal that a detail view is coming.
- Wire the menu to `/activity-audit/{activityId}` and let the not-found page render. Rejected: shipping a UI control whose only outcome is a 404 page is bad UX; users will report it as a bug.
- Admin → deployment-manager fallback in the detail page with a stub renderer in this change. Rejected: dead UI today; better to design the detail experience as one piece in a follow-up.
- Encode the source backend in the URL (`/activity-audit/deployments/{id}`). Rejected: premature scaffolding for a not-yet-designed detail view.

### D9. Column-state localStorage key includes the view type

`ListView` persists column state via `storageKey`. To keep the saved widths and visibility consistent per view, scope the storage key with a view suffix (`activity-audit:config` vs `activity-audit:deployments`). This avoids cross-contamination between the two column sets.

### D10. `fullActivityList` parent/child aggregation only applies to Config view

The current Config implementation maintains a client-side map to attach children to parent activities (used when expanding rows). The deployment-manager backend emits flat activities — no parent/child relationships. Inside `gridDataSource`, when `activityViewType === Deployments`, skip the parent/child aggregation entirely and pass `res.data` straight to `params.successCallback(res.data, total)`.

## Risks / Trade-offs

- **Resource-type free-text filter mismatch** → User types the displayed label `"Adapter container"` and gets zero rows because the BE value is `"AdapterDeployment"`. Accepted: documented as a known UX gap; a follow-up change can introduce a set filter if usage proves painful.
- **BE `version` field not yet shipped** → `Version` column displays empty for image rows until the BE coordinates the change. Accepted: ship the FE feature; coordinate via a BE issue tracked alongside this change. No user data is lost because the column simply has nothing to show.
- **Open-in-new-tab is visible but does nothing in this change** → Users see the affordance but clicking it has no effect. Accepted as a deliberate trade-off: showing a control that always lands on a 404 page would be worse. The follow-up change wires both the menu and row click to the real detail page.
- **Storage key suffix change** → Users with previously saved column state for the audit grid will lose it on first load after deploy. Trade-off: acceptable since the column set itself is changing.
- **Switching the View dropdown clears filters** → If a user accidentally toggles, they lose typed filter values with no undo. Mitigation: deliberate two-click action; same pattern used for other view selectors.
- **`isReadOnlyAdmin` interaction** → Read-only admins should see the Deployments view; they only lose rollback affordances. Verify the existing `isReadOnlyAdmin` branch only gates rollback, not the view selector itself.

## Why

An entity's Audit `Traces` tab lists the entity's calls from the telemetry dataset as bare grid rows: one
call, no context, no way to see what came before or after it. The session page already presents the
usage log as trace cards that open into the full span tree, and the entity `Dashboard` tab already reads
that same usage log behind the analytics flags — so under those flags the two Audit tabs read different
data, and only one of them can explain a call.

## What Changes

- **Behind the existing flags** (`ANALYTICS_ENABLED` and `ANALYTICS_USAGE_ENABLED`, the pair that already
  switches the Audit `Dashboard` tab), an entity's Audit `Traces` tab renders a trace listing over the
  usage log instead of the telemetry `UsageLog`. With either flag off, the tab renders the current
  telemetry `UsageLog` grid, unchanged.
- **The period control stays as it is today**: the same `TimeFilter` above the listing, the same presets,
  the same default (`DEFAULT_TIME_PERIOD`, two days), and the selection shared with the sibling Audit tabs.
  The listing reads only the selected period. The control does **not** take the telemetry range cap
  (`telemetryMaxRangeMs`): that cap describes the telemetry dataset, and the entity usage dashboard over
  the same usage log already renders its `TimeFilter` without one.
- **A row is a call to the entity**, not a trace. Its upper tier states that call — when it started, who
  made it, status, duration, tokens, cost; its lower tier states the trace it belongs to — span count and
  the trace's own totals. This is the two-tier card the session listing already renders, with its own call
  on top and its trace beneath.
  - For an application the call is usually the trace's root, so a card reads as the session card does.
  - For a model or a toolset the call is a child span; showing the trace's root instead would label every
    card with the caller's name rather than the entity's.
- **Newest calls first**, appended page by page as the reader scrolls, within the period the other Audit
  tabs share.
- **Opening a card opens its trace in place**, using the session page's trace view, with the entity's call
  already selected in the span tree.
- **Session-only parts of the card are not shown**: response ratings and the system-request marker. Both
  are defined against a session (its chat id, its project) that an entity listing does not have.
- **A toolset lists tool calls only**, not MCP connection traffic, which is most of its rows and says
  nothing about use.
- **The trace listing and the trace view stop assuming a session.** Their components take the session
  only where a session-only part needs it, so the entity tab reuses them rather than copying them.

## Non-goals

- **Sorting** the listing by anything other than start time, and **an errors-only filter**. A card list
  has no column headers to sort by; both are follow-ups once the listing is in use.
- **The Audit `Conversations` tab.** It stays on telemetry; its counterpart is the sessions listing scoped
  to an entity, a separate change.
- **Ratings or a system-request marker** in the entity listing.
- **Removing the telemetry `UsageLog`.** It stays behind the flags, and the `/usage-log` page is untouched.
- **Backend changes.** Everything reads columns the usage log has now.

## Open question carried into design

Locating an entity's calls has no index to lean on: the usage log is bloom-filtered on `chat_id`,
`trace_id` and `core_span_id` only, while this listing filters by `deployment` or `execution_path` over the
selected period. Its cost at the default two days and at the widest preset is unmeasured; a measurement
outside this change sets the page size, and if it shows the listing needs a range cap of its own, that cap is
discussed before it is specified. Newest-first
also requires keyset paging over each call's start time, which the session listing's specification
already names as the precondition for that order.

## Capabilities

### New Capabilities

- `analytics/entity-trace-listing`: the entity Audit `Traces` tab over the usage log — which entities
  get it and under which flags, what selects an entity's calls, the two-tier card, newest-first keyset
  paging, the period, opening a trace with the entity's call selected, and the telemetry fallback. Adds a
  row to the routing table in `analytics/spec.md`.

### Modified Capabilities

- `analytics/session-trace-detail`: a trace can be opened outside a session, with a given span
  preselected; the session-only facts it states are omitted when there is no session.
- `platform-models`: the model asset's Audit `Traces` sub-tab no longer reads telemetry unconditionally
  — it follows the analytics flags as the `Dashboard` sub-tab does.

## Impact

- `components/EntityTabs/Audit/EntityAudit.tsx` — the `Traces` branch chooses between the new listing
  and `UsageLog` by flag, as the `Dashboard` branch already does.
- `components/Analytics/SessionsTrace/Detail/` — `SessionTraceList`, `SessionTraceView` and
  `useSessionTrace` lose their hard dependency on `SessionScope`; the session page's behavior is
  unchanged.
- `utils/analytics/sessions-queries.ts` — new page and card queries scoped by entity; the existing session
  queries are not changed.
- `components/Analytics/Usage/utils/entity-scope.ts` — reused for what names an entity in the usage log.
- Shared Audit period: the new tab reads the same `TimeFilterValue` as its sibling tabs, so
  `custom-range-picker`'s Audit rules apply unchanged.

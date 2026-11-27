## Context

See proposal.md for why. The pieces this design builds on:

- `EntityAudit` switches its `Dashboard` branch on `analyticsUsageEnabled && hasEntityDashboard(view)`;
  its `Traces` branch renders `UsageLog` (telemetry, `TRACES_QUERY` / `MCP_QUERY`) unconditionally.
  `getAuditTabs` decides which routes offer `Traces` — Models, Applications, Toolsets, Assets toolsets,
  Platform models — and this change leaves it alone.
- The session trace listing reads the usage log in three passes (`sessions-queries.ts`): a **page** pass
  grouped by `trace_id` and filtered by the session id and project, a **roots** pass for the cards, and a
  **figures** pass for the trace totals. Only the page pass and the system-request marker know about the
  session; roots and figures are scoped by `trace_id` and the padded window.
- The trace view (`SessionTraceView`, `HopInspector` and its hooks) takes a `SessionScope`, but the body
  actions never filter by it — `readHopBody` takes no scope, and the comment above it says the scope "reaches
  no filter". It survives as a parameter and as part of the client-side read-cache key.
- `entity-scope.ts` already resolves the name the usage log records an entity under
  (`getEntityDeploymentName`) and the `own` predicate (`deployment = name`). The usage dashboard's MCP view
  already narrows toolset rows to tool calls (`event_kind` MCP and `mcp_method = 'tools/call'`).
- The usage log is bloom-filtered on `chat_id`, `trace_id` and `core_span_id` only; `project_id` leads the
  sort key and the table partitions by UTC day of `request_time`.

## Goals / Non-Goals

**Goals:**

- One page query whose unit is a call row, so newest-first paging needs no aggregate cursor.
- Reuse the session listing's card, figures pass and trace view without forking them.
- Leave the session page's behavior and its queries byte-for-byte unchanged.

**Non-Goals:**

- A shared abstraction over "session scope" and "entity scope" for the page pass. The two page passes answer
  different questions (traces touched by a session vs. calls to an entity) and share no predicate.
- Changing `getAuditTabs` or the telemetry `UsageLog`.

## Decisions

### D1. The page pass reads call rows, not traces

The page query is a **row** query over the usage log: `own` entity predicate, plus the tool-call predicate on
toolset routes, plus the selected period, sorted `request_time DESC, core_span_id DESC`, projecting the card's
call-tier fields directly (`trace_id`, `core_span_id`, `request_time`, `operation_duration_ms`, `success`,
`response_status`, `total_tokens`, `deployment_price`, `total_price`, `parent_deployment`, `project_id`,
`deployment`, `event_kind`, `request_uri`).

This collapses the session listing's page and roots passes into one: the card *is* the page row, so there is
no second read to find it.

*Alternative considered:* group by `trace_id` as the session page pass does and pick the entity's span in
the roots pass. Rejected — newest-first over an aggregate needs keyset paging on `min(request_time)` in a
`HAVING`, with the straddling-trace problem the session spec describes; and a model's traces are mostly
other entities' spans, so grouping first and filtering second reads more to show less.

### D2. Keyset paging on (request_time, core_span_id)

Each further page adds `request_time < t OR (request_time = t AND core_span_id < s)`, where `(t, s)` is the
last row shown. Because the unit is a row, a late-arriving row cannot move a row already shown, and the cursor
needs no `HAVING`. The client still discards a `core_span_id` it has already loaded, as the session listing
does, so a tie at the boundary never duplicates a card.

*Alternative considered:* offset paging ascending, as the session listing does. Rejected by the spec: an audit
reader wants the newest calls, and oldest-first over a 30-day period puts them at the end.

### D3. The figures pass is reused unchanged

The trace tier comes from `buildSessionTraceFiguresQuery(traceIds, window, limit)` over the page's distinct
trace ids. Its window is the page's own min/max `request_time`, expanded to whole UTC days and padded by a
day each side — the same rule and the same reason as the session listing (a trace's spans straddle its
entity call by up to tens of seconds, more for long calls). Its totals are then the trace's own, read by
trace and not by entity, which is what the spec's trace tier requires.

Grouping by trace (several cards under one trace) is done client-side over the page rows, reusing the
session listing's group shape (`SessionTraceGroup` with `cards`). A trace whose calls straddle a page boundary
gains its later card when the next page lands; the group is keyed by `trace_id` so the card joins the existing
group rather than opening a second one.

### D4. The trace view takes a read key, not a session

`SessionTraceView`, `HopInspector` and the inspector hooks replace `scope: SessionScope` with `readKey: string`
— the value the read cache is keyed by. The session page passes the session id (today's `scope.id`); the
entity tab passes the entity's usage-log name. The body server actions drop their `scope` parameter, which
reached no filter.

`useSessionTrace().onOpenTrace` gains an optional `initialSpanId`, since the hook already owns the selection:
it selects that span once the span read returns, and the entry hop when the read did not return it. The tree
is expanded by default, so its ancestors are already open; `SessionEventStream` scrolls the selection into
view once per opened trace.

*Alternative considered:* keep `SessionScope` and pass a synthetic `{ id: entityName }`. Rejected — it reads as
a session at every call site, and the next reader would reasonably add a session filter to it.

### D5. Session-only card parts are props, not forks

`SessionTraceList` takes `traceRatings` as optional; absent, no rating counts render. The system-request
marker is already driven by `card.isCoreInternal`; the entity listing sets it `false`. `hasSessionLabel`
is `false` likewise. No copy of the list component is made.

The call tier needs a caller and a project the session card does not show. These are added to
`SessionTraceCard` as optional fields and rendered only when present, so the session card is unchanged.

### D6. Flags and placement

The `Traces` branch of `EntityAudit` renders the new listing when `analyticsEnabled && analyticsUsageEnabled`
— the pair the `Dashboard` branch already reads — and `UsageLog` otherwise. `analyticsSessionsEnabled` is not
required: the listing reads the usage log, not the sessions entity, and the trace view is a component here,
not the `/sessions` route.

The listing lives under `components/Analytics/EntityTraces/`, next to `Usage/` which owns the entity
dashboard; it imports the session listing's components rather than moving them, so this change does not
relocate `SessionsTrace/`.

The data reads go through a new server action, `getEntityTracePage`, beside `getSessionTracePage` in
`app/[lang]/sessions/actions.ts`: it shares that file's token, client and figures query, and the trace view's
own reads already live there. The listing waits for the access check before its first read, as the entity
dashboard does, so a refused user is never sent a request that is bound to fail.

### D7. Period control

The listing renders `TimeFilter` from the shared Audit `TimeFilterValue`, without `maxRangeMs` — as
`EntityUsageDashboard` already does. Refresh and a period change reset the cursor and the loaded pages.

## Risks / Trade-offs

- [The page pass has no index on `deployment`; a busy model over 30 days or a long custom range may be slow]
  → Measured outside this change, at 2, 7 and 30 days on the widest-traffic entity available. The listing
  ships uncapped, as specified. If the measurement shows a cap is needed, it is decided with the product
  owner first and lands as a spec change — it removes presets the spec says are offered.
- [A call recorded after the first page is invisible until Refresh] → Accepted and specified; the same holds
  for the telemetry grid today.
- [The caller column (`parent_deployment`) may be empty for direct client calls] → Rendered as the unavailable
  placeholder, per spec; the project still identifies the client.
- [Renaming `scope` to `readKey` touches the session page's inspector call sites] → A mechanical change with no
  behavior difference; the session listing's existing tests cover it.

## Migration Plan

No data or backend migration. The change ships behind the existing flag pair; with either flag off the tab is
today's grid. Rollback is turning `ANALYTICS_USAGE_ENABLED` off, which also reverts the `Dashboard` tab — the
two tabs are deliberately switched together.

At archive, add the `analytics/entity-trace-listing` row to the routing table in `openspec/specs/analytics/spec.md`.

## Open Questions

- The page size. The session listing's page size is tuned for tens of traces; an entity's first page may want
  more rows. Settled by the external measurement, without changing specs or tasks.
- Whether the listing needs its own range cap. Not decided here: if the measurement says so, the cap is
  discussed before any change to the spec or the code.

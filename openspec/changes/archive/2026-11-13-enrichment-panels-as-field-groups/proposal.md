## Why

Since the Sessions source became configurable, every enrichment of the base table has its own panel on the session
detail page and its fields no longer reach the metadata panel. The enrichment panel drops every field the schema
types as an object, an array or a map, and the detail query does not even read them, so an enrichment's list-valued
fields that the metadata panel used to state are now stated nowhere. The two panels also present the same kind of
content — a record's fields grouped by tag — through two different controls with two different value formatters.

## What Changes

- Each enrichment panel presents its fields through the metadata panel's field groups: collapsible tag groups, one
  open at a time, the same rows, the same value formatting and the same copy control.
- Object, array and map fields of an enrichment are read by the detail query and rendered the way the metadata panel
  renders them: a list as its items separated by a comma, an object as its key–value pairs.
- A field the record carries no value for is shown as unavailable, as the metadata panel shows it, instead of being
  omitted.
- Every field-group row offers the schema's description of its field as a keyboard-reachable hint beside the label —
  in enrichment panels, in the metadata panel and in the span rail, which share the rows.
- An enrichment panel names its enrichment once: the namespace repeated as a source identifier beside the title is
  dropped. The enrichment table's description is offered as a tooltip on the title, read from the table definition
  the page already fetches for the tag order.
- Enrichment panels move below the usage, metadata and feedback panels.
- The feedback panel of an unrated session states "no ratings" instead of two zero counts above that statement, and
  an instance with no rating enrichment gets no feedback panel at all.
- Kept as they are: the panel per enrichment and its title, the tag order (declared order, then others, `system`
  last), the summary paragraph above the groups, the Title role field left out of the panel, the rating enrichment
  having no panel, and the "not exposed" / "not yet evaluated" states.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/session-trace-listing`: the enrichment panels' presentation, field set, empty-value rule and
  descriptions; field descriptions in the metadata panel's groups.
- `analytics/session-trace-detail`: field descriptions in the span rail's groups, which share the rows.

## Non-goals

- A display name for an enrichment panel: the table definition carries none, so the title stays the namespace.
- Changing how the metadata panel or the span rail open, order or preview their groups.

## Impact

- `components/Analytics/SessionsTrace/Detail/`: `SessionDetailRail`, `SessionDetailPanel`, `SessionEnrichmentPanel`,
  `SpanGroupPanel`, `SpanFactRow`, `SpanObjectFactRow`.
- `utils/analytics/session-insights.ts` (`enrichmentColumnsOf`, `enrichmentPanelsOf`),
  `utils/analytics/session-column-catalog.ts` (`groupSchemaFields`), `utils/analytics/sessions-queries.ts` (detail
  projection).
- `models/analytics/sessions-trace.ts` (`SpanFieldDescriptor`, `SessionEnrichmentPanel`).
- `app/[lang]/sessions/actions.ts` (`getEnrichmentTagOrders`) and `app/[lang]/sessions/[id]/page.tsx`.
- The span rail shares the field-group rows, so its fields gain description hints as well.

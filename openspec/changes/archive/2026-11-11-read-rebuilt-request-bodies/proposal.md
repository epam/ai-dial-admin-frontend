## Why

The analytics service can now store a chat request body as a per-turn delta: a hop's `request_body` then holds
only the messages its parent turn did not have, without the system keys, `tools` and `cache_control` markers it
shares with it. The hop inspector reads `request_body` as the whole request, so on an instance running delta
storage it silently shows a truncated request — wrong message list, wrong role counts, no tools — with nothing
telling the reader it is incomplete. The same service release adds the rebuilt body as a computed field and marks
computed fields `projection_only` in schema discovery; a builder that offers such a field in a filter, sort,
group-by or function argument gets the whole query rejected. This frontend change lands together with that
service release.

## What Changes

- The hop inspector's request side reads `request_body_full` (the whole request, rebuilt by the service) and
  `request_body_rebuild` (its status) instead of `request_body`, in every tier that decodes the request: the
  envelope, one message in full, the raw view, and the MCP, protocol and embedding facts.
- Which request column is read stays a schema decision: an instance whose schema does not report
  `request_body_full` is read from `request_body`, as today.
- A request whose rebuild status is `partial` renders what was recovered and states visibly that the request is
  incomplete. It is an expected state, not an error.
- The entity schema field type carries `projection_only`. A projection-only field is offered only as a row-mode
  Select projection: never as a Filter operand, Group by column, Sort key, Having operand, aggregate or measure
  operand, or function argument — in the Query Builder and in the pipeline editors.
- The existing type-based withholding of `map`, `array` and `object` fields stays as it is; the flag adds to it.

## Non-goals

- No change to the response side, the assembled response, or the Chat tab's choice of span.
- No search over request text, and no filter on `request_body_full`.
- No byte-for-byte comparison of a rebuilt body against any stored body or `request_body_bytes`.
- No change to the sessions listing grid: the new fields are heavy and sensitive and are never projected over a
  page.
- No frontend switch for the service's storage mode; the frontend reads the same columns under every mode.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/session-trace-detail`: the request side reads the rebuilt body where the schema reports it, and
  states a partially rebuilt request as incomplete.
- `analytics/query-builder`: a projection-only field is offered only as a row-mode Select projection.
- `analytics/pipelines`: a projection-only field is never offered as a filter, group key, measure, order or
  variable operand.

## Impact

- Hop body read and decode: `app/[lang]/sessions/actions.ts`, `utils/analytics/session-column-catalog.ts`
  (`hopBodyFields`), `utils/analytics/hop-inspector/*`, `models/analytics/sessions-trace.ts`,
  `constants/analytics/sessions-trace.ts`.
- Inspector request panel and its i18n keys under `components/Analytics/SessionsTrace/Detail/Inspector/`.
- Schema type `models/analytics/entity.ts` (`AnalyticsEntityField`).
- Query Builder option helpers (`components/Analytics/QueryBuilder/utils/fields.ts`, `sql-completions.ts`) and
  the pipeline editors (`Filter`, `Aggregate`, `Enrich`).
- Depends on the analytics service release that adds `request_body_full`, `request_body_rebuild` and
  `projection_only`; against an older service every changed screen behaves as today.

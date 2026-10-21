## Why

The session detail view under-reports what it already has. A trace card states only a time of day, so a session
that spans days cannot be read in order. The Metadata panel lists a handful of curated fields, offers no way to
copy a value, and gives no route to the rest of the record — while the span rail beside it presents every
recorded field, grouped, with a JSON dump. The Usage panel leads with a total that hides the two figures a
reader tunes against, prompt size and how much of it the cache served.

## What Changes

- A trace card's start states a date and a time instead of a time of day.
- The Metadata panel presents every non-heavy field the `sessions` schema reports, grouped by the schema's own
  tags in the same collapsible groups the span rail uses, instead of a curated list. Fields another panel
  already states are omitted from the groups, as the span rail does.
- Each value in the Metadata panel can be copied, and the panel offers an Open JSON control that presents the
  whole session record in the shared viewer.
- The session detail query projects the schema-reported fields instead of the fixed `SessionsField` list.
- The Usage panel replaces **Total tokens** with **Cache hit**, the share of prompt tokens served from cache,
  next to Tokens in (prompt) and Tokens out (completion).
- `cached_prompt_tokens` is read as an optional column: an instance whose `sessions` entity lacks it shows the
  figure as unavailable rather than failing the query.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/session-trace-listing`: the usage panel's figures and the metadata panel's field set change
  (modified requirement); the card's start, the grouped and copyable metadata, and the record's JSON dump are
  added requirements.

## Non-Goals

- No change to the Insights or Feedback panels, to the span rail, or to the transcript.
- No new backend read: the dump presents the record the detail query already returns.
- No per-session cache-creation or reasoning-token figure in the Usage panel; they appear in the Metadata
  groups and the dump only.
- No copy control on the span rail in this change.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/SessionsTrace/Detail/` — `SessionDetailRail.tsx`,
  `SessionTraceList.tsx`, the Metadata panel and its group rendering.
- `apps/ai-dial-admin/src/utils/analytics/` — `sessions-queries.ts` (detail projection),
  `session-column-catalog.ts` (schema-to-groups helper shared with the span rail), `session-detail-fields.ts`
  (cache-hit figure).
- `apps/ai-dial-admin/src/constants/analytics/sessions-trace.ts`, `src/models/analytics/sessions-trace.ts`,
  `src/locales/en.ts`, `src/constants/i18n.ts`.
- Shared `Common/*` components are used as they are; any mismatch is handled in a wrapper.

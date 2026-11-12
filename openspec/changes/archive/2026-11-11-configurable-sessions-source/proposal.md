## Why

The Sessions pages are bound to fixed catalog names: the `sessions` rollup, its `client_session_id`,
`last_request_time`, `project_id`, `total_price` and `turn_count` fields, the `session_insights` enrichment,
and the `response_ratings` rollup. An instance whose session rollup is named or shaped differently cannot use
the pages at all, and an enrichment added to the rollup reaches the grid but not the detail view, which only
knows `session_insights`. Ratings are the one source outside the base entity and its enrichments, so they
cost a second query on every page and a second code path for the filter, the column and the pills.

## What Changes

- An instance-wide **Sessions source** setting on the System Properties page: one base table, chosen from the
  analytics catalog, and the fields that play six roles in it — session id, time and project (required), title,
  cost and turns (optional). Each role offers only fields of a fitting type. Without a stored setting the pages
  use today's binding, so nothing changes for an instance that never opens the tab.
- The setting states, next to the table picker, that the table must carry the same session id the usage log
  records, or a session's traces read as empty. Compatibility is not checked.
- The Sessions pages read from the configured table and its role fields instead of fixed names. The base table
  brings every enrichment the catalog attaches to it; no other table is added to the composition. Traces keep
  reading `dial_usage_log`.
- An empty optional role hides what depends on it: no title shows the session id, no cost or turns hides that
  pill and column.
- The detail view renders **one panel per enrichment** of the base table, in the insights panel's current form,
  instead of a single panel tied to `session_insights`. Panel title, field labels and field grouping come from
  the catalog.
- **BREAKING (catalog):** ratings move into enrichments. A session-grain rating enrichment on the base table
  feeds the Rating column, the feedback filter and the rated/negative pills; a response-grain rating enrichment
  on `dial_usage_log` feeds the span rating and the session's feedback panel. The second query over
  `response_ratings` is removed. An enrichment is recognised by its rating fields, not its name; an instance
  without one renders no ratings.
- The rated pill changes meaning: it counts rated sessions among those active in the period, not sessions rated
  during the period.
- The grid's saved column state records the table it was saved for and is discarded on load when the setting
  names another table.

## Non-goals

- Joining tables other than the base table and its enrichments into the Sessions composition.
- Checking that the chosen table shares its session id with the usage log.
- Making the trace view work over a hop log other than `dial_usage_log`.
- Per-user or per-role source selection: the setting is one value per instance.
- Changing how the rating counts are composed (positive; zero plus negative; the captured-form caveat).

## Capabilities

### New Capabilities

- `analytics/sessions-source`: the instance-wide Sessions source setting — its table and role fields, where it is
  edited and stored, its defaults, and how the Sessions pages resolve every fixed name through it.

### Modified Capabilities

- `analytics/sessions-listing`: the feedback filter, the Rating column and the rated/negative pills read the
  session rating enrichment instead of a second query; provenance colours are assigned per enrichment; the saved
  column state is scoped to the configured table.
- `analytics/session-trace-listing`: one panel per enrichment replaces the single insights panel; the header title
  comes from the title role; the feedback panel reads the response rating enrichment on the usage log.
- `analytics/session-trace-detail`: a span's rating is read from the response rating enrichment on its own usage-log
  row.
- `system-properties`: the page gains a Sessions source tab that saves to the analytics service, independently of
  the Core global-settings save.

## Impact

- Code: `src/constants/analytics/sessions-trace.ts` (fixed entity and field names),
  `src/utils/analytics/sessions-queries.ts`, `session-column-catalog.ts`, `session-insights.ts`,
  `session-enrichment.ts`, the `SessionsTrace` list, header and detail components, `src/app/[lang]/sessions/actions.ts`,
  the System Properties page and its actions, a new analytics settings API client under `src/server/analytics/`.
- Backend: the analytics service stores the setting; the two rating enrichments and the intermediate session rating
  rollup are catalog objects provisioned per instance.
- Deployment: an `INFRA-CHANGELOG.md` entry stating the analytics-service version and the rating enrichments as prerequisites.
- Docs: `openspec/specs/analytics/spec.md` routing table gains the new sub-capability.

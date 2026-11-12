## Context

See proposal.md — Why. The fixed names live in `src/constants/analytics/sessions-trace.ts` (`SESSIONS_ENTITY`,
`FEEDBACK_ENTITY`, `USAGE_LOG_ENTITY`, `INSIGHTS_ENRICHMENT`) and in the `SessionsField` enum of
`src/models/analytics/sessions-trace.ts`, whose members double as the default role fields. Enrichment discovery
already exists for the grid: `session-enrichment.ts` splits a qualified name into namespace and field, the column
catalog and the provenance line are derived from the schema. Three places still key on `session_insights` by name:
the identity title, the insights panel (`session-insights.ts`) and the projection class test in
`session-column-catalog.ts`.

The analytics service exposes an entity as its source plus every enrichment flattened in, filters `sensitive`
fields by the caller's role, and declares each enrichment's grain and cardinality in its table definition. Its
pipeline rules shape the rating design: an `aggregate` pipeline writes only a materialized source; an `enrich`
pipeline with a `sql` transform is row-grain only, refuses aggregate functions, and needs an input that carries
the target's grain key by name; a target column derived from a `sensitive` input column must itself be `sensitive`;
an enrichment column cannot be array-typed.

## Goals / Non-Goals

**Goals:**

- One resolved source object per request replaces every fixed entity and role-field name in the Sessions code.
- Every enrichment-specific feature finds its enrichment by the fields it needs, never by its name.
- Ratings reach the pages only as enrichment fields: of the base entity for session figures, of the usage log for
  response figures.

**Non-Goals:**

- A generic relation model between catalog tables.
- Changing the trace listing's three-query shape or the hop body reads.

## Decisions

### 1. One resolved `SessionsSource` per request, built on the server

The page server component reads the stored setting (or the default binding), fetches the base entity's schema as it
already does, and resolves both into one `SessionsSource`: the base entity name, the six role fields each either a
schema field or absent, and the list of enrichment namespaces with their fields. Server actions take the base entity
and role fields from it instead of from constants; the client receives it as an initial-data prop next to the schema.

Resolving against the schema, not the stored binding, is what makes a role absent for a caller whose role hides its
field (spec: "An unbound optional role hides what depends on it"). A required role that resolves absent fails the page
before any session query.

*Alternative:* keep the constants and swap their values at runtime. Rejected: the constants are module-level and
shared across callers, while the resolution is per caller.

Server actions resolve the source again on every call rather than trusting one sent by the client: the schema is
filtered by the caller's role, and the client never carries resolved field names back.

`SessionsField` keeps its role members as **canonical names**. The grid's curated role columns stay bound to them; the
query builders translate a canonical name to the field the source binds (`sourceFieldOf`), and each returned row has
the bound values copied onto the canonical keys (`canonicalSessionRow`). That keeps every cell renderer, the row id
and the detail link unchanged for any binding, and confines the translation to the action boundary. Fields that are
not roles (`traces`, the token columns, `deployments`) stay schema-derived columns, as today.

### 2. The setting is one analytics-service value, behind one API file

The setting is read and written through a new `src/server/analytics/sessions-source-api.ts`, one file owning the
transport, in the shape of `dashboards-api.ts`. The value is
`{ baseTable, roles: { sessionId, time, project?, title?, cost?, turns? } }`, field names as the base entity's schema
spells them, enrichment fields qualified.

*Alternatives:* DIAL Core global settings — rejected, Core owns that schema and the System Properties save already
guards it with `If-Match`; browser storage or an environment variable — rejected, the value is changed from the UI and
must be the same for every caller.

### 3. The System Properties tab owns its own save cycle

The Sessions source tab is a separate form inside the System Properties view: its own dirty state, Save and Discard,
and its own server actions, so a failure of one store never reads as a failure of the other. Pickers are ui-kit
selects over the schema fields, filtered by role type; the base-table picker lists `adas`-listed entities. The
compatibility caveat is static text under the picker.

### 4. Enrichment-specific features are recognised by field signature

Two signatures are defined in one constants file:

- **rating** — `rate_pos_count`, `rate_zero_count`, `rate_neg_count` (used on the base entity and on the usage log);
- every other namespace is a **generic panel**.

The first namespace carrying the rating signature is the rating enrichment for its entity. `INSIGHTS_ENRICHMENT`
disappears: the insights panel becomes the generic enrichment panel rendered once per namespace, the projection rule
keys on "is an enrichment field" rather than on one namespace, and provenance colours come from a palette indexed by
namespace order.

*Alternative:* configure each enrichment's purpose in the setting. Rejected: it re-introduces the name binding the change
removes, and a new enrichment would need a settings edit to appear.

Panel title: the catalog defines no display name for a table, so a panel is titled by its namespace. Each
enrichment's table definition is read once per detail page for its `tag_order`; a failed read costs that order,
not the panel. Field grouping applies the tag rule in the spec in a pure util.

### 5. Ratings arrive as two enrichments the analytics service provides

The frontend depends on the enrichments' shape, not on how the service builds them:

| Enrichment | Parent | Grain | Fields the pages read |
| --- | --- | --- | --- |
| session rating | the base entity (`sessions` by default) | session id, `zero_or_one` | the rating signature, value-less, boolean-false, captured-form, event and comment counts, first and last rating time |
| response rating | `dial_usage_log` | `response_id`, `zero_or_one` | the rating signature, the same counts, first and last rating time, `comment_sample` |

- The counts are the ones `response_ratings` carries today, summed per session for the session enrichment.
- **Sensitivity mirrors the originals.** Every count is non-sensitive; `comment_sample` is sensitive, as it is in
  `response_ratings`. A caller without the role sees the counts and no comment.
- An enrichment column cannot be an array, so the response enrichment carries one comment sample and the comment
  count, not the full comment set.

Neither is named anywhere in this repo. A rating enrichment is any enrichment of its parent that carries
`rate_pos_count`, `rate_zero_count` and `rate_neg_count`; its name, its pipelines and how it is fed are the
instance's choice, and an instance without one renders no ratings. One way to build both from today's catalog
objects:

```
rate_analytics ─aggregate (sql)─▶ session_ratings_rollup   source, key client_session_id
                                   (chat_id renamed, blank chat_id filtered)
                                        │ enrich (sql, pass-through)
                                        ▼
                                  session_ratings           enrichment on sessions, zero_or_one

response_ratings ─enrich (sql, pass-through)─▶ response_feedback   enrichment on dial_usage_log,
                                                                   grain response_id
```

- An `aggregate` pipeline must target a source, which is why this build needs an intermediate table; the `enrich`
  step only passes columns through, because a `sql` enrich cannot aggregate.
- `response_ratings` already carries `response_id`, so the usage-log enrichment needs no intermediate table.
- The service refuses a non-sensitive column derived from a sensitive one, so the mirrored sensitivity is enforced.

These are catalog objects, provisioned per instance through the analytics API; nothing in this repo creates them.

### 6. Saved column state carries its table

The saved state stays where the shared grid keeps it; a marker next to it, `analytics/sessions/base-table`, records
the table it was saved for. On load the list compares the marker with the resolved source, clears a mismatched state
before the grid reads it, and rewrites the marker. A missing marker (a state saved before this change) counts as saved
for `sessions`, so an instance on the default binding keeps its users' layouts.

*Alternative:* wrap the stored state as `{ baseTable, state }`. Rejected: the state is written and read by the shared
grid component, and wrapping it would change that component for one caller.

## Risks / Trade-offs

- [The chosen table does not share the usage log's session id] → traces read as empty; the tab states the requirement
  next to the picker, and the change deliberately does not check it.
- [An instance upgrades without a rating enrichment] → rating features disappear rather than fail; the `INFRA-CHANGELOG.md` entry states the field signature an enrichment needs to bring them back.
- [The rated pill changes meaning] → it now counts rated sessions among the active ones; the pill caption already names
  the period, and the release note states the change.
- [Rating freshness] → the rating enrichment is materialized on a schedule; a fresh rating appears after its next run,
  not on the next page load.
- [The feedback panel loses the full comment set] → it shows the comment count and one sample; the full set stays
  readable in the Tables page for callers entitled to it.
- [A second namespace carries the rating signature] → the first in schema order wins; the other renders as a generic
  panel, so nothing is lost silently.

## Migration Plan

1. Upgrade the analytics service to a version that serves `GET`/`PUT /v1/settings/sessions-source`. Reading the
   setting needs `SETTINGS_READ`, which every read-only bundle carries; a `roles-mapping` that names raw
   privileges must add it for Sessions users, who otherwise get the source error. Saving needs `SETTINGS_WRITE`.
   For ratings, give the base table and `dial_usage_log` each an enrichment carrying the rating signature, and
   materialize them.
2. Deploy the frontend. Without a stored setting it runs on the default binding.
3. Rollback: redeploy the previous frontend. The enrichments are additive and the previous build ignores them; the
   stored setting is ignored too.

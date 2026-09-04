## Why

The analytics service folded its two declaration registries into one. What the console knows as an
enrichment rule is now a pipeline of `kind: enrich`, sharing one registry, one identity and one DTO
family with the aggregate pipelines that build the rollups the analytics pages already read.
`/v1/rules` was **deleted, not deprecated**, and the dev environment already serves the new contract —
so the Enrichment Rules page is broken now, not at some future deploy.

Repairing it against the merged contract also removes an asymmetry the console has carried since the
analytics feature shipped: it presents the declarations that enrich rows and hides the ones that build
rollups, even though both are the same kind of object and an operator asking "why is this table stale"
needs whichever one owns the table. One registry on the service is what makes one registry in the
console cheap.

## What Changes

- **BREAKING** The Enrichment Rules feature is renamed to Pipelines throughout: the route becomes
  `/pipelines`, i18n key enums, model, util and component filenames, and the component directory follow.
  `/enrichment-rules` is **not** redirected — it resolves to the not-found page.
- **BREAKING** A pipeline is addressed by `name`, not by a UUID `id`. The detail route becomes
  `/pipelines/{name}`, and the console loses the ability to rename a declaration in place, because the
  service made `name` an immutable identity.
- **BREAKING** The client re-paths onto `/v1/pipelines`: listing with `kind`, `enabled` and
  `updated_since` filters and the `{"pipelines": […]}` envelope; a full replace becomes
  `PATCH /v1/pipelines/{name}`; the declaration reshapes (`target_enrichment` → `target`, `source` →
  `inputs` as a list, `filter_sql` → `filter`, the five trigger members nesting under `trigger`).
- The listing presents **both kinds** in one grid, with the kind as a column. Aggregate pipelines
  become visible in the console for the first time. It drops the grain key and the version column: the
  service resolves those only for a listing narrowed to one kind, so on a mixed listing they could only ever
  be empty.
- Registration collects only what the service requires and always registers a pipeline **not running** —
  enabling it is done from its own page, where its declaration can be read back first. Everything optional is
  edited there too.
- The detail page becomes one frame — identity row, read-only facts, read scope, runtime state, JSON
  editor, save bar — with the transform section chosen by kind: the enrichment section as it is today,
  and a new aggregate section authoring group keys, measures and the freshness mode.
- A pipeline's runtime `state` is presented read-only: when it last ran, how far behind it is, what
  held its window short, whether a rebuild is required. Today the console shows none of this, so a
  stale analytics page has no explanation reachable from the console.
- The measure function list is derived from the served function catalog the console already fetches —
  the aggregate group, restricted to functions a single column can satisfy — rather than being
  enumerated in the frontend.
- A caller without full-admin rights keeps the read-only presentation the rule pages already apply. The
  service currently answers `403` on a pipeline read; until it restores read access, such a caller
  resolves to the forbidden page rather than to a load-failure message that would misstate the cause.

## Non-goals

- Preview and refresh actions for an aggregate pipeline. The service exposes both; surfacing them is a
  separate change with its own confirmation and result-reporting questions.
- Any presentation of pipeline health outside the pipeline itself — annotating the analytics pages with
  "this table is stale because…" is the follow-up this change makes possible, not part of it.
- The `external` pipeline kind, which the service declares but does not implement.
- Promoting the query builder's own presentation components into a shared location. They bake in that
  surface's visual language with no override seam, and this change authors its editors in the form
  language the rule pages already use.
- Deleting a pipeline of either kind is out of scope beyond what the rule pages already offer.

## Capabilities

### New Capabilities

None. Analytics requirements live in the single consolidated `analytics` spec.

### Modified Capabilities

- `analytics`: the enrichment-rule requirements re-path onto the pipeline registry and re-address by
  `name`; the listing requirement widens to both kinds; the detail-page requirements split into a
  kind-independent frame plus a per-kind transform section; new requirements cover the aggregate
  declaration's authoring surface, the read-only runtime state, and the forbidden-page fallback for a
  caller the service refuses.

## Impact

- **Routes**: `/enrichment-rules` and `/enrichment-rules/[id]` are removed; `/pipelines` and
  `/pipelines/[name]` replace them. Breadcrumb and menu configuration follow.
- **Service contract**: the client moves off `/v1/rules` entirely. It continues to read the function
  catalog from `/v1/queries/functions`, which is unchanged.
- **Code**: `src/components/Analytics/EnrichmentRules/` becomes `Pipelines/` with a shared subtree and
  one subtree per kind; `models/analytics/rule.ts`, `utils/analytics/rule-dto.ts`,
  `utils/analytics/rule-list-item.ts` and `constants/analytics/enrichment-rules.ts` are renamed;
  `server/analytics/analytics-data-api.ts` re-paths its rule methods.
- **Adjacent features**: the evaluator pages compute their used-by count and populate their Pipelines tab
  from the pipelines listing, so both follow the rename and the new envelope. They narrow the read to
  `kind=enrich` — only that kind declares an evaluator, and only a kind-scoped listing comes back resolved,
  which is what the tab's resolved-version cell reads.
- **Permissions**: a full-admin caller is unaffected. A read-only caller reaches the forbidden page
  until the service restores read access, where today they reach a read-only page.
- **Tests**: the enrichment-rule and evaluator suites follow the rename; the permission suites are kept
  rather than retired, because the read-only presentation they cover is the shape the service returns to.

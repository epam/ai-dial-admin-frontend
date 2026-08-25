## Why

The Analytics section already exposes the two halves of the enrichment pipeline that operators can
see — the Tables catalog (where enrichment results land) and the Query Builder (where they are read)
— but not the binding that produces them. An **enrichment rule** ("with this evaluator, from this
table, over these rows, into this enrichment table") today exists only as an API object: it can be
registered with `POST /v1/rules`, but an operator has no way to see which rules exist, which are
running, or what a stalled enrichment is bound to. When an enrichment stops producing values, the
first question — "is this rule never registered, or registered but switched off?" — cannot be
answered from the admin console at all.

This change makes the rule registry visible and creatable. It is the first of two: the rules listing
and the create modal here, the full rule detail page (edit every field, `PUT` full-replace) as a
follow-up.

## What Changes

- **New route `/enrichment-rules`**, added to the Analytics menu group alongside Tables and Queries,
  and gated by the same `isAnalyticsForbidden()` server check the other Analytics pages use.
  - Named `enrichment-rules` rather than `rules` deliberately: `src/components/Rules/` and
    `RuleFolderProvider` already mean *entity access rules* in this app.
- **Rules listing grid** — name (links to the not-yet-built detail route), target enrichment, source,
  trigger (kind badge with cron / `by {group_by}` beneath), evaluator (`name@version` with an
  `llm`/`sql` type badge), grain key, version column, enabled badge, generation, updated-at.
- **Delete from the listing** — a per-row action with a danger confirmation, mirroring the Tables
  catalog. Without it this change would ship a registry with no way to remove anything, since the
  detail page is deferred.
- **Server-side listing filters** — `enabled` (all / enabled / disabled) and `updated_since`
  (preset → ISO instant), refetched through a server action. The `enabled` parameter is **omitted
  entirely** for "all"; the backend rejects an empty value with 400.
- **Create-rule modal**, assembling a complete rule in one request (the API has no draft state):
  name, evaluator + version, target enrichment, trigger kind with its conditional block, output
  bindings, enabled.
- **Four form controls that a plain input cannot express** — an output-bindings repeater of two
  dependent, mutually-exclusive selects; a six-field cron control (the backend never parses the
  string, so the UI is the only guard); a duration control for `ready_when`; and a derived read-only
  `group_by` (it must equal the target's grain key exactly).
- **New Analytics server API surface** — rules CRUD and the evaluator lookups
  (`GET /v1/evaluators`, `/{name}`, `/{name}/versions/{v}`) on the existing `AnalyticsDataApi`.
- **Rule creation is gated to full admins** — unlike tables, a rule DTO carries no per-entity
  `permissions` object, so registering and enabling is `FULL_ADMIN`-only per the backend contract.

### Non-goals

- **The rule detail page.** Deferred to the follow-up change, together with the controls only it
  needs: `filter_sql`, `input_bindings`, `member_select` (`prefer_sql`, `order_by`, `limit`),
  the declared-vs-inherited `source` radio, `sampling`, and the execution knobs (`cadence`,
  `batch_scan_limit`, `batch_chunk`, `rate_rpm`, `priority`). The listing's name column links to
  `/enrichment-rules/{id}`, which that change adds.
- **`ready_when.signal`** — the SQL-predicate half of the readiness declaration. Only *one* of
  `signal` / `idle` / `max_staleness` is required, so the modal's duration control alone produces a
  valid `group` rule. Deferring it keeps all three SQL predicate fields, and the `SqlEditor`
  refactor they share, in one change.
- **Enabling or disabling a rule from the listing.** `PUT` is a full replace, so a toggle would have
  to read the rule, flip one member, and write the whole object back — that belongs with the detail
  page's save path rather than being built twice.
- **The data plane** (`/scan`, `/group-rows`, `/materialize`, `/rows`). A separate task on the
  detail page.
- **An evaluator management screen.** Evaluators are registered outside the UI. The one consequence
  handled here: an empty evaluator list makes rule creation impossible, so the create action is
  disabled with an explanatory note rather than opening a modal that cannot be submitted.
- **Client-side SQL validation.** Not introduced anywhere in this change; predicate validation stays
  backend-authoritative, consistent with the existing "SQL validation is backend-authoritative"
  requirement.

## Capabilities

### New Capabilities

None. Enrichment rules are part of the Analytics feature, whose requirements are consolidated into
the single master spec.

### Modified Capabilities

- `analytics`: adds requirements for the enrichment-rules route and menu entry, the rules listing
  grid and its server-side filters, the create-rule modal and its conditional trigger block, the
  four bespoke form controls, the rules/evaluators server API layer, and full-admin gating of rule
  creation.

## Impact

**New code**

- `src/app/[lang]/enrichment-rules/{page.tsx, actions.ts}`
- `src/components/Analytics/EnrichmentRules/` — listing view, toolbar, trigger and evaluator cell
  renderers, create popup, output-bindings editor, cron field, duration field, and the form hook
  holding the modal's fetch graph
- `src/models/analytics/{rule.ts, evaluator.ts}`

**Modified code**

- `src/server/analytics/analytics-data-api.ts` — rules CRUD + evaluator lookups. Note the listing
  envelope is `{items: [...]}`, not the `{tables: [...]}` shape the tables methods unwrap.
- `src/components/Menu/menu-configuration.tsx` — one item in the existing Analytics group
- `src/constants/i18n.ts` + `src/locales/en.ts` — a new `AnalyticsEnrichmentRulesI18nKey` enum
- `src/types/routes.ts` — `AnalyticsEnrichmentRules = '/enrichment-rules'`

**Backend**

`analytics-data-access-service` (`DIAL_ANALYTICS_API_URL`), already wired. No backend change is
required; the endpoints exist.

**Risks to existing features**

- Low coupling: no shared component is modified, and the new route sits inside the already
  feature-flagged, preview-tagged Analytics group.
- One payload consideration rather than a risk: the listing inlines each rule's fully resolved
  evaluator, including an `llm` evaluator's complete `request_template` and `response_schema` — on
  the dev instance one rule alone carries ~4KB of prompt text the grid never reads. The listing
  server action projects the response down to the fields the grid uses.

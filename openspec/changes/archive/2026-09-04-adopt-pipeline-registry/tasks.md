## 1. Transport and model

- [x] 1.1 Replace `models/analytics/rule.ts` with `models/analytics/pipeline.ts`: add `PipelineKind`,
      `TruncUnit` and `FreshnessMode` enums; reshape the declaration (`target`, `inputs: string[]`, `filter`,
      nested `trigger`, `group_by: GroupKey[]`, `measures: Measure[]`, `freshness`); drop `id`; add the
      read-only `state` shape. Keep types in the model file per `.claude/rules/code-standards.md`.
- [x] 1.2 Re-point `server/analytics/analytics-data-api.ts` at `/v1/pipelines`: `PIPELINES_URL`,
      `PIPELINE_URL(name)`, the `kind`/`enabled`/`updated_since` list filters, `unwrapList(res,'pipelines')`,
      and `patchAction` in place of `putAction` for the save.
- [x] 1.3 Rename `utils/analytics/rule-dto.ts` to `pipeline-dto.ts`: `READ_ONLY_MEMBERS` loses `id` and gains
      `state`; split assembly into a shared part plus a per-kind contribution; re-point the follow-versus-pin
      inference at `inputs` (design D-9).
- [x] 1.4 Rename `utils/analytics/rule-list-item.ts` to `pipeline-list-item.ts` and project both kinds,
      leaving the other kind's members absent rather than empty.
- [x] 1.5 Stop collapsing the refusal signal in `app/[lang]/pipelines/actions.ts`: keep `undefined` (refused)
      distinct from `null` (failed) through the server actions (design D-6).
- [x] 1.6 Unit tests for 1.1–1.5: DTO assembly per kind, read-only stripping, follow-versus-pin on `inputs`,
      list-item projection for both kinds, and the refusal-versus-failure distinction.

## 2. Rename and route

- [x] 2.1 Move `app/[lang]/enrichment-rules/` to `app/[lang]/pipelines/`, with `[id]` becoming `[name]`. The
      old route is not redirected.
- [x] 2.2 Move `components/Analytics/EnrichmentRules/` to `components/Analytics/Pipelines/` with the
      `Common/`, `Enrich/` and `Aggregate/` subtrees from design D-2; rename `RuleSection` to
      `PipelineSection`.
- [x] 2.3 Rename `constants/analytics/enrichment-rules.ts` to `pipelines.ts` and
      `models/analytics/enrichment-rules-ui.ts` to `pipeline-ui.ts`.
- [x] 2.4 Rename the i18n key enums in `constants/i18n.ts` (`AnalyticsEnrichmentRulesI18nKey` and
      `RulesI18nKey` to `AnalyticsPipelinesI18nKey`) and update the strings in `locales/en.ts`, including the
      menu and breadcrumb labels.
- [x] 2.5 Update `types/routes.ts` (`AnalyticsPipelines`), `components/Menu/menu-configuration.tsx` and
      `components/Breadcrumbs/constants.ts`.
- [x] 2.6 Follow the rename through the evaluator pages: `utils/analytics/evaluator-usage.ts`,
      `components/Analytics/Evaluators/EvaluatorRulesGrid.tsx` (renamed for the tab) and
      `EvaluatorDetailView.tsx`, including the `Pipelines` tab label and the `/pipelines/{name}` row link.
- [x] 2.7 Update the moved and evaluator test suites for the rename, keeping the permission suites rather
      than retiring them.

## 3. Shared frame, enrichment section and the refusal fallback

- [x] 3.1 Build `PipelineDetailView` as the shared frame — identity row, read-only facts, read scope,
      trigger, JSON editor toggle, save bar — with the kind branch as its only branch (design D-1).
- [x] 3.2 Split `use-rule-form.ts` into `Common/use-pipeline-form.ts` plus `Enrich/use-enrich-form.ts`
      (design D-3).
- [x] 3.3 Move the enrichment-only controls into `Enrich/`: evaluator and version, input and output bindings,
      member selection, readiness, execution knobs.
- [x] 3.4 Present the name as a read-only identity with a copy control, and validate it against the service's
      identity grammar on the create path.
- [x] 3.5 Add `Common/PipelineStateSection` presenting the runtime `state` read-only — last and next run, lag,
      last error, backlog, clamp, required rebuild — with absent members shown as absent.
- [x] 3.6 Render `Page403` on a refused listing or a refused pipeline read, keeping the load-failure console
      for every other failure.
- [x] 3.7 Re-point the JSON editor at the pipeline document: exclude derived members, and surface the
      cross-kind, unrecognised-field and immutable-identity refusals as the service words them.
- [x] 3.8 Unit tests for 3.1–3.7: the kind branch, the state section's absent-member handling, the refusal
      fallback, and the JSON document's excluded members.

## 4. Listing over both kinds

- [x] 4.1 Rebuild `PipelinesView` over the unfiltered listing of both kinds, adding the kind column and
      rendering an em dash for a column belonging to the other kind.
- [x] 4.2 Re-point the name cell and the delete action at `name`, keeping the name rendered as text rather
      than as a link.
- [x] 4.3 Compute the taken-targets exclusion across the whole listing rather than one kind.
- [x] 4.4 Unit tests for 4.1–4.3, including a row of each kind and the cross-kind target exclusion.

## 5. Aggregate section

- [x] 5.1 Add `Aggregate/GroupKeysEditor`: ordered rows offering a column or a truncation, the unit list
      narrowed to what the column's type admits, and an optional alias, patterned on `OutputBindingsEditor`.
- [x] 5.2 Add `Aggregate/MeasuresEditor`: name, function, column, `where` and `distinct` per row, with the
      function list derived from the served catalog — aggregate group, required arity at most one — and
      `distinct` offered only where the catalog supports it (design D-5).
- [x] 5.3 Add `Aggregate/FreshnessField` offering `periodic` and `incremental` with what each means, omitted
      from the request when unset.
- [x] 5.4 Compose `AggregateSection` and `Aggregate/use-aggregate-form.ts`, and reuse the cron control for the
      aggregate schedule.
- [x] 5.5 Add the kind choice to the create modal as its first field, with the per-kind required sets and no
      `enabled` choice for the aggregate kind.
- [x] 5.6 Unit tests for 5.1–5.5: the catalog-derived function list including the arity exclusion, the
      truncation unit narrowing, the omitted freshness member, and the per-kind required sets.

## 6. Verification

- [x] 6.1 Run the `spec-browser-verify` skill against the local stack for this change's browser-observable
      scenarios, including registering a demo pipeline of each kind through the create modal, opening each
      one's detail page, and confirming the listing presents both. Resolve every `fail` verdict before the
      change is complete.

## 7. Quality checks

- [x] 7.1 Run `npm run lint`, `npm run format`, and `npm run test`, and resolve everything they report.

Each numbered group is scoped to land as one reviewable PR. Groups 1–3 are strictly sequential;
groups 4 and 5 are independent of each other and of group 3, and both must precede group 6.

No browser-verification task is included: the change has browser-observable scenarios and the
question was put to the user, who chose unit and component tests only.

## 1. Models and server API layer

- [x] 1.1 Add `src/models/analytics/evaluator.ts` — `EvaluatorSummary` (`name`, `latest_version`, `created_at`), `Evaluator` (full version definition incl. `type`, `input_vars`, `output_vars`), `EvaluatorVar`, and an `EvaluatorType` enum (`llm` / `sql`). Use `interface` for shapes and `enum` for the type set, per the code standards.
- [x] 1.2 Add `src/models/analytics/rule.ts` — `EnrichmentRule` (full DTO), `EnrichmentRuleListItem` (the projected listing shape carrying `evaluator` reduced to `{name, version, type}` — see design.md, "The listing server action projects the DTO"), `CreateRuleDto`, `ReadyWhen`, `MemberSelect`, `OutputBinding`, `InputBinding`, and enums `TriggerKind` (`on_ingest` / `schedule` / `group`), `RulePriority` (`live` / `backfill`), `RuleEnabledFilter` (`all` / `enabled` / `disabled`). Keep constant values out of this file per the constants/models split.
- [x] 1.3 Add rules endpoints to `AnalyticsDataApi` (`src/server/analytics/analytics-data-api.ts`): URL builders plus `getRules(filters, token)` unwrapping `{items}` (**not** `{tables}`), `getRule`, `createRule`, `updateRule`, `deleteRule`. Reads use `get`; writes use the `*Action` variants so the caller can surface the service's `message`.
- [x] 1.4 In the same class, build the rules query string so `enabled` is appended only for `RuleEnabledFilter.Enabled` / `.Disabled` and omitted entirely for `.All`, and `updated_since` only when set. This is the single place the 400-on-empty-`enabled` trap is contained.
- [x] 1.5 Add evaluator endpoints to `AnalyticsDataApi`: `getEvaluators` (unwrapping `{items}`), `getEvaluator(name)`, `getEvaluatorVersion(name, version)`. URL-encode every `{name}` segment.
- [x] 1.6 Unit-test the new API methods in `src/server/analytics/tests/analytics-data-api.spec.ts` — covering both listing envelopes, every filter combination including the omission of an unset `enabled`, and path encoding.

## 2. Route, navigation, and the rules listing

- [x] 2.1 Add `ApplicationRoute.AnalyticsEnrichmentRules = '/enrichment-rules'` to `src/types/routes.ts`, a `MenuI18nKey` entry, and an `AnalyticsEnrichmentRulesI18nKey` enum in `src/constants/i18n.ts` with English strings in `src/locales/en.ts`.
- [x] 2.2 Add the "Enrichment rules" item to the Analytics group in `src/components/Menu/menu-configuration.tsx`, positioned after "Tables", and extend `src/components/Menu/tests/menu-configuration.spec.ts`.
- [x] 2.3 Add `src/app/[lang]/enrichment-rules/actions.ts` — `getRules`, `deleteRule`, `createRule`, `getEvaluators`, `getEvaluator`, `getEvaluatorVersion`, `getTables`, authenticating via `getUserToken()` like the tables actions. `getRules` projects each rule to `EnrichmentRuleListItem` before returning.
- [x] 2.4 Add `src/app/[lang]/enrichment-rules/page.tsx` — server component, `dynamic = 'force-dynamic'`, `isAnalyticsForbidden()` → `Page403`, unfiltered rules fetch, `errorObjLog` + `notFound()` on failure, rendering the listing view seeded with the result.
- [x] 2.5 Add `EnrichmentRulesView.tsx` with the grid: name (navigating to `/enrichment-rules/{id}` via `navigateEntityUrl`), target enrichment, source, trigger, evaluator, grain key, version column (em dash when absent), enabled, generation, updated at. No client-side sort — the service's order is total.
- [x] 2.6 Add the two cell renderers — `TriggerCell.tsx` (kind badge + cron or `by {group_by}` beneath) and `EvaluatorCell.tsx` (`name@version`, `llm`/`sql` type badge, "latest" when unpinned) — plus an enabled badge that does not rely on colour alone.
- [x] 2.7 Unit-test the listing view and both cell renderers: resolved evaluator without a second request, unpinned-as-latest, both trigger qualifiers, em-dash version column, and name-cell navigation.

## 3. Listing filters and delete

- [x] 3.1 Add `RulesToolbar.tsx` — the three-way enabled control and the `updated_since` preset select ("Any time" plus relative windows), following `ConversationsToolbar`'s layout conventions.
- [x] 3.2 Add a pure helper resolving an `updated_since` preset to an ISO-8601 instant, with its own unit test (inject the reference instant; do not read the clock inside it).
- [x] 3.3 Wire filter state into `EnrichmentRulesView` as local state that re-fetches through the server action. On a failed re-fetch show an error notification and keep the previously displayed rows.
- [x] 3.4 Add the per-row delete action (`getDeleteOperation`) with a danger-variant `DialConfirmationPopup` naming the rule, gated on `isFullAdmin`. On success show a success notification and refresh with the current filters still applied; on failure show the service's `message` via `getErrorNotification` without removing the row.
- [x] 3.5 Unit-test the toolbar and the filter/delete wiring: each filter selection's request shape, "all" producing no `enabled` parameter, both filters combining, a failed re-fetch leaving rows in place, and the delete success/failure paths.

## 4. Cron and duration controls

- [x] 4.1 Add `src/utils/analytics/cron.ts` — a pure `isValidSixFieldCron(expression)` checking exactly six whitespace-separated fields and each field's grammar, plus the named preset expressions as constants in `src/constants/analytics/`. No next-fire computation and no new dependency (design.md, "Cron validation is field-count plus shape").
- [x] 4.2 Add `CronField.tsx` — preset select plus a custom expression input, blocking submission on an invalid custom value with a message naming the six-field requirement.
- [x] 4.3 Add `src/utils/analytics/duration.ts` — pure `parseDuration` (short form `^(\d+)(ms|s|m|h|d)$` and ISO-8601 `PT…`, `null` when neither) and `formatDuration`.
- [x] 4.4 Add `DurationField.tsx` — a number input paired with a unit select emitting the short form, falling back to a raw text input holding the value verbatim when `parseDuration` returns `null`.
- [x] 4.5 Unit-test `isValidSixFieldCron` and the duration codec directly (arity, five-field rejection, both accepted spellings, the unparseable fallback), and component-test both fields for the blocking and fallback behaviour.

## 5. Output bindings editor

- [x] 5.1 Add `OutputBindingsEditor.tsx` — a repeater of `{column, var, id}` rows with two `DialSelect`s each, taking the target table's `columns` and the evaluator version's `output_vars` as props so it is testable without the modal.
- [x] 5.2 Suppress an already-chosen column or variable from sibling rows' options, and show each option's type beside its name.
- [x] 5.3 Derive per-row errors — a value no longer present in its option set, and an advisory type mismatch — without ever writing to a row's values, so a change of evaluator or target invalidates rather than clears.
- [x] 5.4 Add the empty state directing the operator to select an evaluator and a target table, shown before both are resolved.
- [x] 5.5 Unit-test the editor: sibling suppression for both selects, the type-mismatch flag being advisory, and that changing the evaluator marks rows invalid while retaining their values.

## 6. Create-rule modal

- [x] 6.1 Add `use-create-rule-form.ts` — the form object, the two resolution caches keyed `name@version` and by table name, pending/error state per resolution, and the derived values (`resolved.evaluator`, `resolved.target`, derived `group_by`, available targets). Model it on `use-draft-schema-form.ts`.
- [x] 6.2 Implement `buildDto()` in that hook by constructing from the selected trigger kind — the required five plus only that branch's members — never by copying the form and deleting members.
- [x] 6.3 Implement `canSubmit` — the five required values present (including an explicitly chosen `enabled` with no default), the selected branch's conditional members satisfied, at least one output binding when the resolved evaluator's type is `sql`, and no blocking control-level error.
- [x] 6.4 Compute the available target enrichments as the enrichment tables minus the target enrichments the rules listing already reports, with a stated empty state when none remain.
- [x] 6.5 Add `CreateRulePopup.tsx` — mounted only while open, laying out the fields in spec order (name, evaluator, version, target enrichment, trigger kind, conditional block, output bindings, enabled), with the `enabled` captions and the derived read-only `group_by` captioned as the target's grain key.
- [x] 6.6 Add the `llm`-with-no-bindings warning (non-blocking) and the readiness block for a `group` rule — `idle` and `max_staleness` via `DurationField` with at least one required, plus an optional positive-integer `cost_ceiling`.
- [x] 6.7 Wire the create action into `EnrichmentRulesView`: gated on `isFullAdmin`, disabled with an explanatory note when the evaluator list is empty, and on success closing the modal, notifying, and refreshing the listing.
- [x] 6.8 Handle a rejected submission — render the service's `message` verbatim and leave the modal open with its values intact, including the 409 racing-target case.
- [x] 6.9 Unit-test the form hook directly (DTO construction per trigger kind, branch stripping across a kind change, `canSubmit` for each blocking condition, cache hits on re-selection) and component-test the modal for the create-action gating, the empty-evaluator note, the derived `group_by`, and the rejection path.

## 7. Quality checks

- [x] 7.1 Add any missing mocks to `apps/ai-dial-admin/test-setup.tsx` rather than inline in a spec, and confirm no spec asserts translated text (the mocked `t()` returns the key).
- [x] 7.2 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root; resolve every failure.

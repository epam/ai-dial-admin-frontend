## Delivery: two PRs off this one change

One change, one delta spec, two pull requests — each tracked by its own ticket. Group boundaries align with
PR boundaries, so no group is split across the two. The change archives once, after PR B.

| | Ticket | Groups |
| --- | --- | --- |
| **PR A** (first) | [#4289](https://github.com/epam/ai-dial-admin-frontend/issues/4289) — Evaluators listing page | 1–4 |
| **PR B** (second) | [#4290](https://github.com/epam/ai-dial-admin-frontend/issues/4290) — Evaluator detail page | 5–8 |

Listing first, because the menu item and the breadcrumb entry both belong to the listing route and land with
it. Detail-first would leave PR A with either a menu entry that resolves to nothing or a detail page with no
menu entry and a breadcrumb parent that does not resolve.

**Nothing in PR A links to a route that does not exist yet.** The listing grid ships with its name column as
plain text and no row navigation; PR B adds row activation once the detail route resolves. Because this is a
single change with a single delta describing the end state, that is task ordering rather than a requirement
written and then modified.

Groups 9 and 10 are per-PR, not a third PR: each PR carries the specs for the code it lands and runs the
quality gate itself.

## 1. Listing groundwork — PR A (#4289)

- [x] 1.1 In `src/models/analytics/evaluator.ts`, add `EvaluatorListRow` — the type the evaluators grid
  renders, carrying `usedBy: number | null` — kept distinct from `Evaluator` so the two `created_at` fields
  can never be held in one variable (design.md, Risks).
- [x] 1.2 Add `AnalyticsEvaluators = '/evaluators'` to `ApplicationRoute` in `src/types/routes.ts`.
- [x] 1.3 Add `MenuI18nKey.Evaluators` to `src/constants/i18n.ts` with `'Evaluators'` in
  `src/locales/en.ts`, and add the `Evaluators` sub-item to the Analytics group in
  `src/components/Menu/menu-configuration.tsx`, positioned **directly after** `EnrichmentRules`.
- [x] 1.4 Register `ApplicationRoute.AnalyticsEvaluators` in `src/components/Breadcrumbs/constants.ts`
  following the `AnalyticsEnrichmentRules` shape (named segment + non-linking leaf), which covers both this
  route and the detail route PR B adds.
- [x] 1.5 Add the `AnalyticsEvaluatorsI18nKey` enum in `src/constants/i18n.ts` with its English strings in
  `src/locales/en.ts`, covering the listing's needs: the four column headers, the used-by unavailable state,
  the empty-registry text, and the load-failure message. PR B extends the same enum.

## 2. Server actions module — PR A (#4289)

- [x] 2.1 Create `src/app/[lang]/evaluators/actions.ts` (`'use server'`) holding `getEvaluators`,
  `getEvaluator`, and `getEvaluatorVersion`, moved verbatim from
  `src/app/[lang]/enrichment-rules/actions.ts` including the shared `token()` helper usage. All three move
  together even though the listing only calls one — splitting the module across two PRs would leave
  `enrichment-rules/actions.ts` half-emptied in between.
- [x] 2.2 Delete those three from `src/app/[lang]/enrichment-rules/actions.ts` and repoint its three
  importers: `src/components/Analytics/EnrichmentRules/use-rule-resolution.ts`,
  `src/components/Analytics/EnrichmentRules/EnrichmentRulesView.tsx`, and
  `src/app/[lang]/enrichment-rules/[id]/page.tsx`. The move also repoints the auto-mocks in six existing
  specs that mock the module by path — `CreateRulePopup`, `EnrichmentRulesView`, `EnrichmentRulesPermissions`,
  `RuleDetailView`, `RuleDetailPermissions`, and `use-rule-form` — each gaining
  `vi.mock('@/src/app/[lang]/evaluators/actions')` alongside the existing one.

## 3. Used-by derivation — PR A (#4289)

- [x] 3.1 Add a pure helper under `src/utils/analytics/` that counts rules per evaluator name from
  `EnrichmentRuleListItem[]`, keyed on the rule's declared `evaluator_name`, returning a
  `Record<string, number>`.
- [x] 3.2 Add a pure helper in the same module that selects the rules referencing one evaluator name and
  reports, per rule, whether it pins a version or tracks the latest (reusing `isPinnedToLatest` from
  `src/components/Analytics/EnrichmentRules/utils.ts`). Written here alongside its sibling; its consumer is
  the used-by panel in PR B.

## 4. Evaluators listing page — PR A (#4289)

- [x] 4.1 Create `src/app/[lang]/evaluators/page.tsx`: `export const dynamic = 'force-dynamic'`,
  `isAnalyticsForbidden()` → `Page403`, then two separate `try` blocks — the evaluators listing and the
  rules listing — each logged with `errorObjLog`. A failed evaluators listing renders the console with a
  load-failure flag rather than `notFound()`.
- [x] 4.2 Shape the rows on the server: `toEvaluatorRows(evaluators, usage)` sets `usedBy` to the count, or
  to `null` when the rules listing failed, and the page passes `hasUsageError` alongside. Never substitute
  `0` (design.md Decision 1). The count map is a `Map`, not a `Record`, and stays server-side — a plain
  object mishandles an evaluator named `constructor`, `toString`, or `__proto__`, all of which the service
  permits.
- [x] 4.3 Create `src/components/Analytics/Evaluators/EvaluatorsView.tsx` as the client view: `GridView`
  with the four columns (name, latest version, registered at, used by), no `type` column, no create/edit/
  delete action, and the stated load-failure banner. The name column is plain text; **row navigation is
  task 8.2**, once the detail route resolves. Adding the menu sub-item in 1.3 also updates
  `src/components/Menu/tests/menu-configuration.spec.ts`, which asserts the Analytics sub-items in order.

## 5. Detail groundwork — PR B (#4290)

- [x] 5.1 In `src/models/analytics/evaluator.ts`, add `EvaluatorPreset`
  (`ChatCompletion = 'chat_completion'`) and retype `Evaluator.preset` from `string` to `EvaluatorPreset`.
  Nothing branches on it — see design.md Decision 10.
- [x] 5.2 Extend `AnalyticsEvaluatorsI18nKey` with the detail page's strings: the two distinctly-labelled
  timestamps, the section headings, the empty-input-vars and no-referencing-rules statements, the
  immutability statement, and the version-list-degraded message.
- [x] 5.3 Move `EvaluatorTypeLlm` / `EvaluatorTypeSql` out of `AnalyticsEnrichmentRulesI18nKey` into
  `AnalyticsEvaluatorsI18nKey` (`src/constants/i18n.ts` + `src/locales/en.ts`); the rendered strings stay
  `'LLM'` and `'SQL'`.

## 6. Shared pieces — PR B (#4290)

- [x] 6.1 Move `src/components/Assets/Modals/VersionsControl.tsx` to
  `src/components/Common/VersionsControl/VersionsControl.tsx`, drop the `as CompareView` cast, and update
  the import in `src/components/Assets/Modals/CompareVersions.tsx` (design.md Decision 8).
- [x] 6.2 Add an opt-in `isInitiallyOpen?: boolean` prop to `src/components/Common/CodeViewer/CodeViewer.tsx`
  seeding its `isOpen` state, defaulting to today's collapsed behaviour so its four existing consumers are
  unaffected.
- [x] 6.3 In the same component, pair the toggle's `aria-expanded` with `aria-controls` against a `useId`
  id on the content region (`.claude/rules/a11y.md`).
- [x] 6.4 Extract the type badge from `src/components/Analytics/EnrichmentRules/EvaluatorCell.tsx` into
  `src/components/Analytics/Evaluators/EvaluatorTypeBadge.tsx`, carrying its `TYPE_COLOR` / `TYPE_LABEL`
  maps and reading the relocated i18n keys; have `EvaluatorCell` render it.

## 7. Evaluator detail page — PR B (#4290)

- [x] 7.1 Create `src/app/[lang]/evaluators/[name]/page.tsx`: guard, decode `{name}`, parse `?version`
  permissively (a non-positive-integer is ignored and the latest is read), then three separate `try`
  blocks — the addressed version, the evaluators listing, the rules listing — with the failure handling in
  design.md Decision 4. A null version read calls `notFound()`.
- [x] 7.2 Create `src/components/Analytics/Evaluators/EvaluatorDetailView.tsx` composing the sections in
  spec order as plain `<section>` elements with `aria-label` — no accordion (design.md Decision 6).
- [x] 7.3 Header: name, `EvaluatorTypeBadge`, the version switcher, and both timestamps under distinct
  labels, with the name's timestamp reading unavailable when the listing read failed.
- [x] 7.4 Create `src/components/Analytics/Evaluators/EvaluatorVersionSwitcher.tsx` wrapping the relocated
  `VersionsControl`: options `1..latest_version` built with no request, `router.push` to the version URL on
  change, and a single-option degraded mode plus a stated failure when `latest_version` is unknown.
- [x] 7.5 Facts block: `type`, `preset`, `model` via `LabelledText`; `params` as a CSS-grid key/value
  reading, one row per entry, not a JSON blob.
- [x] 7.6 Render `request_template` through `CodeViewer` with `isInitiallyOpen`, and `response_schema`
  through `CodeViewer` collapsed.
- [x] 7.7 Create `src/components/Analytics/Evaluators/EvaluatorVarsGrid.tsx` — a CSS-grid reading of
  `input_vars` (name, type) and `output_vars` (name, type, producing expression), expressions monospaced
  and truncated with `DialEllipsisTooltip`, and an explicit statement when no input variables are declared.
- [x] 7.8 Create `src/components/Analytics/Evaluators/EvaluatorUsedByPanel.tsx` listing the referencing
  rules with links to `/enrichment-rules/{id}` and each rule's pin, an explicit "no rule references this"
  state, and a stated failure that is never rendered as "none".
- [x] 7.9 Branch the whole composition on `type === EvaluatorType.Sql` to omit preset, model, params,
  request template, input vars, and response schema entirely; for `llm`, a permitted-but-absent member
  renders as explicitly unset. An unrecognised type falls through to rendering what the version carries.
- [x] 7.10 State the registry's immutability on the page: versions cannot be changed and a new version is
  registered through the API.

## 8. Navigation into the detail page — PR B (#4290)

- [x] 8.1 Add an `evaluatorDetailHref(name, version?)` helper alongside the Evaluators view that URL-encodes
  the name and appends `?version=` only when a version is given, mirroring `ruleDetailHref`.
- [x] 8.2 Add row activation to `EvaluatorsView`: `navigateEntityUrl` on `onCellClicked`, honouring the
  modifier keys that open a new tab, mirroring `EnrichmentRulesView`. The name column stays plain text.
- [x] 8.3 In `src/components/Analytics/EnrichmentRules/Properties/RuleReadOnlyFacts.tsx`, make the resolved
  evaluator a link to `evaluatorDetailHref(rule.evaluator.name, rule.evaluator.version)`. Leave the rules
  **listing** evaluator cell as text — the row already navigates to the rule.

## 8a. Tabs and version authoring — PR B (#4290), added mid-change

Scope the user added after the read-only detail page was working: the detail page became a tabbed entity
view whose Properties tab authors a new version. Three requirements that forbade mutation were rewritten
rather than dropped, and the master spec's API-surface requirement now carries `POST /v1/evaluators`.

- [x] 8a.1 Add `EvaluatorPreset` and `CreateEvaluatorDto` to `src/models/analytics/evaluator.ts`;
  `createEvaluator` to `analytics-data-api.ts` and to `evaluators/actions.ts`.
- [x] 8a.2 Add `EntityViewTab.Rules`, `rulesTab`, and `getEvaluatorTabs` to `src/utils/tabs/utils.ts`, plus
  `TabsI18nKey.Rules`.
- [x] 8a.3 Add `src/utils/analytics/evaluator-dto.ts` — `toEvaluatorDraft`, `buildEvaluatorDto` constructing
  per type, and `isEvaluatorShapeValid` mirroring `requireValidShape`.
- [x] 8a.4 Add `use-evaluator-form` holding the draft, comparing built DTOs for `isChanged`, and reporting
  `nextVersion` as `latest_version + 1` or null.
- [x] 8a.5 Add `EvaluatorVarsEditor` and `EvaluatorParamsEditor` (addable/removable rows, disabled off the
  role), replacing the read-only vars grid and the params block.
- [x] 8a.6 Add `EvaluatorProperties` — every accepted member as a control, `name` read-only for everyone,
  the `sql` branch omitting the six forbidden members.
- [x] 8a.7 Add `EvaluatorRulesGrid` — a `GridView` of the referencing rules with row activation, replacing
  `EvaluatorUsedByPanel`.
- [x] 8a.8 Rework `EvaluatorDetailView` into the entity-view shape: identity and actions above the tabs
  (version control leftmost of the actions), facts inside Properties above a divider, `HeaderTabs` wrapped
  in a row so its `flex-1` fills the row rather than the column.
- [x] 8a.9 Wire the save: `ChangedEntityButtons` with `isSaveAllowed={false}` plus a Save-as-new-version
  button, a confirmation naming the version to be created, and navigation to it on success.
- [x] 8a.10 Correct `EVALUATOR_VAR_TYPES` to the catalog wire codes and add `withStrandedOption` so a stored
  alias or unknown value stays selected rather than blanking.
- [x] 8a.11 Fix the seven Important findings from PR B's review that survive the restructure — chiefly the
  double `decodeURIComponent` on the route param (Next already decodes; a name containing `%` threw
  `URIError`) and `CodeViewer`'s non-focusable collapse toggle.

## 9. Tests — split per PR

One spec per source file, as the sibling `EnrichmentRules/tests/` folder does — a component spec per
component, a `*Permissions.spec.tsx` per page for the guard and the page-level reads. **9.1–9.3 land with
PR A; 9.4–9.10 land with PR B.**

- [x] 9.1 `src/utils/analytics/tests/` — unit-test the two used-by helpers from group 3: counting across
  versions, a zero for an unreferenced evaluator, and the pin-versus-latest report per rule.
- [x] 9.2 `Evaluators/tests/EvaluatorsView.spec.tsx` — the four columns present and no `type` column, the
  name rendered as text, zero rendered as a value, the unavailable state when the usage map is `null`, and
  no mutation action on any row.
- [x] 9.3 `src/app/[lang]/evaluators/tests/page.spec.tsx` — the listing page's access and failure
  behaviour: `Page403` with no fetch when forbidden, the usage map left null rather than emptied when the
  rules listing fails, and a stated failure rather than a not-found result. Written against the page
  component itself (`await Page()`), following `conversations-trace/tests/page.spec.tsx`, because the guard
  is only observable there — a `*Permissions.spec.tsx` on the view could not reach it, and the view carries
  no role gate to test since the whole surface is open.
  The empty-registry and no-mutation-control cases live in 9.2, where the view is rendered.
- [x] 9.4 `Evaluators/tests/EvaluatorDetailView.spec.tsx` — both types in one file, since it is one
  component. Rewritten for the tabbed authoring page: tab switching, the seeded form, the read-only name,
  the confirmation naming the next version, and the posted DTO. A companion
  `EvaluatorDetailPermissions.spec.tsx` covers the non-full-admin path (own file, because `test-setup`
  pins `isFullAdmin` true), and `EvaluatorVarsEditor.spec.tsx` covers type preselection including a
  stranded alias. For `llm`: both timestamps under distinct labels, params read one entry at a time, the request
  template readable without a further interaction, the response schema present, and a version carrying no
  `params` stating them unset rather than omitting the section. For `sql`: no preset, model, params,
  request-template, input-vars, or response-schema section, with type and output variables still presented.
  Mock `@monaco-editor/react` locally as `CodeViewer.spec.tsx` does.
- [x] 9.5 `Evaluators/tests/EvaluatorVersionSwitcher.spec.tsx` — every version from 1 to latest offered with
  no per-version request, the shown version marked, selection pushing the version URL, and the degraded
  single-option mode when `latest_version` is unknown.
- [x] 9.6 `Evaluators/tests/EvaluatorUsedByPanel.spec.tsx` — referencing rules linking to their own pages,
  the pin stated per rule, the explicit unreferenced state, and a failed listing never reading as "none".
- [x] 9.7 `Evaluators/tests/EvaluatorVarsGrid.spec.tsx` — output variables presented with their producing
  expression, the full expression reachable without a pointer hover, and the no-input-variables statement.
- [x] 9.8 `src/app/[lang]/evaluators/tests/detail-page.spec.tsx` — the detail page's guard plus its version
  addressing, written against the page component for the same reason as 9.3: `Page403` with no fetch when forbidden, no param reads latest, a valid param reads that
  version, a malformed param falls back to latest without a not-found, and an unresolvable version is not
  found.
- [x] 9.9 Extend `Evaluators/tests/EvaluatorsView.spec.tsx` with row activation navigating to the detail
  route, update `src/components/Analytics/EnrichmentRules/tests/cells.spec.tsx` for the relocated type i18n
  key, and assert in the rule detail's existing spec that the resolved evaluator links to the evaluator page
  at the rule's resolved version.
- [x] 9.10 Add a `CodeViewer` case for `isInitiallyOpen` in its existing spec, confirming the default keeps
  today's collapsed behaviour for its four consumers.

Note on browser verification: the user was asked, per the `tasks` rule in `openspec/config.yaml`, whether to
add a `spec-browser-verify` task for this change's browser-observable scenarios, and declined. The rule was
followed, not skipped — no verification task is included by decision.

## 10. Quality checks — run in both PRs

- [x] 10.1 Run `npx vitest run` from `apps/ai-dial-admin/` for the touched specs while iterating, then
  `npm run test` for the full gate.
- [x] 10.2 Run `npm run lint` and `npm run format` and resolve anything this change introduced.
- [x] 10.3 Type-check with `npx tsc -p apps/ai-dial-admin/tsconfig.app.json --noEmit` (not
  `tsconfig.json` — it picks up stale `.next` types).
- [x] 10.4 No doc under `docs/` describes the Analytics menu group, so none needs updating; confirm nothing
  new landed there before closing out.

Group 10 ran clean for PR B too: full suite 9,863 passing / 4 skipped, lint 0 errors (134 warnings,
unchanged), prettier clean, and `tsc -p tsconfig.app.json` reporting nothing in any touched file.

Group 10 ran clean for PR A: full suite 9,795 passing / 4 skipped, lint 0 errors (134 warnings, unchanged
from the pre-existing baseline), prettier clean, and `tsc -p tsconfig.app.json` reporting nothing in any
file this change touches. Re-run the same four before PR B.

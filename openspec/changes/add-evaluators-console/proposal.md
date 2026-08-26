## Why

The enrichment rules console names evaluators but never explains them. The listing's evaluator cell renders
`{evaluator_name}@{version}` with a type badge, the rule detail's read-only facts repeat the same two
values, and the create-rule modal offers `evaluators.map((item) => ({ value: item.name, label: item.name }))`
— a list of bare names. An operator choosing which evaluator a rule should call, or reading a rule someone
else registered, has nowhere in the console to see what that evaluator actually does: which model it calls,
what its request template says, what variables it declares, what its response is validated against.

The registry also only grows. `POST /v1/evaluators` is the sole mutation; `PUT` and `DELETE` on a version
return 409 `evaluator_immutable`, and there is no `DELETE /v1/evaluators/{name}` endpoint at all, so an
evaluator can never be removed once registered. On the dev instance three of six registered evaluators are
referenced by no rule, and nothing in the console reveals that — which is the one fact an operator needs
before registering a new version of something, or before concluding an enrichment stopped because its
evaluator went missing.

## What Changes

- Add the evaluators listing at `/evaluators`: **name**, **latest version**, **registered at**, and a
  **used by** count of the rules referencing that evaluator, joined from one rules-listing fetch the page
  makes on the server. Row activation opens the detail page.
- Add a read-only evaluator detail page at `/evaluators/{name}`, addressing one version through a
  `?version=N` search param. The page presents the version's facts, `params`, `request_template`,
  `input_vars`, `response_schema`, `output_vars`, and the rules that reference it — each linking back to
  `/enrichment-rules/{id}`.
- Add a version switcher that enumerates `1..latest_version` and navigates rather than re-fetching in
  place, reusing `VersionsControl` and the navigate-on-change pattern `ImagesButtonsWrapper` already uses
  for image versions. `latest_version` is not in a version response, so the detail page reads the
  evaluators listing alongside the version — which is also where the name's own registration timestamp
  lives.
- Label the two `created_at` values by what each dates. The listing's dates when the **name** was first
  registered; a version response's dates **that version**. On dev they differ by two days for
  `conversation-insights`, and presenting them as one fact would misreport when the running definition
  was written.
- Branch the detail page on evaluator `type`: a `sql` evaluator does not render the `preset`, `model`,
  `params`, `request_template`, `input_vars`, or `response_schema` sections at all, because the service
  forbids those members for that type. Rendering them as "not set" would imply they could be set.
- State the registry's immutability on the page. The console offers no edit and no delete affordance for an
  evaluator or a version, and says why rather than leaving the absence to be read as an unfinished screen.
- Move `getEvaluators`, `getEvaluator`, and `getEvaluatorVersion` out of `enrichment-rules/actions.ts` into
  the new `evaluators/actions.ts`, and update the three importers. The rules console keeps calling them;
  only the module they live in changes.
- Add an `EvaluatorPreset` enum to `models/analytics/evaluator.ts`, replacing `preset?: string`.

## Capabilities

### New Capabilities

None. Evaluators are part of the analytics enrichment surface the `analytics` capability already covers.

### Modified Capabilities

- `analytics`: adds the evaluators listing route and its columns, the evaluator detail route and its
  version addressing, the per-type section branching, the used-by derivation, the two-timestamp labelling,
  and the statement that the console never mutates the registry. Two existing requirements change: the
  Analytics menu group gains an "Evaluators" sub-item, and the rule detail's read-only facts link their
  resolved evaluator to that evaluator's page at the version the rule resolved to.
- The API-surface requirement is **not** touched. Its evaluator endpoints are already specified, and its
  line reading "read-only from this app — evaluators are registered outside the UI" stays true: this change
  adds no mutation. It becomes wrong only in the follow-up that registers versions.

## Impact

- **New**: `app/[lang]/evaluators/page.tsx`, `app/[lang]/evaluators/[name]/page.tsx`,
  `app/[lang]/evaluators/actions.ts`; `EvaluatorsView`, `EvaluatorDetailView`, `EvaluatorTypeBadge`,
  `EvaluatorVarsGrid`, `EvaluatorVersionSwitcher`, `EvaluatorUsedByPanel` under
  `components/Analytics/Evaluators/`.
- **Modified**: `models/analytics/evaluator.ts` (`EvaluatorPreset`, a listing row type);
  `enrichment-rules/actions.ts` (evaluator readers removed) and its importers —
  `use-rule-resolution.ts`, `EnrichmentRulesView.tsx`, `enrichment-rules/[id]/page.tsx`;
  `EvaluatorCell.tsx` (type badge extracted for reuse); `RuleReadOnlyFacts.tsx` (the resolved evaluator
  becomes a link to its detail page); `types/routes.ts`; `Menu/menu-configuration.tsx`;
  `Breadcrumbs/constants.ts`; `constants/i18n.ts` and `locales/en.ts`; `Common/CodeViewer/CodeViewer.tsx`
  gains an opt-in "open on mount" prop so the request template does not arrive collapsed.
- **Reused unchanged**: `GridView`, `LabelledText`, `CodeViewer`, `VersionsControl`, `Accordion`,
  `DialEllipsisTooltip`, `navigateEntityUrl`, `isAnalyticsForbidden`, `Page403`.
- **Access**: the guard is `isAnalyticsForbidden()` alone. `GET /v1/evaluators*` carries no `@FullAdminOnly`
  on the service, so unlike the rules console there is no `isFullAdmin` gate — and with no mutation on the
  page there is nothing for one to protect.
- **Tests**: new specs for the two views, the used-by derivation, the version addressing, and the per-type
  branching. No existing spec changes behaviour; the moved server actions are re-imported, not rewritten.

## Non-goals

- **Registering an evaluator or a new version** (`POST /v1/evaluators`). Deferred to
  `add-evaluator-version-authoring`, together with the editable form and the "save as new version" flow
  that is the only save path an immutable registry can offer.
- **Diffing two versions.** Also deferred to that follow-up, where `CompareVersions` and `DiffField` are
  reused for `request_template` and `response_schema`.
- **A `type` column in the listing.** `GET /v1/evaluators` returns only `{name, latest_version,
  created_at}`, so a type column would need either a per-row read — which the rules listing requirement
  already forbids for its own evaluator cell — or a join from the rules listing that leaves every unused
  evaluator blank, where an em dash would read as "no type" rather than "no rule". Type is shown on the
  detail page instead.
- **Deleting or retiring an unused evaluator.** The service exposes no endpoint for it. The used-by count
  reports the dead weight; it cannot clear it.
- **Making the rules listing's evaluator cell a link.** The row already navigates to the rule; a second
  target inside the cell would make one click mean two things.

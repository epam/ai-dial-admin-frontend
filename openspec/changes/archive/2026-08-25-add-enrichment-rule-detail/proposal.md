## Why

The enrichment rules console ships a listing and a create modal, but the listing's name column links to
`/enrichment-rules/{id}`, a route that does not exist — every rule name is a dead link. More importantly,
the create modal collects 11 of a rule's ~25 members, so the remaining 14 (`source`, `filter_sql`,
`input_bindings`, `member_select`, the execution knobs) can only be set by calling the API directly, and
once set they cannot be inspected or corrected anywhere in the console.

## What Changes

- Add the rule detail page at `/enrichment-rules/{id}`: every editable member of a rule, a read-only
  metadata block, and save-through-`PUT` with dirty tracking, discard, and a tab-switch guard.
- Refactor create-rule state from the flattened `CreateRuleForm` onto the rule DTO itself, so the modal
  and the detail page share one `RuleProperties` component and one resolution hook. The modal's
  behaviour is unchanged; only its internal state shape moves.
- Extract evaluator/target/source resolution out of the form hook into `useRuleResolution`, extended
  from two lookups to three — the read source is needed for input bindings and every SQL predicate,
  and it is itself derived from the target enrichment.
- Add five field controls the create modal did not need: a SQL predicate input (used three times), a
  read-source selector, an input-bindings editor, a member-select editor, and an order-by editor.
- Treat an unsent `source` as meaningful: a rule that follows its target enrichment's `source_table`
  must keep following it after a save. **BREAKING for any rule saved through the UI** in the sense that
  the DTO the console sends is no longer a verbatim echo of what it read — see design.md.

## Capabilities

### New Capabilities

None. The rule detail page extends an existing capability rather than introducing one.

### Modified Capabilities

- `analytics`: adds the rule detail route, its field catalogue, the read-source follow/pin semantics,
  the three-way resolution chain, and the save contract. Amends the create-modal requirements whose
  wording assumes a flattened form model, and the API-surface requirement to cover `GET /v1/rules/{id}`
  and `PUT /v1/rules/{id}` as server actions.

## Impact

- **New**: `app/[lang]/enrichment-rules/[id]/page.tsx`; `RuleDetailView`, `RuleProperties`,
  `useRuleResolution`, `SqlPredicateField`, `SourceField`, `InputBindingsEditor`, `MemberSelectEditor`,
  `OrderByEditor` under `components/Analytics/EnrichmentRules/`.
- **Modified**: `CreateRulePopup.tsx` and `use-create-rule-form.ts` (state shape moves to the DTO);
  `OutputBindingsEditor` (owns its row identity internally); `actions.ts` (surface `getRule`,
  `updateRule` — both already exist on `analytics-data-api.ts`); `models/analytics/enrichment-rules-ui.ts`;
  `constants/i18n.ts` and `locales/en.ts`; `components/Breadcrumbs/constants.ts`.
- **Reused unchanged**: `ChangedEntityButtons`, `DiscardModal`, `SaveValidationContext`,
  `isEqualSkippingUndefined`. No edits to shared route-keyed files (`SimpleEntityHeader`,
  `DeleteConfirmationModal`, `getEntityPath`, `deleteEntityMap`).
- **Tests**: `use-create-rule-form.spec.ts` and `CreateRulePopup.spec.tsx` are rewritten against the new
  state shape; the modal's observable behaviour is unchanged, so the assertions largely survive.
- Delete stays on the listing; the detail page does not offer it.

## Non-goals

- The data plane (`/scan`, `/group-rows`, `/materialize`, `/rows`). The detail page leaves room for a
  panel; its contents are separate work.
- An evaluator management screen. Evaluators stay read-only, registered outside the console.
- Adopting the shared entity-detail shell (`SimpleEntityHeader`, `PropertiesTabContent`,
  `DeleteConfirmationModal`) for analytics. Considered and declined — see design.md.
- Distinguishing a declared `source` from a defaulted one at the API level. The console infers it;
  making the service report it is a backend change.

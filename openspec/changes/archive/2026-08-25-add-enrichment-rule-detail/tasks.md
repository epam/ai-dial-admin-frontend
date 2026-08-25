Each numbered group is one PR. Groups 1 and 2 ship together as PR 1 — the refactor is not independently
useful and splitting it would leave the modal rewritten with nothing consuming the new shape.

No browser-verification task: the user was asked and declined, choosing to verify the detail page manually
during review.

## 1. Shared state, resolution, and controls (PR 1)

- [x] 1.1 Surface `getRule` and `updateRule` as server actions in
      `app/[lang]/enrichment-rules/actions.ts`, mirroring the existing `createRule` / `deleteRule` shape.
      Both already exist on `server/analytics/analytics-data-api.ts:197,205`.
- [x] 1.2 Replace `CreateRuleForm` in `models/analytics/enrichment-rules-ui.ts` with a rule-draft type
      based on `CreateRuleDto`, and drop the flattened `idle` / `maxStaleness` / `costCeiling` /
      `evaluatorVersion` members. Keep `OutputBindingRow` — it is internal to the bindings editor now.
- [x] 1.3 Extract `useRuleResolution` from `use-create-rule-form.ts`: evaluator → target → source, each
      cached by key, each with its own pending and error flag. The source leg is new and depends on the
      resolved target (`design.md` — Resolution becomes a chain).
- [x] 1.4 Rewrite `use-create-rule-form.ts` as `use-rule-form.ts` over the DTO shape: validation, the
      `canSubmit` / `canSave` predicate, and `buildDto` constructing the trigger branch from the selected
      kind rather than deleting from a copy.
- [x] 1.5 Move output-binding row identity inside `OutputBindingsEditor.tsx` so it takes and emits
      `OutputBinding[]`; keep the stranded-value and type-mismatch reporting from `output-bindings.ts`.
- [x] 1.6 Extract the modal's field layout into
      `components/Analytics/EnrichmentRules/Properties/RuleProperties.tsx` with the
      `{ rule, onChange, isModal }` signature used by `Analytics/Queries/Properties/QueryProperties.tsx`.
- [x] 1.7 Rewire `CreateRulePopup.tsx` onto `RuleProperties` and the new hook. No behaviour change —
      `tests/CreateRulePopup.spec.tsx` assertions stay as they are and gate the refactor.
- [x] 1.8 Update `tests/use-create-rule-form.spec.ts` and `tests/OutputBindingsEditor.spec.tsx` for the new
      shapes; add resolution-chain cases for `useRuleResolution` covering caching, the source leg deriving
      from the target, and each failure path.

## 2. Rule detail page (PR 1)

- [x] 2.1 Add `app/[lang]/enrichment-rules/[id]/page.tsx`: `dynamic = 'force-dynamic'`,
      `isAnalyticsForbidden()` guard before any fetch, `getRule`, `notFound()` on a null result.
- [x] 2.2 Add `components/Analytics/EnrichmentRules/RuleDetailView.tsx` — bespoke header, `Accordion`
      sections, `selectedRule` cloned from `originalRule`, edited state via `isEqualSkippingUndefined`.
- [x] 2.3 Wire `ChangedEntityButtons` and `DiscardModal` for save/discard, and wrap the page in
      `SaveValidationContextProvider` so field validity gates save. Gate save on `isFullAdmin`, matching
      the listing rather than the shared wrapper's `isReadOnlyAdmin` (`design.md` — Borrow the shell's
      mechanisms, not the shell).
- [x] 2.4 Add the read-only facts block: `id`, `grain_key`, `version_column` (em dash when absent),
      `generation`, `created_at`, `updated_at`, and the resolved evaluator.
- [x] 2.5 Implement save: build the full DTO by preserving members the form does not present, strip the
      read-only members, construct the trigger branch, `updateRule`, then `router.refresh()` so the
      derived facts re-read. Surface the service's message on failure and keep the edits.
- [x] 2.6 Re-offer the rule's own `target_enrichment` in the taken-targets exclusion, so an edited rule is
      not stranded on a value its select does not list.
- [x] 2.7 Link the listing's name column to the detail route and add the `/enrichment-rules` segments to
      `components/Breadcrumbs/constants.ts`.
- [x] 2.8 Add i18n keys to `constants/i18n.ts` and English strings to `locales/en.ts` for everything above.
- [x] 2.9 Unit-test the detail view: load, edit, dirty transitions (including editing back to the original
      value), discard-restores, save success and failure, read-only rendering, and the full-replace
      preservation of a member the form does not present.

## 3. Read scope (PR 2)

- [x] 3.1 Add `SqlPredicateField.tsx` — multi-line monospaced expression input captioned with the table its
      columns come from, no client-side grammar validation.
- [x] 3.2 Add `SourceField.tsx` — follow/pin radio seeded from the `source === target.source_table`
      inference, naming the followed table when following is selected.
- [x] 3.3 Apply the inference on save: omit `source` when following, send it when pinned.
- [x] 3.4 Add `filter_sql` (via `SqlPredicateField`) and `sampling` (bounded 0–1) to `RuleProperties`.
- [x] 3.5 Add i18n keys and English strings for the read-scope section.
- [x] 3.6 Unit-test `SourceField` seeding in both directions, the omit/send behaviour on save, the sampling
      bound, and that a predicate names its source.

## 4. Bindings and member selection (PR 3)

- [x] 4.1 Add `InputBindingsEditor.tsx` — rows binding an `input_var` to either a source column or a
      JSONata expression, mutually exclusive, with the already-bound variable excluded from other rows.
- [x] 4.2 Report stranded input-binding rows (variable or column absent from the resolved evaluator or
      source) while keeping the stranded value visible, reusing the approach in `output-bindings.ts`.
- [x] 4.3 Add `OrderByEditor.tsx` — repeatable column plus direction over the read source's columns.
- [x] 4.4 Add `MemberSelectEditor.tsx` composing `SqlPredicateField` for `prefer_sql`, `OrderByEditor`, and
      a required `limit`; caption `prefer_sql` as a preference, not a filter. Omit the whole object from
      the saved rule when nothing is declared.
- [x] 4.5 Add `ready_when.signal` to the group branch via `SqlPredicateField`.
- [x] 4.6 Add i18n keys and English strings for the bindings and member-selection sections.
- [x] 4.7 Unit-test the column/expression exclusivity, the bound-variable exclusion, stranded-row
      reporting, incomplete rows being omitted from the DTO, the limit requirement, and member selection
      being omitted when empty and hidden for a non-group rule.

## 5. Execution knobs (PR 4)

- [x] 5.1 Add `cadence`, `batch_scan_limit`, `batch_chunk`, `rate_rpm`, and `priority` to `RuleProperties`
      as an execution section, imposing no validation the service does not.
- [x] 5.2 Omit a cleared numeric knob from the saved rule rather than sending zero.
- [x] 5.3 Add i18n keys and English strings for the execution section.
- [x] 5.4 Unit-test that a cleared knob is omitted rather than zeroed, and that `priority` round-trips.

## 6. Quality gates (each PR)

- [x] 6.1 `npx vitest run` over the touched specs while iterating, then the full `npm run test` as a final
      gate before each PR.
- [x] 6.2 `npm run lint` and `tsc` clean on the touched files.
- [x] 6.3 Update `openspec/specs/analytics/spec.md` if implementation reveals behaviour the delta states
      incorrectly, rather than letting the spec and the code diverge.

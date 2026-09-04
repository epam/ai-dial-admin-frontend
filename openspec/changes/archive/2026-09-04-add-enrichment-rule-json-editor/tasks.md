## 1. Request assembly

- [x] 1.1 Narrow the trimmed members in `apps/ai-dial-admin/src/utils/analytics/rule-dto.ts`, all four:
  `name`, `trigger_cron` (schedule only), `member_select.prefer_sql` and `ready_when.signal` (group only).
  Add `Array.isArray` where `member_select.order_by.length` is read and an object check on `ready_when` —
  those two do not throw, they change what is carried, so assert the behaviour rather than the absence of
  a fault. The four trims do throw, and `RuleDetailView` calls `buildRuleDto` during render to derive `isChanged`, so a pasted
  `"name": 5` blanks the page through the error boundary. A wrongly typed member must read as absent and
  still be carried to the request, where the service refuses it. Verify by sweeping all three trigger
  kinds — fixing one kind hides three of the four.
- [x] 1.3 Narrow the same class in `components/Analytics/EnrichmentRules/use-rule-form.ts`, which runs its
  own checks on every render outside any `useMemo`: `draft.name`, `draft.trigger_cron` fed to the cron
  validator, and `draft.output_bindings`, where `?? []` does not save a value that is a string and a
  non-object entry faults the stranded-binding scan. Sweep the hook end to end, not just the assembly —
  guarding `rule-dto.ts` alone leaves the page still able to blank.
- [x] 1.2 Expose a replacing setter from `use-rule-form.ts` so the editor can hand the whole document
  back. `RuleDraft` is `Partial<CreateRuleDto>`, so an assembled request is already a valid draft and no
  conversion is needed; `getSourceMode` resolves an absent `source` to Follow, which covers the one member
  the assembly drops on purpose.

## 2. Page wiring

- [x] 2.1 Wrap `RuleDetailView` in `SaveValidationContextProvider` in
  `apps/ai-dial-admin/src/app/[lang]/enrichment-rules/[id]/page.tsx`, following
  `app/[lang]/evaluators/[name]/page.tsx`. Required even for a caller who only reads:
  `EntityJsonEditor` calls `useJsonEditorValidation()` before consulting `readonly`.

## 3. Editor in the detail view

All in `apps/ai-dial-admin/src/components/Analytics/EnrichmentRules/RuleDetailView.tsx`.

- [x] 3.1 Add `isEditorEnabled` state and render `JsonToggle` in the identity row, **outside** the
  `{isFullAdmin && (…)}` wrapper that currently encloses every control, so a caller without saving rights
  can still open the editor. Resolve the slot the way the evaluator view does: Discard/Save while
  something is pending, the toggle otherwise.
- [x] 3.2 Swap the whole region below the identity row when the editor is on — `RuleReadOnlyFacts`,
  `RuleProperties`, `RuleEnabledBadge` and the enable/disable action all withdraw, leaving only
  `EntityJsonEditor`.
- [x] 3.3 Feed the editor the assembled request rather than the draft, and route its output back through
  1.2. Memoise the assembled request: `EntityJsonEditor` decides whether to remount Monaco by comparing
  `entity` by identity, so a fresh object each render remounts every render and the remount sets state —
  it does not settle, and the page hangs. No `ignoredFields`: `id` is not in the body and `toRuleDraft` already strips the read-only members.
  Pass `readonly` for a caller who may not save.
- [x] 3.4 Stop the form's own checks from gating the save while the editor is on — including
  `form.isValid` and the `takenTargets` uniqueness check — leaving `isSaving` applying in both modes.
- [x] 3.5 Gate the save on Monaco markers: read `jsonErrors` from `useSaveValidationContext`, raise one
  notification per marker via `showEditorErrorNotifications` instead of saving, and store them through
  `ValidationActionType.SetJsonEditorNotifications` so the editor's unmount cleanup can clear them.
- [x] 3.6 Raise the Discard/Save pair on markers as well as on a draft difference, since unparseable text
  never reaches the draft; and dispatch `ValidationActionType.Reset` before discarding, so a marker for a
  document that no longer exists cannot hold the pair up.
- [x] 3.7 Leave `onToggleEnabled`, its confirmation, and the `ToggleBlockedByEdits` guard untouched. The
  action is absent in editor mode, so it needs no new rule.

## 4. Tests

- [x] 4.1 Unit-test the name guard and the seed-from-request mapping in
  `utils/tests/rule-dto.spec.ts`: a non-string name neither throws nor blocks assembly, and a
  request round-trips back into a draft that reproduces it — including a Follow-mode rule, whose absent
  `source` must not come back as a pin.
- [x] 4.2 Component-test the view in `components/Analytics/EnrichmentRules/tests/RuleJsonEditor.spec.tsx`,
  stubbing `@/src/components/EntityTabs/JsonEditor/JsonEditor`: the toggle is offered, including to a
  caller who may not save; enabling it withdraws the facts, the fields, the badge and the enable/disable
  action; the editor is read-only without rights; editing withdraws the toggle and offers Discard/Save;
  discarding restores the stored rule and the toggle.
- [x] 4.3 Component-test the marker gates in the same file, with a controllable `SaveValidationContext`:
  markers alone raise Discard/Save on an untouched draft, saving then reports one notification per marker
  and does not submit, the Save control stays enabled, and the pair withdraws once the markers clear.
- [x] 4.4 Add `components/Analytics/EnrichmentRules/tests/RuleJsonRoundTrip.spec.tsx`, stubbing only
  `JsonEditorBase` so the real `EntityJsonEditor` runs: a member the fields do not present is readable and
  reaches the request when changed; a member deleted from the document is absent from the request,
  `evaluator_version` included; a renamed rule saves under the new name against the same id; unparseable
  text leaves the last good draft in place. Stubbing the whole editor cannot cover this path — that is how
  a missing Discard/Save shipped on the evaluator page.

## 5. Review follow-ups

- [x] 5.2 Seed the JSON document on entry instead of deriving it per render, and keep the grouping-key
  check applying in editor mode. Both came out of review: the derived document broke `EntityJsonEditor`'s
  identity contract and re-created the Monaco model on every accepted keystroke, and bypassing
  `form.isValid` also removed the only thing stopping a group rule from saving before its target resolved.
- [x] 5.3 Cover the two guards in `use-rule-form.ts` that no test reached, re-query the editor node in the
  round-trip spec so its unparseable-text case actually types unparseable text, and assert the behaviour of
  the two non-throw guards in `rule-dto.ts`.

## 6. Quality gate

- [x] 6.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root; fix anything they
  report.

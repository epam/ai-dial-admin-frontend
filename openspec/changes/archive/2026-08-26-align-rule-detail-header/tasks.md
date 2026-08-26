## Delivery

One PR. Presentation only: nothing here changes what the rule detail page reads, writes, or sends, and the
toggle's behaviour is untouched apart from how the control is drawn.

## 1. Header composition

- [x] 1.1 In `RuleDetailView.tsx`, move `RuleEnabledBadge` into the leading column above the `<h1>` so the
  column stacks badge then name, matching the leading column `SimpleEntityHeader` builds (design §1).
- [x] 1.2 Fold the separate `isFullAdmin` action row into the header row so `ChangedEntityButtons` and the
  enable/disable control sit at the trailing edge of the name's line, and remove the now-empty second row.
  Keep the toggle visible-but-disabled while edits are pending, with its existing `title` (design §4).

## 2. Toggle treatment

- [x] 2.1 Render the control by direction: `DialDangerButton` with `ButtonAppearance.Outlined` while the rule
  is enabled, `DialPrimaryButton` while it is disabled, no icon on either. Keep the full-admin gate, the
  confirmation popup, and the `disabled={isChanged || isSaving}` condition exactly as they are.

## 3. The id becomes a fact

- [x] 3.1 Remove the id line from the header in `RuleDetailView.tsx`.
- [x] 3.2 Add the id as the first `LabelledText` in `RuleReadOnlyFacts.tsx`, passing `copyable` with
  `copyLabel={t(EntityFieldsI18nKey.id)}` — the key `ReadonlyId` already uses, so no new i18n entry.

## 4. Tests

- [x] 4.1 Extend `EnrichmentRules/tests/RuleDetailView.spec.tsx`: the badge precedes the rule name in the
  header, "Disable rule" is presented as a danger action while enabled, "Enable rule" as the primary action
  while disabled, and the toggle stays present-but-disabled with its stated reason while edits are pending.
- [x] 4.2 Update the existing `renders the rule name and id` case, which asserts the id in the header, so it
  asserts the id inside the read-only facts region instead.
- [x] 4.3 Cover the id fact's copy control, queried by accessible name via `getByRole`, per `testing.md` §4.

## 5. Quality checks

- [x] 5.1 `npx vitest run` from `apps/ai-dial-admin/` for the touched specs while iterating, then
  `npm run test` for the full gate.
- [x] 5.2 `npm run lint` and `npm run format`, resolving anything this change introduced.
- [x] 5.3 Type-check with `npx tsc -p apps/ai-dial-admin/tsconfig.app.json --noEmit` (not `tsconfig.json` —
  it picks up stale `.next` types).

Note on browser verification: the user was asked, per the `tasks` rule in `openspec/config.yaml`, whether to
add a `spec-browser-verify` task for this change's browser-observable scenarios, and declined. The rule was
followed, not skipped — no verification task is included by decision.

Group 5 ran clean: full app suite 9,927 passing / 4 skipped, eslint 0 errors on the touched files,
prettier applied, and `tsc -p tsconfig.app.json` reporting 286 errors both with and without this change —
an unchanged pre-existing baseline, none of it in a file this change touches.

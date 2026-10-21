## Why

The rule detail page's header does not read like the rest of the console. Every asset view composes its
header through `SimpleEntityHeader`: a status badge on its own line, the entity name beneath it, both at the
leading edge, with the actions on the name's row at the trailing edge. The rule header instead puts the
enabled badge at the **trailing** edge, opposite the name, and pushes its actions onto a second row below.
Status is the first question a rule answers — an operator arriving from the listing wants to know whether
this rule is running at all — and a badge on the far side of the header is read last, after the name and
after the actions.

Two other things in that header work against the reader. The enable/disable control is a neutral grey
`DialNeutralButton` in both directions, so nothing distinguishes stopping an enrichment that other things
depend on from restoring the expected state. And the rule `id` sits directly under the name as unlabelled
small print, spending the most prominent line of the page on a value an operator only ever reads in order to
quote it somewhere else — with no way to copy it.

## What Changes

- Recompose the rule detail header to match the console's other entity headers: the enabled badge moves from
  the trailing edge to its own line above the rule name, and the header's actions move onto the name's row.
- Render the enable/disable control by direction rather than as one neutral button: outlined danger while
  the rule is enabled ("Disable rule"), primary while it is disabled ("Enable rule"), no icon on either.
- Move the rule `id` out of the header into the read-only facts row as a labelled fact carrying a copy
  control, alongside `grain_key`, `version_column`, and the rest of the derived members.
- Write down the rule detail header's composition and the toggle's treatment, neither of which the spec
  covers today — the toggle shipped with the rule detail page and was never specified at all.

## Capabilities

### New Capabilities

None. The rule detail page is part of the analytics enrichment surface the `analytics` capability covers.

### Modified Capabilities

- `analytics`: adds a requirement for the rule detail header's composition and the appearance of its
  enable/disable control, and modifies the read-only rule facts requirement so the rule `id` is presented
  among the facts as a labelled, copyable value rather than as unlabelled small print under the name.

## Impact

- **Modified**: `components/Analytics/EnrichmentRules/RuleDetailView.tsx` (header recomposed, toggle
  rendered by direction, id line removed); `components/Analytics/EnrichmentRules/Properties/RuleReadOnlyFacts.tsx`
  (id joins the facts as a copyable entry).
- **Reused unchanged**: `RuleEnabledBadge`, `LabelledText` (its `copyable`/`copyLabel` props already render
  a `CopyButton` as the postfix), `CopyButton`, `ChangedEntityButtons`, `DialDangerButton`,
  `DialPrimaryButton`, `ButtonAppearance`.
- **i18n**: none added. The id label reuses `EntityFieldsI18nKey.id`, the key `ReadonlyId` already passes as
  its `copyLabel`.
- **Behaviour**: unchanged. Nothing here alters what the page reads, writes, or sends; the toggle keeps its
  full-admin gate, its confirmation popup, and its withheld-while-edited state.
- **Tests**: `RuleDetailView.spec.tsx` extended for badge order and the two button treatments; its existing
  `renders the rule name and id` case updated, since it asserts the id in the header.

## Non-goals

- **Adopting `SimpleEntityHeader` itself.** It is built around `SimpleButtonsWrapper`, which hardwires a
  Delete action, a delete-confirmation modal, an etag, a JSON editor toggle, and
  `useSaveValidationContext`. A rule has none of those. The header copies the composition, not the
  component.
- **The rule status staying stale after a toggle until a manual reload.** A real defect, reproduced but not
  root-caused: `RuleDetailView` repaints correctly when handed a fresh rule, the PUT carries the flipped
  flag, `router.refresh()` is called, the refresh returns fresh server output on both the prefixed and the
  unprefixed URL, and the service reads the rule straight off Postgres with no cache. Guessing at a fix
  while moving the badge would bury it. This change is presentation only and leaves the behaviour as it
  stands.
- **Making the listing's status column match.** The badge component is shared; only the detail header's
  layout changes.

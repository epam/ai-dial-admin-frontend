## Context

`RuleDetailView` builds its header by hand. `SimpleEntityHeader` — the header every asset view uses — stacks
a status badge over `ReadonlyId` in a leading column and puts the action cluster on that same row at the
trailing edge. The rule header inverts it: name and id in the leading column, badge alone at the trailing
edge, actions on a second row below. The result is a header where the least prominent slot holds the most
important fact.

The rule's enable/disable control is also the only consequential action in the console rendered as a neutral
button, and the rule `id` is the only entity id presented without a label or a copy affordance.

## Goals / Non-Goals

**Goals**

- Make the rule header read like the console's other entity headers.
- Give the toggle an appearance that matches what it does in each direction.
- Present the `id` where the other derived facts are, labelled and copyable.

**Non-Goals**

- Adopting `SimpleEntityHeader` or `SimpleButtonsWrapper`.
- Any behavioural change: the toggle's gate, confirmation, and withheld-while-edited state are untouched.
- Fixing the post-toggle staleness (see the proposal's non-goals).

## Decisions

### 1. Follow `SimpleEntityHeader`'s composition without adopting the component

`SimpleEntityHeader` is built around `SimpleButtonsWrapper`, which hardwires a Delete action, a
delete-confirmation modal, an etag, a JSON editor toggle, and `useSaveValidationContext`. A rule has none of
those, so consuming it would mean threading props that exist only to be switched off, and inheriting a Delete
button the rule detail page deliberately does not offer. The rule header keeps its own markup and copies the
composition: a `flex flex-col` leading column holding badge then `<h1>`, with the action cluster moving up
onto that row.

### 2. `LabelledText`, not `ReadonlyId`, for the id

`ReadonlyId` exists to render an id **in a header**, wrapping it in `DialEllipsisTooltip` because asset ids
can be arbitrarily long. A rule id is a fixed-length UUID moving **into** the facts row, where `LabelledText`
already renders a `CopyButton` through its `copyable` prop and the row is `flex-wrap`, so it needs no
truncation machinery. The id therefore becomes one more `LabelledText` beside `grain_key` and the rest.

It goes **first** in the row. It is the rule's identity, and the fact an operator scans for when they came to
the page to copy it.

The label reuses `EntityFieldsI18nKey.id`, the key `ReadonlyId` already passes as its `copyLabel`. A rule id
is an id in the same sense as every other entity's, so a second key would be two strings to keep in step for
no distinction a reader would notice.

### 3. The toggle's appearance is keyed to the direction, not to the control

The control is one button whose label already flips with the rule's state, so the alternative was to keep one
appearance for both directions. It takes two instead — outlined danger to disable, primary to enable —
because the directions are not equivalent: disabling stops an enrichment that other things depend on, while
enabling restores the expected state. Rendering both as the same neutral grey button, which is what ships
today, states that they carry the same weight.

Outlined rather than filled danger, because that is exactly how `SimpleButtonsWrapper` renders Delete, and a
filled danger button in the same position would read as the more destructive of the two. No icon: the trash
glyph that accompanies Delete would misstate a reversible switch as a removal, and the label carries the
direction unambiguously on its own.

### 4. Save/discard and the toggle share one row, and the toggle stays visible while edits are pending

Merging the action row into the header row puts `ChangedEntityButtons` and the toggle side by side.
`SimpleButtonsWrapper` swaps between them — save/discard **or** delete, never both — but the rule page keeps
showing the toggle, disabled, with the `title` that explains why. Hiding it would answer "where did the
button go?" with nothing; the disabled control plus its reason answers it in place.

## Risks / Trade-offs

- **A disabled control with a `title` is a weak affordance** → the tooltip is the existing behaviour and this
  change does not regress it. Strengthening it (an inline message rather than a `title`) is a separate
  question about how the page reports blocked actions generally, not something to settle inside a layout
  change.
- **`RuleDetailView` renders the mutation's visible result straight from a server prop**, unlike `Models`,
  `Roles`, `TestSuites`, `Adapter`, and `Interceptors`, which clone the server entity into local state and
  treat `router.refresh()` as a background reconcile → moving the badge changes that exposure neither way.
  Whoever fixes the staleness should decide whether this view should mirror the sibling pattern.

## Migration Plan

None. Presentation-only change to two components, no data, route, or API surface involved.

## Context

See proposal.md — Why. Three facts about the current code shape the approach:

- `DraftSchemaEditor` builds its own label-with-hint node inline (`labelWithHint`): a `DialTooltip`
  wrapping a bare `IconInfoCircle`. Nothing there takes focus and nothing carries an accessible name.
- `ConversationsTrace/FieldCaveat.tsx` already solves exactly this, correctly: a real `<button>` whose
  `aria-label` is the hint, an `aria-hidden` icon inside, and `focus-visible` mirroring hover. It is
  presentational and domain-free, so by components.md §4 it belongs in `Common/`.
- The `ACTIVE` key summary uses `Common/LabelledText`. Its `label` prop is typed `string`, and its
  `tooltip` prop attaches a tooltip to the **value**, not an info icon to the label — so it cannot carry
  this affordance as it stands.

The hint copy itself is already agreed with the user, sentence by sentence, and is checked against the
ClickHouse documentation for the four keys that map to a storage-engine concept (ordering key, partition
column, granularity, grain key). Identity and version columns have no ClickHouse counterpart — they are
the analytics service's own scan contract — so their copy describes pipeline behavior instead.

## Goals / Non-Goals

**Goals:**

- One hint component used by both surfaces, so the draft editor and the `ACTIVE` summary cannot drift.
- Hint text lives in `en.ts` only; no component holds prose.
- The affordance is keyboard-reachable on both surfaces, closing an existing gap rather than copying it.

**Non-Goals:**

- No change to `Common/LabelledText`. Per the standing rule, a shared component does not grow a prop to
  fit one caller; the caller adapts.
- No redesign of the `ACTIVE` summary layout beyond attaching hints to its labels.
- No change to the ConversationsTrace hint behavior — the promotion is a move plus import updates.

## Decisions

**Promote `FieldCaveat` to `Common/FieldCaveat/FieldCaveat.tsx` rather than add a second hint
component.** It is already the accessible pattern and it is domain-free. Alternative — leave it in
`ConversationsTrace` and import across features — was rejected: a `Tables` component importing from
`ConversationsTrace` couples two unrelated features. Alternative — keep `labelWithHint` and only add an
`aria-label` — was rejected: a `<span>` with an `aria-label` is still not focusable, so the keyboard gap
would survive.

**Keep the prop name `caveat`, or rename to `hint`?** Rename to `hint`. On five of the six fields the
text is not a caveat but an explanation; `caveat` would mislabel the majority of call sites. The rename
touches the two ConversationsTrace call sites and their specs.

**The `ACTIVE` summary switches from `Common/LabelledText` to ui-kit `DialLabelledText`.**
`DialLabelledText.label` is typed `ReactNode`, so a `<span>{label}<FieldCaveat …/></span>` node passes
straight through. Precedent exists (`Images/View/TabsContent.tsx`, `TestSuites/Runs/RunModal.tsx` both
use the ui-kit component directly). The summary needs neither `copyable` nor `children`, which are the
only things the wrapper adds, so nothing is lost. Alternative — widen `LabelledText.label` to
`ReactNode` — was rejected under the shared-component rule.

**A shared label component, not a repeated JSX node.** Both surfaces render label + hint the same way,
so `Tables/KeyFieldLabel.tsx` owns that node and both `DraftSchemaEditor` and `TableDetailView` render
it. It is Tables-specific glue, not a Common component: it exists only because these two surfaces show
the same six fields. It is a component rather than a `keyLabel()` helper because components.md §3 wants
one PascalCase component per file, and a function returning JSX is a component wearing another name.

**Keys grouping is presentational.** The draft editor already renders a `Columns` sub-header
(`dial-small-semi text-primary`); the `Keys` header reuses that exact treatment, with the note beneath
it in `dial-small-text text-secondary`. No new layout primitive, no accordion, no card.

**i18n keys** follow the existing `AnalyticsTables` naming: `Keys`, `KeysNote`, `OrderingKeyHint`,
`GranularityHint`, `GrainKeyHint` are new; `PartitionColumnHint`, `IdentityColumnHint`,
`VersionColumnHint` keep their names with new text. Reusing the three existing key names keeps the
`en.ts` diff readable as a copy change and avoids a rename churn across specs.

## Risks / Trade-offs

- **The six hints are long enough to make a wide tooltip.** → The Keys note absorbs the immutability
  sentence every hint used to repeat, which is what keeps them at two or three sentences. If a tooltip
  still reads too wide in the browser, the fix is the tooltip's own width, not shortening the copy.
- **Promoting `FieldCaveat` touches ConversationsTrace specs.** → The move is mechanical (path + prop
  name); its own spec assertions query by role and accessible name, which do not change.
- **The `ACTIVE` summary loses the `Common/LabelledText` wrapper.** → It never used `copyable` or
  `children` there, so the switch is prop-for-prop. Verified against the current call sites.
- **On the draft surface a key field's group name now repeats its whole hint.** `DialFormItem` puts
  `role="group"` plus `aria-labelledby` on the label **container**, so the group's accessible name is
  computed from everything inside it — including the hint button's `aria-label`. A screen reader
  therefore announces the full ~300-character hint before reaching the select. → Accepted as is. The
  ui-kit exposes no way to override it: neither the group nor the label container takes an `aria-label`
  (only `labelClassName`), and any text placed in the label — `sr-only` included — feeds that name. The
  alternatives are worse: a short button name drops the full text from assistive tech (a `title` is
  ignored next to an `aria-label`, and DialTooltip's `aria-describedby` wiring is unverified), moving
  the copy into the field `description` prints six paragraphs under the fields, and positioning the
  button outside the label breaks on any ui-kit markup change. The real fix belongs upstream and is filed as
  [epam/ai-dial-ui-kit#853](https://github.com/epam/ai-dial-ui-kit/issues/853): `aria-labelledby`
  should point at the label's text node, not at a container holding interactive children. The `ACTIVE` summary is unaffected — it has no FormItem group.
- **The Granularity hint presents `Year` as a working option, and it may not be.** → ADAS renders
  `Year` as `toYYYY(col)`, a function this change could not find in the ClickHouse function reference
  and which no ADAS test covers. If `Year` is in fact broken, the fix belongs in ADAS; no copy here
  should paper over it.

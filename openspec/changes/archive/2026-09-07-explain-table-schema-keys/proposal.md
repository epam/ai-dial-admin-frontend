## Why

The Tables draft-schema surface asks the user to pick columns for five physical keys — ordering key,
partition column, identity column, version column, grain key — and explains almost none of them. Three
labels carry an info affordance today, and each states a restriction (`Only Date or Timestamp columns
can be selected`) or an obligation the caller must honour, never what the choice buys. Ordering key and
grain key carry nothing at all, and the ACTIVE table's read-only key summary carries nothing for any of
them. An admin defining a table therefore has to know ClickHouse to understand what these five selects
do, and a wrong pick is unrecoverable: the keys are frozen at materialization.

The existing affordance is also unreachable without a mouse. `labelWithHint` in `DraftSchemaEditor`
wraps a bare `IconInfoCircle` in a tooltip — no focusable element, no accessible name — so keyboard and
screen-reader users get none of the three explanations that do exist.

## What Changes

- Every key field on the draft-schema surface carries an info affordance whose text leads with what the
  choice gives the reader, in plain language: **Ordering key**, **Partition column**, **Granularity**,
  **Identity column**, **Version column**, **Grain key**. Ordering key, Granularity and Grain key gain
  one; Partition column, Identity column and Version column have theirs rewritten.
- The draft's key selects are grouped under a **Keys** sub-header carrying one shared note — the keys
  are set once, when the table is created, and fixed afterwards. Each hint drops its own copy of that
  sentence, so the six hints stay short.
- The ACTIVE table's read-only key summary carries the same six hints on its labels, so the explanation
  is available where a key is read, not only where it is chosen.
- The info affordance becomes keyboard-reachable and screen-reader-addressable: a real button whose
  accessible name is the hint text, following the existing `FieldCaveat` pattern from
  ConversationsTrace, which is promoted to a shared component. `labelWithHint` is removed.

Non-goals:

- No change to which columns each select offers, to validation, to the submitted payload, or to the
  scan-pair rules. This change is copy plus the affordance that carries it.
- The `Year` partition granularity is left as it is. ADAS renders it as `toYYYY(col)`, a function this
  change could not find in the ClickHouse function reference and which no ADAS test covers, so `Year`
  may fail at `CREATE TABLE`. That is an ADAS defect, tracked separately; the Granularity hint
  describes `Year` as usable.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the Table detail draft-schema requirements gain a hint on every key field plus the Keys
  group note; the ACTIVE header key summary gains the same hints; the info-affordance requirement
  changes from "an icon with a hover tooltip" to a focusable control whose accessible name is the hint.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Tables/DraftSchemaEditor.tsx` — Keys group, six hints,
  `labelWithHint` removed.
- `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx` — hints on the ACTIVE key
  summary. The summary uses `Common/LabelledText`, whose `label` is typed `string` and whose `tooltip`
  attaches to the value rather than the label, so the summary switches to ui-kit `DialLabelledText`
  with a label node. `Common/LabelledText` is not modified.
- `apps/ai-dial-admin/src/components/Analytics/ConversationsTrace/FieldCaveat.tsx` — promoted to
  `Common/`; its ConversationsTrace call sites re-point. No behavior change there.
- `apps/ai-dial-admin/src/constants/i18n.ts`, `apps/ai-dial-admin/src/locales/en.ts` — five new keys
  (`Keys`, `KeysNote`, `OrderingKeyHint`, `GranularityHint`, `GrainKeyHint`), three rewritten
  (`PartitionColumnHint`, `IdentityColumnHint`, `VersionColumnHint`).
- Specs of `DraftSchemaEditor`, `TableDetailView` and `ConversationFieldRows`/`ConversationDetailRail`
  (the last only if the promotion changes an import path a spec asserts).
- No server action, DTO, or API surface is touched.

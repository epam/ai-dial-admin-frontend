## Context

See proposal.md — Why.

Three facts from the data-access service shape every decision below:

- `write` is accepted **only** by `POST /v1/tables`. The schema-definition endpoint declares the
  member and rejects it with 422 ("the write discipline is identity, declared at POST /v1/tables");
  the metadata and schema-patch endpoints reject it too. The create popup is therefore not the
  convenient place for the control — it is the only place.
- A null `write` means "unspecified" and is stored as `append`, so omitting the member and sending
  `append` produce the same table.
- The member is source-only: an enrichment carrying it is a 422, because an enrichment's discipline
  is implied by its kind.

The popup itself is the established shape: a single form object seeded by `createTableForm`, one
`DialSelectField` already present for the enrichment's source table, `KeyFieldLabel` +
`FieldCaveat` already carrying the hint text for every physical key on the schema-definition surface.

## Goals / Non-Goals

**Goals:**

- Collect the discipline where the service accepts it, with the same explanatory affordance the
  physical keys already get.
- Keep the enrichment path structurally incapable of sending the member — a type error, not a runtime
  branch someone can forget.

**Non-Goals:**

- Everything listed under proposal.md — Non-goals. In design terms the load-bearing one: no read
  surface changes, so `AnalyticsTable` gains no `write` member in this change even though the service
  returns one on every table read.

## Decisions

### D1. A radio group, not a select

`DialRadioGroup` with two options in a column, each carrying its mode as the option `name` and what it
does to a write against a key the table already holds as its `caption`. Both options and both
explanations are visible without opening anything, and the text wraps inside the popup's own width.

*Alternative — a `DialSelectField`, which is what every other control in this popup is.* Tried first
and reverted, in two steps. A single label carrying both parts ("Append — keep every row") overflowed:
the dropdown panel sizes itself to its longest option, so the collapsing option's label ran past the
`PopupSize.Sm` popup. Splitting it into `SelectOption.label` + `SelectOption.description` did not fix
it either — the ui-kit select renders the description on the same line, right-aligned, rather than
under the label, so the option stayed one long line. Widening the popup to fit an option is the wrong
lever, and a two-option choice with per-option explanations is what a radio group is for.

*Alternative — the 2.0 `RadioGroup`, which the ui-kit MCP server names as `DialRadioGroup`'s
replacement.* Also built and reverted. The 2.0 radio appears nowhere else in this app — every existing
radio (`ModelType`, `ExportModal`, `ImportFileType`, `ImportOptionsStep`) is the 1.0 one — so it would
have been the single control in the console drawn from the new set, visibly different from the radios a
user meets one screen over. Consistency wins here; the 1.0 component has every prop this needs.

The cost is vertical space: four lines where the select was one. In a four-field popup that is
affordable, and it buys both explanations being readable at once.

### D2. `TableWriteMode` enum in the table model; options in the tables constants

The value set goes in `src/models/analytics/table.ts` beside `AnalyticsTableType` as a TypeScript
`enum` (`Append = 'append'`, `UpsertByKey = 'upsert_by_key'`) — code-standards requires an enum over a
string-literal union for a fixed value set. The rendered `{ value, label }` pair goes in
`src/constants/analytics/tables.ts` beside `PARTITION_GRANULARITY_OPTIONS`, keeping the
constants/models split.

### D3. Option name carries the mode, its caption the consequence, the group label the immutability

Each option is a `name` ("Append", "Upsert by key") plus a `caption` rendered under it ("Keeps every row
written", "Keeps only the latest row per ordering key"). The group's `labelDescription` states the one
thing neither part can: that the choice fixes how the table stores rows and cannot be changed after
creation. `DialRadioGroup` renders that description as the label's info button — the same affordance
`KeyFieldLabel` + `FieldCaveat` give the physical keys on the schema-definition surface, so the hint
reads the same way in both places without this popup assembling it by hand.

## Risks / Trade-offs

- **`DialRadioGroup` gives every option's caption the same DOM id (`id="caption"`), and points each
  option's `aria-describedby` at it.** A screen reader therefore reads the first option's caption as the
  description of both. → A defect inside an installed package, so out of scope for a fix here (a11y.md —
  Scope boundary): report it upstream. The captions are visible text, so a sighted user is unaffected,
  and the option names alone still distinguish the two choices.

- **The ordering-key hint does not yet mention that an upsert table's ordering key is its unique
  key.** A user who picks the collapsing discipline meets the ordering-key control later, on the
  schema-definition surface, where the hint still describes an append table's ordering key. → Out of
  scope here (that hint belongs to the "Table schema keys are explained where they are chosen and
  where they are read" requirement, which this change does not touch); the consequence is an
  incomplete explanation, not a wrong one, and the create-time caveat already says the discipline
  collapses rows per ordering key.
- **The choice is invisible after creation.** A user who forgets what they picked has no way to check
  it in the console, and picking wrong costs a delete and re-create. → Accepted deliberately (see
  proposal.md — Non-goals); the create-time caveat is the only mitigation in this change.
- **`upsert_by_key` is chosen speculatively.** Nothing in the create popup explains that a rollup
  target needs it, so the user still has to know that from the pipeline side. → The aggregate
  pipeline's own validation message names the requirement when a wrong target is submitted; making
  the pipeline modal explain it up front is separate work in `analytics/pipelines`.

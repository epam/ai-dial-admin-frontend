## Context

See proposal.md — Why. The constraints that shape the approach:

- **The panel needs two provenances at once.** `PanelProvenance` is
  `Exclude<ColumnProvenance, Insights | Other>`, and `ConversationDetailRail` derives the monospace source
  label *from* the panel's provenance (`SOURCE_LABEL[provenance]`). The insights panel must say
  `conversations` in mono and wear the insight colour, so one field cannot carry both.
- **The rail is data-driven.** `CONVERSATION_DETAIL_PANELS` is a list of definitions and
  `ConversationFieldRows` renders each in one of two layouts, `Grid` (two-column figures) or `Rows` (mono
  label/value pairs). Neither suits a 60-word paragraph.
- **`resolveConversationField` already distinguishes three states** — `Unavailable` (key absent from the row,
  so never projected), `Empty` (key present and null) and `Available`. That distinction is exactly the
  absent-enrichment vs unevaluated-conversation distinction the spec now requires, and it is already computed.
- **The optional-field gate is established.** `availableSelectFields` filters an ordered list against the
  fetched schema; the detail route reads the schema server-side before building the conversation query.

## Goals / Non-Goals

**Goals:**

- Add the panel and its fields with no new analytics request and no change to the grid.
- Keep the identifier/colour split narrow — a model change, not a rework of the provenance system.
- Make the absent-insight case a first-class state rather than six dashes.

**Non-Goals:**

- Reworking `ConversationPanelLayout` into a general layout engine. One prose-plus-badges panel body is
  written directly; the two existing layouts stay as they are.
- Any presentation change to the eight insight columns the grid already derives.
- Localizing the evaluator's vocabulary beyond rendering its tokens as readable words. `language` renders the
  BCP-47 code the service reports; mapping `uk` to a language name is a separate concern with its own data.

## Decisions

### Split the panel's identifier from its colour

`ConversationPanelDefinition` gains two fields where it had one: the entity whose catalog identifier the
panel prints, and the `ColumnProvenance` its icon takes. `PanelProvenance` — the type that exists only to
forbid `Insights` and `Other` — is removed, and `SOURCE_LABEL` is keyed on the entity instead of on the
provenance.

*Alternative considered:* widen `PanelProvenance` to include `Insights` and add an `Insights → conversations`
entry to `SOURCE_LABEL`. Rejected: it makes the map assert that the insight provenance *is* the
`conversations` entity, which is the exact conflation the spec's two-register rule forbids. The map would
read as a fact about provenance while actually encoding "which entity exposes this enrichment", and the next
enrichment would have to be added to it too.

### Render the panel body directly rather than adding a third layout

The insights panel is a prose lead, a badge row and two term lists — three shapes in one body. Expressing
that as a `ConversationPanelLayout` member would mean `ConversationFieldRows` growing a branch whose fields
are heterogeneous, where its whole design is that a layout renders a homogeneous list.

So the panel gets its own body component and `ConversationDetailPanel` (the icon/title/source frame) is
reused. `CONVERSATION_DETAIL_PANELS` keeps describing the two field-list panels; the insights panel is
rendered explicitly by the rail, the way the feedback panel already is.

*Alternative considered:* a `Prose` layout plus a `Badges` layout, composed. Rejected as two enum members
and two branches for one caller.

### Decide the panel's presence on the title field's state, not on a separate probe

`resolveConversationField` already yields `Unavailable` when a key is absent from the row (never projected,
so the schema does not report it) and `Empty` when present and null (projected, but the enrichment has no
row). Reading `conversation_insights.title` gives all three cases without a second question:

| title field state | meaning | rendered |
| --- | --- | --- |
| `Unavailable` | the instance carries no insight enrichment | "insights are not available on this deployment" |
| `Empty` | the enrichment exists; this conversation is unevaluated | "this conversation has not been evaluated yet" |
| `Available` | evaluated | the panel |

The heading already reads the title for exactly this reason, so no field is projected for the panel's sake.

*Alternative considered:* test whether *any* descriptive insight field has a value. Rejected: the fields are
written by one evaluator pass and are populated together — measured on the dev instance, all 1 432 rows carry
all eight — so an any-of test is a more complicated way to ask the same question, and it would report
"unevaluated" for a hypothetical row whose title alone was blank.

### Hold a badge colour map, not a vocabulary enum

Sentiment and resolution status get a `Record<string, string>` of Tailwind token classes keyed on the
service's tokens, with a neutral fallback and the raw value as the badge text. Not a TypeScript `enum`: an
enum of the evaluator's vocabulary would be a closed type over an open set, and code branching on it would
have to handle a value outside it anyway.

This is deliberately a different answer from the one the schema-derived-columns change gave for **filters**,
and the asymmetry is the point: an unrecognised filter value is sent to the service and rejects the whole
query, while an unrecognised badge value degrades to a neutral chip. The failure modes are not comparable, so
the same caution does not apply.

Readable words come from replacing separators and capitalizing — the same transform the derived columns
already apply to a field name — rather than from an i18n key per value, which would need a release for every
value the evaluator adds.

### Name the descriptive set, keep provenance out

The five new members go into `OPTIONAL_DETAIL_SELECT_FIELDS`, which the existing gate filters against the
fetched schema. `sentiment_score` is included on the user's decision; the service's own guidance is that it
is for averaging while `sentiment` is for grouping, so the panel renders it beside the badge rather than as a
figure of its own standing.

The four remaining `provenance`-tagged fields (`evaluator_version`, `model`, `enriched_at`, `group_version`)
are not projected. `conversation_insights.model` is the evaluator's own deployment and reads as the
conversation's model when shown bare — the defect that caused schema-derived columns to be withdrawn once
already.

## Risks / Trade-offs

**The summary is derived from body columns the service marks sensitive, but is not itself marked sensitive.**
→ Not mitigated in code, and deliberately so: this is the decision the schema-derived-columns change already
recorded when it offered `summary` as a grid column. The flags on a derived field say what the service gates,
not what the derivation is worth. Nothing here widens that exposure — the field is already offered in the
grid to the same callers.

**A prose paragraph is the largest thing in the rail.** → It is capped at 60 words by the evaluator, and it
is first in the rail where the reader is looking. If it proves too heavy in review the mitigation is a
line-clamp with the full text reachable, not removing the field.

**`language` renders a bare BCP-47 code.** → Accepted. It is one line, it is the value of record, and the
alternative — a code-to-name table in the frontend — is a data set to maintain for a field whose main use is
filtering in the grid.

**The badge colour map drifts if the evaluator is re-versioned with new values.** → The neutral fallback
makes drift a cosmetic degradation rather than a break, and an unrecognised value still renders its own text.

**The identifier/colour split touches every panel definition.** → All of them are in one constant and one
component; the compiler finds every site because `PanelProvenance` is removed rather than widened.

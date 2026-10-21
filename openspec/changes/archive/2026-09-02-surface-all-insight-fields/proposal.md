## Why

The conversation detail view names the insight enrichment's fields one by one, in a frontend enum and a
constant list. The enrichment has since grown past that list, and the list cannot grow with it: the
evaluator now emits an activity pair, a risk block and its own bookkeeping columns that the panel has no
name for and therefore cannot show. Worse than absent, the hardcoding is now **stale in a way the reader
cannot see** — the two activity columns the panel does name were superseded, so a conversation labelled by
the current evaluator renders them blank while the columns that replaced them, which do carry a value, are
invisible. The reader sees an empty activity and concludes the evaluator said nothing.

## What Changes

- The insights panel renders **every** field the `session_insights` enrichment exposes, discovered from the
  fetched entity schema rather than from a list held in the frontend. A field the enrichment gains appears
  with no frontend release; a field it drops disappears.
- Field labels and their explanatory hints come from the schema's own `display_name` and `description`,
  so a newly exposed column is labelled without an i18n key being added for it.
- The enrichment's bookkeeping columns — the evaluator version, the model that produced the row, when it was
  computed, and whether its input was truncated — are shown alongside the descriptive ones. This **reverses**
  the current rule that the view reads none of them: they are what distinguishes "the evaluator has not run
  the current version over this conversation" from "the evaluator looked and found nothing", which the
  descriptive fields alone cannot say. The detail header keeps its own rule that a title is never qualified
  with a truncation caveat — a field stated in a panel is not a caveat attached to the heading.
- The single-session query names the insight columns the schema reports, rather than the subset the frontend
  enumerates, so the panel is fed what it is now able to render.
- Summary keeps its prose register and the title stays out of the panel, being the view's heading.
  Everything else — including sentiment and resolution status, which had badges — renders as a labelled
  value row. The badges went because they were the only styling the panel had and it reached exactly the two
  closed-vocabulary fields the frontend happened to enumerate; the enrichment exposes seven more. What they
  carried that is worth keeping — a value read as words rather than as an underscored token — now follows
  the schema's declared type, so every closed-vocabulary field gets it.
- Whether the panel renders at all is decided over the enrichment's namespace instead of over its title
  field, so a conversation whose title alone is blank is no longer reported as one the evaluator never
  reached.

## Capabilities

### New Capabilities

None. This change modifies behaviour the analytics spec already describes.

### Modified Capabilities

- `analytics`: the single-session query's insight selection changes from an enumerated descriptive subset to
  every insight column the schema reports; the insights panel's field set changes from an enumerated list to
  the same schema-derived set.

## Impact

- **Query** — `buildConversationDetailQuery` and the detail server action take the schema's fields rather
  than only their names, so the insight namespace can be read off them.
- **Detail view** — the schema-derived insight columns are resolved once on the server page and passed to
  the rail, which replaces the panel's fixed `ResolvedInsightFields` shape.
- **Constants and models** — the insight entries of `ConversationsField`, `CONVERSATION_INSIGHT_FIELDS` and
  `DETAIL_INSIGHT_FIELDS` stop being the panel's source of truth. The title entry stays: the grid's identity
  column and the detail heading both read it by name.
- No change to the analytics service, to the trace listing, or to any other view.

## Non-goals

- Filtering, sorting or grouping the conversations log by the newly surfaced insight columns. The log already
  offers every schema-reported column through its catalog; this change is about the detail panel.
- Interpreting the risk columns — no thresholds, no aggregate, no styling that ranks one value above another.
  The service's own description is carried through as the field's hint and nothing is added to it.
- Any change to the header's title rules, including its existing refusal to qualify a title computed from a
  truncated input.

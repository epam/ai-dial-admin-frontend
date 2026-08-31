## ADDED Requirements

### Requirement: A contains filter over an array-valued column resolves its values first

A column backed by an array field SHALL offer the same operators a text column offers, and its predicate
SHALL hold when **any element** of the array satisfies it. A predicate over a set either quantifies over
its members or means nothing.

The service's array predicates match whole elements, not substrings, so a contains filter SHALL be answered
in two steps: the entered text SHALL first resolve to the set of values it matches, read from a scalar
column carrying those values; the listing query SHALL then narrow on membership in that set. `equals` needs
no resolution step and SHALL test membership directly. The negative operators SHALL hold where no element
matches.

The resolved set SHALL NOT be truncated. A truncated set silently changes what the filter means — it would
return fewer conversations than match, with nothing to say so.

Not truncating it SHALL be achieved by reading the resolution in pages until a page comes back short, under
an ordering that makes those pages disjoint. A single read cannot express it: the service applies a default
row limit to a query that names no page, and rejects a requested limit above its ceiling rather than
clamping it, while more distinct values exist than that ceiling. A resolution that names no page is
therefore truncated to the service's default, which is the failure this requirement forbids and is invisible
at the call site. Where the walk cannot be completed, the filter SHALL fail rather than narrow on a partial
set, because a partial set is the wrong answer the rule exists to prevent.

Where the resolution step returns nothing, the filter SHALL narrow the result to nothing rather than being
dropped: no value matched, so no conversation does.

The resolution SHALL belong to the result rather than to the page. The values SHALL be resolved once for a
result and reused by every later page of it, because the resolution reads a live table: resolved again per
page, a later page could be narrowed by a different set than the first, and rows would duplicate or vanish
across the scroll. A query that discovers a column's values for a filter SHALL be narrowed by the same
resolved set the rows are, so a count cannot describe a different population than the rows it predicts.

An array-valued column SHALL NOT be sortable. An array has no ordering the query language expresses, and a
client-side ordering would order the loaded pages rather than the result.

Making an array field filterable SHALL NOT make it a derived column. The rule excluding non-scalar types
from becoming columns concerns rendering a structured value in a grid cell and is unchanged.

#### Scenario: A contains filter matches on any element

- **WHEN** the operator applies a contains filter of `gpt` to an array-valued column
- **AND** a conversation's values are `["embedding-ada", "gpt-4o"]`
- **THEN** that conversation is in the result

#### Scenario: The entered text is resolved to values before the listing is narrowed

- **WHEN** the operator applies a contains filter to an array-valued column
- **THEN** the values matching the text are resolved first
- **AND** the listing query narrows on membership in that resolved set

#### Scenario: An equals filter tests membership without a resolution step

- **WHEN** the operator applies an equals filter of `gpt-4o`
- **THEN** conversations whose values include `gpt-4o` are returned
- **AND** a conversation whose only value is `gpt-4o-mini` is not returned

#### Scenario: A negated filter requires no element to match

- **WHEN** the operator applies a does-not-contain filter of `claude`
- **AND** a conversation's values are `["gpt-4o", "claude-sonnet"]`
- **THEN** that conversation is not in the result

#### Scenario: Text matching no value narrows the result to nothing

- **WHEN** the entered text resolves to no values
- **THEN** the result holds no conversations
- **AND** the filter is not dropped as though nothing had been entered

#### Scenario: The resolved set is not truncated

- **WHEN** the entered text matches a large number of values
- **THEN** every matched value takes part in the predicate
- **AND** the result is not narrowed to a subset of the matches

#### Scenario: The resolution is read in pages until one comes back short

- **WHEN** the entered text matches more values than the service returns for one read
- **THEN** further reads are issued at successive offsets
- **AND** the walk ends on the first read that comes back short of a full page

#### Scenario: A later page of one result reuses the values its first page resolved

- **WHEN** a filter over an array-valued column is applied and the operator scrolls past the first page
- **THEN** the later page is narrowed by the set the first page resolved
- **AND** no further resolution is issued for it

### Requirement: A column of an enum type filters by selecting from its observed values

A column whose field the entity schema declares to be of an **enum** type SHALL offer a filter listing the
field's values for selection rather than a free-text entry. A selection SHALL contribute a single
set-membership predicate naming the selected values.

The trigger SHALL be the declared type and nothing else. The frontend MUST NOT hold a list of which columns
are enums, and MUST NOT infer enum-ness from how many distinct values a field is observed to have. A list
drifts as an instance's enrichments change; a cardinality threshold misclassifies in both directions on the
data as it stands — `session_insights.language` shows six values but is an open BCP-47 set, while
`session_insights.activity_sub_task_type` has twenty-two values and is a genuine enum. Reading the type
makes a field an instance begins reporting as an enum filterable with no frontend change.

Values SHALL be discovered by a grouped count when the filter is opened, listed most frequent first with
each value's count, so the operator sees the shape of the data before narrowing it.

The value list MAY be bounded, unlike an array column's resolved set. A value the operator never sees is a
value they cannot select, so a bounded list narrows what the control offers; a name missing from a resolved
set changes what a filter the operator already applied means. The bound SHALL therefore sit well above the
size of any closed value set the schema is expected to declare, so that reaching it is evidence a field has
been typed `enum` in error rather than an ordinary outcome.

The value query SHALL carry the view's period, the page's search and feedback narrowing, and every
**other** column's filter — and SHALL NOT carry the opened column's own. Excluding the column's own
predicate keeps its unselected values reachable, so a selection can be widened without first being cleared;
carrying the rest keeps each count equal to what selecting that value returns.

The list SHALL offer observed values only. A **null** SHALL NOT be presented as selectable: null on an
enrichment-backed field means the enrichment has not reached that conversation, which is a statement about
coverage rather than a value of the enum.

A selection of no values SHALL contribute no predicate, as a text filter with an empty value does. Where
the value query fails or returns nothing, the filter SHALL say so and SHALL contribute no predicate; it
MUST NOT fall back to a text entry, since an operator who opened one control and was given another would
enter a value under the wrong operator.

A column of an enum type SHALL remain sortable on the same terms as any other scalar column.

#### Scenario: Opening an enum filter lists its values with counts

- **WHEN** the operator opens the filter on a column the schema types as enum
- **THEN** a grouped count over that field is requested
- **AND** the values are listed most frequent first, each with its count

#### Scenario: The value query carries the page's other narrowing but not the column's own

- **WHEN** the operator opens an enum column's filter while a period, a search term and another column's
  filter are active
- **AND** that same enum column already has values selected
- **THEN** the value query carries the period, the search term and the other column's filter
- **AND** it does not carry the opened column's own selection
- **AND** every value of the column is still listed

#### Scenario: A selection becomes one set-membership predicate

- **WHEN** the operator selects two values in an enum column's filter
- **THEN** the request carries a single predicate naming both values for that column

#### Scenario: An empty selection contributes no predicate

- **WHEN** an enum column's filter is opened and no value is selected
- **THEN** the request carries no predicate for that column

#### Scenario: Null is not offered as a value

- **WHEN** an enum column's grouped count reports rows with no value alongside its values
- **THEN** the filter lists only the values

#### Scenario: Enum-ness follows the declared type, not the value count

- **WHEN** the schema types a field as string and it is observed to hold six distinct values
- **THEN** its column offers the text filter, not a value list

#### Scenario: A newly declared enum field needs no frontend change

- **WHEN** an instance's schema begins reporting a previously unknown field as an enum type
- **THEN** that field's column offers the value filter
- **AND** no frontend list names the field

#### Scenario: A failed value query does not become a text filter

- **WHEN** the grouped count for an enum column fails
- **THEN** the filter states that the values could not be loaded
- **AND** no text entry is offered in its place
- **AND** the request carries no predicate for that column

### Requirement: Conversations grid names and filters the deployments a conversation used

The conversations grid SHALL present a curated **Deployments** column reading the rollup's `deployments`
array, so an operator can see which deployments served a conversation without opening it. The column SHALL
be part of the default visible set and SHALL be projected by the first list query.

The column SHALL render its values as discrete pills with an overflow badge stating how many further values
exist, and SHALL make the complete list reachable without a pointer, so the values hidden by the overflow
are available to a keyboard user and not only on hover.

The column SHALL render the array **as recorded**. It MUST NOT narrow it, and it MUST NOT be labelled as
naming models. `deployments` records every deployment that handled a hop — orchestrating deployments,
applications, MCP toolsets and embedding deployments alongside the models — and which of those is a model is
not derivable from the array. A name-shaped rule cannot decide it: a router or application deployed under a
plain name is indistinguishable from a model, while an embedding deployment that was billed is a legitimate
member of the billed set. A column labelled for the field it reads needs no such guess and cannot misreport.

Where a per-conversation set of **billed models** is wanted, it SHALL come from a conversation-level field
the service reports. The turn rollup's `models` column is the authoritative billed set but is per turn, no
server-side union over it is expressible, and a union over the bounded turn list a detail view loads would
understate a longer conversation — so the grid MUST NOT synthesize one.

The column SHALL offer a text filter, answered as specified under "A contains filter over an array-valued
column resolves its values first". Because the array is rendered as recorded and the filter tests it as
recorded, a filter's matches SHALL be exactly the conversations whose visible pills satisfy it — the column
MUST NOT filter over a value it does not show.

The filter SHALL be a text entry rather than a selection among the deployments observed. The set of
deployment names is open and grows with every deployment added to an instance, so a value list would
present a moving set as a closed one.

The column SHALL NOT be sortable. The query language expresses no ordering over an array field, and the
grid pages server-side, so a client-side ordering would apply to the loaded page rather than to the result
and would misstate what it did.

#### Scenario: Deployments renders on first paint

- **WHEN** the conversations grid loads with no stored column choice
- **THEN** the Deployments column is visible
- **AND** the first list query's select names `deployments`

#### Scenario: Values render as pills with an overflow badge

- **WHEN** a conversation's list holds more values than the column width fits
- **THEN** the cell renders as many pills as fit followed by a badge stating the remaining count
- **AND** the complete list is reachable without a pointer

#### Scenario: The recorded array renders unnarrowed

- **WHEN** a conversation's deployments include an application resource path, a toolset resource path, an
  embedding deployment and a model
- **THEN** the cell states all four
- **AND** none is withheld as not being a model

#### Scenario: The column does not claim to name models

- **WHEN** the operator reads the column header
- **THEN** it names deployments
- **AND** the detail view's metadata panel names the same field the same way

#### Scenario: Deployments filters but does not sort

- **WHEN** the operator inspects the Deployments column header
- **THEN** a filter control is offered
- **AND** no sort affordance is offered

#### Scenario: The filter matches what the cell shows

- **WHEN** the operator applies a contains filter matching one of a conversation's rendered pills
- **THEN** that conversation is in the result

#### Scenario: Deployments is filtered by text, not by a value list

- **WHEN** the operator opens the Deployments column's filter
- **THEN** a text entry with an operator list is offered
- **AND** no list of observed deployment names is presented for selection

## MODIFIED Requirements

### Requirement: Conversations grid with server-side ordering and per-column filtering

The conversations view SHALL render a grid of five visible columns — conversation, project, user, activity,
cost — plus the Rating column. Turns, tokens, deployments and topics are curated columns that default to
hidden; see "Conversation grid columns are a fixed curated set gated by the entity schema" for the whole set
and its origins.

A column SHALL offer a sort or a filter control **only** when the control can be answered over the whole
result. That is the case exactly when the column is backed by a stored field of the `sessions` entity,
because the control then becomes part of the query. Sorting and filtering SHALL therefore be resolved by the
backend, and the grid MUST NOT narrow or reorder the pages it already holds: those pages are a slice of the
result, so narrowing them client-side would report a slice as the complete answer.

| Column | Sort | Filter |
|---|---|---|
| conversation (`client_session_id`) | yes | text |
| project (`project_id`) | yes | text |
| user (`user_hash`) | yes | text |
| turns (`turn_count`) | yes | number |
| activity (`last_request_time`) | yes | none |
| tokens (`total_tokens`) | yes | number |
| cost (`total_price`) | yes | number |
| deployments (`deployments`) | no | text, over the array's elements |
| topics (`session_insights.topics`) | no | text |
| Rating | no | no |

The deployments column SHALL offer a text filter but no sort. Its value is an array: a predicate over it is
expressible as a test on the array's elements, specified under "A contains filter over an array-valued
column resolves its values first", while an ordering of an array is not expressible at all. The topics
column SHALL likewise offer a text filter but no sort: its value is a delimited string, so a lexicographic
ordering would sort by whichever term happens to be written first and carry no meaning, while a contains
predicate matches a term wherever it appears in the string.

A predicate on an enrichment-backed field SHALL be gated on the entity schema exactly as the projection is. An
instance that does not carry the enrichment would have the whole query rejected, not the one predicate
dropped. A reader SHALL NOT be led to believe such a filter searched every conversation: it matches only rows
the enrichment has reached, which is under a quarter of them, and that is correct behaviour rather than a
bug — but it is a narrowing of the population, not only of the result.

The Rating column SHALL offer neither. It is composed from rating-source lookups resolved for the page
just returned and has no field on the queried entity, so any ordering or narrowing of it could only describe
the rows already on screen. The feedback control is the filter for that dimension.

The activity column SHALL be sortable but SHALL NOT offer a filter. The page's time-period control already
predicates on `last_request_time`, and a second control over the same dimension would let a filter appear to
widen a range the period clips.

Filter controls SHALL offer only operators the query language can express. An operator with no equivalent —
notably prefix and suffix matching — MUST NOT be offered, since an offered operator that cannot be translated
either fails or silently returns the wrong rows. Text columns SHALL offer contains, does-not-contain, equals
and not-equals; number columns SHALL additionally offer the four magnitude comparisons; a column of an enum
type SHALL offer selection among the field's values instead of an operator list, as specified under "A column
of an enum type filters by selecting from its observed values". An incomplete filter entry — an operator
chosen with no value, or a value list with nothing selected — SHALL contribute no predicate rather than a
predicate against an empty value.

Column filters SHALL compose with the page's own controls as a conjunction: the search term, the time period,
the feedback narrowing and every column filter SHALL all hold for a returned conversation. The page's filter
state MUST NOT be written into the grid's filter model, and the grid's filter model MUST NOT be read as the
page's filter state; they are separate inputs to one query.

A change to the sort or to any column filter SHALL discard the pages already fetched and restart from the
first page of the new result, exactly as a search, period or feedback change does. The whole-result
conversation count and cost SHALL be re-resolved under the same predicates, so the summary cannot describe a
different result than the rows.

When no column sort is applied the result SHALL be ordered most recent last activity first. Clearing a
column's sort SHALL return to that default rather than leaving an arbitrary order.

The conversation column SHALL keep **both** of its lines reachable when either is too long to display, since
real ids are not uniformly short and can run to hundreds of characters, and a title is free text. Truncation
MUST NOT be the only presentation of either value. The user column SHALL keep its value reachable on the same
terms.

The conversation column MUST NOT carry a copy control per row. The full id is already reachable there, and a
control in every row of an infinitely scrolling grid adds a focusable node per row to the tab order for a
value the detail view already offers to copy.

The user column SHALL show the conversation's `user_hash`, labelled the way the conversation detail page
labels it. The value is a de-identified surrogate rather than an identity, so the column SHALL NOT be
presented as a name or an address.

While the first page of a new sort, filter or page-control state is in flight the view SHALL show a loading
indicator, so the empty state cannot flash between a change and its rows. When the result holds no rows the
view SHALL render a no-data state rather than an empty grid body.

Numeric and currency columns SHALL carry the same formatting these value types carry elsewhere in the app.
The grid SHALL use a taller row than the app's shared default, since its cells stack two lines.

The page header SHALL be the title alone, with no status badge of its own — the Analytics navigation group
already marks the whole area as preview.

Rows SHALL be openable, navigating to that conversation's detail view. The grid SHALL indicate that its rows
are openable rather than leaving the affordance undiscoverable, and SHALL honour the app's convention for
opening a row in a new tab. The conversation id SHALL be URL-encoded into the detail address, since real ids
contain path separators and percent-encoded text.

The grid SHALL carry a provenance band above the column headers, grouping every column under the data source
it comes from, and a column MUST NOT be able to leave its group when moved.

Every column SHALL belong to exactly one group: an unattributed column would imply a provenance the page has
not stated. Group labels SHALL name the actual source of the columns beneath them and MUST NOT overstate it —
a column read from a source table MUST NOT be labelled as enrichment-derived, and no group SHALL be attributed
to a source the page does not query. Each group SHALL carry a tooltip naming its source precisely. Colours
SHALL come from theme tokens, never literal values, and every provenance value SHALL map to a colour, so a
newly added one cannot render unstyled.

The band and the column-header row SHALL each carry their own height, and the band label SHALL be separated
from the column header beneath it.

#### Scenario: Sorting a field-backed column re-queries from the first page

- **WHEN** the operator sorts the cost column descending
- **THEN** a new request is issued carrying that sort key with a first-page offset
- **AND** the pages already fetched are discarded
- **AND** the rows shown are the result's ordering, not a reordering of the rows already held

#### Scenario: Clearing a sort returns to the default ordering

- **WHEN** the operator clears the sort on a column
- **THEN** the result is ordered most recent last activity first

#### Scenario: A column filter becomes a query predicate

- **WHEN** the operator applies a contains filter on the project column
- **THEN** a new request is issued carrying that predicate with a first-page offset
- **AND** the returned rows are the whole result's matches, not the previously loaded rows narrowed

#### Scenario: Column filters compose with the page's controls

- **WHEN** a column filter is applied while a search term, a time period and a feedback state are active
- **THEN** the request carries all of them, and a returned conversation satisfies every one

#### Scenario: The summary follows the sort and filter state

- **WHEN** a column filter is applied
- **THEN** the whole-result conversation count and cost are re-resolved under the same predicates

#### Scenario: Rating offers no sort and no filter

- **WHEN** the operator inspects the Rating column header
- **THEN** it offers no sort affordance and no filter control
- **AND** clicking it does not change the row order

#### Scenario: Activity sorts but does not filter

- **WHEN** the operator inspects the activity column header
- **THEN** a sort affordance is offered
- **AND** no filter control is offered

#### Scenario: Untranslatable operators are not offered

- **WHEN** the operator opens a text column's filter
- **THEN** the operator list offers contains, does-not-contain, equals and not-equals
- **AND** it offers no prefix or suffix matching option

#### Scenario: An operator with no value contributes nothing

- **WHEN** a filter entry has an operator selected and its value left empty
- **THEN** the request carries no predicate for that column

#### Scenario: Every column is attributed to a source

- **WHEN** the grid renders
- **THEN** a band above the column headers groups the columns by source
- **AND** every column belongs to exactly one group
- **AND** the conversation, project, user, turns, activity, tokens and cost columns are attributed to
  `sessions`, and the Rating column to `response_ratings`

#### Scenario: Groups survive column movement

- **WHEN** a column is dragged
- **THEN** it cannot be moved out of its provenance group

#### Scenario: A long conversation id stays reachable

- **WHEN** a conversation id is too long to fit its column
- **THEN** the cell truncates it and the full value remains reachable

#### Scenario: Opening a row navigates to the conversation

- **WHEN** a grid row is opened
- **THEN** that conversation's detail view is navigated to, with its id URL-encoded in the address

#### Scenario: Opening a row in a new tab

- **WHEN** a grid row is opened with the app's new-tab modifier
- **THEN** the conversation's detail view opens in a new tab and the grid keeps its fetched pages

#### Scenario: Loading replaces the grid rather than the empty state showing

- **WHEN** the first page of a new sort or filter state is in flight
- **THEN** a loading indicator renders in place of the grid
- **AND** the no-data content is not shown

#### Scenario: Empty result renders the empty state

- **WHEN** the result holds zero conversations
- **THEN** the no-data content renders instead of an empty grid body

### Requirement: Conversation grid columns are the curated set plus every field the entity schema reports

The conversations grid SHALL offer, in addition to its curated columns, one column per field the fetched
`sessions` entity schema reports. The offered set SHALL follow the instance rather than a list held in
the frontend, and the number of columns MUST NOT be fixed anywhere in the frontend: one instance reports 39
fields (25 from the rollup, 14 from `session_insights`), another carrying a further enrichment reports
more, and the difference between them is the reason the schema is read rather than a list maintained.

The curated columns SHALL keep their designed cells, headers and defaults and SHALL NOT be re-derived. They
are Conversation, Project, User, Turns, Activity, Tokens, Cost, Deployments, Topics and Rating.

A derived column SHALL take:

- its header from the field's `display_name` where the schema reports one, and otherwise from the field's
  `name` rendered readably — separators replaced by spaces and the first word capitalized, with an
  enrichment prefix stripped first, so `avg_duration_ms` reads "Avg duration ms" and
  `session_insights.activity_sub_task_type` reads "Activity sub task type". `display_name` is reported for some
  fields and not others on the same instance, and for none at all on some instances, so both paths are
  ordinary rather than exceptional. A raw catalog identifier SHALL NOT be presented as a header;
- its tooltip from the field's `description`, **verbatim**. The descriptions are authoritative and several
  contradict what the column looks like — `duration_ms` counts a chained turn's nested hops more than once
  and so exceeds the conversation's elapsed time, and `chain_price_total` is NULL wherever no turn carries a
  chain-starting hop with a chat id, which is a coverage gap and not a zero. The frontend SHALL NOT
  paraphrase a description into a string of its own, because a paraphrase is a second copy that drifts when
  the service re-words the original;
- its cell formatting and its sort affordance from the field's declared type, on the same terms as any other
  column of that value type elsewhere in the app;
- its filter from the declared type **only where the grid's filter translation carries that filter's model**.
  A derived column of a timestamp or boolean type SHALL offer no filter at all. A date filter reports its
  bounds under names the translation does not read, so the predicate would be dropped and the header would
  show an active filter over an unnarrowed result; a boolean falling through to the text filter would offer
  a contains predicate the query language cannot express over a boolean, and the service rejects a whole
  query for one such predicate — so a filter menu would take the listing down rather than narrow it. Both
  SHALL remain sortable: an ordering is expressible for either, and it is only the predicate that has no
  translation.

  A derived column of an **enum** type SHALL offer the value filter specified under "A column of an enum
  type filters by selecting from its observed values" rather than the text filter, and SHALL offer no
  floating filter — the floating filter is a text entry, so it would write a text model over the value model
  the translation reads. It SHALL remain sortable on the same terms as any other scalar column. The branch
  SHALL key on the declared type alone: no list in the frontend names which fields are enums, so a field an
  instance begins reporting as one gets the control with no frontend change.

A field SHALL NOT be offered as a derived column when:

- the service marks it `sensitive` — selecting it would be rejected for a caller without the required role,
  so the column could never be shown;
- its type is the non-scalar `object` or `array` — a grid cell is not a structured-value viewer, and
  rendering one as text would assert a shape the view does not know;
- a curated column already reads it, including a field a curated column composes without having a column of
  its own. `first_request_time` (composed into Activity) and `session_insights.title` (read by the
  identity column) SHALL NOT additionally appear as columns of their own, which would present the same value
  twice under two names.

A field the service marks `heavy` SHALL NOT be excluded from being offered on that ground alone: `heavy` is a
transfer-cost hint and SHALL govern **projection** rather than offering.

On the current schema no offered field is heavy, so the heavy class is empty — the expected result rather
than a gap. The non-scalar rule is a rule about which fields become **columns**, and carries no implication
for projection: `deployments` is an array, has a designed column, and is projected on every page like any
other cheap field. The one heavy field the entity reports is `traces`, and it is absent from the projection
because **no rendered column reads it**, not because of its type. The class SHALL become non-empty on either
of two events, neither requiring this rule to be revisited: the service marking a scalar field `heavy`, or a
column being designed that reads `traces`.

The default visible set SHALL be exactly the set visible today — Conversation, Project, User, Activity, Cost
and Rating — and every derived column SHALL ship hidden. Grouping constrains column order, so the default
visible **order** SHALL become Conversation, Activity, Project, User, Cost, Rating. The change of order is
accepted deliberately: a group a reader can see is worth more than a preserved column sequence.

Columns SHALL be grouped on the pair of **origin and tag**, at one level, with one group per pair the schema
actually reports:

- the **tag** SHALL supply the group's label, rendered as readable words rather than as the raw kebab-case
  catalog identifier. A tag for which the frontend holds no label SHALL fall back to the raw tag rather than
  causing its columns to be dropped, and a group with no tag at all SHALL be labelled by its origin;
- the **origin** — the rollup, a named enrichment, or the rating source — SHALL supply the group's colour;
- a group of an **enrichment** origin SHALL additionally name that enrichment in the label itself, not in
  the colour alone, and two enrichments the frontend cannot name SHALL form separate groups even where they
  carry the same tag — they share one catch-all origin, so the enrichment is the only thing distinguishing
  them. The columns panel prints a group's label as the caption under each of its columns, so a
  caption reading only "Evaluator run" above a column reading "Model" still leaves the reader to guess whose
  model it is. A group of the rollup SHALL take no such prefix: the rollup is what the grid is a list of, and
  naming the source table there is the mis-attribution this grouping replaced.

Each group SHALL also state its origin's meaning on hover, so a hue is never the only carrier of the
distinction.

Keying on the pair rather than on the tag alone SHALL keep a rollup field and an enrichment field that share
a tag in separate groups. Two origins merged under one tag would attribute an enrichment value to the rollup,
and the two produce different kinds of empty cell — one that cannot happen and one that means not yet
evaluated.

Every column SHALL be attributed to exactly one group, and no column SHALL be left unattributed.

The five fields the schema tags `provenance` are the evaluation's own bookkeeping rather than facts about the
conversation: the evaluator's DIAL deployment, its version, the input's group version, when the row was
computed, and whether the input was truncated. They SHALL be presented only under a group whose label names
them as the evaluator's run, and MUST NOT be presented under a label a reader could take for a property of
the conversation. In particular the field whose reported `display_name` is "Model" — described by the service
as the DIAL deployment that produced the row — MUST NOT appear as a column headed "Model" without that group
above it: read bare, it is indistinguishable from the deployments the conversation actually used, which is
the specific defect that caused schema-derived columns to be withdrawn.

The identity column SHALL NOT be hideable. It is how a reader recognises a row and how a row is opened, so a
grid without it is a table of values belonging to conversations the reader cannot name. It SHALL declare the
rollup as its origin even though it reads the enrichment for its title — a conversation's identity is its id
and the title only labels it — and SHALL state in its own disclosure that the title comes from the insight
enrichment and may describe only part of the conversation. It SHALL state that size cap **once**, for the
column, rather than marking the rows it applies to.

`session_insights.summary` SHALL be offered as a derived column, hidden by default. It is derived text
the service reports as non-sensitive, like the title the identity column already shows. This is recorded as a
decision and not an oversight: the request and response bodies it was derived from are marked `sensitive` and
`heavy`, are encrypted at rest and carry an explicit gating instruction, and none of that propagates through
an enrichment — so the flags on the derived field cannot be read as evidence that the derivation is
uninteresting, only that the service does not gate it.

The two fields whose values form a closed vocabulary — an insight's sentiment and its resolution status —
SHALL be offered as derived columns of their reported string type, with the string operators the query
language already expresses. The frontend SHALL NOT hold a copy of the evaluator's enumeration in order to
offer a value-list filter for them: that vocabulary is declared in the evaluator's response schema on the
service side and would drift silently whenever the evaluator is re-versioned.

A curated column whose field the entity schema does not report SHALL NOT be rendered at all — neither shown
nor offered as hideable — because the query cannot name the field and the cells could never fill. Rating is
the exception and SHALL render unconditionally: it reads no field of this entity, so no schema will ever
report it, and it SHALL remain outside the derived set, not offered, hidden or reordered as a field-backed
column is.

An enrichment field's exposed name is a qualified flat name containing a dot. The grid SHALL read such a field
by that whole name and MUST NOT interpret the dot as a path into a nested value: the row carries the name as a
single key, so a path interpretation finds nothing and renders an empty cell for a field the row does carry.

No column SHALL be offered for a request or response body, because the entity reports no such field. Those
are columns of `dial_usage_log`, a different entity; the listing queries `sessions`. The frontend SHALL
state this where columns are derived and SHALL NOT carry a filter against those names, which would imply the
schema could report them.

When the entity schema cannot be fetched the grid SHALL render the curated columns that need no optional
field, SHALL offer no derived column, and SHALL report that the additional columns could not be read.

A stored column choice recorded against a smaller column set SHALL leave a column it does not name at that
column's coded default, so columns introduced by this change arrive hidden for an operator who already has a
stored choice.

#### Scenario: The offered columns come from the schema, not from a fixed list

- **WHEN** the grid loads against an instance whose schema reports fields beyond those the curated columns read
- **THEN** each such field is offered as a column
- **AND** the offered count follows the schema rather than a number held in the frontend
- **AND** an instance reporting a further enrichment offers that enrichment's fields too, with no code change

#### Scenario: The default visible set is unchanged and derived columns ship hidden

- **WHEN** the grid loads with no stored column choice
- **THEN** the Conversation, Project, User, Activity and Cost columns are visible, together with Rating
- **AND** every derived column is hidden
- **AND** the visible order is Conversation, Activity, Project, User, Cost, Rating

#### Scenario: A group is named by its tag and coloured by its origin

- **WHEN** the grid renders its column groups
- **THEN** each group is labelled in readable words rather than by a raw catalog identifier
- **AND** each group's colour distinguishes the rollup from an enrichment
- **AND** a group of an enrichment origin names that enrichment in its label, while a rollup group does not
- **AND** each group states its origin's meaning on hover
- **AND** the columns of one group are adjacent
- **AND** every column belongs to exactly one group

#### Scenario: A rollup field and an enrichment field sharing a tag stay in separate groups

- **WHEN** the schema reports an enrichment field carrying the same tag as a field of the rollup
- **THEN** the two are placed in different groups
- **AND** neither group attributes an enrichment value to the rollup

#### Scenario: The evaluator's deployment never reads as the conversation's model

- **WHEN** the schema reports `session_insights.model` with the display name "Model"
- **THEN** its column appears only under a group whose label names the evaluator's run
- **AND** the columns panel states that column's origin alongside it
- **AND** no column headed "Model" appears with no such group above it

#### Scenario: A tag the frontend has no label for still yields columns

- **WHEN** the schema reports a field carrying a tag the frontend holds no label for
- **THEN** the field is still offered as a column
- **AND** its group is labelled with the raw tag rather than dropped

#### Scenario: A field with no display name gets a readable header

- **WHEN** the schema reports `avg_duration_ms` with no display name, and
  `session_insights.activity_sub_task_type` with none either
- **THEN** the first column's header reads "Avg duration ms"
- **AND** the second's reads "Activity sub task type", the enrichment prefix having been stripped
- **AND** neither header is a raw catalog identifier

#### Scenario: A field's description is its tooltip, unparaphrased

- **WHEN** the grid renders the header of a derived column whose field carries a description
- **THEN** the tooltip is that description as the service reported it
- **AND** the duration column's tooltip states that nested hops are counted more than once
- **AND** the chain-cost column's tooltip states that its NULL is a coverage gap, not an accounting difference

#### Scenario: Sensitive and non-scalar fields are not offered

- **WHEN** the schema reports a field marked sensitive, and a field of an object or array type
- **THEN** neither is offered as a column

#### Scenario: A heavy field is not excluded for being heavy

- **WHEN** the schema reports a scalar field marked heavy
- **THEN** it is offered as a column
- **AND** it is hidden by default like any other derived column

#### Scenario: A field a curated column already reads is not offered twice

- **WHEN** the columns are built
- **THEN** `first_request_time` is not offered as a column of its own, being composed into Activity
- **AND** `session_insights.title` is not offered as a column of its own, being read by the identity column
- **AND** `deployments` and `session_insights.topics` are offered only as their curated columns

#### Scenario: The summary is offered, hidden

- **WHEN** the schema reports `session_insights.summary`
- **THEN** it is offered as a column
- **AND** it is hidden by default

#### Scenario: Sentiment and resolution status are offered as string columns

- **WHEN** the schema reports the insight sentiment and resolution status as string fields
- **THEN** each is offered as a column with the string filter operators the query language expresses
- **AND** neither offers a value list drawn from a copy of the evaluator's enumeration held in the frontend

#### Scenario: No body column is offered

- **WHEN** the columns are built from the reported schema
- **THEN** no column is offered for a request or response body
- **AND** no filter names those fields, the schema reporting none

#### Scenario: The identity column cannot be hidden and discloses its title's source

- **WHEN** the operator opens the columns panel
- **THEN** the Conversation column offers no way to hide it
- **AND** every other column can be hidden
- **AND** the column's own disclosure states that its title comes from the insight enrichment and may describe
  only part of the conversation
- **AND** no row carries a separate truncation marker of its own

#### Scenario: A dotted enrichment field is read by its whole name

- **WHEN** a derived enrichment column renders a row carrying that field's qualified name as a key
- **THEN** the cell states that row's value
- **AND** it is not empty

#### Scenario: A curated column whose field is missing is not rendered

- **WHEN** the schema reports no insight fields
- **THEN** the grid renders no Topics column
- **AND** the columns panel offers it nowhere
- **AND** the remaining columns render as they did before it existed

#### Scenario: Rating survives a schema that reports no such field

- **WHEN** the columns are built from a schema reporting no `rating` field
- **THEN** the Rating column renders
- **AND** it is not offered as a derived column

#### Scenario: A failed schema fetch degrades to the curated columns

- **WHEN** the entity schema cannot be fetched
- **THEN** the curated columns that need no optional field render
- **AND** no derived column is offered
- **AND** the view reports that the additional columns could not be read

#### Scenario: A stored choice from the smaller set leaves new columns hidden

- **WHEN** the grid loads for an operator whose stored column choice names only the previously shipped columns
- **THEN** that stored choice is honoured for the columns it names
- **AND** every column it does not name is hidden

#### Scenario: A derived timestamp or boolean column offers no filter

- **WHEN** the schema reports a timestamp field and a boolean field that no curated column reads
- **THEN** each is offered as a column and each offers a sort
- **AND** neither offers a filter control

#### Scenario: Two unnamed enrichments sharing a tag stay apart

- **WHEN** the schema reports fields from two enrichments the frontend has no name for, both carrying the
  same tag
- **THEN** each enrichment's fields form their own group
- **AND** each group is labelled with the enrichment that supplies it

#### Scenario: Sort affordances match what the query can order

- **WHEN** the grid renders its headers
- **THEN** a derived column of a scalar type offers a sort
- **AND** the Rating, Topics and Deployments columns offer none

#### Scenario: An enum-typed field's column offers the value filter

- **WHEN** the schema reports a field of an enum type that no curated column reads
- **THEN** its column offers the value filter rather than a text entry
- **AND** it offers no floating filter
- **AND** it remains sortable

#### Scenario: A timestamp or boolean field's column still offers no filter

- **WHEN** the schema reports a timestamp field and a boolean field
- **THEN** neither column offers a filter
- **AND** both remain sortable

## REMOVED Requirements

### Requirement: Conversations grid names the deployments a conversation used

**Reason**: Its central claim is false. The requirement forbade a filter on the Deployments column and gave
as the reason that the query language expresses no predicate over an array field. The service's function
catalog carries `array_has`, `array_has_any` and `array_has_all`, all returning boolean and all valid in a
filter; only the comparison operators are scalar. A filter over the column was verified working against a
live instance with no service change.

**Migration**: Replaced by "Conversations grid names and filters the deployments a conversation used",
which keeps every other requirement on the column — the pills, the overflow badge, rendering the array as
recorded, not claiming to name models, and remaining unsortable — and replaces the prohibition on filtering
with the text filter and its rationale.

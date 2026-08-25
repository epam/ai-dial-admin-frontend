## MODIFIED Requirements

### Requirement: Feedback filter resolved through a second query

The conversations page SHALL provide a feedback filter with exactly four mutually exclusive states — all,
positive, negative, and rated — defaulting to all. It SHALL reuse the shared `DialSegmentedControl`.

Feedback lives in the `response_ratings` entity — the per-response rollup of DIAL's rate events, keyed on the
rated `response_id` and carrying the `chat_id` the rating was submitted from — which the conversation rollup
does not include, and the structured-query DSL accepts a single `entity` with no join construct. A feedback
filter SHALL therefore be resolved as two queries: first a candidate query over `response_ratings` returning
the `chat_id` values carrying the requested feedback, then the conversation query over `conversations`
narrowed to those ids with an `in` predicate. Both SHALL be issued server-side with the caller's token, and
the `all` state SHALL issue only the conversation query, so the default path costs exactly one request per
page.

The rating source SHALL be the per-response rollup rather than the raw rate-event log. The rollup partitions
each response's events into additive counts, which is what allows a direction to be selected and counted from
the same columns; the event log carries a single normalized `rate` from which the directions cannot be
separated without one query per direction.

Both queries SHALL be issued within a **single** request from the client when the first page of a result is
fetched, rather than the client resolving candidates in one request and the page in another. The candidate
ids SHALL be returned to the client alongside that first page.

The candidate set SHALL be resolved once per filter state and reused across the pages of that result, rather
than re-queried per page: the narrowing is a property of the filter, not of the page. The reuse SHALL be held
per client, keyed by the filter state it was resolved under, and the ids SHALL be carried back with each
later page of that result. The candidate set MUST NOT be held in a cache shared between callers: it is
resolved under the caller's token, so serving one caller's set to another would narrow a result by rows the
second caller's token never selected.

When the candidate set reaches that limit the view SHALL state that the feedback-filtered result may be
incomplete and that the conversations shown are the most recently rated ones. The cap truncates the result
regardless of how it is ordered, and the ordering is the operator's to choose, so a truncated result MUST NOT
be presented as the complete set of conversations carrying that feedback. The disclosure SHALL be visible
while the capped filter state is applied and SHALL clear when the filter state no longer reaches the cap.

The candidate query SHALL be aggregate mode over `response_ratings` grouped by `chat_id`, carry time bounds
over `last_rate_time` matching the period the conversation query is bounded to, and an empty-id guard, and
select `chat_id` plus `max(last_rate_time)`. It SHALL be ordered by most recent rating, so that if the
candidate set reaches its limit the ids retained are the most recently rated ones. Its limit SHALL NOT exceed
1000, the service's hard maximum.

The rate predicates SHALL be:

| State | Predicate |
|---|---|
| positive | `gt(rate_pos_count, 0)` |
| negative | `gt(rate_zero_count, 0)` OR `gt(rate_neg_count, 0)` |
| rated | `gt(rate_pos_count, 0)` OR `gt(rate_zero_count, 0)` OR `gt(rate_neg_count, 0)` |

These SHALL select exactly what the previous predicates over the event log's normalized `rate` selected, and
the negative state SHALL keep its present meaning: `rate_zero_count` counts the events the service normalized
to zero — a boolean `false` among them — and `rate_neg_count` counts the unambiguously negative ones, so
their union is what `le(rate, 0)` matched. The negative state MUST NOT be narrowed to the provably negative
subset: that would silently drop every non-positive rating whose submitted form predates the service's
captured-form column, which is most of the recorded history, and a filter that quietly stops returning rows
it used to return is a worse failure than a figure that needs a caveat.

`rated` SHALL be the union of the three value-bearing counts rather than an `IS NOT NULL` test. The rollup
partitions a response's events into positive, zero, negative and value-less counts, so those three cover
every event that carried a rating and exclude only an event whose body carried no rate at all — which is what
the previous null comparison excluded. The rule that `rated` must not be expressed as a union of the other two
states no longer applies: it existed because a rating outside the positive/negative split could not be
detected, and the rollup's partition leaves nothing outside it.

When the candidate query returns no ids the page SHALL return no rows **without** issuing the conversation
query: the service rejects an empty `in` list with HTTP 400, and "nothing carries this feedback" is already
the complete answer. Blank ids SHALL be dropped from the candidate set. When the candidate query fails, the
failure SHALL propagate and the conversation query MUST NOT run.

The page MUST NOT fall back to the raw rate-event log when the rollup is absent. The rollup is provisioned
per instance exactly as the conversation and turn rollups are, and the page cannot render without those
either, so an absent rating rollup SHALL surface as the read failing rather than as a second rating path
maintained beside the first.

#### Scenario: Feedback filter issues the candidate query then the narrowed query

- **WHEN** a feedback state other than all is selected
- **THEN** a query against `response_ratings` is issued first, carrying the state's rate predicate
- **AND** a query against `conversations` follows, restricted to the returned ids by an `in` predicate
- **AND** both carry the caller's token

#### Scenario: The first page costs one request, not two

- **WHEN** a feedback state other than all is selected and the first page of the result is fetched
- **THEN** the client issues exactly one request for that page
- **AND** the candidate ids are returned to the client with it

#### Scenario: Later pages reuse the ids without re-resolving them

- **WHEN** the operator scrolls to a further page of a feedback-filtered result
- **THEN** no further query against `response_ratings` is issued
- **AND** the page request carries the candidate ids the first page returned

#### Scenario: The default state costs one query per page

- **WHEN** the feedback filter is in its all state
- **THEN** only the conversation query is issued and it carries no `in` predicate

#### Scenario: A capped candidate set is disclosed

- **WHEN** the candidate query returns its full limit of ids
- **THEN** the view states that the result may be incomplete and covers the most recently rated
  conversations

#### Scenario: The disclosure clears when the filter state no longer caps

- **WHEN** the operator changes to a filter state whose candidate set is below the limit
- **THEN** the incompleteness disclosure is no longer shown

#### Scenario: No conversation carries the feedback

- **WHEN** the candidate query returns no ids
- **THEN** no rows are returned
- **AND** the conversation query is not issued

#### Scenario: The candidate query fails

- **WHEN** the candidate query returns a failure
- **THEN** that failure is returned and the conversation query is not issued

#### Scenario: Negative feedback includes a zero rating

- **WHEN** the negative state is selected
- **THEN** its predicate matches a conversation whose only rating was normalized to zero, alongside one
  carrying an unambiguously negative rating
- **AND** it selects the same conversations the previous non-positive predicate selected

#### Scenario: Rated covers both thumbs

- **WHEN** the rated state is selected
- **THEN** its predicate matches every conversation the two thumb states match
- **AND** it does not match a conversation whose only rate event carried no rating value

#### Scenario: Feedback composes with the other filters

- **WHEN** a feedback state is selected while a search term and a time range are applied
- **THEN** the narrowed conversation query still carries the search predicates and the time bounds

#### Scenario: An instance without the rating rollup reports a failed read

- **WHEN** a feedback state is selected on an instance that does not carry `response_ratings`
- **THEN** the read fails and the failure is reported
- **AND** no query against a raw rate-event log is issued as a substitute

### Requirement: Rating column resolved for the displayed page

The grid SHALL show a Rating column giving each conversation's positive and negative rating counts, attributed
in the provenance band to `response_ratings` rather than to `conversations`.

Ratings SHALL be resolved by a query issued **after** the conversation query, restricted by `in` to exactly the
conversation ids in the page just returned. Resolving them from the feedback filter's candidate set instead
MUST NOT be done: that set is capped, so a displayed conversation could fall outside it and be reported as
unrated when it is not. The ratings query SHALL be skipped entirely when the returned page has no rows.

The two directions SHALL be resolved by a **single** query. The rating source partitions each response's
events into additive counts, so the directions are separate columns rather than a split to be derived: one
aggregate over `response_ratings` grouped by `chat_id`, restricted by `in` to the page's ids, selecting
`sum(rate_pos_count)` for the positive side and `sum(rate_zero_count)` and `sum(rate_neg_count)` for the
negative one. The previous rule requiring one query per direction SHALL NOT be carried forward: it existed
because the event log's normalized `rate` is a signed integer from which `count` and `sum` cannot recover the
two directions, and additive per-direction columns remove that obstacle entirely.

The negative figure SHALL be the sum of the zero and negative counts, which is what the previous non-positive
predicate counted, so the column's meaning is unchanged. Each side SHALL be counted from the **same** columns
the corresponding feedback filter predicates on, which is what guarantees the column agrees with the filter:
a conversation the Positive filter selected cannot then display a zero positive count, and the same holds for
the negative side.

The same query SHALL also select `sum(rate_bool_false_count)`, `sum(rate_raw_count)` and
`sum(rate_event_count)`. These do not compose either figure: they state how much of the negative one is
provably a thumbs-down, and how much of the conversation's feedback had its submitted form captured at all —
which is a proportion, so the event count is named to give it a denominator. Where part of a negative figure is not established as a thumbs-down, that side SHALL
carry a caveat saying so, and the caveat SHALL be reachable by keyboard and exposed to assistive technology —
the figure is not redefined, it is disclosed. The caveat MUST NOT attribute the whole gap to an uncaptured
form: a rating submitted as a numeric zero **is** captured, and is unestablished because the service has not
fixed what a numeric zero means. Stating only the uncaptured cause would contradict the captured-form
proportion quoted beside it. A cell whose negative figure is fully attributable, and a cell
with no negative ratings, SHALL carry no caveat: a caveat on every cell would stop being read.

The query SHALL carry time bounds over `last_rate_time` matching the period the conversation query is bounded
to. Bounding them identically keeps the column and the feedback filter consistent. The consequence — a rating
given outside the selected period is not counted — is accepted for that consistency.

Both counts SHALL be displayed at all times, including a zero, so the absence of ratings on one side is visible
rather than implied. A side carrying ratings SHALL be coloured — positive as success, negative as error, from
theme tokens — and a side with none SHALL stay muted. Each side SHALL carry a text label for assistive
technology, since the icons carry the meaning.

When the ratings query fails, both counts SHALL be left unresolved and the cell SHALL render nothing rather
than displaying zeros or a half-counted split, which would assert an absence of feedback that was never
established. The conversation rows themselves SHALL still be returned.

A comment indicator SHALL NOT be shown in the grid cell. The rating source's `comment_count` is catalogued
**non**-sensitive, so the previous reason for withholding it — that the event log's comment column could not
be counted by a caller without the elevated role — no longer holds. It is withheld on a different ground: the
cell is a two-direction figure, a third signal in it is a design question of its own, and the conversation's
comment count is stated on the detail view's feedback panel instead.

#### Scenario: Ratings are resolved for exactly the page returned

- **WHEN** a page of conversations is returned
- **THEN** exactly one `response_ratings` aggregate query follows, restricted by `in` to that page's ids
- **AND** it is not issued at all when the page has no rows

#### Scenario: Both directions come from one query

- **WHEN** the ratings query is built
- **THEN** it selects the positive count and the two columns forming the negative count in one aggregate
- **AND** no second query is issued for the other direction

#### Scenario: Both directions are always shown

- **WHEN** a conversation has positive ratings and no negative ones
- **THEN** the cell shows the positive count coloured and a muted zero for the negative side

#### Scenario: A conversation rated both ways shows both counts

- **WHEN** a conversation carries one like and one dislike
- **THEN** it shows one on each side, each coloured for its own direction

#### Scenario: A zero-normalized rating still counts as negative

- **WHEN** a conversation's only rating was submitted as a boolean false and normalized to zero
- **THEN** its negative count is one
- **AND** the figure matches what the previous non-positive count reported

#### Scenario: An unattributable negative figure carries a caveat

- **WHEN** part of a conversation's negative count comes from events whose submitted form was never captured
- **THEN** the negative side carries a caveat stating that
- **AND** the caveat is reachable by keyboard and exposed to assistive technology

#### Scenario: The caveat names both causes of an unestablished rating

- **WHEN** a conversation's negative figure includes a rating submitted as a numeric zero whose form was
  captured
- **THEN** the caveat states that such a rating is not established as a thumbs-down
- **AND** it does not claim the rating was recorded without its submitted form

#### Scenario: A fully attributable figure carries no caveat

- **WHEN** every event behind a conversation's negative count had its submitted form captured
- **THEN** the negative side carries no caveat

#### Scenario: An unrated conversation is muted, not blank

- **WHEN** a conversation has no ratings in the period
- **THEN** both sides show a muted zero

#### Scenario: A failed ratings lookup shows nothing rather than zero

- **WHEN** the ratings query fails
- **THEN** the conversation rows are still returned
- **AND** their rating cells render nothing, asserting no absence of feedback

### Requirement: Conversation detail feedback reads the rating source

The detail view SHALL read this conversation's ratings from the rating source and SHALL state, **in the
feedback panel**, how many were positive and how many negative. A conversation with no ratings SHALL state
zero in both directions rather than rendering them as unavailable.

Those figures SHALL come from an **aggregate scoped to the conversation**, not from counting the rows the
panel loaded. The listed ratings are bounded, so counting them reports the bound rather than the conversation:
a conversation with more rated responses than the view requested would state the count of the ones on screen
while presenting it as the conversation's total. The figures SHALL therefore be exact regardless of how many
the panel lists, and the list's own bound SHALL be disclosed separately.

The negative figure SHALL be composed on the same terms as the grid's — the zero and negative counts
together — and SHALL carry the same keyboard-reachable caveat where part of it is not attributable to a
captured submitted form.

The feedback panel SHALL list the conversation's rated **responses**, most recently rated first. The rating
source rolls a response's rate events into one row per rated response, so the list's grain is the response
rather than the individual event: a response rated more than once appears once. Each listed entry SHALL state
its direction, and the time it was rated. Where a response's first and last rating times differ, the entry
SHALL state the window rather than a single time, so a re-rated response does not present its latest rating as
its only one.

An entry whose response carries more than one distinct rating value SHALL state that its own ratings
disagree. The source reports that condition directly, and a single direction shown for such a response would
present one side of a contested rating as the response's verdict.

Each entry SHALL state how many comments its response carries. The comment **count** is catalogued
non-sensitive and is therefore stated for every caller. The comment **text** is catalogued sensitive, so it
SHALL be named only when the fetched schema reports it — the same gate the transcript's body columns use —
and an entry SHALL distinguish a response with no comments from one whose comment text this caller may not
read. An entry MUST NOT render a comment as flatly unavailable where the count says there is one.

Each assistant message SHALL also show the ratings attributed to its turn. Attribution SHALL be by time — a
rating belongs to the last turn that had started when the rating was submitted — using each rated response's
latest rating time. The rating source records no trace identifier, so this remains an approximation and MUST
NOT be presented as an exact join: a rating left after a later turn began is attributed to that later turn.

When more rated responses exist than the view requested, the panel SHALL say the list is partial rather than
presenting it as complete. That disclosure is about the **list**; the panel's direction figures are exact and
SHALL NOT be qualified by it.

#### Scenario: Rating counts render with the ratings they summarise

- **WHEN** a conversation has positive and negative ratings
- **THEN** the feedback panel states the count in each direction

#### Scenario: The counts are exact, not the loaded subset

- **WHEN** a conversation has more rated responses than the panel lists
- **THEN** the stated direction counts cover every rated response of the conversation
- **AND** they are not derived from the listed entries

#### Scenario: An unrated conversation reports zero

- **WHEN** a conversation has no ratings
- **THEN** the feedback panel states zero in both directions

#### Scenario: An assistant message shows its turn's ratings

- **WHEN** a rating was submitted after a turn began and before the next turn began
- **THEN** that turn's assistant message shows it in the matching direction

#### Scenario: Individual ratings are listed

- **WHEN** a conversation has ratings
- **THEN** the feedback panel lists each rated response with its direction and rating time, most recently
  rated first
- **AND** a response rated more than once appears as one entry rather than one per event

#### Scenario: A re-rated response states its window, not one time

- **WHEN** a listed response's first and last rating times differ
- **THEN** the entry states the window rather than a single time

#### Scenario: A contested response says its ratings disagree

- **WHEN** a listed response carries more than one distinct rating value
- **THEN** the entry states that its ratings disagree

#### Scenario: A listed rating's comment is marked unavailable

- **WHEN** the feedback panel lists a response carrying comments and the schema reports no comment text column
- **THEN** the entry states how many comments the response carries
- **AND** the comment text renders as unavailable to this caller rather than as absent
- **AND** that is distinguished from a response carrying no comments at all

#### Scenario: Comment text is read where the schema reports it

- **WHEN** the schema reports the comment text column
- **THEN** the query names it and the entry renders the comment

#### Scenario: A response with no rating value is labelled neither way

- **WHEN** a listed response's rate events carried no rating value at all
- **THEN** the entry states that it carries no rating value
- **AND** it is labelled neither positive nor negative, matching the figures that count it in neither

#### Scenario: The comment count is stated alongside a readable comment

- **WHEN** a listed response carries three comments and this caller may read the comment text
- **THEN** the entry states the count as well as the text
- **AND** the text is not presented as the response's only comment

#### Scenario: A conversation-wide figure is not announced as period-scoped

- **WHEN** the detail view's rating figures render
- **THEN** their accessible names state the conversation's ratings without claiming a selected period
- **AND** the grid's own figures, which are period-bounded, keep an accessible name that says so

#### Scenario: A partial rating list says so

- **WHEN** a conversation has more rated responses than the view requested
- **THEN** the panel states that the list is partial
- **AND** the panel's direction figures are not qualified by that disclosure

### Requirement: Conversations grid with server-side ordering and per-column filtering

The conversations view SHALL render a grid of five visible columns — conversation, project, user, activity,
cost — plus the Rating column. Turns, tokens, deployments and topics are curated columns that default to
hidden; see "Conversation grid columns are a fixed curated set gated by the entity schema" for the whole set
and its origins.

A column SHALL offer a sort or a filter control **only** when the control can be answered over the whole
result. That is the case exactly when the column is backed by a stored field of the `conversations` entity,
because the control then becomes part of the query. Sorting and filtering SHALL therefore be resolved by the
backend, and the grid MUST NOT narrow or reorder the pages it already holds: those pages are a slice of the
result, so narrowing them client-side would report a slice as the complete answer.

| Column | Sort | Filter |
|---|---|---|
| conversation (`chat_id`) | yes | text |
| project (`project_id`) | yes | text |
| user (`user_hash`) | yes | text |
| turns (`turn_count`) | yes | number |
| activity (`last_request_time`) | yes | none |
| tokens (`total_tokens`) | yes | number |
| cost (`total_price`) | yes | number |
| deployments (`deployments`) | no | no |
| topics (`conversation_insights.topics`) | no | text |
| Rating | no | no |

The deployments column SHALL offer neither, because the query language expresses no ordering and no predicate
over an array. The topics column SHALL offer a text filter but no sort: its value is a delimited string, so a
lexicographic ordering would sort by whichever term happens to be written first and carry no meaning, while a
contains predicate matches a term wherever it appears in the string.

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
and not-equals; number columns SHALL additionally offer the four magnitude comparisons. An incomplete filter
entry — an operator chosen with no value — SHALL contribute no predicate rather than a predicate against an
empty value.

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
  `conversations`, and the Rating column to `response_ratings`

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

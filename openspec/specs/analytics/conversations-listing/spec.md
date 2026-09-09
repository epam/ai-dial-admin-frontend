# Analytics Conversations Listing

## Purpose

The conversations log page: its route and guard, the filters and the second query that resolves the feedback filter, the provenance line, and the grid's columns, server-side ordering and per-column filtering.

## Requirements

### Requirement: Conversations page route, access guard, and server prefetch

The system SHALL expose an Analytics page at `/conversations-trace`, present in the `ApplicationRoute`
enum (`types/routes.ts`) as `ConversationsTrace`. The route directory SHALL be
`src/app/[lang]/conversations-trace/`. The page SHALL be a server component declaring
`export const dynamic = 'force-dynamic'`, SHALL call `isAnalyticsForbidden()` before any data access and
render `Page403` when it returns `true`. Code identifiers SHALL use `conversations-trace` /
`ConversationsTrace`; every user-facing string SHALL read "Conversations". The route MUST NOT collide with
the existing `/conversations` DIAL Core route — breadcrumb and menu resolution match on the exact first
path segment, so the two are independent.

For a permitted caller the page SHALL prefetch the **entity schema** server-side and pass it to the client
view as an initial-data prop, so the column catalog is known before the grid mounts. A schema prefetch
failure SHALL be reported through the initial state handed to the client view, since a server component
cannot raise a toast.

The page MUST NOT prefetch the first page of rows: the grid fetches its own pages, so a prefetched page would
be discarded or duplicated. The page MUST NOT prefetch the **result summary** either. The summary is required
to be an observation of the same fetch cycle as the rows on screen, so a summary resolved during server
rendering is superseded by the client's own first fetch the moment it lands; resolving it twice buys nothing
but a scan of the whole filtered result. The summary figures SHALL therefore be unavailable until the
client's first fetch resolves them, and the view SHALL render that pending state rather than zeros, which
would assert an empty result that was never established.

The page SHALL depend on the `conversations` entity being registered and populated in the environment it runs
against. Where it is absent, the access guard still passes and the conversation query fails with HTTP 400; the
page SHALL surface that as a load failure rather than as an empty period. That failure SHALL be reported by
the client's own fetch, which is the first request the page makes against the entity.

#### Scenario: Page renders for a permitted caller

- **WHEN** `isAnalyticsForbidden()` returns `false` and the page is requested
- **THEN** the page prefetches the entity schema on the server and renders the client view with it
- **AND** the grid requests its first page of rows

#### Scenario: The summary is not resolved during server rendering

- **WHEN** the page is requested by a permitted caller
- **THEN** no result-summary query is issued while the page is rendered on the server
- **AND** the summary pills report their figures as pending until the client's first fetch resolves them

#### Scenario: Forbidden caller sees Page403 and no query runs

- **WHEN** `isAnalyticsForbidden()` returns `true` and the page is requested
- **THEN** `Page403` is rendered
- **AND** no conversation query is issued

#### Scenario: Route does not shadow the DIAL Core conversations route

- **WHEN** the browser is at `/conversations-trace`
- **THEN** the Analytics "Conversations" menu item is the active item
- **AND** the existing `/conversations` menu item is not marked active

#### Scenario: A missing conversations entity reads as a failure

- **WHEN** the `conversations` entity is not registered in the environment and the page is requested
- **THEN** the view reports a load failure
- **AND** it does not report that the period held no conversations

### Requirement: Feedback filter resolved through a second query

The conversations page SHALL provide a feedback filter with exactly four mutually exclusive states — all,
positive, negative, and rated — defaulting to all. It SHALL reuse the shared `DialSegmentedControl`.

Feedback lives in the `response_ratings` entity — the per-response rollup of DIAL's rate events, keyed on the
rated `response_id` and carrying the `chat_id` the rating was submitted from — which the session rollup
does not include, and the structured-query DSL accepts a single `entity` with no join construct. A feedback
filter SHALL therefore be resolved as two queries: first a candidate query over `response_ratings` returning
the `chat_id` values carrying the requested feedback, then the session query over `sessions`
narrowed to those ids with an `in` predicate. Both SHALL be issued server-side with the caller's token, and
the `all` state SHALL issue only the session query, so the default path costs exactly one request per
page.

The two ids join without translation: the analytics service sets a session's id to the conversation's
`chat_id` wherever the hop carries one, so a rating's `chat_id` is a `client_session_id` for exactly the
sessions that have ratings. **A session that did not originate in DIAL Chat therefore has no rating and SHALL
NOT be presented as unrated-by-measurement.** Coding-agent traffic submits no rate events, so any state other
than `all` narrows the result to chat-origin sessions as a consequence of the data rather than as a filter on
client type, and the affordance MUST NOT be described as one.

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
over `last_rate_time` matching the period the session query is bounded to, and an empty-id guard, and
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
failure SHALL propagate and the session query MUST NOT run.

The page MUST NOT fall back to the raw rate-event log when the rollup is absent. The rollup is provisioned
per instance exactly as the conversation and turn rollups are, and the page cannot render without those
either, so an absent rating rollup SHALL surface as the read failing rather than as a second rating path
maintained beside the first.

#### Scenario: Feedback filter issues the candidate query then the narrowed query

- **WHEN** a feedback state other than all is selected
- **THEN** a query against `response_ratings` is issued first, carrying the state's rate predicate
- **AND** a query against `sessions` follows, restricted to the returned ids by an `in` predicate
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
- **THEN** only the session query is issued and it carries no `in` predicate

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
- **AND** the session query is not issued

#### Scenario: The candidate query fails

- **WHEN** the candidate query returns a failure
- **THEN** that failure is returned and the session query is not issued

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
- **THEN** the narrowed session query still carries the search predicates and the time bounds

#### Scenario: An agent session falls outside every feedback state but all

- **WHEN** a coding-agent session is in the period and the rated state is selected
- **THEN** the session is absent from the result, its id having carried no rating
- **AND** the affordance does not describe itself as filtering by client

#### Scenario: An instance without the rating rollup reports a failed read

- **WHEN** a feedback state is selected on an instance that does not carry `response_ratings`
- **THEN** the read fails and the failure is reported
- **AND** no query against a raw rate-event log is issued as a substitute

### Requirement: Provenance line and period summary

The page header SHALL state which entities the view is composed over, listing each contributing entity by its
real catalog name and colouring it with the same provenance colour the grid band uses, so the two cannot
disagree. That list SHALL be derived from the entity schema the page fetches — the base entity, followed by
each enrichment namespace the schema reports, in the order those namespaces first appear — together with any
further entity the page itself queries to render a column. A hardcoded list is not permitted: enrichments are
catalog objects provisioned per instance, so a fixed list states the composition the code was written against
rather than the one the instance has. Every entity named SHALL be one the page actually queries; the line MUST
NOT name a source the page does not read, and MUST NOT carry a "pending" or "not registered" marker — a source
that does not exist is not listed at all. Where the schema reports no enrichments, the line SHALL name the base
entity alone rather than rendering an empty or partial list.

The header SHALL show summary pills for the conversation count, the rated count, the count carrying negative
feedback, and the total cost. All four SHALL be exact figures for the **selected time period**, obtained from
the backend, and MUST NOT be computed from the rows currently loaded. The rated and negative counts SHALL be
resolved by aggregating the rating source over the period, not by inspecting fetched rows, so that they stand
complete from the first page and do not climb as the operator scrolls.

The pills SHALL report the period alone. The free-text search, the grid's column filters and the feedback
filter SHALL narrow the grid and MUST NOT change any pill: the header answers what the period holds, and the
grid answers what the current filters select. Because the two answer different questions, each pill SHALL name
the period it covers in text visible on the pill, so the reader is never left to infer that a pill tracks the
filters below it. A caveat carried only in a tooltip or only in assistive-technology-only content is not
stated for the reader looking at the header; the visible caption SHALL NOT replace the existing hover and
assistive-technology text.

The rated pill SHALL state the number of conversations carrying at least one rating in the period, as a bare
count. It MUST NOT be rendered as a ratio over the conversation count: the two are bounded by different clocks
— ratings by when they were submitted, conversations by when they were last active — so a conversation rated
inside the period whose activity fell outside it counts toward one and not the other. Presented as a ratio
those figures do not describe a proportion, and on a short period the pill can read above one, which states an
impossibility. The count MUST NOT be clamped or adjusted to make a ratio look plausible.

The pills SHALL be re-resolved whenever the applied period changes and whenever the page fetches the first page
of a result, including the first page the client fetches after mount; a server-prefetched figure MUST NOT
remain the displayed value once the client has fetched a page of its own.

The cost total SHALL be summed with the decimal library rather than as floating-point numbers, since the
values carry twelve fractional digits, and SHALL be rounded for display. That rounding is local to the summary
and does not settle how the Cost column renders.

When the summary request fails, the pills SHALL report that the figures are unavailable rather than rendering
zeros, which would assert an empty result that was never established. A rating aggregate that fails SHALL make
the rated and negative pills unavailable without disturbing the conversation count or the cost, since they are
resolved independently.

A failure to fetch the rows SHALL NOT by itself make the figures unavailable: they are resolved by their own
request, so a row failure is no evidence about them. A failure that prevents the summary request from being
issued at all SHALL, however, clear the figures, because the ones on screen then describe the previous period
rather than the applied one.

#### Scenario: The provenance line follows the fetched schema

- **WHEN** the page renders for an instance whose conversations schema reports two enrichment namespaces
- **THEN** the line names the base entity followed by both enrichment namespaces by their catalog names
- **AND** each carries the provenance colour its columns carry in the grid band
- **AND** an enrichment this frontend has no name for is still listed, under the unattributed provenance colour

#### Scenario: An instance reporting no enrichments names the base entity alone

- **WHEN** the fetched schema reports no enrichment namespace
- **THEN** the line names the base entity and the further entities the page queries, and nothing else
- **AND** it renders no empty separator and no placeholder in place of the absent enrichments

#### Scenario: The provenance line names only real, queried entities

- **WHEN** the page renders
- **THEN** every entity on the line is one the page issues a query against
- **AND** no entity is marked as pending or unregistered

#### Scenario: The rated and negative pills cover the whole period

- **WHEN** the result holds more conversations than one page and only the first page is loaded
- **THEN** the rated and negative pills show the period's totals, not the loaded rows' totals
- **AND** those figures do not change as further pages are loaded

#### Scenario: The conversation count is exact regardless of how much is loaded

- **WHEN** the result holds more conversations than one page and only the first page is loaded
- **THEN** the conversation count shows the period's total
- **AND** it carries no approximation marker and no "understated" hint

#### Scenario: Grid filters do not move the pills

- **WHEN** a search term, a column filter or a feedback state is applied and the grid re-queries
- **THEN** all four pills keep reporting the period's figures unchanged
- **AND** the grid alone reflects the narrowing

#### Scenario: Each pill names the period it covers

- **WHEN** the header renders for any selected period
- **THEN** each pill states that period in text visible without hovering
- **AND** no pill states that it covers only the conversations loaded so far

#### Scenario: The rated pill is a count, not a ratio

- **WHEN** the rated pill renders
- **THEN** it shows the number of conversations rated in the period and no denominator
- **AND** it is never rendered as a fraction of the conversation count

#### Scenario: The pills follow a period change

- **WHEN** the applied period changes and the client fetches the first page of the new result
- **THEN** all four pills are re-resolved for that period
- **AND** the figures shown are those observations, not the ones prefetched at page load

#### Scenario: A failed summary reports unavailability

- **WHEN** the summary request fails
- **THEN** the pills report the figures as unavailable rather than showing zeros

#### Scenario: A failed rating aggregate leaves the count and cost standing

- **WHEN** the rating aggregate fails but the conversation count and cost resolved
- **THEN** the rated and negative pills report unavailability
- **AND** the conversation count and cost pills show their resolved figures

#### Scenario: A failed row fetch leaves the figures standing

- **WHEN** the first page of rows fails but the summary request succeeded
- **THEN** the pills keep showing the figures the summary request returned

#### Scenario: A summary that could not be issued reports unavailability

- **WHEN** a failure prevents the summary request from being issued for the applied period
- **THEN** the pills report the figures as unavailable rather than the previous period's figures

### Requirement: Conversation filters re-query the backend

The conversations page SHALL provide a free-text search box, a time-period control and a feedback filter, and
every change to any of them SHALL produce a new backend request carrying the filter values. The page MUST NOT
filter, hide or reorder rows it already holds in response to a filter change: the page holds only the pages it
has fetched, so narrowing those client-side would silently hide matches that exist outside them and report a
wrong result as a complete one. A filter change SHALL discard the loaded pages and re-fetch from the first
page of the new result.

The time-period control SHALL reuse the shared `TimeFilter` component and the `useTimeFilter` hook — the
same controls the dashboard and Usage Log use — so presets, the custom range picker and their labels behave
identically across the app. The page's default period SHALL be the 7-day preset.

Filter state SHALL cross the server-action boundary as a search string plus the range's start and end as
epoch milliseconds, not as `Date` instances: epoch millis are already the shape the query's timestamp
literals require, and the boundary then carries no value whose serialization has to be reasoned about.

Search input SHALL be debounced so that a burst of keystrokes issues one request rather than one per
character, while the box SHALL show each character as it is typed. A time-period or feedback change SHALL NOT
be debounced — each is one deliberate action, so it queries immediately. Because a debounced search can
overlap either and its response can arrive after the newer one, the page SHALL apply only the most recent
request's response.

A failed conversations request SHALL be reported to the operator rather than rendered as an absence of
data. An emptied grid alone is indistinguishable from a period that genuinely held no conversations, so a
failure SHALL surface both as an error toast and in the empty state's own wording, and the failed state
SHALL clear as soon as a later request succeeds. A failure while fetching a later page SHALL NOT discard the
pages already shown, and SHALL still raise the notification.

#### Scenario: A search term issues a new query from the first page

- **WHEN** the operator types a term into the search box
- **THEN** the server action is called with that term and a first-page offset
- **AND** the rows the grid holds are replaced by the rows the response returns

#### Scenario: Keystrokes collapse into one request

- **WHEN** the operator types several characters in quick succession
- **THEN** the box shows each character immediately
- **AND** exactly one request is issued for the burst

#### Scenario: A time-period change issues a new query

- **WHEN** the operator selects a different time preset
- **THEN** the server action is called with the new range as epoch-millisecond bounds
- **AND** the currently applied search term is carried into that request

#### Scenario: A feedback change issues a new query without waiting

- **WHEN** the operator selects a feedback state
- **THEN** the server action is called immediately with that state, without waiting out the search debounce
- **AND** the currently applied search term is carried into that request

#### Scenario: A stale response cannot overwrite a newer one

- **WHEN** two filter changes are in flight and the earlier one's response arrives last
- **THEN** the rows shown are those of the most recently issued request

#### Scenario: A failed filtered request does not leave stale rows

- **WHEN** a request issued by a filter change fails
- **THEN** the grid does not keep showing rows that no longer match the applied filters

#### Scenario: A failed request says so rather than reading as no traffic

- **WHEN** a request issued by a filter change fails
- **THEN** an error notification names the failure
- **AND** the empty grid reports the failure instead of "No conversations"

#### Scenario: A successful request clears an earlier failure

- **WHEN** a request succeeds after an earlier one failed
- **THEN** the grid shows the returned rows and no longer reports a failure
- **AND** a successful request raises no notification

#### Scenario: A failed later page keeps the rows already shown

- **WHEN** fetching a page after the first fails
- **THEN** an error notification names the failure
- **AND** the rows already loaded remain visible

### Requirement: Rating column resolved for the displayed page

The grid SHALL show a Rating column giving each conversation's positive and negative rating counts, attributed
in the provenance band to `response_ratings` rather than to `sessions`.

A session with no rating SHALL render the same unavailable placeholder as a conversation nobody rated. An
agent session can carry no rating at all, so the empty cell SHALL NOT be styled or worded as a defect, and
the column MUST NOT be hidden for such a row — a column that disappears per row reads as a rendering fault.

Ratings SHALL be resolved by a query issued **after** the session query, restricted by `in` to exactly the
session ids in the page just returned. Resolving them from the feedback filter's candidate set instead
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

The query SHALL carry time bounds over `last_rate_time` matching the period the session query is bounded
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

#### Scenario: A session that can carry no rating renders the ordinary placeholder

- **WHEN** the grid renders a coding-agent session
- **THEN** its Rating cell shows the same unavailable placeholder an unrated conversation shows
- **AND** the column is still present for that row

#### Scenario: A failed ratings lookup shows nothing rather than zero

- **WHEN** the ratings query fails
- **THEN** the conversation rows are still returned
- **AND** their rating cells render nothing, asserting no absence of feedback

### Requirement: Conversation cells render composed values, not raw aggregates

The grid SHALL render composed cells rather than one raw stored value per column:

- The conversation column SHALL be a single **identity** cell stacking the conversation's title over its id,
  rather than two columns. The title labels the conversation and the id addresses it; they are one identity,
  and a column apiece printed the id twice on every conversation the enrichment has not reached, which is
  most of them. Where no title exists the first line SHALL render the unavailable marker and MUST NOT repeat
  the id.
- The topics column SHALL render its value as discrete chips rather than as the stored string. The value is a
  delimited list whose separator is not reliably spaced in real data, so the cell SHALL split on the
  delimiter, trim each term and drop empty ones before rendering. A term the view does not recognise SHALL
  render as it is stored: the vocabulary is owned by an evaluator that can be re-versioned without the
  frontend knowing, so normalising or dropping an unexpected term would hide real data. The full list SHALL
  stay reachable when more terms exist than the cell shows.
- The activity column SHALL stack how long ago the conversation was last active over how long it ran. The span
  requires the first activity as well as the last, so the query SHALL select both. The absolute instant SHALL
  stay reachable on hover, since relative time is readable but imprecise.
- Token counts SHALL be compacted rather than delimited in full.
- Cost SHALL be rounded to significant digits and coloured. Rounding SHALL be local to this page and MUST NOT
  change the shared currency formatter, so other price columns are unaffected.
- The project column SHALL show the project alone. It MUST NOT show a model chip: the conversation rollup does
  not carry `deployment`, so the page has no model to attribute to a conversation and MUST NOT infer one. A
  conversation with no project SHALL render an explicit placeholder rather than an empty cell, because an
  unattributed project is common in real data and a blank cell reads as a rendering fault.

Relative time and span helpers SHALL take the current time as a parameter rather than reading the clock, so
they stay deterministic and need no fake timers. Colours SHALL come from theme tokens, never literal values.

Every composed cell SHALL degrade rather than break when part of its data is missing: an absent first activity
leaves the relative time alone, and an absent last activity renders nothing at all.

#### Scenario: The identity cell states the title over the id

- **WHEN** a row carries both a conversation id and an insight title
- **THEN** one cell states the title above the id
- **AND** no separate title column exists

#### Scenario: An untitled conversation shows the marker, not a repeated id

- **WHEN** a row carries no insight title
- **THEN** the cell's first line renders the unavailable marker
- **AND** the id appears once, on the second line

#### Scenario: Topics render as chips from an unevenly delimited string

- **WHEN** a row's topics value is `capabilities,error` and another's is `security, code review, validation`
- **THEN** both render as discrete chips with no leading or trailing whitespace
- **AND** an unrecognised term renders as stored

#### Scenario: The project cell shows the project alone

- **WHEN** a row has a project
- **THEN** the cell shows the project
- **AND** it shows no model chip and no model count

#### Scenario: A conversation with no project is marked, not blank

- **WHEN** a row's project is an empty string
- **THEN** the cell renders an explicit placeholder rather than nothing

#### Scenario: The activity cell carries the span

- **WHEN** a row has both activity bounds
- **THEN** the cell shows the relative time over the span
- **AND** the absolute timestamp is available on hover

#### Scenario: Composed cells degrade on missing parts

- **WHEN** the first activity is absent
- **THEN** the relative time renders alone
- **AND** when the last activity is absent, the cell renders nothing

#### Scenario: Cost is readable

- **WHEN** a cost arrives at the full scale of a decimal sum
- **THEN** it renders rounded to significant digits rather than showing every fractional digit

### Requirement: Conversation row values tolerate either backend wire shape

The `ConversationRow` model in `src/models/analytics/conversations-trace.ts` SHALL type its timestamp and
numeric-metric fields to accept either a number or a string, and nullable metrics to additionally accept
`null`.

The shapes the service actually returns are: a timestamp as an **ISO-8601 string with a `Z` zone designator**,
and a decimal as a **JSON number carrying the column's full fractional scale**. Timestamp parsing SHALL treat
a zoneless string as a hazard rather than assume a shape — a zoneless value parses as local time and shifts by
the viewer's offset — so it SHALL either require the zone or normalize the value before parsing, and MUST NOT
rely on a bare local-time parse. Comments and documentation MUST NOT state that timestamps arrive as epoch
milliseconds.

Tolerating both shapes still costs nothing — the shared formatters (`formatDateTimeToLocalString`,
`currencyValueFormatter`, `numberValueFormatter`) already accept `number | string` — and keeps the page
resilient if the mapping changes.

#### Scenario: Timestamp renders from the shape the service returns

- **WHEN** `last_request_time` arrives as an ISO-8601 string with a `Z` designator
- **THEN** the activity cell renders a formatted local date-time for that instant

#### Scenario: Timestamp renders from an epoch-millisecond number too

- **WHEN** `last_request_time` arrives as an epoch-millisecond number
- **THEN** the activity cell renders a formatted local date-time for the same instant

#### Scenario: Null metrics render as empty cells

- **WHEN** a row's `total_tokens` or `total_price` is `null`
- **THEN** the corresponding cell renders empty rather than `0`, `null`, or `NaN`

### Requirement: Conversation list query over the conversations entity

The system SHALL provide
`buildConversationListQuery({ range, search, chatIds, sort, columnFilters, visibleFields, offset })` in
`src/utils/analytics/conversations-queries.ts` returning a `StructuredQuery` over the entity `sessions`
in **row mode**. The session rollup is materialized by the analytics service — one row
per `client_session_id`, produced by an aggregate pipeline over `dial_usage_log` — so the query SHALL read stored
columns and MUST NOT group or aggregate.

The select SHALL name **`client_session_id` unconditionally**, and nothing else unconditionally. It is the only field
read outside a cell renderer — the grid keys its rows by it, a row click navigates by it, and the loaded set
is mapped by it — so a row without it is unusable whatever the column state. A sort or a filter needs no
field named here: both are resolved server-side by field name, not from the projected row.

Every other field a column reads SHALL reach the select through the cost classification below, with no
standing exemption for the curated columns. An exemption list would have to be re-audited against the schema
on every change and would not be, and it would defeat the classification exactly where it matters: a curated
field the service later marks `heavy` would go on being named on every page, silently, which is the failure
the heavy class exists to prevent. Three of the curated columns are hidden by default, so the exemption also
fetched and discarded their fields on every page.

A field SHALL be projected according to **what projecting it costs**, in three classes:

- a **cheap field of the entity's own source** SHALL be named whether or not its column is visible. Measured
  on a rollup of 6 328 conversations, twenty such columns instead of two read 2.08 MiB instead of 492 KiB and
  took 7 ms instead of 5 — so gating them would buy nothing and would add a re-fetch to every reveal;
- a field of the entity's own source that the service marks **`heavy`** SHALL be named only while its column
  is visible. The service omits such a field from a wildcard projection because it is expensive to transfer,
  and the measurement bears that out: adding the one heavy field to ten scalar columns took the read from
  1.44 MiB to 5.39 MiB — 2.7× the other ten together;
- a field the service reports under an **enrichment namespace** — a name qualified by the enrichment that
  supplies it, `session_insights.` being the one the `sessions` entity exposes today — SHALL be named only
  while that field's column is visible. The service joins an enrichment only
  when a query names one of its columns, so naming one unconditionally would add that join to every page of
  every scroll, for columns the operator has not asked for.

The classes SHALL be decided by what the schema reports — the qualified name for an enrichment, the `heavy`
flag for a heavy field — rather than by a list of field names held in the frontend, so a field the service
newly marks heavy, or an enrichment newly added to the entity, is classified without a code change.

All three rules SHALL apply to a **curated** column's field as well as a derived one's, with no exemption
beyond `client_session_id`. A curated column is
designed rather than derived, but it still reads a stored field, so a projection that skipped it would render
an empty cell for data the row does carry, and it is classified by the same test. The identity column's
enrichment field is the one exception and SHALL be named unconditionally: that column cannot be hidden, so
there is no hidden state for a visibility rule to key on.

It MUST NOT name every field the entity carries: the field set is whatever the service reports and can grow,
and a field no column reads is one nothing renders. A column with no field behind it — Rating is composed
from `rate_analytics` lookups — MUST NOT be named at all, since the entity has no such column.

Making a hidden **enrichment-backed** or **heavy** column visible SHALL restart paging, because the fetched
pages do not carry that field and a column rendered from an absent value would read as empty data rather than
as data not fetched. Making a hidden **cheap source-backed** column visible SHALL NOT re-query: its field is
already in every fetched page, so the rows already held render it. Hiding a visible column SHALL NOT re-query
in any case: the rows already held remain a correct answer to a narrower projection. The whole-result count
and cost SHALL be unaffected by which columns are visible, being aggregates over the filtered result rather
than over the projection.

`turn_count` is the pipeline's count of the conversation's **distinct trace ids**, one trace per request, so
it is a count of turns and not of usage-log rows: the embedding, MCP and routing hops a request fans out
into collapse into the trace that produced them. Turn, request and trace therefore name one quantity, and
user-facing copy SHALL call it **turns** throughout — a second name for the same figure reads as a second
figure. Copy MUST NOT claim it counts individual hops.

The filter SHALL be `and[ ge(last_request_time, startMs), le(last_request_time, endMs) ]`. The time bounds
SHALL apply to `last_request_time`, so a selected period means *conversations whose last activity falls in the
period*. The query MUST NOT carry an empty-`client_session_id` guard: the pipeline's own membership predicate excludes
those rows, so every row of the entity has a non-empty id.

The projection SHALL NOT be what scales with data volume, and this requirement SHALL NOT be read as a
performance control. Measured across every projection variant above, the rows read stayed identical at 7 760
— the whole table — because the list query orders by `last_request_time` under no narrowing filter. The
ordering is what grows with the data; the column list does not.

When a non-blank `search` term is supplied the filter SHALL additionally carry one `or` group of two `ico`
predicates matching `client_session_id` and `project_id`. The term SHALL be trimmed, and a blank or whitespace-only term
SHALL add no predicate at all rather than an `ico` against the empty string, which would match every row at
the cost of a scan. Both targets are base columns of the entity, so no select-alias restriction applies.

Search SHALL NOT reach the conversation title either: the title is an enrichment column, absent for any
conversation the evaluator has not processed, so a term matched against it would silently narrow the result to
enriched conversations only.

Search MUST NOT reach message content: no column of `sessions` carries it, and the only column that
could — `dial_usage_log.request_body` — is catalogued `sensitive` and belongs to a different entity. Search
SHALL NOT reach `user_hash` either: selecting the column for display does not make a surrogate a useful
free-text target, and a partial-match predicate over it would cost a scan for a value operators paste whole —
the user column's own filter is the exact-value input for it. The search affordance SHALL name only the fields
search actually reaches.

When `chatIds` is non-empty the filter SHALL additionally carry `in(client_session_id, chatIds)`, which is how the
feedback filter narrows the result.

When `columnFilters` is non-empty the filter SHALL additionally carry one predicate per entry, conjoined with
everything above. Each entry names a field of the entity and an operator the language expresses; an entry
naming a field the entity does not carry, or an operator with no equivalent, SHALL be rejected rather than
translated to an approximation. A range entry SHALL become a `ge` and an `le` predicate on the same field.
Predicate value types SHALL follow the field's type: string fields carry string literals, count fields
integers, price fields decimals, and timestamp fields epoch-millisecond literals.

An array field SHALL carry neither a sort key nor a filter predicate: the query language expresses no ordering
or comparison over one, so a request to sort or filter by such a field SHALL be rejected rather than
approximated client-side over the loaded page.

The sort SHALL be the caller's sort keys, if any, followed by `{ client_session_id, asc }`; with no caller sort keys it
SHALL be `[{ last_request_time, desc }, { client_session_id, asc }]`. The trailing `client_session_id asc` tiebreaker is required
in every case: the service appends no implicit tiebreaker, so without it a paged result is not stable across
requests and a row could be skipped or repeated between pages. A caller sort key SHALL carry an explicit
nulls ordering placing nulls last, so a column holding nulls orders deterministically rather than relying on
the backend's default. A sort key naming a field the entity does not carry SHALL be rejected: sorting by a
value the query cannot name would silently fall back to an unstated order.

The page SHALL be `{ type: 'offset', offset, limit, include_total: false }`, on **every** page including the
first. The result total is resolved by the summary query under an identical filter, so requesting it here
resolves the same figure a second time; the service issues `include_total` as its own statement over the whole
filtered result, so the second resolution costs a scan per page fetched. A limit above 1000 SHALL never be
sent — the service rejects it with HTTP 400 and does not clamp.

The query SHALL reference no column absent from the entity's role-visible schema; `sessions` exposes no
`sensitive` column, so every selected field is visible to a read-only admin. `user_hash` is catalogued
non-sensitive — the analytics service exposes it as a de-identified surrogate — so selecting, sorting or
filtering on it requires no elevated role.

#### Scenario: Query reads the conversations entity in row mode

- **WHEN** `buildConversationListQuery` is called with a time range
- **THEN** the query targets entity `sessions` with `mode: 'row'`
- **AND** it carries no `group_by` and no aggregate function expression
- **AND** its select names `client_session_id`, `project_id`, `user_hash`, `turn_count`, `total_tokens`, `total_price`,
  `last_request_time`, `first_request_time` and `deployments`

#### Scenario: The query requests no result total

- **WHEN** the query is built for the first page, and again for a later page
- **THEN** each carries `include_total: false`

#### Scenario: Only row identity is named unconditionally

- **WHEN** the query is built with a classified set of source fields
- **THEN** the select names `client_session_id`
- **AND** it names no curated column's field that the classification did not carry
- **AND** `client_session_id` is named once, even where the classification carries it too

#### Scenario: Without a schema the base rollup columns are still named

- **WHEN** the query is built with no classified fields at all, the schema having failed to load
- **THEN** the select names the base rollup columns the curated set renders
- **AND** those columns render values rather than empty cells

#### Scenario: Source-owned fields are projected whether or not their columns are visible

- **WHEN** the query is built while every derived column is hidden
- **THEN** its select names each cheap field of the entity's own source
- **AND** it names no field reported under an enrichment namespace
- **AND** it names no field the service marks heavy

#### Scenario: A heavy source field is projected only while its column is visible

- **WHEN** the query is built with a heavy-field column hidden, and again with it visible
- **THEN** the first select does not name that field
- **AND** the second does

#### Scenario: Revealing a heavy column restarts paging

- **WHEN** the operator makes a hidden heavy-field column visible after scrolling
- **THEN** the fetched pages are discarded and the next request is for the first page
- **AND** that request's select names the newly visible field
- **AND** the column renders values rather than empty cells

#### Scenario: Time bounds apply to last activity as epoch-millisecond literals

- **WHEN** the query is built for a range
- **THEN** the filter contains a `ge` and an `le` predicate on `last_request_time`
- **AND** each carries `value_type: 'timestamp'` with the bound's epoch-millisecond count as a string

#### Scenario: No empty-id guard is emitted

- **WHEN** the query is built
- **THEN** the filter carries no comparison on `client_session_id` against the empty string

#### Scenario: A search term becomes an OR of contains predicates

- **WHEN** the query is built with a search term
- **THEN** the filter carries one additional `or` group of exactly two `ico` predicates
- **AND** they match `client_session_id` and `project_id`, each against the trimmed term
- **AND** no predicate matches `user_hash`

#### Scenario: A blank search term adds no predicate

- **WHEN** the query is built with an empty or whitespace-only search term
- **THEN** the filter carries only the time bounds

#### Scenario: A column filter becomes a conjoined predicate

- **WHEN** the query is built with a column filter entry on `total_price` above a value
- **THEN** the filter carries a `gt` predicate on `total_price` conjoined with the time bounds
- **AND** a range entry instead produces a `ge` and an `le` predicate on that field

#### Scenario: An array field carries no sort or filter

- **WHEN** the query is built with a sort key or a column filter naming `deployments`
- **THEN** that input is rejected rather than translated into a predicate or sort key

#### Scenario: Caller sort keys precede the tiebreaker

- **WHEN** the query is built with a sort key on `total_tokens` descending
- **THEN** the sort is that key followed by `client_session_id` ascending
- **AND** the caller's key carries a nulls-last ordering

#### Scenario: Sort ends with a stable tiebreaker

- **WHEN** the query is built with no caller sort keys
- **THEN** the sort is `last_request_time` descending followed by `client_session_id` ascending
- **AND** `client_session_id` ascending is the final sort entry

#### Scenario: An unknown field is rejected rather than approximated

- **WHEN** the query is built with a sort key or column filter naming a field the entity does not carry
- **THEN** that input is rejected rather than translated

#### Scenario: Search leaves the rest of the query untouched

- **WHEN** the query is built with a search term
- **THEN** its select, sort and page are identical to the same query built without one
- **AND** the time bounds are unchanged
- **AND** `having` is absent

#### Scenario: The projection follows the visible columns

- **WHEN** the query is built with one enrichment-backed column visible and another hidden
- **THEN** the select names the visible column's field
- **AND** it does not name the hidden column's field

#### Scenario: Showing a source-backed column does not re-query

- **WHEN** the operator makes a hidden cheap source-backed column visible after scrolling
- **THEN** no new request is issued and the rows already loaded render that column's values

#### Scenario: A curated hidden column is projected once it is shown

- **WHEN** the operator makes the Topics column visible
- **THEN** the next request's select names `session_insights.topics`
- **AND** the cells render that field's values rather than empty cells

#### Scenario: The identity column's enrichment field is projected with no column of its own

- **WHEN** the list query is built with every optional column hidden
- **THEN** the select still names `session_insights.title`
- **AND** it names no other enrichment field

#### Scenario: Showing a column re-queries from the first page

- **WHEN** the operator makes a hidden enrichment-backed column visible after scrolling
- **THEN** the fetched pages are discarded and the next request is for the first page
- **AND** that request's select names the newly visible field

#### Scenario: Hiding a column does not re-query

- **WHEN** the operator hides a visible column carrying no filter
- **THEN** no new request is issued and the rows already loaded remain

#### Scenario: Hiding a filtered column clears its filter and re-queries

- **WHEN** the operator hides a column that carries an active filter
- **THEN** that column's filter is cleared
- **AND** the fetched pages are discarded and the next request is for the first page
- **AND** that request carries no predicate on the hidden column's field

#### Scenario: The summary is unchanged by a projection change

- **WHEN** the operator changes which columns are visible
- **THEN** the whole-result conversation count and cost do not change

### Requirement: Server-side paging with an exact result total

The conversations page SHALL fetch its rows one page at a time from the backend. The result total SHALL be
the conversation count the result summary resolves, and the list query SHALL NOT request a total of its own.
The summary count and the list query are built from the same filter, so they resolve the same figure; asking
for it twice returns one number by two independent requests, which can disagree with each other and costs a
scan of the whole filtered result on each page fetched.

The page SHALL reuse the application's existing server-paged grid mechanism and its shared page size rather
than introducing a second paging pattern. Successive pages SHALL be requested by advancing the query's
`offset` while every other part of the query — filter, sort, limit — stays identical, so paging cannot change
which conversations are in the result, only which slice of it is delivered.

The grid SHALL be told the total number of rows once it is known, so it stops requesting pages at the end of
the result instead of probing past it. The summary and the first page of a result SHALL be resolved
concurrently and delivered together, so the total reaches the grid with that page rather than by a second
request; the first page SHALL NOT wait on the summary beyond whichever of the two is slower. A later page
carries no summary and SHALL leave the total as it stands. A request for a page beyond the result SHALL
yield no rows and SHALL NOT be reported as a failure.

Where the summary is unavailable — it failed, or it has not yet arrived — the grid SHALL fall back to
treating a page returning fewer rows than were requested as the end of the result, which is the same signal
it uses to terminate a result whose total is not yet known. No further total SHALL be requested on that
account: the fallback already terminates paging, and re-requesting one would reintroduce the scan this
requirement removes. Until either signal arrives the end of the result is simply unknown, which the grid
already represents.

Any filter change SHALL discard the pages already fetched and restart from the first page: a filter change
produces a different result set, so an already-fetched page of the previous one is not a prefix of it. A
change to the sort SHALL restart paging on the same grounds: a page of a differently ordered result is not a
prefix of the new one either, even though the set of conversations is unchanged. A change to any column filter
SHALL restart paging as a filter change.

Ratings SHALL be resolved for each page as it arrives, restricted to the conversations that page contains.

The result total SHALL never be presented as a lower bound. Because the total is exact, the summary MUST NOT
render an approximation marker such as a trailing "+", and MUST NOT hint that the figures understate the
result.

#### Scenario: The first page requests a total

- **WHEN** the page loads its first page of conversations
- **THEN** the request resolves the result summary alongside the rows
- **AND** the list query's offset page sets `include_total: false`
- **AND** the result total shown is the conversation count that summary resolved

#### Scenario: A later page requests no total

- **WHEN** a page after the first is fetched
- **THEN** its list query's offset page sets `include_total: false`

#### Scenario: The total is delivered with the first page

- **WHEN** the first page of a result is fetched
- **THEN** the summary is resolved concurrently with the rows and returned alongside them
- **AND** the grid's row count is set from that summary as the page is delivered

#### Scenario: A later page does not restate the total

- **WHEN** a page after the first is fetched
- **THEN** its response carries no summary
- **AND** the grid's row count is left as the first page established it

#### Scenario: Scrolling fetches the next page unchanged but for its offset

- **WHEN** the operator scrolls past the rows already loaded
- **THEN** a further query is issued with a larger `offset`
- **AND** its filter, sort and limit are identical to the previous page's

#### Scenario: The grid stops at the end of the result

- **WHEN** the last page of the result has been delivered
- **THEN** the grid is told the total row count and issues no further page request

#### Scenario: A short page ends the result when the total is unavailable

- **WHEN** the summary request failed and a page returns fewer rows than were requested
- **THEN** the grid treats that page as the end of the result and issues no further page request
- **AND** no total is requested to establish it

#### Scenario: A filter change restarts paging

- **WHEN** the operator changes the search term, the time period or the feedback state after scrolling
- **THEN** the previously fetched pages are discarded
- **AND** the next request is for the first page of the new result

#### Scenario: A sort change restarts paging

- **WHEN** the operator changes a column's sort after scrolling
- **THEN** the previously fetched pages are discarded
- **AND** the next request is for the first page, carrying the new sort

#### Scenario: A column filter change restarts paging

- **WHEN** the operator applies or clears a column filter after scrolling
- **THEN** the previously fetched pages are discarded
- **AND** the next request is for the first page, carrying the new predicates

#### Scenario: Ratings follow each page

- **WHEN** a page of conversations arrives
- **THEN** the rating counts are resolved for exactly the conversations on that page

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

### Requirement: The enum value filter is presented in the grid's own filter design language

The value-selection control an enum-typed column's filter offers (see "A column of an enum type filters by
selecting from its observed values", whose value semantics this requirement does not change) SHALL be presented
consistently with the text and number filters in the same grid header, which are themed to the application's
form controls. A control that applies the same kind of narrowing SHALL NOT read as a different class of thing
because of how it was implemented.

The control SHALL provide:

- a **search field** that narrows the listed values, offered once the list is long enough for scanning to be the
  slower path. The search SHALL be presentational: it SHALL NOT change which values are selected, and clearing
  it SHALL restore the full list with the selection intact.
- a **select-all / clear** affordance reflecting the current selection as all, none, or partial, so a
  many-valued column does not have to be cleared one value at a time.
- each value's **count** rendered as its own trailing element in a secondary text treatment, **not** concatenated
  into the option's label. The count SHALL NOT form part of the option's accessible name: the name is the value,
  which is what a selection means, and a name that changes as counts move makes the same option unrecognisable
  between openings.
- a **reset** action that clears the selection, matching the reset the text and number filters offer.

The control's **loading**, **empty** and **failed** states SHALL each be announced through a live region and
SHALL be visually distinguishable, with the failed state carrying the error text treatment. The live region
SHALL remain separate from any control's own label.

An enum column SHALL keep its place in the grid's **floating-filter row**, so its affordance sits level with
every neighbouring column's filter rather than a row above it. It MUST NOT take the row's default floating
filter, which is a free-text entry and would write a text model over the column's value model. The affordance
SHALL be the grid's own filter button — the same control, at the same size, as the one every other column in
that row carries — and MUST NOT be a bespoke substitute, which would differ from its neighbours for no reason
a reader could see. Exactly one such control SHALL be offered for the column.

The listed values SHALL remain keyboard-reachable and operable, and the selected state SHALL be exposed
programmatically rather than by styling alone.

#### Scenario: The filter is themed like the grid's other filters

- **WHEN** the operator opens an enum column's filter
- **THEN** its surface, spacing and controls follow the same treatment as the text and number filters in that
  grid's header

#### Scenario: Search narrows the list without changing the selection

- **WHEN** the operator has two values selected and types a term matching neither
- **THEN** the list shows only the matching values
- **AND** the two values remain selected
- **AND** clearing the term restores the full list with both still selected

#### Scenario: Select all and clear act on the whole list

- **WHEN** the operator activates select-all on an enum column's filter
- **THEN** every listed value becomes selected
- **AND** the affordance reports the selection as complete
- **AND** activating it again clears the selection

#### Scenario: A value's accessible name is the value alone

- **WHEN** the operator reaches a listed value with assistive technology
- **THEN** its accessible name is the value
- **AND** the count is not part of that name

#### Scenario: Reset clears the selection

- **WHEN** the operator has values selected and activates reset
- **THEN** no value is selected
- **AND** the request carries no predicate for that column

#### Scenario: The affordance sits level with the other columns' filters

- **WHEN** the grid renders an enum column beside a text-filtered one
- **THEN** both columns' filter affordances are in the floating-filter row
- **AND** the enum column's is the grid's own filter button, not a text entry and not a bespoke one

#### Scenario: Only one control opens the value list

- **WHEN** the grid renders an enum column
- **THEN** its floating-filter row offers a single filter control
- **AND** no second control for the same column appears in the header row

#### Scenario: Loading, empty and failed states are announced

- **WHEN** the value query is in flight, returns nothing, or fails
- **THEN** the corresponding message is announced through a live region
- **AND** the failed state is rendered in the error text treatment

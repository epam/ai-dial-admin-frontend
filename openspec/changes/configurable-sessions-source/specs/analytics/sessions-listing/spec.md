## ADDED Requirements

### Requirement: The session rating enrichment is recognised by its fields

Session-level feedback SHALL be read from a **session rating enrichment** of the base entity: an enrichment
whose namespace reports the fields `rate_pos_count`, `rate_zero_count` and `rate_neg_count`. It SHALL be
recognised by those fields under whatever namespace the schema reports them, and never by the enrichment's
name. Where more than one namespace reports them, the first in schema order SHALL be used.

The enrichment is one row per session, so its fields are read like any other enrichment field of the row: no
second query, no candidate set and no lookup after the page. Where the caller's schema reports no such
enrichment, the feedback filter, the Rating column and the rated and negative pills SHALL NOT be shown, and no
query against a rating rollup or a rate-event log SHALL be issued in their place.

#### Scenario: The rating enrichment is found under another namespace

- **WHEN** the base entity's schema reports `rate_pos_count`, `rate_zero_count` and `rate_neg_count` under a namespace other than `session_ratings`
- **THEN** the Rating column, the feedback filter and the rating pills read that namespace's fields

#### Scenario: No rating enrichment, no rating features

- **WHEN** the caller's schema reports no namespace carrying the three rating counts
- **THEN** the grid offers no Rating column and the toolbar offers no feedback filter
- **AND** no query is issued against `response_ratings` or `rate_analytics`

### Requirement: Feedback filter narrows the session query by the rating enrichment

The sessions page SHALL provide a feedback filter with exactly four mutually exclusive states — all,
positive, negative, and rated — defaulting to all. It SHALL reuse the shared `SegmentedControl`.

A state other than all SHALL add one predicate to the session query over the session rating enrichment's
fields, and SHALL issue no other query:

| State | Predicate |
|---|---|
| positive | `gt(rate_pos_count, 0)` |
| negative | `gt(rate_zero_count, 0)` OR `gt(rate_neg_count, 0)` |
| rated | `gt(rate_pos_count, 0)` OR `gt(rate_zero_count, 0)` OR `gt(rate_neg_count, 0)` |

The negative state SHALL keep its meaning — the zero and the negative counts together — and MUST NOT be narrowed
to the provably negative subset. `rated` SHALL be the union of the three value-bearing counts, which excludes
only a rate event that carried no value.

The predicate is part of the session query, so the result is exact and is paged like any other filtered result:
there is no candidate cap and no incompleteness disclosure. The filter SHALL compose with the search, the column
filters and the period exactly as those compose with each other.

A session whose client submits no rate events carries no rating row, so any state other than all narrows the
result to sessions that were rated. The affordance MUST NOT describe itself as filtering by client.

#### Scenario: A feedback state costs no extra query

- **WHEN** the negative state is selected and a page is fetched
- **THEN** exactly one query is issued, against the base entity
- **AND** it carries the negative predicate over the rating enrichment's fields

#### Scenario: Negative feedback includes a zero rating

- **WHEN** the negative state is selected
- **THEN** its predicate matches a session whose only rating was normalized to zero, alongside one carrying an unambiguously negative rating

#### Scenario: A feedback-filtered result is exact

- **WHEN** more than a thousand sessions in the period carry the selected feedback
- **THEN** all of them are reachable by scrolling
- **AND** no incompleteness disclosure is shown

#### Scenario: Feedback composes with the other filters

- **WHEN** a feedback state is selected while a search term and a time range are applied
- **THEN** the session query carries the feedback predicate, the search predicates and the time bounds together

### Requirement: Rating column reads the rating enrichment of each row

The grid SHALL show a Rating column giving each session's positive and negative rating counts, attributed in the
provenance band to the session rating enrichment's namespace.

The positive figure SHALL be `rate_pos_count`; the negative figure SHALL be `rate_zero_count` plus
`rate_neg_count`. Both SHALL be read from the row itself. Each side SHALL be counted from the same fields the
feedback filter predicates on, so a session the Positive filter selected cannot display a zero positive count,
and the same holds for the negative side. The figures SHALL count every rating the session carries, whenever it
was submitted.

The row's `rate_bool_false_count`, `rate_raw_count` and `rate_event_count` SHALL decide the caveat. Where part of a
negative figure is not established as a thumbs-down, that side SHALL carry a caveat saying so, reachable by
keyboard and exposed to assistive technology. The caveat MUST NOT attribute the whole gap to an uncaptured form: a
rating submitted as a numeric zero is captured and is unestablished because the service has not fixed what a
numeric zero means. A fully attributable negative figure, and a cell with no negative ratings, SHALL carry no
caveat.

Both counts SHALL be displayed at all times, including a zero. A side carrying ratings SHALL be coloured —
positive as success, negative as error, from theme tokens — and a side with none SHALL stay muted. Each side SHALL
carry a text label for assistive technology. A session with no rating row SHALL show a muted zero on both sides.

The fields the Rating column composes SHALL NOT also be offered as separate derived columns. A comment indicator
SHALL NOT be shown in the cell; the session's comment count is stated on the detail view's feedback panel.

#### Scenario: Ratings come with the page

- **WHEN** a page of sessions is returned
- **THEN** its Rating cells render from the page's own rows
- **AND** no further query is issued for them

#### Scenario: A zero-normalized rating still counts as negative

- **WHEN** a session's only rating was submitted as a boolean false and normalized to zero
- **THEN** its negative count is one

#### Scenario: An unattributable negative figure carries a caveat

- **WHEN** part of a session's negative count comes from events whose submitted form was never captured
- **THEN** the negative side carries a caveat stating that
- **AND** the caveat is reachable by keyboard and exposed to assistive technology

#### Scenario: A fully attributable figure carries no caveat

- **WHEN** every event behind a session's negative count had its submitted form captured
- **THEN** the negative side carries no caveat

#### Scenario: An unrated session is muted

- **WHEN** a session carries no rating row
- **THEN** both sides show a muted zero

#### Scenario: Composed fields are not offered twice

- **WHEN** the column picker lists the derived columns
- **THEN** it offers no separate column for `rate_pos_count`, `rate_zero_count` or `rate_neg_count`

### Requirement: The saved column state belongs to the table it was saved for

The grid's saved column state SHALL record the base table it was saved under. On load, a saved state recorded for a
table other than the configured base table SHALL be discarded and the grid SHALL render its default column state.
The check SHALL run in every browser on every load, because the setting is changed in one browser and the saved
states live in all of them.

#### Scenario: A table change resets the saved columns

- **WHEN** the operator's browser holds a column state saved for one base table and the setting now names another
- **THEN** the grid renders its default column state
- **AND** the stale state is not applied

#### Scenario: The same table keeps the saved columns

- **WHEN** the saved state was recorded for the configured base table
- **THEN** the grid applies it

## MODIFIED Requirements

### Requirement: Provenance line and period summary

The page header SHALL state which entities the view is composed over, listing each contributing entity by its
real catalog name and colouring it with the same provenance colour the grid band uses, so the two cannot
disagree. That list SHALL be derived from the entity schema the page fetches — the base entity, followed by
each enrichment namespace the schema reports, in the order those namespaces first appear — together with any
further entity the page itself queries to render a column. Each enrichment SHALL carry a provenance colour of
its own, assigned by the order its namespace first appears in the schema rather than by its name, so two
enrichments are told apart whether or not this frontend has ever heard of them. A hardcoded list is not permitted: enrichments are
catalog objects provisioned per instance, so a fixed list states the composition the code was written against
rather than the one the instance has. Every entity named SHALL be one the page actually queries; the line MUST
NOT name a source the page does not read, and MUST NOT carry a "pending" or "not registered" marker — a source
that does not exist is not listed at all. Where the schema reports no enrichments, the line SHALL name the base
entity alone rather than rendering an empty or partial list.

The header SHALL show summary pills for the session count, the rated count, the count carrying negative
feedback, and the total cost. All four SHALL be exact figures for the **selected time period**, obtained from
the backend, and MUST NOT be computed from the rows currently loaded. The rated and negative counts SHALL be
resolved by aggregating the session rating enrichment's fields over the base entity in the period, not by
inspecting fetched rows, so that they stand complete from the first page and do not climb as the operator
scrolls. Where the caller's schema reports no session rating enrichment, the rated and negative pills SHALL
NOT be shown.

The pills SHALL report the period alone. The free-text search, the grid's column filters and the feedback
filter SHALL narrow the grid and MUST NOT change any pill: the header answers what the period holds, and the
grid answers what the current filters select. Because the two answer different questions, each pill SHALL name
the period it covers in text visible on the pill, so the reader is never left to infer that a pill tracks the
filters below it. A caveat carried only in a tooltip or only in assistive-technology-only content is not
stated for the reader looking at the header; the visible caption SHALL NOT replace the existing hover and
assistive-technology text.

The rated pill SHALL state the number of sessions active in the period that carry at least one rating, as a
bare count. The rating figures are fields of the base entity, so the pill is bounded by the session's Time
field exactly as the session count is: a session active in the period counts with every rating it carries,
whenever that rating was submitted, and a session rated during the period but active only outside it does not
count. The count MUST NOT be clamped or adjusted.

The pills SHALL be re-resolved whenever the applied period changes and whenever the page fetches the first page
of a result, including the first page the client fetches after mount; a server-prefetched figure MUST NOT
remain the displayed value once the client has fetched a page of its own.

The cost total SHALL be summed with the decimal library rather than as floating-point numbers, since the
values carry twelve fractional digits, and SHALL be rounded to a whole number for display, with its thousands
grouped. That rounding is local to the summary and does not settle how the Cost column renders.

When the summary request fails, the pills SHALL report that the figures are unavailable rather than rendering
zeros, which would assert an empty result that was never established. A rating aggregate that fails SHALL make
the rated and negative pills unavailable without disturbing the session count or the cost.

A failure to fetch the rows SHALL NOT by itself make the figures unavailable: they are resolved by their own
request, so a row failure is no evidence about them. A failure that prevents the summary request from being
issued at all SHALL, however, clear the figures, because the ones on screen then describe the previous period
rather than the applied one.

#### Scenario: The provenance line follows the fetched schema

- **WHEN** the page renders for an instance whose sessions schema reports two enrichment namespaces
- **THEN** the line names the base entity followed by both enrichment namespaces by their catalog names
- **AND** each carries the provenance colour its columns carry in the grid band
- **AND** an enrichment this frontend has no name for is still listed, under a provenance colour of its own
- **AND** two enrichments never share a colour

#### Scenario: An instance reporting no enrichments names the base entity alone

- **WHEN** the fetched schema reports no enrichment namespace
- **THEN** the line names the base entity and the further entities the page queries, and nothing else
- **AND** it renders no empty separator and no placeholder in place of the absent enrichments

#### Scenario: The provenance line names only real, queried entities

- **WHEN** the page renders
- **THEN** every entity on the line is one the page issues a query against
- **AND** no entity is marked as pending or unregistered

#### Scenario: The rated and negative pills cover the whole period

- **WHEN** the result holds more sessions than one page and only the first page is loaded
- **THEN** the rated and negative pills show the period's totals, not the loaded rows' totals
- **AND** those figures do not change as further pages are loaded

#### Scenario: The session count is exact regardless of how much is loaded

- **WHEN** the result holds more sessions than one page and only the first page is loaded
- **THEN** the session count shows the period's total
- **AND** it carries no approximation marker and no "understated" hint

#### Scenario: Grid filters do not move the pills

- **WHEN** a search term, a column filter or a feedback state is applied and the grid re-queries
- **THEN** all four pills keep reporting the period's figures unchanged
- **AND** the grid alone reflects the narrowing

#### Scenario: Each pill names the period it covers

- **WHEN** the header renders for any selected period
- **THEN** each pill states that period in text visible without hovering
- **AND** no pill states that it covers only the sessions loaded so far

#### Scenario: The rated pill is a count, not a ratio

- **WHEN** the rated pill renders
- **THEN** it shows the number of sessions active in the period that carry a rating, and no denominator
- **AND** it is never rendered as a fraction of the session count

#### Scenario: The cost pill shows whole dollars

- **WHEN** the period's summed cost carries a fractional part
- **THEN** the cost pill shows it rounded to a whole number, with its thousands grouped
- **AND** no fractional digits are shown

#### Scenario: The pills follow a period change

- **WHEN** the applied period changes and the client fetches the first page of the new result
- **THEN** all four pills are re-resolved for that period
- **AND** the figures shown are those observations, not the ones prefetched at page load

#### Scenario: A failed summary reports unavailability

- **WHEN** the summary request fails
- **THEN** the pills report the figures as unavailable rather than showing zeros

#### Scenario: A failed rating aggregate leaves the count and cost standing

- **WHEN** the rating aggregate fails but the session count and cost resolved
- **THEN** the rated and negative pills report unavailability
- **AND** the session count and cost pills show their resolved figures

#### Scenario: No rating enrichment hides the rating pills

- **WHEN** the caller's schema for the base entity reports no session rating enrichment
- **THEN** the rated and negative pills are not shown
- **AND** the session count and cost pills render as usual

#### Scenario: A late rating on an active session counts

- **WHEN** a session active in the period was rated after the period ended
- **THEN** the rated pill counts it

#### Scenario: A failed row fetch leaves the figures standing

- **WHEN** the first page of rows fails but the summary request succeeded
- **THEN** the pills keep showing the figures the summary request returned

#### Scenario: A summary that could not be issued reports unavailability

- **WHEN** a failure prevents the summary request from being issued for the applied period
- **THEN** the pills report the figures as unavailable rather than the previous period's figures

## REMOVED Requirements

### Requirement: Feedback filter resolved through a second query

**Reason**: Session feedback is now a session-grain enrichment of the base entity, so the filter is one predicate
on the session query instead of a capped candidate query over `response_ratings`.

**Migration**: See "Feedback filter narrows the session query by the rating enrichment". An instance that wants ratings gives the
base table an enrichment carrying the rating fields.

### Requirement: Rating column resolved for the displayed page

**Reason**: The rating counts are fields of each session row, so the lookup after the page is no longer needed.

**Migration**: See "Rating column reads the rating enrichment of each row".

## REMOVED Requirements

### Requirement: Provenance line and result summary

**Reason**: The header stops being a summary of the filtered result and becomes the selected period's
standing figures, so the requirement's central contract — that the pills describe whatever the list query
currently selects — no longer holds. Its loaded-scope clauses (the `Loaded so far` caption, the
distinct-loaded-conversation counting rule, the unresolved-rating exclusion) describe a computation that no
longer happens: nothing derives a pill from fetched rows. Its provenance clause fixed the entity list to a
pair decided when the view was written, which cannot describe an instance whose enrichments were provisioned
later.

**Migration**: Replaced in full by **Provenance line and period summary** below, which keeps the pill set, the
colour agreement with the grid band, the decimal cost summing and every failure clause, and restates scope,
provenance derivation and the rated denominator. No consumer contract outside this page depends on it.

## ADDED Requirements

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

The rated pill SHALL state the rated count against the period's conversation count as its denominator, so both
halves of the ratio describe the same population.

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

#### Scenario: The rated ratio shares one population

- **WHEN** the rated pill renders
- **THEN** its denominator is the period's conversation count, the same figure the conversation pill shows

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

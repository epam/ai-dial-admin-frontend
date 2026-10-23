## Purpose

The entity Audit `Traces` tab over the usage log: an entity's own calls, newest first, each shown with the
trace it belongs to and opening into that trace with the call selected.

## ADDED Requirements

### Requirement: The entity Audit Traces tab serves the trace listing behind the flags

While both `ANALYTICS_ENABLED` and `ANALYTICS_USAGE_ENABLED` resolve truthy — the same pair that decides what
the Audit `Dashboard` tab serves — the Audit `Traces` tab of these entity types SHALL render the entity trace
listing over the usage log: Models, Platform models, Applications, Toolsets and Assets toolsets. With either
flag falsy, the tab SHALL render the telemetry usage-log grid where it does today, unchanged.

The flags SHALL NOT change which entity types offer a `Traces` tab or where it sits among the Audit sub-tabs.
Assets applications, whose Audit tab holds `Dashboard` alone, SHALL gain no `Traces` tab.

When the analytics service refuses the user, the tab SHALL render the no-access state the Audit `Dashboard`
tab renders, rather than an empty listing and a failure notification.

#### Scenario: Flags on serve the trace listing

- **GIVEN** both flags resolve truthy
- **WHEN** the user opens a model's Audit tab and selects `Traces`
- **THEN** the entity trace listing renders for that model
- **AND** no telemetry grid is rendered in the tab

#### Scenario: A flag off keeps the telemetry grid

- **GIVEN** `ANALYTICS_USAGE_ENABLED` resolves falsy
- **WHEN** the user opens a model's Audit `Traces` tab
- **THEN** the telemetry usage-log grid renders as before

#### Scenario: Asset applications gain no Traces tab

- **GIVEN** both flags resolve truthy
- **WHEN** the user opens an asset application's Audit tab
- **THEN** its only sub-tab is `Dashboard`

#### Scenario: A refused user sees the no-access state

- **GIVEN** both flags resolve truthy and the analytics service answers 403 for the user
- **WHEN** the user opens an entity's Audit `Traces` tab
- **THEN** the no-access state renders in the tab

### Requirement: The listing reads the period the Audit tabs share

The listing SHALL render the same period control the telemetry grid renders today — the same presets, the
same default of the last two days, and a Refresh action — and its selection SHALL be the one the sibling Audit
tabs share, so switching between `Dashboard` and `Traces` keeps the period.

The control SHALL NOT be capped by the telemetry dataset's range limit. That limit describes the telemetry
dataset, which this listing does not read.

The listing SHALL read only calls whose start time falls inside the selected period. Changing the period or
pressing Refresh SHALL discard the loaded pages and read from the newest call again.

#### Scenario: The default period is two days

- **WHEN** the user opens the Audit tab and selects `Traces` without having changed the period
- **THEN** the period control reads the last two days
- **AND** every listed call started within the last two days

#### Scenario: The period is shared with Dashboard

- **GIVEN** the user selected the last seven days on the Audit `Dashboard` tab
- **WHEN** the user switches to `Traces`
- **THEN** the period control reads the last seven days and the listing reads that period

#### Scenario: No telemetry range cap

- **GIVEN** the telemetry dataset's range limit is shorter than the widest preset
- **WHEN** the user opens the period control on the listing
- **THEN** every preset is offered and no maximum-range badge is shown

#### Scenario: Refresh reads from the newest call

- **GIVEN** the user has scrolled the listing past its first page
- **WHEN** the user presses Refresh
- **THEN** the listing is re-read from its first page, newest call first

### Requirement: The listing shows the entity's own calls

The listing SHALL show the calls **made to the entity**, identified by the name the usage log records the
entity's calls under — the same name the entity's usage dashboard filters by. A call made *by* the entity
to something else SHALL NOT be listed as one of its calls.

For a toolset or an asset toolset, only **tool calls** SHALL be listed. MCP connection traffic — session
initialisation, tool listing, notifications — is most of a toolset's rows and says nothing about how the
toolset is used.

An entity with no name the usage log could record it under SHALL list nothing and SHALL say so, rather than
listing every call in the log under the entity's heading.

#### Scenario: A model lists the calls made to it

- **GIVEN** an application called a model, which is a child span of the application's call in one trace
- **WHEN** the user opens the model's Audit `Traces` tab
- **THEN** the listing shows the model's call
- **AND** the card names the model's call, not the application's

#### Scenario: An application does not list the calls it made

- **GIVEN** an application's call fanned out into two model calls
- **WHEN** the user opens the application's Audit `Traces` tab
- **THEN** the listing shows the application's own call
- **AND** neither model call is shown as a card

#### Scenario: A toolset lists tool calls only

- **GIVEN** a toolset whose period holds tool calls and connection handshakes
- **WHEN** the user opens the toolset's Audit `Traces` tab
- **THEN** only the tool calls are listed

#### Scenario: An entity with no name to match lists nothing

- **GIVEN** an asset toolset with no path to build its usage-log name from
- **WHEN** the user opens its Audit `Traces` tab
- **THEN** the listing states that the entity has no calls it can be matched by
- **AND** no call from another entity is listed

### Requirement: A card states the call above the trace it belongs to

Each listed call SHALL render as a card with two tiers, which SHALL NOT be interchangeable:

- the **call tier** states that call from its own recorded row — when it started, as a date and a time; who
  made it (the deployment that called it and the project it was made under); whether it succeeded; its
  duration; its tokens; and its cost;
- the **trace tier** states the trace the call belongs to — its kinds of spans, its span count, its own
  token and cost totals, and how many of its spans failed.

The trace tier's figures SHALL be the trace's own, read by trace and not by entity, so a call's card states
what the whole chain consumed even where most of the chain was other entities' calls.

Where one trace holds more than one listed call, its calls SHALL be shown as cards under that one trace, and
the trace's figures SHALL be stated once for the trace rather than repeated on each card.

A value the usage log did not record SHALL render the listing's explicit unavailable placeholder, not a
blank and not zero.

The card SHALL NOT show response ratings or the system-request marker. Both are defined against a session,
which an entity listing does not have.

#### Scenario: A card states its call and its trace apart

- **GIVEN** a model call that took 2 s inside a trace of 14 spans
- **WHEN** the card renders
- **THEN** its call tier states the model call's own duration, tokens and cost
- **AND** its trace tier states 14 spans and the trace's own totals

#### Scenario: Two calls in one trace share the trace

- **GIVEN** a trace in which the same model was called twice within the period
- **WHEN** the listing renders that trace
- **THEN** both calls appear as cards under one trace
- **AND** the trace's totals are stated once

#### Scenario: An unrecorded caller is stated as unavailable

- **GIVEN** a call whose row records no calling deployment
- **WHEN** the card renders
- **THEN** the caller reads the unavailable placeholder

#### Scenario: No session-only parts

- **WHEN** any card in the listing renders
- **THEN** it shows no rating counts and no system-request marker

### Requirement: The listing orders calls newest first and pages by the last call shown

The listing SHALL order calls by start time, newest first, tie-broken by the call's span id so a page boundary
is never arbitrary. It SHALL load further pages as the reader scrolls, appending each to those already shown,
and SHALL NOT impose a fixed ceiling on how far back within the period the reader can go.

Each further page SHALL be read **after the last call already shown**, by its start time and span id — never
by an offset. Calls keep arriving while the listing is open, and under a newest-first order an offset would
shift with every new call, re-serving calls already shown and skipping others.

A call that arrives after the first page was read SHALL NOT be inserted into the loaded pages; it appears on
the next Refresh or period change. A call already shown SHALL NOT be shown twice.

#### Scenario: Newest call first

- **WHEN** the listing renders its first page
- **THEN** its first card is the most recent call in the period

#### Scenario: A new call does not shift the next page

- **GIVEN** the listing has loaded its first page
- **AND** a new call to the entity is recorded
- **WHEN** the reader scrolls to load the next page
- **THEN** the next page starts at the call that followed the last one shown
- **AND** no card on it repeats a card already shown

#### Scenario: The listing reaches the start of the period

- **GIVEN** a period holding more calls than one page
- **WHEN** the reader keeps scrolling
- **THEN** pages keep loading until the oldest call in the period is shown, and no further page is requested

### Requirement: A card opens its trace with the entity's call selected

Opening a card SHALL open its trace in place, replacing the listing within the Audit tab with a control that
returns to it, using the same trace view the session page opens a trace into.

The opened trace SHALL have the card's call already selected: its span selected in the tree, its ancestors
expanded so it is visible, and its details shown in the span panel. The reader SHALL NOT have to find the
entity's call in a trace that may hold hundreds of spans.

Returning to the listing SHALL keep the pages already loaded and the selected period.

#### Scenario: The entity's call is selected on open

- **GIVEN** a model card whose call is a child span three levels deep
- **WHEN** the user opens the card
- **THEN** the trace view renders that trace
- **AND** the model's span is selected, visible in the tree, and its details are shown

#### Scenario: Returning keeps the listing

- **GIVEN** the user has loaded three pages and opened a card on the third
- **WHEN** the user returns to the listing
- **THEN** the three pages are still shown and the period is unchanged

### Requirement: The listing states its empty and failed states

A period holding no calls to the entity SHALL render an empty state saying so for the selected period. A
failed read SHALL render an error state in place of the listing with a way to retry; a failed further page
SHALL keep the pages already shown and offer to retry that page. Neither SHALL raise a toast of its own.

The listing SHALL announce, through a polite live region, when a read completes with no calls or fails, since
neither leaves other persistent confirmation.

#### Scenario: No calls in the period

- **GIVEN** the entity received no calls in the last two days
- **WHEN** the user opens its Audit `Traces` tab
- **THEN** the empty state renders for the selected period

#### Scenario: A further page fails

- **GIVEN** the listing has loaded its first page
- **WHEN** the read of the next page fails
- **THEN** the first page stays shown and a retry for the next page is offered

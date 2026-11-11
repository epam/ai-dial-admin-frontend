## ADDED Requirements

### Requirement: Every enrichment of the base entity has its own panel

The detail view SHALL render **one panel per enrichment namespace** the base entity's schema reports, in the
order the namespaces first appear, instead of a single panel tied to one named enrichment. Each panel SHALL follow
every rule of "The insights panel's field set is derived from the enrichment's schema", applied to its own
namespace: the field set comes from the schema, a field the record carries no value for is omitted, a value
renders in full, and whether the session was reached at all is decided over the namespace as a whole.

The session rating enrichment SHALL NOT get a panel of its own: the feedback panel states it.

A panel's title SHALL be the enrichment's display name where the catalog reports one, and otherwise its namespace.
A field's label SHALL be the field's display name where the schema reports one, and otherwise its name with the
namespace dropped, underscores read as spaces and the first letter capitalised.

A panel's fields SHALL be grouped by their tag. The groups SHALL be ordered first by the enrichment's declared tag
order, then by any other tag in the order its first field appears, with the `system` tag always last. A tag the
declared order omits SHALL still form a group: the declared order is a preference, not a whitelist.

#### Scenario: Two enrichments render two panels

- **WHEN** the base entity's schema reports two enrichment namespaces and the record carries values for both
- **THEN** the detail view renders two panels, in schema order, each holding only its own namespace's fields

#### Scenario: A panel without a catalog display name is titled by namespace

- **WHEN** the catalog reports no display name for an enrichment
- **THEN** its panel is titled by the enrichment's namespace

#### Scenario: A field without a display name gets a readable label

- **WHEN** a field named `<namespace>.resolution_status` reports no display name
- **THEN** its label reads "Resolution status"

#### Scenario: An undeclared tag still forms a group

- **WHEN** an enrichment declares the tag order `insight`, `system` and some of its fields carry the tag `risk`
- **THEN** the panel shows the groups `insight`, `risk`, `system` in that order

#### Scenario: The rating enrichment has no panel of its own

- **WHEN** the base entity's schema reports a session rating enrichment
- **THEN** no enrichment panel is rendered for it
- **AND** its figures appear in the feedback panel

### Requirement: Session detail feedback reads the rating enrichments

The detail view SHALL state, **in the feedback panel**, how many of the session's ratings were positive and how many
negative, read from the session rating enrichment's fields on the session record. They are the same fields the
grid's Rating column reads, so the two SHALL agree for the same session. A session with no rating row SHALL state
zero in both directions. The negative figure SHALL be composed on the same terms as the grid's and SHALL carry
the same keyboard-reachable caveat.

The panel SHALL list the session's rated **responses**, most recently rated first, read from the **response rating
enrichment** on the usage log: an enrichment of `dial_usage_log` grained by response id, recognised by the same
three rating counts the session rating enrichment carries. A response recorded on more than one hop SHALL be
listed once. Each entry SHALL state its direction and when it was rated; where its first and last rating times
differ, the window. An entry whose response carries more than one distinct rating value SHALL state that its
ratings disagree. An entry whose rate events carried no rating value SHALL be labelled neither positive nor
negative.

Each entry SHALL state how many comments its response carries. The comment **text** is catalogued sensitive, so it
SHALL be named only when the fetched schema reports it, and an entry SHALL distinguish a response with no comments
from one whose comment text this caller may not read.

Each card, and each assistant message, SHALL show the ratings of the rated responses its trace recorded, joined
exactly on the response id and counting each rated response once per trace. Attribution MUST NOT fall back to
time, so a rating does not move when a further page of traces loads.

When more rated responses exist than the panel lists, it SHALL say the list is partial; the direction figures come
from the session record and SHALL NOT be qualified by that disclosure. Where the usage log's schema reports no
response rating enrichment, the panel SHALL state the direction figures and no list, and no card SHALL state a
rating.

#### Scenario: Panel figures agree with the grid

- **WHEN** a session's grid row shows two positive and one negative rating
- **THEN** its feedback panel states two positive and one negative

#### Scenario: Rated responses are listed from the usage log

- **WHEN** the session's hops recorded three rated responses, one of them on two hops
- **THEN** the panel lists three entries, most recently rated first

#### Scenario: Comment text respects the schema

- **WHEN** a listed response carries comments and the caller's schema reports no comment text field
- **THEN** the entry states the comment count
- **AND** the text renders as unavailable to this caller rather than as absent

#### Scenario: A relayed response is counted once on its card

- **WHEN** a trace recorded a rated response id on a span and on a span nested beneath it
- **THEN** the trace's card counts that rating once

#### Scenario: No response rating enrichment, no list

- **WHEN** the usage log's schema reports no response rating enrichment
- **THEN** the feedback panel states the direction figures and lists no responses
- **AND** no card shows a rating

## REMOVED Requirements

### Requirement: Session detail feedback reads the rating source

**Reason**: The session's figures are now fields of the session record and its rated responses are fields of the
usage log's own rows, so the detail view no longer reads a separate rating rollup.

**Migration**: See "Session detail feedback reads the rating enrichments". An instance that wants ratings gives the
base table and the usage log each an enrichment carrying the rating fields.

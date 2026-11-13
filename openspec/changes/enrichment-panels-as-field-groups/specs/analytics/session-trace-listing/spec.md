## REMOVED Requirements

### Requirement: The insights panel's field set is derived from the enrichment's schema

**Reason**: Superseded by "An enrichment panel's field set is derived from the enrichment's schema", which states the same rules for every enrichment panel and replaces the omit-when-null rule with the metadata panel's unavailable marker.

**Migration**: None; the replacement requirement carries every surviving rule and scenario.

## ADDED Requirements

### Requirement: An enrichment panel's field set is derived from the enrichment's schema

The insights panel SHALL present **every** field of the insight enrichment that the fetched schema reports — not an
enumerated subset — including the fields the schema types as an object, an array or a map. The field set SHALL be
derived from the schema, so a field the enrichment gains renders with no frontend release and a field it drops stops
rendering with none either.

A field's label and its explanatory hint SHALL be taken from what the schema reports for that field — its
display name, falling back to its readable field name with the enrichment namespace dropped, and its
description. A field this frontend has never heard of must still be labelled and explained, and no
translation key can exist for one.

The enrichment's own **bookkeeping** fields SHALL be presented alongside its descriptive ones and in the
same register — no field is withheld for the kind of field it is. Which evaluator produced a row, and from
what input, is what tells a reader whether an empty descriptive field means *the evaluator found nothing* or
*this row predates that field*, which no descriptive field can say about itself. This does not reopen the
header's rule: the header SHALL still state a title exactly as recorded and MUST NOT qualify it with a
truncation caveat, per "Session detail header names the session and states its turn count". A
fact stated as a field in a panel is not a caveat attached to a heading.

Whether the session carries an insight row at all SHALL be decided over the enrichment's **namespace
as a whole**, never over one named field. A record carrying no key for any field of the namespace has not
been reached by the enrichment on this instance; a record carrying those keys with a value in none of them
has been reached and produced nothing. Keying that test on a single field would make the panel's existence
depend on that field continuing to exist, and would report a session whose one field happens to be
blank as one the evaluator never reached.

A value SHALL render **in full**, wrapping where it is long, rather than being clipped to a fixed value
slot. The enrichment's fields range from a two-letter code to several sentences and the schema declares no
length for any of them, so which values are short is not something the panel can be told in advance.

A field the record carries no value for SHALL be stated as **unavailable**, as the metadata panel states one,
rather than omitted. The panel presents its fields in the metadata panel's groups, and a group whose rows came and
went with the record would make its own structure depend on which evaluator version labelled the row.

A list value SHALL render as its items separated by a comma and a single space, and an object or map value as its
key–value pairs, as the metadata panel renders them.

A value of a field the schema types as a **closed vocabulary** SHALL render as readable words rather than as
the raw underscored token the evaluator emits. The rule follows the schema's declared type rather than a
list of field names, so a field newly typed as a closed vocabulary reads as words with no frontend change.

#### Scenario: A field the frontend has never heard of still renders

- **WHEN** the schema reports an insight field no frontend list enumerates and the record carries a value
  for it
- **THEN** the panel renders it as a labelled value
- **AND** rendering it required no change to a frontend field list

#### Scenario: A field's label and hint come from the schema

- **WHEN** the panel renders an insight field the schema reports a display name and a description for
- **THEN** the field's label is that display name
- **AND** its description is offered as a keyboard-reachable hint

#### Scenario: A field the schema names but does not describe is still labelled

- **WHEN** the schema reports an insight field with no display name
- **THEN** the panel labels it from its field name, in readable words, without the enrichment namespace

#### Scenario: The enrichment's bookkeeping is stated in the panel

- **WHEN** a session's insight row carries the enrichment's own bookkeeping fields alongside its
  descriptive ones
- **THEN** the insights panel states them in the same register as the rest
- **AND** the view's heading still states the title with no truncation caveat attached to it

#### Scenario: A long value renders in full rather than clipped

- **WHEN** the panel renders an insight field whose value runs long
- **THEN** the value renders in full, wrapping, rather than clipped to a value slot

#### Scenario: A field left null is stated as unavailable

- **WHEN** a session's insight row carries no value for a field the schema still reports
- **THEN** that field renders in its group, marked unavailable
- **AND** it offers no copy control

#### Scenario: A list field renders its items

- **WHEN** the schema types an insight field as an array of strings and the record carries three items for it
- **THEN** the detail query reads that field
- **AND** the panel states the three items separated by a comma and a space

#### Scenario: An object field renders its pairs

- **WHEN** the schema types an insight field as an object and the record carries a value for it
- **THEN** the panel states the object's keys and values as pairs, not as a serialised string

#### Scenario: A closed-vocabulary value row reads as words

- **WHEN** the panel renders a value row for a field the schema types as a closed vocabulary
- **THEN** its value reads as readable words rather than the raw underscored token

#### Scenario: The panel's presence is decided over the namespace, not one field

- **WHEN** a record carries values for the enrichment's fields but none for the one the view reads as its
  heading
- **THEN** the insights panel renders those fields
- **AND** the session is not reported as unevaluated

#### Scenario: A record carrying the namespace with no values reads as unevaluated

- **WHEN** a record carries the enrichment's field keys and a value in none of them
- **THEN** the view reports the session as not yet evaluated
- **AND** it does not report the enrichment as absent from the instance

## MODIFIED Requirements

### Requirement: The metadata panel presents the session's record as the groups the schema defines

The metadata panel SHALL present the session's record as collapsible groups — one group per tag the `sessions`
schema reports, in the order the schema reports them — and SHALL carry no other presentation of the record's
fields, so a field is stated once, in the group of its tag. It SHALL present them the way the span rail
presents a span's fields, with the same group control and the same rows: it is the same kind of content as the
span rail's, and a reader moving between the two sees one control. The enrichment panels use the same groups and
rows. The set of fields SHALL be discovered from the schema and not enumerated, so a column the service adds
reaches the panel without a release, and a tag this release has no label for SHALL be presented under the schema's
own spelling. One group SHALL be open at a time, and a header SHALL state whether it is expanded and what it
controls.

Each row SHALL offer the schema's description of its field as a keyboard-reachable hint beside the label, where the
schema reports one. A field the schema does not describe SHALL carry no hint control.

A closed caller group SHALL preview the user's name, so the reader sees who called without opening it; where
the session records no name the group previews its first stated field, as every group does. The other groups
preview as the span rail's do.

Where this view states a column more exactly than the catalog names it, the row SHALL carry this view's label:
the successful-request row, in particular, keeps the label that states what `success_count` counts.

The panel SHALL leave out a column the service marks `heavy`, because the detail read is one row and a heavy
column is the expensive one to transfer, with one exception: the trace ids, which the panel is required to state,
remain read. It SHALL leave out every enrichment's columns, which the enrichment panels present. It SHALL NOT leave
out a column because another panel states it in another form: the usage panel states token counts in compact form,
which rounds them, so the groups state the counts exactly, and the dump states them again. A reported zero in a
rollup is a sum, not an unmetered call, so a zero in a token, cost or duration group SHALL be stated as zero and
not as unavailable. A column the service marks sensitive SHALL be presented, in a group and in the dump, only
where the fetched schema reports it: the service removes such a column from the schema for a caller without the
elevated role, so a column that arrived is one this caller may read.

Where the schema could not be read and so no group can be formed, the panel SHALL say so in text and SHALL still
offer the record as JSON, because the record the detail read returned does not depend on the schema.

#### Scenario: Fields are grouped by the schema's tags

- **WHEN** the detail view renders for an instance whose schema tags its columns
- **THEN** the metadata panel presents one group per reported tag, in the schema's order
- **AND** each group lists the fields reported under that tag
- **AND** no field is presented outside a group

#### Scenario: The panel reads as the span rail's field groups do

- **WHEN** the metadata panel and the span rail's field groups are both on screen
- **THEN** their groups use the same control and the same rows

#### Scenario: A column the schema adds appears without a release

- **WHEN** the schema reports a column this frontend has no entry for
- **THEN** the column renders in the group of its tag under the schema's own label

#### Scenario: A described field offers its description

- **WHEN** a group is open and the schema reports a description for one of its fields
- **THEN** that field's row offers the description as a hint reachable by keyboard
- **AND** a field the schema does not describe offers no hint

#### Scenario: A closed caller group previews the user's name

- **WHEN** the metadata panel renders with its groups closed and the session records a user name
- **THEN** the caller group previews that name

#### Scenario: A caller group without a name previews its first field

- **WHEN** the session records no user name
- **THEN** the caller group previews its first stated field

#### Scenario: The successful-request row keeps its qualified label

- **WHEN** the group holding the successful-request count is open
- **THEN** its label states that a turn counts when at least one of its hops succeeded

#### Scenario: A figure the usage panel states is also stated exactly

- **WHEN** the usage panel states a token count in compact form
- **THEN** the token usage group states the same count exactly

#### Scenario: A reported zero is stated as zero

- **WHEN** the rollup records a zero in a token, cost or duration column
- **THEN** its group states zero
- **AND** it does not mark the field unavailable

#### Scenario: An enrichment's column is not stated in the metadata panel

- **WHEN** the base entity's schema reports an enrichment namespace
- **THEN** none of that namespace's columns renders in a metadata group
- **AND** they render in that enrichment's panel

#### Scenario: A sensitive column the schema reports is presented

- **WHEN** the schema reports a column marked sensitive
- **THEN** the detail query names it
- **AND** a group and the dump present it

#### Scenario: A sensitive column the schema does not report is not presented

- **WHEN** the schema does not report a column marked sensitive for the caller
- **THEN** the detail query does not name it
- **AND** no group and no dump presents it

#### Scenario: An unreadable schema leaves the record available as JSON

- **WHEN** the sessions schema could not be read
- **THEN** the metadata panel says the schema could not be read
- **AND** its JSON control still presents the record

### Requirement: Every enrichment of the base entity has its own panel

The detail view SHALL render **one panel per enrichment namespace** the base entity's schema reports, in the
order the namespaces first appear, after the usage, metadata and feedback panels, instead of a single panel tied to one named enrichment. Each panel SHALL follow
every rule of "An enrichment panel's field set is derived from the enrichment's schema", applied to its own
namespace: the field set comes from the schema, a field the record carries no value for is stated as unavailable,
a value renders in full, and whether the session was reached at all is decided over the namespace as a whole.

The session rating enrichment SHALL NOT get a panel of its own: the feedback panel states it.

A panel's title SHALL be the enrichment's display name where the catalog reports one, and otherwise its namespace.
The panel SHALL carry no separate source identifier: the title already names the enrichment, and repeating the
namespace beside it states one fact twice. Where the enrichment's table definition carries a description, the title
SHALL offer it as a tooltip on hover and on keyboard focus; where it carries none, or the definition could not be
read, the title SHALL offer no tooltip and SHALL NOT take focus.
A field's label SHALL be the field's display name where the schema
reports one, and otherwise its name with the namespace dropped, underscores read as spaces and the first letter
capitalised.

A panel SHALL present its fields in the metadata panel's collapsible groups, one group per tag, with the same group
control, the same rows, the same value formatting, the same description hints and the same copy control: one group
open at a time, a closed group previewing its first stated value. A field the view reads as its heading through the
Title role SHALL NOT be repeated as a row, and an evaluated panel left with nothing to state once that field is set
aside — no group and no summary — SHALL NOT render at all, and a long free-text summary field SHALL be stated as a paragraph inside the
groups' frame, above the first group, rather than as a row, under its own field label. Where the record carries no
summary, neither the label nor the paragraph SHALL render. The summary SHALL be clamped to two lines, with a control
that expands it in place and collapses it again; a summary that fits in two lines SHALL offer no such control.

The groups SHALL be ordered first by the enrichment's declared tag order, then by any other tag in the order its
first field appears, with the `system` tag always last. A tag the declared order omits SHALL still form a group:
the declared order is a preference, not a whitelist. A field the schema leaves untagged SHALL form a group of its
own, as it does in the metadata panel.

#### Scenario: Enrichment panels follow the base panels

- **WHEN** the detail view renders for a session whose base entity reports an enrichment
- **THEN** the usage, metadata and feedback panels come first and the enrichment panels after them

#### Scenario: Two enrichments render two panels

- **WHEN** the base entity's schema reports two enrichment namespaces and the record carries values for both
- **THEN** the detail view renders two panels, in schema order, each holding only its own namespace's fields

#### Scenario: A panel without a catalog display name is titled by namespace

- **WHEN** the catalog reports no display name for an enrichment
- **THEN** its panel is titled by the enrichment's namespace

#### Scenario: An enrichment panel names its enrichment once

- **WHEN** an enrichment panel renders without a catalog display name
- **THEN** its namespace appears once, as the title
- **AND** no source identifier repeats it beside the title

#### Scenario: A described enrichment explains itself on its title

- **WHEN** the enrichment's table definition carries a description
- **THEN** hovering or focusing the panel title shows the description as a tooltip

#### Scenario: An undescribed enrichment title offers no tooltip

- **WHEN** the enrichment's table definition carries no description, or could not be read
- **THEN** the panel title shows no tooltip and is not a focus stop

#### Scenario: An enrichment panel reads as the metadata panel does

- **WHEN** an enrichment panel and the metadata panel are both on screen
- **THEN** their groups use the same control and the same rows
- **AND** opening a group of the enrichment panel closes the group of that panel already open

#### Scenario: A field without a display name gets a readable label

- **WHEN** a field named `<namespace>.resolution_status` reports no display name
- **THEN** its label reads "Resolution status"

#### Scenario: An undeclared tag still forms a group

- **WHEN** an enrichment declares the tag order `insight`, `system` and some of its fields carry the tag `risk`
- **THEN** the panel shows the groups `insight`, `risk`, `system` in that order

#### Scenario: The summary sits inside the groups' frame, clamped to two lines

- **WHEN** an enrichment record carries a summary longer than two lines
- **THEN** the summary is stated above the first group, inside the same frame as the groups, under its field label
- **AND** it shows two lines and a Show more control that expands it in place

#### Scenario: A record without a summary states no summary label

- **WHEN** an enrichment record carries no value for its summary field
- **THEN** neither the summary label nor a summary paragraph renders

#### Scenario: A panel holding only the heading is not rendered

- **WHEN** an enrichment's only value on the record is the field the Title role reads as the page heading
- **THEN** no panel renders for that enrichment

#### Scenario: The heading field is not repeated

- **WHEN** the Title role is bound to a field of an enrichment
- **THEN** that field is not stated as a row of the enrichment's panel

#### Scenario: The rating enrichment has no panel of its own

- **WHEN** the base entity's schema reports a session rating enrichment
- **THEN** no enrichment panel is rendered for it
- **AND** its figures appear in the feedback panel

### Requirement: Session detail feedback reads the rating enrichments

The feedback panel SHALL render only where the base entity reports a session rating enrichment. Where it reports
none, the detail view SHALL render no feedback panel at all, as the grid already leaves out its Rating column: a
capability the instance does not have is absent from the page, while a configured one with no data states so.

The detail view SHALL state, **in the feedback panel**, how many of the session's ratings were positive and how many
negative, read from the session rating enrichment's fields on the session record. They are the same fields the
grid's Rating column reads, so the two SHALL agree for the same session. A session with no rating — no
positive or negative count and no rated response — SHALL state that it carries no ratings, in text, instead of two
zero counts; the counts and the statement SHALL NOT appear together, because two zeros above a statement of no
ratings state one fact twice. The negative figure SHALL be composed on the same terms as the grid's and SHALL carry
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

#### Scenario: An unrated session states no ratings instead of zeros

- **WHEN** a session carries no positive or negative rating and no rated response
- **THEN** the feedback panel states that no ratings are recorded
- **AND** it shows no rating counts

#### Scenario: No rating enrichment, no feedback panel

- **WHEN** the base entity's schema reports no session rating enrichment
- **THEN** the detail view renders no feedback panel
- **AND** the usage and metadata panels still render

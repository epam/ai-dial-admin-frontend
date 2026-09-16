## ADDED Requirements

### Requirement: The span rail states every field the hop log records for the selected span

The rail SHALL present the selected span's recorded fields in full, not a curated subset. **Which fields
exist SHALL be decided by the fetched hop-log entity schema**, and the span read SHALL name the fields that
schema reports rather than a list written out in the frontend.

**A field the service withholds from this caller SHALL never be named.** A column flagged sensitive in the
analytics catalog is absent from the schema below full administrator, and a projection naming an absent
column is rejected with the whole query — which would cost the reader the span tree, not merely the field.
The frontend MUST NOT implement an access check of its own: the schema is the answer, exactly as it already
is for the body columns.

**Heavy columns SHALL be excluded.** The recorded request body, the recorded response body and the assembled
response are presented by the bodies section, which reads them in tiers for the span the reader opened; the
span read never selects them, and a rail cannot hold one.

**The projection SHALL name only columns the fetched schema reports.** The columns this console knows the hop
log to carry are the fallback for a failed read, not an addition to a successful one: an instance whose log
predates one of them would have it named and reject the whole query.

**A failed schema read SHALL NOT cost the reader the trace.** Where the schema cannot be fetched, the span
read SHALL still issue with the columns this console knows the hop log to carry — the tree, the transport
line and the rail's own figures are built from them — and the tree, the bodies and the rail's figures SHALL
render as they always do. The rail SHALL then present no field groups and SHALL state why: a field the
schema does not describe has no label, no type and no group, and supplying those here is what resolving them
from the schema exists to prevent.

**A column the service chose to return SHALL be presented, sensitive ones included.** Where the caller holds
the entitlement, the fetched schema carries the captured request headers, the token's claims and the caller's
email, and the rail states them as it states any other column: the trace pages are administrator surfaces,
and an administrator can read the same columns with a query. The entitlement stays the service's to decide —
a caller below it never sees the columns in the schema, so there is nothing here to withhold.

**A field the schema reports but this frontend has never heard of SHALL be presented**, under the label the
schema gives it. An observability console that silently drops an unfamiliar column reports a gap in its own
knowledge as a gap in the record.

**A field SHALL be stated as its label over its value, and nothing else.** The schema's own description of a
column is not presented: it is a line of prose per row in a 360px rail, where the label and the value are
what the reader came for.

#### Scenario: The rail presents the fields the schema reports

- **WHEN** a span is selected and the hop-log schema has been fetched
- **THEN** the rail presents every non-heavy field that schema reports for the span
- **AND** no field is presented that the schema does not report

#### Scenario: A caller holding the sensitive columns sees them

- **WHEN** the fetched schema reports the columns flagged sensitive for this caller
- **THEN** the rail states them among the fields of their groups
- **AND** the record offered as JSON carries them too

#### Scenario: A caller without the sensitive columns keeps the whole rail

- **WHEN** the fetched schema omits the columns flagged sensitive for this caller
- **THEN** the span read names none of them
- **AND** the rail presents the remaining fields with no error and no placeholder for the absent ones

#### Scenario: The body columns are not among the rail's fields

- **WHEN** a span whose body columns the caller may read is selected
- **THEN** the rail presents no recorded body
- **AND** the bodies section remains the only surface presenting them

#### Scenario: A column the schema does not report is never named

- **WHEN** the fetched schema omits a column this console knows the hop log to carry
- **THEN** the span read does not name it

#### Scenario: A failed schema read leaves the tree and the rail working

- **WHEN** the hop-log schema cannot be fetched
- **THEN** the span read still returns the spans and the tree renders
- **AND** the rail states its own figures, the endpoint and the upstream
- **AND** it presents no field groups and states why

#### Scenario: An unrecognised column is presented, not dropped

- **WHEN** the fetched schema reports a column this frontend has no name for
- **THEN** the rail presents it under the label the schema gives it
- **AND** no unfamiliar column is omitted

### Requirement: The rail's fields are grouped by the schema's own grouping, one group open at a time

The rail SHALL present its fields as one section of collapsible groups. **A group SHALL be the schema's own
`tag`**, and the groups SHALL follow the order the schema reports its fields in — the service returns them
sorted by the entity's own tag ordering where one is set, so honouring arrival order honours the catalog's
ordering without a second copy of it here. Grouping invented in this frontend would be a second answer to a
question the catalog already answers, and would need maintaining every time the service publishes a column.

**A column the catalog leaves untagged SHALL be presented in a group of its own**, after the tagged ones.

**Opening a group SHALL close the one already open.** Thirteen groups expanded at once turn a 360px rail into
a scroll of a hundred rows, which is the state a grouped presentation exists to prevent.

**The set of groups SHALL be decided by the schema, not by the selected span's values.** A group whose fields
this span has no value for SHALL remain listed and SHALL remain operable, opening on a statement that this
span recorded none of them. A list of groups that changed with every click of the tree would make the rail's
own structure a moving target, and a group removed from the list takes its header out of the focus order.

**A collapsed group SHALL state its name and a preview of what it holds** — the first value this span
recorded in it, at the trailing edge and clamped — so that a reader scanning the rail can tell a group worth
opening from one whose answer they already have. **The preview SHALL be the group's own first recorded value
rather than a field chosen per tag**: a map of tag to representative field is thirteen entries this console
would own and the catalog would keep outgrowing, for a line that is a preview and not a fact the reader acts
on.

**A group SHALL be previewed by the column named for its tag where one is named**, not by its own first
field. Fields arrive sorted by name inside a tag, so a token group leads with a cache count — a part of
another figure — and the call groups lead with whichever of their columns sorts first. What a reader scanning
the rail wants from those groups is the hop's token total, its verb and its status, so those are the columns
named. Where a named column reported nothing, the preview SHALL fall back to the group's own first recorded
value.

**A group with no value that stands for it SHALL be previewed by nothing at all, never by a count.** The
untagged group is whatever the catalog left ungrouped, so its first value stands for nothing, and an
object-valued field has no single value to stand for it either. A number in that place answers a question
nobody asked — how many fields there are — while looking like the figure the other groups state.

**The preview SHALL NOT be stated while the group is open**, where the value it previews is the first row
beneath it. **No count, no colour and no marker**: the rail answers what this hop recorded, and a group is a
way of finding a field in it rather than a thing in its own right.

**An object-valued field SHALL be presented as the pairs it records**, each under its own key, and SHALL NOT
be stringified into one line. The request's captured headers and a token's claims arrive this way: tens of
pairs, each a fact a reader looks for by name, and one line is a wall to pick it out of. An object recording
no pair worth rendering counts as no value.

**A field the span has no value for SHALL still be rendered, with its absence stated.** An absent figure is
an answer — the hop did not meter it — while a missing row leaves the reader checking the schema to find out
whether the column exists at all. **Absence SHALL be decided by one test**, shared with the preview, so a row
cannot state a figure the rest of the rail treats as unreported: `null`, an empty string and an empty array
are absent, and so is a reported zero in a metered figure, because a core predating a token column stores
zero for "not reported". A row deciding this by whether its formatted text is empty would state such a zero
as `0`.

**A cost figure SHALL be stated in the console's own money format.** Cost columns are decimals running below
the cent, so a general-purpose number rendering — three decimals by default — states a hop that spent
$0.0000075 as `0`, and an instance serialising the decimal as a string states twelve raw places beside a
tile that states three.

**The open group SHALL persist across a change of selected span**, wherever the newly selected span offers
that group. A reader comparing one group across two spans is asking the same question twice; being returned
to a collapsed rail on each click answers a different one.

#### Scenario: Groups follow the schema's tags and its order

- **WHEN** the rail presents a span's fields
- **THEN** each group corresponds to a tag the schema declares
- **AND** the groups follow the order the schema reported its fields in
- **AND** a column the schema leaves untagged is presented in a group of its own

#### Scenario: Opening a group closes the previous one

- **WHEN** a group is opened while another is open
- **THEN** the previously open group collapses
- **AND** exactly one group is open

#### Scenario: A group with no values stays listed and operable

- **WHEN** the selected span has a value for none of a group's fields
- **THEN** the group is still listed
- **AND** opening it states each of its fields with its absence

#### Scenario: An object-valued field states its pairs

- **WHEN** a group holding a field the schema types as an object is opened
- **THEN** each pair the field records renders under its own key
- **AND** the field is not stated as one stringified line

#### Scenario: A metered zero is stated as an absence

- **WHEN** a group holds a metered figure the span recorded as zero
- **THEN** its row states the absence rather than the figure

#### Scenario: A sub-cent cost is stated as money

- **WHEN** a cost group holds a figure below one cent
- **THEN** its row states it in the money format the rest of the console uses
- **AND** it is not rounded away to zero

#### Scenario: A collapsed group previews its first recorded value

- **WHEN** the rail presents a span's fields
- **THEN** each collapsed group states its name and its first recorded value
- **AND** it states no count and carries no colour marker

#### Scenario: A group with a named column is previewed by it

- **WHEN** the rail presents a collapsed group of token figures
- **THEN** it states the hop's total rather than the group's first field
- **AND** the request group states the hop's verb and the response group its status
- **AND** where a named column reported nothing, the group states its own first recorded value

#### Scenario: A group with nothing to preview states nothing

- **WHEN** the rail presents a collapsed group the schema left untagged
- **THEN** it states no preview beside its name
- **AND** it states no count of the fields it holds

#### Scenario: The preview gives way to the rows

- **WHEN** a group is opened
- **THEN** its header states its name without the preview
- **AND** the value the preview stated is the group's first row

#### Scenario: The open group survives selecting another span

- **WHEN** a group is open and the reader selects another span that offers it
- **THEN** that group is still the open one

### Requirement: The rail states the per-span figures the tree does not, and the endpoint and upstream

Above the groups the rail SHALL state the figures a reader checks on every span it opens: **the recorded
instant at the precision the log holds it**, and **the span's own cost beside its chain cost**.

**The recorded instant SHALL keep sub-second precision.** The tree's row states the instant to the second,
and a turn's spans routinely start within the same second — so stated to the second, the instant answers
nothing about order, which is the question it is read for.

**The own cost and the chain cost SHALL be stated together.** A row of the tree states whichever of the two
applies to it, so the rail is the only surface where their relationship is visible — and that relationship is
the answer to why an application span reports no cost of its own while its chain spent.

**The endpoint and the upstream URI SHALL be stated above the groups as well**, outside any group. The tree
states neither: the upstream is deliberately not a row fact, and the endpoint can name a deployment other
than the one the row is named for, so a reader cannot infer it from the row.

**A figure stated above the groups SHALL NOT be repeated inside one**, and nothing else is withheld from the
groups. The groups are the hop's record, so a reader looking for its status, its duration or its token total
finds them there without knowing which other surface owns them — the tree's row and the bodies section state
the same columns in their own form, and that repetition is the price of the record being complete. Only the
rail's own headline facts are dropped, because repeating them a few rows below themselves states one fact
twice on one surface.

**A column whose recorded value cannot be read at face value SHALL be withheld by name.** The baggage
table's copy of the request time exists to drive that table's row expiry and is non-nullable, so an event
with no baggage row reads it as the epoch: a date under a label saying "request time" that no reader can act
on. It SHALL be matched by its full published name — the hop log's own `request_time` is a different column
the rail does state, and matching without the enrichment namespace withholds both.

#### Scenario: The recorded instant is stated more precisely than on the row

- **WHEN** a span is selected
- **THEN** the rail states its recorded instant with sub-second precision

#### Scenario: Both cost figures are stated, whichever the span recorded

- **WHEN** a span that recorded no cost of its own but whose chain spent is selected
- **THEN** the rail states its own cost as unavailable and states the chain cost

#### Scenario: The endpoint and upstream are stated outside the groups

- **WHEN** a span is selected
- **THEN** the endpoint and the upstream URI are stated above the groups
- **AND** neither is inside a collapsible group

#### Scenario: The rail's headline figures are not its whole record

- **WHEN** a span whose row states tokens, request messages and cost is selected
- **THEN** the rail states neither the duration nor the token total above the groups
- **AND** both are present in the groups, where the record is

#### Scenario: An unreadable column is withheld by its full name

- **WHEN** the schema reports the baggage table's copy of the request time
- **THEN** no group presents it
- **AND** the hop log's own request time is still stated

#### Scenario: A field kept out of the groups is still read

- **WHEN** the span read is issued
- **THEN** it names the columns the tree and the transport line are built from
- **AND** it names them whether or not the rail presents them

### Requirement: The rail's figures are labelled distinctly from the trace header's

**A figure about one span SHALL NOT carry the same label as a figure about the whole trace.** The header
states the trace's summed tokens and its summed cost; the rail states one span's own. Sharing a label makes
the two read as a contradiction — a header reporting thousands of tokens above a rail reporting none for the
span that orchestrated the turn — when both are correct about different things.

#### Scenario: The span's figures are labelled as the span's

- **WHEN** a trace is open with a span selected
- **THEN** the labels of the rail's figures distinguish them from the trace header's
- **AND** no label appears on both surfaces for figures of different scope

### Requirement: The selected span's record is available as a JSON dump

The rail SHALL offer a control that presents the selected span's record as JSON, in a popup over the page
rather than inline: the rail's width is what makes the grouped presentation necessary in the first place, and
it is the same width a dump would have to be read in.

**The dump SHALL present the whole record, including the fields the groups omit as already stated
elsewhere.** Deduplication is a property of the readable presentation, not of the record; a reader copying
the dump into a ticket or a query is entitled to the row as it was read.

**Keys SHALL be the column names the service publishes**, qualified exactly as the schema reports them, not
the display names the groups use. The dump's purpose is to be pasted somewhere that a display name does not
resolve.

**A field with no value SHALL appear with the value it was read as**, rather than being omitted. A dump that
drops an empty field asserts the column does not exist.

**The dump SHALL state nothing the record does not contain.** In particular it SHALL carry no key of this
console's own making: the dump is pasted into tickets and queries, where an invented key is a defect.

**The dump SHALL require no additional read.** It presents the same record the groups present; a control that
issued a query would make the rail's cost depend on a reader's curiosity about a format.

#### Scenario: The dump opens in a popup and holds the whole record

- **WHEN** the reader activates the JSON control
- **THEN** a popup presents the span's record as JSON
- **AND** it includes the fields the groups omit as stated elsewhere

#### Scenario: The dump is keyed by the published column names

- **WHEN** the dump is presented
- **THEN** each key is the column name the schema reports, with its qualification
- **AND** no key is a display label

#### Scenario: Empty fields survive the dump

- **WHEN** the selected span has no value for a field
- **THEN** the dump presents that field with the value it was read as
- **AND** the field is not omitted

#### Scenario: The dump carries no key of the console's own making

- **WHEN** the dump is presented for a span whose bodies are readable
- **THEN** every key in it is a column the schema reports

#### Scenario: Opening the dump issues no read

- **WHEN** the reader activates the JSON control
- **THEN** no span query and no body query is issued

## MODIFIED Requirements

### Requirement: Every hop states how its call went, before any body is read

**A hop SHALL state the outcome of its call from the hop row alone** — the recorded HTTP status with its
reason phrase, the recorded size of each side, and the duration — and SHALL state it without reading a body.
These are columns the tree already carries, so the statement costs no read and holds for a hop whose bodies
are withheld, absent, or clamped away. Until now a hop that showed no body showed nothing at all, which
reports a gap in what the reader may see as a gap in what happened.

**The outcome SHALL be stated in the bodies section rather than on the span's facts sheet.** The status is the
answer to "did this call work", which is the question the two bodies are read against, so it belongs where
they are read; stating it in both places leaves one fact with two homes and two chances to disagree.

**Each fact SHALL be stated on the side it describes, beside that side's own facts.** The verb heads the
request; the status heads the response. Stated once over both tabs, the outcome of the call sits above the
request describing something the request has not done yet.

**A tab SHALL state the one fact its side owns, and not the measurements another surface already carries.**
The duration is on the hop's own row in the tree, the sizes are on the messages and on the recorded bytes — a
line that repeats them makes the reader search it for the two facts only it can give. **Where a hop offers no
tab at all** — a caller entitled to neither body column — **the sizes and the duration SHALL be stated with
both halves**, because that line is then the whole of what the section can show.

**The conversation tab SHALL state neither half**: it presents a history rather than a call.

**A failed call SHALL be marked on the line as a whole, not on the status alone.** The status states the
failure in words; the line carries it before the reader has read anything.

**Failure SHALL be decided by the same test the tree uses** — a false success flag or a status of 400 and
above — so a hop cannot read as failed in one surface and successful in the other. A status outside that
test, such as the 202 a notification is answered with, SHALL be stated as the success it is.

#### Scenario: A hop with no readable body still states its outcome

- **WHEN** a hop whose body columns are withheld is opened
- **THEN** the section states the recorded status, the recorded sizes and the duration
- **AND** it states separately that the bodies were withheld

#### Scenario: Each side states its own half of the call

- **WHEN** the reader is on the Request tab
- **THEN** it states the verb and does not state the status
- **AND** on the Response tab the status is stated instead

#### Scenario: A failed call is marked on the line, not by the status alone

- **WHEN** a hop whose call failed is opened
- **THEN** its status states the failure in words
- **AND** the line carrying it is marked as failed

#### Scenario: The conversation tab states no transport facts

- **WHEN** the reader moves to the Chat tab
- **THEN** neither half of the transport is stated there

#### Scenario: An accepted notification is not stated as a failure

- **WHEN** a hop answered with a status outside the failure test is opened
- **THEN** it is stated as successful
- **AND** the marker the tree gives that hop agrees with it

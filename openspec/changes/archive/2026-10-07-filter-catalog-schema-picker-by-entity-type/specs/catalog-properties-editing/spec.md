## MODIFIED Requirements

<!--
The requirement below is authored under its superseded heading `The schema picker lists both
populations in one grid`, and its first two scenarios under `Both populations appear` and `The grid
shows exactly the three columns`, because a MODIFIED requirement may not drop a scenario the current
spec still has and REMOVED + ADDED of one requirement is rejected outright — neither route could
rename them.

When this delta is synced into the consolidated spec, rename:

- the requirement to `The schema picker filters to the deployment's entity kind`
- `Both populations appear` to `Both populations appear, filtered to the deployment's kind`
- `The grid shows exactly the three columns` to `The filtered grid shows the id alone`

The remaining four scenario headings are already accurate and keep their names.
-->

### Requirement: The schema picker lists both populations in one grid

The picker SHALL read every catalog schema DIAL Core resolves — those written through its API and
those declared in its configuration file — in a single request, and SHALL present them in a
single-select grid.

The picker SHALL filter that set to the schemas whose declared `dial:catalogEntityType` matches the
kind of deployment being edited: `model` on a model, `agent` on an application, `toolset` on a
toolset, and `interceptor` on an interceptor. The filter SHALL apply to both halves of the picker —
the inline selection field and the browse grid — so the two cannot list different sets.

Two kinds of row SHALL NOT be hidden by the filter, because hiding either would make a legal
configuration unreachable:

- a schema declaring no entity kind at all, which Core's listing reports as absent rather than
  omitting the schema; and
- the schema the deployment currently points at, whatever kind it declares — a field SHALL NOT show a
  value its own list denies.

The browse grid SHALL offer a control that relaxes the filter and lists every schema Core resolved.
DIAL Core never checks a deployment's own kind against the schema's `dial:catalogEntityType`, so a
deliberate cross-kind pairing is legal and the picker SHALL keep it reachable rather than refusing a
pairing Core accepts. The filter is a default, not a constraint.

In the filtered view the grid SHALL present the schema's `$id` alone. The entity kind is a constant
there, and the display name distinguishes nothing — display names are not unique, so the `$id` is the
only column that identifies a schema. When the filter is relaxed the grid SHALL present the display
name and the entity kind alongside it, both of which carry information in that view.

Author and updated-time columns SHALL NOT be offered in either view: the read that unions the two
populations carries no resource metadata, and adding them would cost one metadata request per row for
the API-written half and remain empty for the other.

When nothing is left to pick the grid SHALL say so rather than render as bare column headers, which
reads as a failed load. Where the filter is what emptied it, the message SHALL name the entity kind
as the cause, so the relax control reads as the way out; where no schema exists at all, it SHALL
report only that.

#### Scenario: An empty filtered result names the kind as the cause

- **WHEN** an admin opens the picker on a deployment whose kind no schema declares
- **THEN** the grid reports that there are no catalog schemas for this entity kind
- **AND** the control that relaxes the filter is still offered

#### Scenario: Both populations appear

- **WHEN** an admin opens the picker and schemas matching the deployment's kind exist in both
  populations
- **THEN** all of those are listed in one grid, whichever population each came from

#### Scenario: The grid shows exactly the three columns

- **WHEN** the picker grid renders with the filter in effect
- **THEN** its only column is the schema id — no display-name and no entity-kind column
- **AND** no author or updated-time column is present in either view

#### Scenario: A schema written for another entity kind is still selectable

- **WHEN** an admin opens the picker on a model and a schema declares the `agent` entity kind
- **THEN** that schema is not listed by default
- **AND** after the admin relaxes the filter it is listed with its kind visible and can be selected

#### Scenario: Exactly one schema can be selected

- **WHEN** an admin picks a row in the grid
- **THEN** any previous selection is replaced rather than added to

#### Scenario: A failed read is reported rather than shown as an empty catalogue

- **WHEN** the schema list cannot be read
- **THEN** the picker surfaces the failure instead of presenting an empty selectable list

#### Scenario: The selected schema is reachable

- **WHEN** an admin has a schema selected
- **THEN** its own detail page can be opened from the field in a new tab

## ADDED Requirements

### Requirement: A schema outside the deployment's kind stays visible once selected

The picker SHALL continue to list the schema a deployment already points at even when its declared
entity kind does not match the deployment's own, and SHALL do so without the filter being relaxed.

This follows from DIAL Core accepting such a pairing: a deployment saved with a cross-kind schema is
valid, so reopening it SHALL show its selection intact rather than presenting the field as empty or
the selection as unavailable.

A schema declaring no entity kind SHALL likewise remain listed for every deployment kind, selected or
not.

#### Scenario: A cross-kind selection survives a reopen

- **WHEN** a deployment already points at a schema whose declared kind differs from the deployment's
- **AND** an admin reopens the picker without relaxing the filter
- **THEN** that schema is listed and shown as the current selection

#### Scenario: A schema declaring no kind is always offered

- **WHEN** a schema declares no entity kind
- **THEN** it is listed for a deployment of any kind, with the filter in effect

## MODIFIED Requirements

### Requirement: The schema picker filters to the deployment's entity kind

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

The two halves of the picker SHALL identify a schema differently, because they answer different
questions. The browse grid in its filtered view SHALL show a single `$id` column. The inline selection
SHALL label each option with the schema's display name and describe it with the `$id`, so a reader
sees what the schema is called and which one it is. A schema with no display name SHALL appear once,
labelled by its `$id`, with no description repeating it. Display names are not unique, which is why
the `$id` SHALL accompany every named option: it is the stored reference and the only text that
separates two schemas sharing a name. The entity kind is a constant under the filter and SHALL NOT be
added to an option. When the filter is relaxed the grid SHALL present the display name and the entity
kind alongside the `$id`, both of which carry information in that view.

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

#### Scenario: Both populations appear, filtered to the deployment's kind

- **WHEN** an admin opens the picker and schemas matching the deployment's kind exist in both
  populations
- **THEN** all of those are listed in one grid, whichever population each came from

#### Scenario: The inline selection identifies each option by its id

- **WHEN** an admin opens the inline catalog-schema selection
- **THEN** each schema that has a display name is labelled with it and described by its `$id`
- **AND** every option carries its `$id`, as that description or, with no display name, as the label

#### Scenario: Two schemas sharing a display name stay distinguishable

- **WHEN** two schemas declare the same display name and an admin opens the inline selection
- **THEN** both options carry that name as their label
- **AND** each shows its own `$id` as its description

#### Scenario: A schema with no display name is listed once

- **WHEN** a schema declares no display name and an admin opens the inline selection
- **THEN** its option is labelled by its `$id`
- **AND** the `$id` is not repeated as a description

#### Scenario: The filtered grid shows the id alone

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

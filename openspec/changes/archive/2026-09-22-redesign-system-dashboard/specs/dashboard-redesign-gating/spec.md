## Purpose

Defines how the usage analytics page is reached at runtime: the environment flag that admits it,
which surfaces that flag governs, and the guarantee that the existing dashboard keeps working
untouched while both pages live in the tree.

## ADDED Requirements

### Requirement: An environment flag admits the usage page and its menu item together

The system SHALL expose an environment variable that, when truthy per the existing flag helper and
combined with the Analytics group's own flag, is surfaced on the runtime feature-flags object. When
both resolve truthy the `/usage` route SHALL render the page and the Analytics menu group SHALL
offer its item; when either is absent or falsy the route SHALL answer as not found and the menu
SHALL omit the item.

The flag SHALL be read where the other feature flags are initialized and SHALL be added to the
feature-flags model alongside them, so no surface learns about it through a separate mechanism. It
SHALL be declared in the environment template as a commented entry.

The route and the menu SHALL agree on the same pair of flags, so a reachable item never leads to a
missing page and a reachable page is never absent from the menu.

#### Scenario: Both flags on admit the page and its menu item

- **GIVEN** the analytics flag and the usage flag both resolve truthy
- **WHEN** the user opens the application
- **THEN** the Analytics group offers a Usage item
- **AND** opening `/usage` renders the page

#### Scenario: The usage flag off hides both

- **GIVEN** the usage flag is unset
- **WHEN** the user opens the application
- **THEN** the Analytics group offers no Usage item
- **AND** opening `/usage` directly answers as not found

#### Scenario: The analytics flag off hides both

- **GIVEN** the usage flag resolves truthy but the analytics flag does not
- **WHEN** the user opens `/usage`
- **THEN** the route answers as not found

#### Scenario: Flag is falsy for the usual falsy spellings

- **GIVEN** the variable is set to `false`, an empty string, `0`, or any value the flag helper
  treats as falsy
- **WHEN** the feature flags are initialized
- **THEN** the flag is false and neither surface admits the page

#### Scenario: Access control still applies behind the flag

- **GIVEN** both flags resolve truthy
- **WHEN** a user without analytics access opens `/usage`
- **THEN** the forbidden page renders rather than the dashboard

### Requirement: The existing dashboard is untouched by this page

The usage page SHALL be a surface of its own. The `/dashboard` route, its menu item and the entity
Audit tab SHALL continue to render the existing dashboard whatever the usage flag's value, with
their own controls and their refresh-interval selector.

The two pages answer different questions from different datasets, and both are reachable at once
on purpose: an operator comparing them sees both, rather than whichever a flag selected. Retiring
the existing dashboard is a separate change.

#### Scenario: The dashboard route is unaffected by the flag

- **GIVEN** the usage flag resolves truthy
- **WHEN** the user opens `/dashboard`
- **THEN** the existing dashboard renders, with its refresh-interval selector

#### Scenario: Entity Audit tab is unaffected by the flag

- **GIVEN** the usage flag resolves truthy
- **WHEN** the user opens an entity's Audit tab
- **THEN** the existing dashboard renders

#### Scenario: The menu offers both, in their own groups

- **GIVEN** both flags resolve truthy
- **WHEN** the sidebar menu renders
- **THEN** the Audit group offers its Dashboard item pointing at `/dashboard`
- **AND** the Analytics group offers a Usage item pointing at `/usage`

### Requirement: The two pages share no mutable state

The usage page SHALL NOT read or write any browser-stored preference, query constant, context value
or component that the existing dashboard owns.

Shared code SHALL be limited to what neither page needs to change: the structured-query server
action, the domain-free presentational components, the time-filter hook, and the design system. A
change required to make one of those fit the usage page SHALL be made so that the existing
dashboard's behaviour is unchanged by construction — in the usage page's own wrapper where a
wrapper can express it, and otherwise behind a parameter whose default is the existing behaviour.

#### Scenario: A shared component keeps its behaviour for its existing callers

- **GIVEN** a shared presentational component the usage page also renders
- **WHEN** an existing caller renders it without naming the new parameter
- **THEN** it renders exactly as it did before the usage page existed

#### Scenario: Removing the page leaves the existing dashboard intact

- **GIVEN** the usage page's own module is deleted
- **WHEN** the existing dashboard is opened
- **THEN** it renders and behaves exactly as before the usage page was added

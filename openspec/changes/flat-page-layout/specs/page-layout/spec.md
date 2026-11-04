## Purpose

Defines how page content sits inside the application shell: the page, the header and the left menu read as one
surface, pages draw no card of their own, and the content keeps a single margin from the shell.

## ADDED Requirements

### Requirement: Page, header and menu share one surface

The page area inside the application shell SHALL have the same background as the header and the left menu, in
every theme, including a theme served by the themes service.

#### Scenario: Background matches the header and the menu

- **WHEN** any page inside the shell is shown
- **THEN** the background behind the page content is the same as the background of the header and of the left
  menu

#### Scenario: Served theme keeps the match

- **WHEN** the themes service changes the surface the header uses
- **THEN** the page background and the left menu follow it

### Requirement: Pages have no page-level card

A page rendered inside the shell SHALL place its content directly on the page surface, with no card of its own
around it. This applies to entity lists, entity detail views, Import Config, Export Config, Folders Storage, the
activity audit and system rollback pages, System Properties, the Usage Log, the Analytics pages, the Telemetry
dashboard, Run Compare, and the error, 403, 404 and maintenance pages.

#### Scenario: Entity list without a card

- **WHEN** an entity list such as Containers is shown
- **THEN** the list heading, header actions and grid sit on the page surface with no card around them

#### Scenario: Entity detail view without a card

- **WHEN** an entity detail view such as a container is shown
- **THEN** its title, tabs, properties and sections sit on the page surface with no card around them

#### Scenario: Error page without a card

- **WHEN** the 404 page is shown inside the shell
- **THEN** its content sits on the page surface

### Requirement: Content keeps a single margin from the shell

Page content SHALL keep one consistent margin from the left menu, the header and the right edge of the content
area, the same on every page, and SHALL not touch the viewport edges on small screens. An entity view's floating
action bar on small screens SHALL NOT cover the view's content.

#### Scenario: Same margin on every page

- **WHEN** an entity list and an entity detail view are shown at the same viewport width
- **THEN** their headings start at the same distance from the left menu and from the header

#### Scenario: Mobile margin kept

- **WHEN** a page is shown on a phone-sized viewport
- **THEN** the page content does not touch the viewport edges

#### Scenario: Floating actions do not cover content

- **WHEN** an entity detail view is shown on a small viewport and scrolled to the bottom
- **THEN** the last section of the view is not covered by the floating action bar

#### Scenario: No horizontal scroll from the layout

- **WHEN** an entity detail view or a conversation is shown
- **THEN** the page does not scroll horizontally unless a grid's own columns are wider than the page

### Requirement: Nested surfaces stay distinguishable

An element inside a page that is presented as a separate surface (a card, a pane, a panel, a grid) SHALL remain
visually distinguishable from the page surface without the card.

#### Scenario: Card on the page surface keeps a boundary

- **WHEN** a page shows a card-like element, such as an Export Config selection pane or a metric card
- **THEN** the element's edge is visible against the page surface

#### Scenario: Grid and accordions keep their edges

- **WHEN** a page shows a grid or a collapsible section
- **THEN** the grid and the section remain visibly bounded on the page surface

# entity-overall-status-badge Specification

## Purpose

Defines the overall status badge shown above the id in an entity's detail header, driven by the
`status` and `validationWarnings` DIAL Core reports in `_metadata`, and the generic status badge it is
built on — a variant-driven pill that future statuses (for example run statuses) extend by adding
variants. Created by archiving change `add-entity-overall-status-badge`.

## Requirements

### Requirement: Overall status badge in the entity header
The system SHALL render an overall status badge in the entity header, above the entity id, for every
entity whose `_metadata.status` is `valid` or `invalid`. The badge SHALL be rendered by the same header
block in `SimpleEntityHeader` and `AssetHeader`, with a `gap-2` between the badge and the id. An entity
with no `_metadata.status`, or with a value other than `valid` / `invalid`, SHALL render no badge and no
placeholder, so the header layout is unchanged.

#### Scenario: Platform entity with a valid status
- **WHEN** a platform entity's detail view opens and `_metadata.status` is `valid`
- **THEN** a badge labelled "Valid" is shown directly above the id
- **THEN** no info icon is shown

#### Scenario: Platform entity with an invalid status
- **WHEN** a platform entity's detail view opens and `_metadata.status` is `invalid`
- **THEN** a badge labelled "Invalid" is shown directly above the id

#### Scenario: Entity without a status
- **WHEN** a detail view opens for an entity with no `_metadata.status` (for example a public
  application, a public toolset or a prompt)
- **THEN** no status badge is rendered and the id sits where it did before this change

#### Scenario: Unrecognised status value
- **WHEN** `_metadata.status` holds a value other than `valid` or `invalid`
- **THEN** no status badge is rendered

#### Scenario: Both header types
- **WHEN** an entity with `_metadata.status` is shown under `SimpleEntityHeader` and under `AssetHeader`
- **THEN** the badge renders identically in both

### Requirement: Status badge visual contract
The system SHALL provide a generic status badge whose pill uses `px-2 py-0.5` padding and a 120px border
radius, with a 6px × 6px filled circle before the label and a `gap-1` between circle and label and
4px of horizontal margin (`mx-1`) on each side of the circle. The
badge's colours SHALL come from Tailwind theme tokens only; no hex values SHALL be hard-coded. The
`valid` variant SHALL use `bg-success` / `text-success`. The `invalid` variant SHALL use `bg-error` /
`text-error`. The circle SHALL be filled with the current text color (`bg-[currentColor]`), so it always
matches the variant's text token, and SHALL be decorative and hidden from assistive
technology; the label text SHALL be the badge's accessible name.
Variants SHALL be defined in a single lookup so further variants (completed, failed, running, stopped)
can be added as entries without changing the component's structure.

#### Scenario: Valid variant styling
- **WHEN** the badge renders the `valid` variant
- **THEN** the pill carries `bg-success` and `text-success`, and a circle filled with the current text color (`text-success`)
  precedes the label with `gap-1`

#### Scenario: Invalid variant styling
- **WHEN** the badge renders the `invalid` variant
- **THEN** the pill carries `bg-error` and `text-error`, and a circle filled with the current text color (`text-error`) precedes the
  label with `gap-1`

#### Scenario: Decorative circle
- **WHEN** a screen reader reads the badge
- **THEN** only the label text is announced, not the circle

### Requirement: Status badge hint
The status badge SHALL show an info icon (16px) after the label only when a hint is provided, and SHALL
reveal the hint text when the icon is hovered or keyboard-focused. The icon SHALL have an accessible
name. A badge without a hint SHALL render no icon. The overall status mapping SHALL provide a hint only
for the `invalid` status, and only when `_metadata.validationWarnings` yields non-empty text; the hint
SHALL list each warning as `field: message` (or the single non-empty part when one is missing), joined
with `; `.

#### Scenario: Invalid with validation warnings
- **WHEN** `_metadata.status` is `invalid` and `_metadata.validationWarnings` contains
  `{ field: "endpoint", message: "must not be empty" }`
- **THEN** an info icon follows the "Invalid" label
- **WHEN** the user hovers or focuses the icon
- **THEN** a tooltip shows `endpoint: must not be empty`

#### Scenario: Multiple warnings
- **WHEN** `_metadata.validationWarnings` contains two warnings
- **THEN** the tooltip lists both, separated by `; `

#### Scenario: Invalid without warnings
- **WHEN** `_metadata.status` is `invalid` and `_metadata.validationWarnings` is absent or empty (for
  example for a non-admin user, for whom Core omits warnings)
- **THEN** the "Invalid" badge is shown with no info icon

#### Scenario: Valid never has a hint
- **WHEN** `_metadata.status` is `valid`
- **THEN** no info icon is shown, even if warnings are present

#### Scenario: Keyboard access to the hint
- **WHEN** the user tabs to the info icon
- **THEN** the icon receives focus and the hint is shown without a mouse

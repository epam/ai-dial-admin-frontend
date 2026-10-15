# status-badge Specification

## Purpose
Defines the generic status badge — a tone-driven pill with an optional leading indicator, hint and
trailing control — and the header status row that lays badges out above an entity's id. It carries no
knowledge of any particular status (validity, sync, run), so a feature built on it can be removed without
changing this capability.

## Requirements

### Requirement: Status badge visual contract
The system SHALL provide a status badge rendered as a pill with `px-2 py-0.5` padding, a 120px border
radius, and a label in the 12px semi-bold tiny-text style with a 16px line height. The label SHALL be the
badge's accessible name. Colours SHALL come from Tailwind theme tokens only; no hex values SHALL be
hard-coded. The badge SHALL be driven by a tone, defined in a single lookup:

| Tone | Pill |
|---|---|
| `success` | `bg-success text-success` |
| `error` | `bg-error text-error` |
| `info` | `bg-info text-info` |
| `neutral` | `bg-layer-4 text-secondary` |

Tones SHALL be named by meaning (not by the status that uses them), so a new status adds no tone unless it
needs a new colour.

#### Scenario: Each tone is styled from tokens
- **WHEN** the badge renders with tone `success`, `error`, `info` or `neutral`
- **THEN** the pill carries the classes in the table above and no inline or hex colour

#### Scenario: Label is the accessible name
- **WHEN** a screen reader reads the badge
- **THEN** it announces the label text; any leading indicator is not announced

### Requirement: Status badge leading indicator
The badge SHALL support three leading indicators inside the pill, before the label with a `gap-1`: a
filled dot, an in-progress spinner, or none. The dot and the spinner SHALL occupy a 12px slot, SHALL be
filled with the pill's text colour, and SHALL be hidden from assistive technology. A badge with no
leading indicator SHALL render its label alone with the same padding.

#### Scenario: Dot
- **WHEN** the badge renders with the dot indicator
- **THEN** a 12px dot in the pill's text colour precedes the label

#### Scenario: Spinner
- **WHEN** the badge renders with the spinner indicator
- **THEN** a 12px spinner precedes the label and is not announced

#### Scenario: No indicator
- **WHEN** the badge renders with no leading indicator
- **THEN** only the label is shown inside the pill

### Requirement: Status badge hint
The badge SHALL show an info icon (16px, in a 24px square button) beside the pill only when a hint is
provided, and SHALL reveal the hint text when the icon is hovered or keyboard-focused. The icon SHALL
have an accessible name. A badge without a hint SHALL render no icon.

#### Scenario: Hint provided
- **WHEN** the badge has a hint
- **THEN** an info icon follows the pill
- **WHEN** the user hovers or focuses the icon
- **THEN** a tooltip shows the hint text

#### Scenario: No hint
- **WHEN** the badge has no hint
- **THEN** no icon is rendered

#### Scenario: Keyboard access
- **WHEN** the user tabs to the info icon
- **THEN** it receives focus and the hint is shown without a mouse

### Requirement: Status badge trailing slot
The badge SHALL accept an optional trailing element rendered beside the pill, outside its background,
with a 4px gap. The badge SHALL NOT interpret the element; the feature that supplies it owns its behaviour
and accessible name. When both a hint and a trailing element are supplied, the hint icon SHALL render
first.

#### Scenario: Trailing element
- **WHEN** a feature supplies a trailing element
- **THEN** it renders after the pill, outside the coloured background, 4px from it

#### Scenario: Hint and trailing element together
- **WHEN** both are supplied
- **THEN** the hint icon precedes the trailing element

### Requirement: Header status row
The entity header SHALL render the status badges that apply to the entity in one row above the entity id.
Badges SHALL sit in the row with a 20px gap, the row SHALL have 4px vertical padding, and the row SHALL be
4px above the id. The row SHALL render nothing — no padding, no placeholder — when no badge applies, so an
entity with no status badge has the same header layout as before. Each badge SHALL be an independent
element of the row, so that omitting one does not change how the others render. This SHALL hold for both
`SimpleEntityHeader` and `AssetHeader`.

#### Scenario: Two badges
- **WHEN** an entity has a validity badge and a sync badge
- **THEN** both render in the one row above the id, validity first, 20px apart

#### Scenario: One badge
- **WHEN** an entity has only one applicable badge
- **THEN** it renders alone in the row above the id

#### Scenario: No badge
- **WHEN** no badge applies to the entity
- **THEN** no row is rendered and the id sits where it did before this change

#### Scenario: Both header types
- **WHEN** the same badges are supplied to `SimpleEntityHeader` and to `AssetHeader`
- **THEN** the row renders identically in both

## MODIFIED Requirements

### Requirement: Pivot cells truncate and open a full-value popup

Pivot value cells SHALL be capped to a fixed cell height and SHALL scroll vertically within that height when content does not fit, instead of expanding the row. On hover, the cell SHALL show an “open in popup” affordance at the bottom-right. Clicking the cell SHALL open a `Popup` titled with the field label and showing the full value (not a two-pane diff viewer).

#### Scenario: Truncate long value
- **WHEN** a field value is taller than the cell's fixed height
- **THEN** the cell shows an internal vertical scrollbar and the row height does not grow to fit the value

#### Scenario: Short value shows no scroll
- **WHEN** a field value fits within the cell's fixed height
- **THEN** the cell shows no scrollbar and renders exactly as before

#### Scenario: Hover shows open-popup icon
- **WHEN** the user hovers a value cell
- **THEN** an open-in-popup icon appears at the bottom-right of the cell

#### Scenario: Click opens full-value popup
- **WHEN** the user clicks a value cell
- **THEN** a popup opens with the field label as title and the full cell content

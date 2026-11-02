## MODIFIED Requirements

### Requirement: Compare pivot cells truncate and open a dual-run popup

Compare pivot value cells SHALL be capped to a fixed cell height and SHALL scroll vertically within that height when content does not fit, instead of expanding the row. Each cell's scroll is independent — scrolling one primary or secondary cell SHALL NOT move any other cell's scroll position. On hover, the cell SHALL show an “open in popup” affordance at the bottom-right. Clicking a cell of a field that is not a metric SHALL open a popup titled with the field label that shows both the primary and compared run values for that field (side-by-side) as a text diff, not only the clicked cell’s value. Clicking a metric cell SHALL open the score popup defined by `run-value-popups`. Delta-row cells SHALL remain non-clickable.

#### Scenario: Truncate long value
- **WHEN** a primary or secondary field value is taller than the cell's fixed height
- **THEN** the cell shows an internal vertical scrollbar and the row height does not grow to fit the value

#### Scenario: Scrolling one cell does not affect its row neighbor
- **WHEN** the user scrolls a primary cell that has overflowing content
- **THEN** the corresponding secondary cell's scroll position is unaffected, and vice versa

#### Scenario: Short value shows no scroll
- **WHEN** a primary or secondary field value fits within the cell's fixed height
- **THEN** the cell shows no scrollbar and renders exactly as before

#### Scenario: Hover shows open-popup icon
- **WHEN** the user hovers a value cell
- **THEN** an open-in-popup icon appears at the bottom-right of the cell

#### Scenario: Click opens dual-run popup
- **WHEN** the user clicks a primary or secondary value cell of a field that is not a metric
- **THEN** a popup opens with the field label as title
- **AND** both the primary and compared run values for that field are shown as a text diff

#### Scenario: Click on a metric opens the score popup
- **WHEN** the user clicks a primary or secondary value cell of a metric field
- **THEN** the score popup opens with one column per displayed run

## ADDED Requirements

### Requirement: Compare table metric rows open the score popup

In the right-sidebar table of a comparison, the control that opens a field's popup SHALL open the score popup
defined by `run-value-popups` for a metric field and the text diff for any other field.

#### Scenario: Metric row opens the score popup from the table
- **WHEN** the user activates the popup control of a metric row in the sidebar table
- **THEN** the score popup opens with one column per displayed run

#### Scenario: Other rows keep the text diff
- **WHEN** the user activates the popup control of a non-metric row in the sidebar table
- **THEN** the text diff of both runs opens

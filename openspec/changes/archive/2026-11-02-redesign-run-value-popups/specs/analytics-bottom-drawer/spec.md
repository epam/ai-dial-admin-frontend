## MODIFIED Requirements

### Requirement: Pivot cells truncate and open a full-value popup

Pivot value cells SHALL be capped to the cell height and SHALL truncate their content with an ellipsis at the
end of the last line that fits when it does not, instead of scrolling inside the cell or growing the row.
Every pivot value cell SHALL be one control over the whole cell, whether or not its content is truncated.
On hover or keyboard focus, the cell SHALL show an "open in popup" affordance at the bottom-right. Activating
the cell SHALL open the popup defined by `run-value-popups`: the score popup for a metric field and the text
popup, showing the full value, for any other.

#### Scenario: Truncate long value
- **WHEN** a field value is taller than the cell
- **THEN** the cell shows as many lines as fit, the last ending in an ellipsis, with no scrollbar, and the row height does not grow

#### Scenario: Short value shows no scroll
- **WHEN** a field value fits within the cell
- **THEN** the cell shows the whole value with no ellipsis and no scrollbar

#### Scenario: Truncation follows the cell height
- **WHEN** the panel is resized so the cell is taller or shorter
- **THEN** the number of visible lines changes to fit and the ellipsis moves with it

#### Scenario: Hover shows open-popup icon
- **WHEN** the user hovers a value cell
- **THEN** an open-in-popup icon appears at the bottom-right of the cell

#### Scenario: Click opens full-value popup
- **WHEN** the user clicks a non-metric value cell
- **THEN** the text popup opens with the field label as title and the full cell content

#### Scenario: Click on a metric opens the score popup
- **WHEN** the user clicks a metric value cell
- **THEN** the score popup opens with the metric name as its title

#### Scenario: A score cell keeps its heat-map fill
- **WHEN** a metric cell shows a numeric score
- **THEN** its heat-map colour fills the whole cell and the whole cell is clickable

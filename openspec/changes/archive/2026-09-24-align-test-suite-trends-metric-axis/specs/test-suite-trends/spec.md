## ADDED Requirements

### Requirement: Metric Trend score-axis readability
When Metric Trends renders one or more metric-series cards, each card SHALL use the fixed `0`–`1` score domain and display Y-axis labels at `0`, `0.25`, `0.5`, `0.75`, and `1`. The chart SHALL reserve sufficient left-side plot space so those labels are visible without clipping. The X axis SHALL remain hidden.

#### Scenario: Metric Trend card shows the fixed labeled score scale
- **WHEN** a user views a Metric Trend card with one or more visible metric series
- **THEN** the card shows Y-axis labels `0`, `0.25`, `0.5`, `0.75`, and `1` within reserved left-side chart space, while its X axis remains hidden

#### Scenario: Metric Trend card retains existing chart interactions and marks
- **WHEN** a user views or filters metric series in a Metric Trend card
- **THEN** metric lines, legend/tag filtering, tooltip content, and horizontal grid lines remain available and unchanged

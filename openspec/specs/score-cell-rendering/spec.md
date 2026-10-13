# score-cell-rendering Specification

## Purpose
Defines the shared contract for rendering a 0.00–1.00 score or a −1.00–+1.00 score delta as a
colored grid cell — bucket boundaries, per-bucket background/text/border colors, border behavior,
and value-text visibility — used by Extraction Result's metric columns and by the Heat Map tab's and
Test Case Stability's value cells.

## Requirements
### Requirement: Absolute score buckets
Given a score in the closed range `[0.00, 1.00]`, the system SHALL resolve it to exactly one of 12
buckets: `0.00` (exact), `(0.00, 0.10)`, `[0.10, 0.20)`, `[0.20, 0.30)`, `[0.30, 0.40)`,
`[0.40, 0.50)`, `[0.50, 0.60)`, `[0.60, 0.70)`, `[0.70, 0.80)`, `[0.80, 0.90)`, `[0.90, 1.00)`, and
`1.00` (exact). Each bucket SHALL carry an independent background color, text color, and border
color, each defined separately for light and dark theme. Buckets SHALL progress from a red hue at
the lowest scores through orange and yellow to green at the highest.

#### Scenario: Lowest bucket renders distinctly from near-zero
- **WHEN** a cell shows an exact score of `0.000`
- **THEN** it renders with the `0.00` bucket's colors, visibly more saturated than a cell showing
  `0.102`

#### Scenario: Mid-range score picks its 0.1-wide bucket
- **WHEN** a cell shows a score of `0.303`
- **THEN** it renders with the `[0.30, 0.40)` bucket's background, text, and (when its value is hidden) border
  color

#### Scenario: Highest bucket renders distinctly from near-one
- **WHEN** a cell shows an exact score of `1.000`
- **THEN** it renders with the `1.00` bucket's colors, visibly more saturated than a cell showing
  `0.847`

#### Scenario: Bucket colors adapt to theme
- **WHEN** the same score renders under the light theme and under the dark theme
- **THEN** each renders with that bucket's light-mode or dark-mode color set respectively, and both
  remain legible against their theme's layer background

### Requirement: Delta score buckets
Given a delta (difference between two scores) in the closed range `[-1.00, 1.00]`, the system SHALL
resolve a non-zero delta to one of 8 buckets — 4 negative (regression) and 4 positive (improvement),
each spanning a width of `0.25` — each with its own background, text, and border color per theme,
progressing from red at the most negative to green at the most positive. A delta of exactly `0`
SHALL resolve to a neutral state: no bucket background, text, or border color is applied.

#### Scenario: Positive delta renders in a green-family bucket
- **WHEN** a cell shows a delta of `+0.303`
- **THEN** it renders with the matching positive bucket's colors

#### Scenario: Large negative delta renders in the most severe red bucket
- **WHEN** a cell shows a delta of `-0.898`
- **THEN** it renders with the most negative delta bucket's colors

#### Scenario: Zero delta is neutral
- **WHEN** a cell shows a delta of `0`
- **THEN** it renders with no bucket color (background, text, and border all remain unstyled by this
  contract)

### Requirement: Right-aligned number replaces the progress-bar rendering
A cell rendering a score or delta under this contract SHALL display the numeric value right-aligned
within the cell, with no progress bar. This applies to every consumer of this contract, including
Extraction Result's metric columns, which previously rendered a bar alongside the number.

#### Scenario: Extraction Result metric cell has no bar
- **WHEN** a user views a metric column in the Extraction Result tab
- **THEN** the cell shows only the right-aligned, colored number — no progress bar is rendered

### Requirement: Visible-value cells draw no border
A cell rendering under this contract SHALL draw no border while its value text is visible, so
adjacent score cells read as one continuous field rather than a grid of individually divided boxes.
When the cell's value text is hidden (see the hidden-value requirement below), the cell SHALL draw a
right-and-bottom border in the bucket's accent color — the hidden-value case needs a visible
boundary, since there is no digit left to otherwise mark where one cell ends and the next begins.
A zero delta (no bucket) SHALL draw a neutral right border on a neutral background instead.

#### Scenario: Visible score cells blend into one continuous field
- **WHEN** a consumer renders a score cell whose value text is visible
- **THEN** the cell draws no border between it and its neighbors

#### Scenario: Hidden-value cells show a visible accent border
- **WHEN** a score cell's value text is hidden
- **THEN** the cell's right and bottom border are the bucket's accent color

#### Scenario: Zero delta draws a neutral border
- **WHEN** a consumer renders a delta cell whose value is exactly `0`
- **THEN** the cell shows a neutral background with a neutral right border and no bucket accent

### Requirement: Value text adapts to the column width
A cell rendering under this contract SHALL size its value text to the width of its column so the text
is never cropped: 14px when the widest score string fits at that size, otherwise 12px, otherwise
10px, and otherwise hidden (see the hidden-value requirement below). Horizontal padding SHALL shrink
with the text size. Delta cells SHALL need more width than absolute cells for the same size, because
a signed value is wider. A cell whose column width is unknown SHALL render at 14px.

#### Scenario: Wide column keeps the full-size text
- **WHEN** a score cell's column is wide enough for the widest score string at 14px
- **THEN** the value renders at 14px

#### Scenario: Narrowing column steps the text down
- **WHEN** a score cell's column is too narrow for 14px text but wide enough for 12px
- **THEN** the value renders at 12px, and at 10px once the column is too narrow for 12px

#### Scenario: Column too narrow for the smallest size hides the text
- **WHEN** a score cell's column is too narrow for 10px text
- **THEN** the value text is hidden and the hidden-value border and accessible name apply

#### Scenario: Delta needs more width than absolute
- **WHEN** an absolute score and a delta score are rendered in columns of the same width
- **THEN** the delta value steps down or hides at a wider column than the absolute value does

### Requirement: Value text can be hidden while remaining accessible
A cell's numeric text SHALL be hidden while keeping its background/border color when its column is too
narrow for the smallest text size (see above), as happens when a heatmap has many columns. This applies equally to a cell showing a resolved score and to
one showing a missing-value placeholder (the em dash) — hiding a missing-value cell leaves it
visually empty, not showing the dash. When the value text is hidden, the score (or, for a
missing-value cell, the fact that it's not applicable) SHALL remain available to assistive technology
(via the cell's accessible name or its existing tooltip) rather than being removed from the
accessibility tree entirely.

#### Scenario: Hidden value keeps the color, loses the digits
- **WHEN** a consumer renders a score cell with the value text hidden
- **THEN** the cell still shows its bucket's background and its hidden-state accent border (see
  above) but shows no visible digits

#### Scenario: Hidden missing-value cell shows no dash
- **WHEN** a consumer renders a missing-value cell (one that would otherwise show an em dash) with
  the value text hidden
- **THEN** the cell shows no dash and no other text — a visually empty cell, not a placeholder
  character

#### Scenario: Hidden value is still announced to assistive technology
- **WHEN** a screen reader user reaches a score cell whose value text is hidden
- **THEN** the score is still exposed through an accessible name or tooltip, not silently omitted

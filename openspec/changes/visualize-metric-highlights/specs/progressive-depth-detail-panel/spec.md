## ADDED Requirements

### Requirement: Metric highlight columns in the row-detail pivot

When a metric leaf's `metricInfos` entry holds a `highlight` value — an object of chunk
arrays such as `{ "corpus": [{ "text": string, "score": number, "title"?: string }, ...] }`,
or a bare chunk array — the single-run row-detail pivot SHALL show a `highlight` column
immediately after that leaf's numeric column. The cell SHALL render the chunk text with
score-based coloring: positive scores use the green delta score palette, negative scores
the red delta score palette, and a score of exactly `0` has no highlight. Chunk `title`
values SHALL be exposed as native tooltips; colored chunks SHALL also carry a non-color
cue (for example an `aria-label` with the score). Named sources SHALL show their key as a
secondary label above the text. The score popup SHALL remain unchanged. A leaf without a
`highlight` key SHALL get no such column.

#### Scenario: Highlight column appears next to the numeric leaf
- **WHEN** a metric leaf has `metricInfos[group][leaf].highlight`
- **THEN** the pivot shows a `highlight` column immediately after that leaf

#### Scenario: Highlight cell shows colored text
- **WHEN** the highlight column cell is rendered
- **THEN** it shows the chunk text colored by score and does not show raw JSON brackets

#### Scenario: Neutral score has no color
- **WHEN** a highlight chunk has score `0`
- **THEN** that chunk is rendered with the standard text look and no score background

#### Scenario: No highlight key means no column
- **WHEN** a metric leaf has no `highlight` in its metricInfos entry
- **THEN** the pivot does not add a highlight column for that leaf

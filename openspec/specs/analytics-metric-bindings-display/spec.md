## ADDED Requirements

### Requirement: AnalyticsTab fetches results and snapshots in parallel under a single loader

`AnalyticsTab` SHALL fire `getTestCaseRunResults` and `getMetricSnapshots` concurrently. A single loading state SHALL cover both — the grid and metric bindings SHALL only become available once both fetches have settled.

#### Scenario: Both fetches complete before rows are interactive

- **WHEN** `AnalyticsTab` mounts with a valid `run.id`
- **THEN** `isLoading` is `true` until both `getTestCaseRunResults` and `getMetricSnapshots` resolve
- **THEN** the grid is rendered and the metric bindings state is populated simultaneously

#### Scenario: Either fetch fails gracefully

- **WHEN** one of the parallel fetches rejects
- **THEN** `isLoading` is set to `false` and the successfully resolved data is still used (partial render acceptable)

### Requirement: AnalyticsTab stores metricBindings and passes them to the detail panel

`AnalyticsTab` SHALL store the result of `snapshotsToBindingsMap` as `metricBindings: Record<string, MetricBindings>` in local state. When a row is clicked, the current `metricBindings` value SHALL be passed to `RunMetricDetailPanel` as a prop.

#### Scenario: metricBindings passed on row click

- **WHEN** the user clicks a row in the analytics grid
- **THEN** `RunMetricDetailPanel` is opened with `metricBindings` equal to the resolved snapshot map

#### Scenario: Empty metricBindings when snapshots return null

- **WHEN** `getMetricSnapshots` returns `null`
- **THEN** `metricBindings` is set to `{}` (empty record) and no bindings sections are rendered in the panel

### Requirement: RunMetricDetailPanel renders a Metric Bindings sub-section per metric group

For each metric group rendered in `RunMetricDetailPanel`, if `metricBindings[group.title]` exists and contains at least one binding (across `configBindings` and `inputBindings` combined), the group section SHALL include a collapsible "Metric Bindings" sub-section below `MetricCardsGrid`.

The sub-section SHALL start collapsed. Its title SHALL use the `RunsI18nKey.MetricBindings` i18n key.

If `metricBindings[group.title]` is absent or has no bindings, the sub-section SHALL not be rendered (silent skip).

#### Scenario: Bindings sub-section present when data available

- **WHEN** `RunMetricDetailPanel` renders with `metricBindings['RAGAS Faithfulness']` containing bindings
- **THEN** a collapsible "Metric Bindings" section appears inside the "RAGAS Faithfulness" group section

#### Scenario: Bindings sub-section absent when no data for group

- **WHEN** `RunMetricDetailPanel` renders with `metricBindings` not containing a key matching `group.title`
- **THEN** no "Metric Bindings" section is rendered for that group

#### Scenario: Sub-section starts collapsed

- **WHEN** `RunMetricDetailPanel` opens with bindings available
- **THEN** the Metric Bindings sub-section is collapsed (rows not visible) on initial render

### Requirement: Metric Bindings sub-section renders flat rows with property, source-type chip, and value

The Metric Bindings sub-section SHALL render a flat list combining `configBindings` and `inputBindings` without sub-grouping. Each row SHALL display three columns: property name, source-type chip, and value.

**Source-type chip labels and colors:**
- `Constant` → chip text `CONSTANT`, style: `text-accent-secondary bg-accent-secondary-alpha`
- `TestCase` → chip text `TESTCASE`, style: `text-success bg-success-alpha`
- `Response` → chip text `RESPONSE`, style: `text-accent-primary bg-accent-primary-alpha`

**Value resolution:**
- `Constant` source: `String(source.value)`
- `TestCase` or `Response` source: `source.columnName ?? ''`

#### Scenario: Constant binding row renders value

- **WHEN** a binding has `source.$type === 'Constant'` and `source.value === '0.7'`
- **THEN** the row shows the property name, a `[CONSTANT]` chip, and `'0.7'` as the value

#### Scenario: TestCase binding row renders column name

- **WHEN** a binding has `source.$type === 'TestCase'` and `source.columnName === 'expected_output'`
- **THEN** the row shows the property name, a `[TESTCASE]` chip, and `'expected_output'` as the value

#### Scenario: Response binding row renders column name

- **WHEN** a binding has `source.$type === 'Response'` and `source.columnName === 'passages'`
- **THEN** the row shows the property name, a `[RESPONSE]` chip, and `'passages'` as the value

### Requirement: snapshotsToBindingsMap converts MetricSnapshot[] to Record<string, MetricBindings>

`snapshotsToBindingsMap` SHALL reduce a `MetricSnapshot[]` to a `Record<string, MetricBindings>` keyed by `tsmdName`. Snapshots without `tsmdName` SHALL be silently skipped.

#### Scenario: Snapshots with tsmdName are included

- **WHEN** `snapshotsToBindingsMap` receives snapshots with `tsmdName: 'Metric A'` and `tsmdName: 'Metric B'`
- **THEN** the result has keys `'Metric A'` and `'Metric B'` each with their respective bindings

#### Scenario: Snapshots without tsmdName are skipped

- **WHEN** `snapshotsToBindingsMap` receives a snapshot with no `tsmdName`
- **THEN** that snapshot does not appear in the result

#### Scenario: Empty array returns empty record

- **WHEN** `snapshotsToBindingsMap` receives `[]`
- **THEN** the result is `{}`

#### Scenario: Null configBindings/inputBindings default to empty arrays

- **WHEN** a snapshot has `configBindings: undefined` and `inputBindings: undefined`
- **THEN** the result for that key has `configBindings: []` and `inputBindings: []`

### Requirement: RunsI18nKey.MetricBindings i18n key exists

The `RunsI18nKey` enum SHALL contain `MetricBindings = 'Runs.MetricBindings'`. The English locale SHALL map this key to `'Metric bindings'`.

#### Scenario: i18n key resolves to English label

- **WHEN** `t(RunsI18nKey.MetricBindings)` is called in the English locale
- **THEN** the result is `'Metric bindings'`

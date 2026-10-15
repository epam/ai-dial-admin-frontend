## ADDED Requirements

### Requirement: RunResultDetailPanel displays Extracted Columns section

`RunResultDetailPanel` SHALL render an `AdaptiveValueGrid` section titled with the `RunsI18nKey.ExtractedColumns` i18n key, driven by `result.extractedColumns`.

The section SHALL be placed after the Test Case Data grid and before the Request `CodeViewer`.

The section SHALL only render when `result.extractedColumns` is non-null and produces at least one entry from `getDetailEntries`.

#### Scenario: Extracted Columns section appears when data present

- **WHEN** `RunResultDetailPanel` is rendered with `result.extractedColumns = { match: 'found' }`
- **THEN** a section titled "Extracted Columns" (or its i18n key) is present in the panel

#### Scenario: Extracted Columns section is absent when data is empty or null

- **WHEN** `RunResultDetailPanel` is rendered with `result.extractedColumns = {}` or `undefined`
- **THEN** no "Extracted Columns" section is rendered

#### Scenario: Extracted Columns section appears between Test Case Data and Request

- **WHEN** `RunResultDetailPanel` is rendered with both `testCaseData` and `extractedColumns` populated, and Request JSON present
- **THEN** the DOM order is: Test Case Data section → Extracted Columns section → Request viewer

### Requirement: RunMetricDetailPanel displays Extracted Columns section

`RunMetricDetailPanel` SHALL render an `AdaptiveValueGrid` section titled with `RunsI18nKey.ExtractedColumns`, driven by `details.extractedColumns`.

The section SHALL be placed after the Test Case Data grid and before the Request `CodeViewer`.

The section SHALL only render when `details.extractedColumns` is non-null and produces at least one entry.

#### Scenario: Extracted Columns section appears when details loaded with extractedColumns

- **WHEN** `RunMetricDetailPanel` loads details and `details.extractedColumns = { output: 'value' }`
- **THEN** an "Extracted Columns" section is visible in the panel

#### Scenario: Extracted Columns section is absent when extractedColumns is empty

- **WHEN** `RunMetricDetailPanel` loads details with `details.extractedColumns = undefined`
- **THEN** no "Extracted Columns" section is rendered

### Requirement: RunsI18nKey.ExtractedColumns i18n key exists

The `RunsI18nKey` enum SHALL contain `ExtractedColumns = 'Runs.ExtractedColumns'`. The English locale SHALL map this key to `'Extracted Columns'`.

#### Scenario: i18n key resolves to English label

- **WHEN** `t(RunsI18nKey.ExtractedColumns)` is called in the English locale
- **THEN** the result is `'Extracted Columns'`

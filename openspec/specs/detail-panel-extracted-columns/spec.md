# detail-panel-extracted-columns Specification

## Purpose

The i18n label of the Extracted Columns section in run detail views; the section itself is specified by `run-row-details`.

## Requirements

### Requirement: RunsI18nKey.ExtractedColumns i18n key exists

The `RunsI18nKey` enum SHALL contain `ExtractedColumns = 'Runs.ExtractedColumns'`. The English locale SHALL map this key to `'Extracted Columns'`.

#### Scenario: i18n key resolves to English label

- **WHEN** `t(RunsI18nKey.ExtractedColumns)` is called in the English locale
- **THEN** the result is `'Extracted Columns'`

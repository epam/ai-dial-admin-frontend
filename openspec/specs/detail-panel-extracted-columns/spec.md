# detail-panel-extracted-columns Specification

## Purpose

Defines the `Runs.ExtractedColumns` i18n key that labels the Extracted section in the Run row-detail views.

## Requirements

### Requirement: RunsI18nKey.ExtractedColumns i18n key exists

The `RunsI18nKey` enum SHALL contain `ExtractedColumns = 'Runs.ExtractedColumns'`. The English locale SHALL map this key to `'Extracted Columns'`.

#### Scenario: i18n key resolves to English label

- **WHEN** `t(RunsI18nKey.ExtractedColumns)` is called in the English locale
- **THEN** the result is `'Extracted Columns'`

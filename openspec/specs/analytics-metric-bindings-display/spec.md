# analytics-metric-bindings-display Specification

## Purpose

The i18n label for metric bindings. The run detail view no longer loads or shows metric bindings.

## Requirements

### Requirement: RunsI18nKey.MetricBindings i18n key exists

The `RunsI18nKey` enum SHALL contain `MetricBindings = 'Runs.MetricBindings'`. The English locale SHALL map this key to `'Metric bindings'`.

#### Scenario: i18n key resolves to English label

- **WHEN** `t(RunsI18nKey.MetricBindings)` is called in the English locale
- **THEN** the result is `'Metric bindings'`

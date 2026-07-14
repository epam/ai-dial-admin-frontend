# Conditional metric evaluation — frontend integration

**Date:** 2026-07-14
**Branch:** `feature/multi-turn-support-2` (base: `development`)
**Status:** approved for implementation — POC iteration
**Reference:** `experimental/multi-turn-conversations` (the condition feature there is the source of truth for the UI)

## 1. Context

Each Test Suite Metric Definition (TSMD — the `Metric` model in create/update/read of
`/test-suites/{id}/metric-definitions`) gains an optional `condition` string: a JSONata expression the
backend evaluates per test-case result (per turn, under row-based multi-turn) to decide whether that
metric runs. Null/blank ⇒ always runs (backward compatible). The backend validates JSONata syntax
eagerly on POST/PUT and rejects malformed / over-2000-char expressions with `400 VALIDATION_ERROR`.
`condition` is a hard-fail-on-syntax field — it does NOT participate in soft `valid`/
`validationWarnings`.

Runtime effects (metric skipped ⇒ absent from `metricValues`; condition error ⇒ absent + a
`metricInfos[name].error` entry surfaced as the `metricError::<name>` CSV column) act on data already
exposed by the analytics/eval endpoints. **Development already handles `metricInfos`/`metricError`**
(`run.ts`, `Runs/Details/RunMetricDetailPanel`, `Runs/View/utils`, `Runs/Export/utils/group-columns`),
so no results-side change is needed for this feature.

## 2. Scope

**In scope (write / authoring side only):**

- Add `condition?: string` to the `Metric` model.
- Author it in the Add/Edit Metric modal: a `Condition` input (controls view) + the field in the JSON
  view; hydrate from `editingMetric.condition`; include `condition: condition.trim() || undefined` in the
  create/update payload.
- Client-side guard for the one mistake catchable offline: a bare reserved system-function call
  (`name()`), surfaced before the request. All other JSONata syntax errors are left to the backend 400.
- Show the condition (or "Always run") in the metric list.
- i18n strings.

**Out of scope:** results/CSV rendering of skipped metrics or condition errors (already handled on
development); a full client-side JSONata validator (backend owns syntax validation); condition builder /
autocomplete.

## 3. Contract facts

- `condition` — string, nullable, max 2000 chars, on POST/PUT request and POST/PUT/GET(+list) response.
- PUT is a full replacement: omitting `condition` clears it (metric reverts to always-run) — matched by
  sending `undefined` when blank.
- Errors: `400 VALIDATION_ERROR` for malformed or over-length `condition`, surfaced via the existing
  generic error toast on metric save. No code-to-message mapping added.
- CRUD/GET carry the field automatically — `createTestSuiteMetric`/`updateTestSuiteMetric` already send
  the full `Metric`; GET returns it.

## 4. Design (mirrors the reference branch)

- `src/models/evaluation/metric.ts` → `Metric`: add `condition?: string` (sibling of bindings) with a
  short doc comment.
- `src/components/TestSuites/Metrics/AddMetric/constants.ts`: `CONDITION_MAX_LENGTH = 2000`;
  `SYSTEM_FUNCTION_CONDITION_REGEX = /^[A-Za-z_][A-Za-z0-9_]*\(\)$/`.
- `src/components/TestSuites/Metrics/AddMetric/utils.ts`: `isReservedSystemFunctionCondition(condition?)`
  — true when the trimmed condition matches the reserved-call regex.
- `src/components/TestSuites/Metrics/AddMetric/Configuration.tsx`: `condition` / `conditionError` /
  `onChangeCondition` props; a `Condition` `DialInput` (label + hint caption + placeholder +
  `maxLength`); include `condition` in the JSON-view `MetricConfigurationData`.
- `src/components/TestSuites/Metrics/AddMetric/AddMetricModal.tsx`: `condition` state, hydrate from
  `editingMetric.condition`, compute `conditionError` via the guard, gate step-2 validity on
  `!conditionError`, thread props to `Configuration`, and add
  `condition: condition.trim() || undefined` to the `onConfirm` payload.
- `src/components/TestSuites/Metrics/Metrics.tsx`: render the condition (or `ConditionAlwaysRun`) in the
  metric card.
- i18n: `TestSuitesI18nKey.{Condition, ConditionHint, ConditionAlwaysRun, ConditionSystemFunctionUnavailable}`
  in `constants/i18n.ts` + strings in `locales/en.ts`.

## 5. Testing (mirror reference)

- `utils.spec`: `isReservedSystemFunctionCondition` — bare `name()` true; `$exists(...)`, paths,
  operators, blank/undefined false.
- `Configuration.spec`: renders the Condition input; `onChangeCondition` fires; shows `conditionError`.
- `AddMetricModal.spec`: condition hydrated from `editingMetric`; reserved-call blocks finish
  (step invalid); payload carries `condition` (and `undefined` when blank).
- `Metrics.spec`: renders condition value / "Always run".

## 6. Notes

- Only the reserved-system-function case is validated client-side; everything else relies on the backend
  400 surfaced through the existing toast. Deliberate for the POC.

## Why

Creating a test case similar to an existing one currently requires users to add a blank row and
re-enter every field. This is especially costly for cases with many schema fields or multiple turns.

## What Changes

- Add a **Duplicate** action to the Test Cases row context menu in dataset grids and in the private
  dataset grid on a test suite's Test Cases tab.
- Create a new case with a distinct ID and copy all user-editable fields and all turns from the
  source case; give it a unique copy name because names must be unique within a dataset.
- Persist the duplicate immediately through the existing test-case creation action and refresh the
  grid.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dataset-test-cases`: specify duplication in both dataset-backed Test Cases grids.
- `multi-turn-test-cases`: specify preservation of every turn when duplicating a multi-turn case.

## Impact

- `apps/ai-dial-admin/src/components/Datasets/TestCases/TestCasesList.tsx`
- `apps/ai-dial-admin/src/components/TestSuites/TestCases/TestCasesList.tsx`
- Related row-action/i18n code and component tests.
- No backend API contract change; the duplicate uses the existing test-case creation API.

## Non-goals

- Do not add duplication for test suites or datasets themselves.
- Do not change public-dataset read-only behavior.
- Do not add a separate backend endpoint or change test-case field/schema behavior.

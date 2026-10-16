## Why

A PUBLIC dataset that is bound to a test suite cannot have its fields renamed: Save returns 409 ("Cannot rename fields of PUBLIC dataset …: it is bound to N test suite(s)"). The Schema tab still lets the user edit, and after the error the field keeps the new name until the page is refreshed. There is also no way to see which test suites use a dataset.

## What Changes

- The Schema tab becomes read-only when the dataset is PUBLIC and at least one test suite is bound to it: field inputs, type/required/scope controls, Add field and the remove action are disabled, and a warning above the grid explains why. A private dataset (created inside a test suite) keeps an editable schema.
- The JSON Editor toggle in the dataset header is disabled for the same datasets, on every tab, so the schema cannot be edited through it.
- New **Test Suites** tab on the dataset page listing the test suites bound to the dataset (Display Name, Description, ID, Suite Type, Application, Creation Time, Updated Time, Created By) with server-side sort and filter inputs under the headers.
- Clicking a row, or "Open in new tab" in the row's context menu, opens the test suite in a new browser tab.
- The list is loaded with the unified query API (`test_suites` entity filtered by `dataset_id`). Opening the tab sends one request. The read-only decision is made by a separate size-1 probe in the dataset page's server component.

## Capabilities

### New Capabilities

- `dataset-test-suites`: the dataset page's Test Suites tab — what it lists, its columns, filtering, opening a suite, request budget.

### Modified Capabilities

- `dataset-schema`: the Schema tab is read-only, with a warning, for a PUBLIC dataset bound to at least one test suite; the existing "Rename rejected for a shared public dataset" 409 scenario stays as the fallback for a page opened before the binding existed.
- `dataset-management`: "Dataset tabs" grows from three tabs to four; the JSON Editor toggle is disabled while the schema is read-only.

## Impact

- `components/Datasets/{View,Schema}`, new `components/Datasets/TestSuites/`, `components/TestSuites/TestCaseSchema/SchemaManager.tsx` and `components/TestSuites/utils/columns.tsx` (a read-only mode shared with the test-suite schema modal, default off).
- `components/EntityHeaderControls` (JSON Editor toggle disabled state), `utils/tabs/utils.ts`, `constants/i18n.ts`, `locales/en.ts`, `constants/grid-columns/grid-columns.tsx`.
- `components/ListView/Evaluation/utils/{constants,test-suites-query}.ts` (a `datasetId` → `dataset_id` mapping); `app/[lang]/datasets/actions.ts` and `app/[lang]/datasets/[id]/page.tsx` (new query action and probe).
- No backend change. Shared pieces are only extended with optional, default-off props, so the test-suite schema modal and the test-suites list are unaffected.

## Non-goals

- No change to backend rename validation; the 409 stays the authority and its toast stays as the fallback.
- No "View Test Suites" link in the warning (crossed out in the mockup).
- No general fix for form state surviving a failed save beyond what the read-only lock prevents.
- No run/duplicate/delete actions on the Test Suites tab rows, and no unbind from the dataset page.

## 1. OpenSpec contract

- [x] 1.1 Keep the proposal, design, delta specs, and implementation aligned on both grid surfaces,
      API-assigned unique identity, full field/turn copying, and immediate creation behavior.

## 2. Dataset Test Cases grid

- [x] 2.1 Add a localized **Duplicate** row action to the dataset Test Cases grid and create a case
      with copied fields and turns through the existing creation action.
- [x] 2.2 Give the duplicate a dataset-unique name using the localized copy postfix, adding a
      numeric suffix when the postfix name already exists.

## 3. Test Suite private dataset grid

- [x] 3.1 Add the same **Duplicate** row action to the Test Suites Test Cases grid for editable
      private datasets; keep it unavailable for read-only public datasets.
- [x] 3.2 Apply the same unique copy-name behavior to the Test Suites grid.

## 4. Tests

- [x] 4.1 Add or update component tests for action availability, copied fields, unique IDs, all
      multi-turn data, source independence, immediate creation, refresh, and failure notification.
- [x] 4.2 Cover repeated duplication when a matching copy name already exists.

## 5. Quality gates

- [x] 5.1 Run the focused component tests, app and spec typechecks, and applicable lint/format
      checks; run the repository test command as the final suite gate.

> Browser verification task omitted by user choice. The user declined the dedicated automated
> `spec-browser-verify` task; component tests and quality gates remain required.

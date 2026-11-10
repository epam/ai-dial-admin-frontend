## Why

A failed policy-assignment create produces two identical error notifications and closes the form, losing the user's edits (#5444).

## What Changes

- Give the shared create dialog sole ownership of reporting failed create requests on asset-list routes, and retain the form on failure.
- Preserve the existing notification behavior of application creation and duplication.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-policy-assignments`: specify a single unchanged Core error notification and retained form edits on failed creation.

## Non-goals

- Global notification deduplication or changes to Core validation and request contracts.
- Changing duplicate or application creation behavior.

## Impact

The shared asset list and its create-dialog wiring affect other asset types using `CreateEntity`; server actions and APIs are unchanged.

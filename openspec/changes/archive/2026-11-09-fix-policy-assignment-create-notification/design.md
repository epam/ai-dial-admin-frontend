## Context

`BaseAssetList` and `CreateEntity` both handled create errors, so one failed request produced two notifications. The list handler also serves application creation and duplication.

## Goals / Non-Goals

**Goals:** One error owner and retained edits for the shared create dialog; preserve other call paths.

**Non-Goals:** Global toast deduplication or changing Core's validation.

## Decisions

The create handler returns the response without reporting errors or closing the modal. `CreateEntity` and `CreateApplication` each report their final protected-request failure and close on success; the list's duplicate handler reports its own failures. This avoids an error-ownership flag and prevents notifications for an unauthorized response that is retried successfully. Global notification deduplication would mask multiple owners and could suppress legitimate separate failures.

## Risks / Trade-offs

- Shared list wiring serves multiple asset types → exercise the connected dialog and preserve application and duplicate failure coverage.

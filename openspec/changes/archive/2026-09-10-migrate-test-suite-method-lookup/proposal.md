## Why

The shared test-suite Methods picker still loads deployment details through the typed
`/api/v1/deployments/{type}/{id}` endpoint. Eval Framework now provides the type-agnostic
`/api/v1/deployments/all/{id}` endpoint for single-deployment lookups, so method selection should use
that endpoint consistently without depending on the selected target's type.

## What Changes

- Load the full deployment used by the shared Methods picker through
  `GET /api/v1/deployments/all/{id}`.
- Apply the lookup to Create Test Suite step 3 and the Change Method modal, which share the picker.
- Keep the existing method groups, loading state, selection defaults, and missing-deployment behavior.

## Non-goals

- Changing the Target step's typed deployment lists.
- Removing the typed single-deployment API or migrating unrelated callers.
- Changing method availability, request templates, or visible modal layout.
- Adding browser verification; focused component tests cover the unchanged visible behavior.

## Capabilities

### New Capabilities

- `test-suite-method-lookup`: Defines how the shared test-suite Methods picker loads full deployment
  details before building selectable methods.

### Modified Capabilities

_(none)_

## Impact

- `apps/ai-dial-admin/src/components/TestSuites/Methods/Methods.tsx` switches to the existing
  `getDeploymentById` server action.
- The co-located Methods component tests update their action mock and lookup assertion while
  preserving in-progress Responses API test edits.
- No API client, server action, model, dependency, or public component interface changes.

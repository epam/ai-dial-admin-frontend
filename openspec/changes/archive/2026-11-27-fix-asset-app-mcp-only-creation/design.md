# Design

## Context

See proposal.md for motivation. Asset creation uses `ResourceSourceField` and holds the source mode separately from the resource; regular application validation expects a different persisted source shape. The source-step status also depends on `SaveValidationContext`.

## Goals / Non-Goals

**Goals:** Keep source-mode calculations independently testable and preserve the existing submission and field-validation flows.

**Non-Goals:** Unify resource and regular application data models or alter existing source-switching behavior.

## Decisions

- Extract creation-specific pure calculations and the step enum to feature-local utilities and constants. Reuse existing source type constants. This keeps the component focused on state and UI without introducing an abstraction used by unrelated editors.
- Use the existing `isValidEndpoint` check for either the chat or MCP endpoint in the creation-only source predicate. Using regular applications' `isValidSourceField` would require a different source shape and would change URL validation semantics. Represent the resource's MCP field through a narrow local type rather than changing shared resource contracts.
- Keep the shared `isValid` field-validation gate in addition to the source predicate. An OR alone would enable Create when one enabled field is valid and another is invalid.
- Test the predicate separately, the modal's gating and payload, and the real source editor with the validation provider. A mocked source editor alone cannot establish checkbox behavior or field validation cleanup.

## Risks / Trade-offs

- The source predicate and field controls use different existing URL validators → preserve their current behavior; test invalid enabled fields through the real validation provider.
- The existing consolidated spec says empty Interfaces are valid, whereas current creation requires a configured interface → do not change Interfaces behavior in this fix.

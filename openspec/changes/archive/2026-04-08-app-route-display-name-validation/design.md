## Context

App Routes use the `name` field as a route identifier that is sent to the backend. The backend enforces the constraint `^[a-zA-Z0-9_]+$`. Currently the frontend only checks for a small blocklist of forbidden characters (`%`, `/`, `\`, `;`) and spaces — allowing characters like `@`, `-`, `!`, etc. to pass through to the API, where they will be rejected.

The codebase already has a established pattern for field-specific validation: each field type with distinct rules has its own `getErrorFor*` function in `utils/validation/name-error.ts` (e.g., `getErrorForName`, `getErrorForDisplayName`, `getErrorForUrlId`). This change follows that same pattern.

The Display Name field in App Routes is rendered in two places:
1. **Edit flow** — `RouteProperties.tsx` (via `DisplayNameControl`)
2. **Create flow** — `CreateRoute.tsx` modal (calls `getErrorForName` directly)

## Goals / Non-Goals

**Goals:**
- Add `^[a-zA-Z0-9_]+$` validation to the App Route Display Name field in both the create modal and the edit properties panel.
- Show the error: "Field must not contain forbidden characters. Only alphanumeric characters and underscore are allowed."
- Block save when the field is invalid (via `SaveValidationContext`).
- Keep `getErrorForName` and `DisplayNameControl` unchanged for all other callers.

**Non-Goals:**
- Changing validation for non-app-route display name fields.
- Changing validation for the `Route` entity (non-app routes).
- Backend changes.
- Character filtering on input (the field shows an error, not silently strips characters).

## Decisions

### Decision 1: New `getErrorForAppRouteName` function, not a new parameter on `getErrorForName`

`getErrorForName` already has 8 parameters, several boolean flags, and branching logic. Adding a ninth (`alphanumericUnderscoreOnly`) would further increase the cognitive load of an already complex signature.

**Alternative considered**: Add a boolean flag to `getErrorForName`.
**Rejected because**: The existing `isDeploymentId` flag shows how this pattern accumulates debt. Each new "special case" makes the function harder to read and test.

**Chosen**: A new `getErrorForAppRouteName(name, names, t)` function with a clean, minimal signature. It applies the same length/duplicate checks as `getErrorForName` but uses a positive-allowlist regex instead of a blocklist.

### Decision 2: New `alphanumericOnly` prop on `DisplayNameControl`

`RouteProperties` uses `DisplayNameControl` to get its validation state integrated with `SaveValidationContext`. Duplicating that wiring inline in `RouteProperties` would be more code change for no benefit.

**Alternative considered**: Manage validation state directly in `RouteProperties` with a raw `DialInput`.
**Rejected because**: `DisplayNameControl` already encapsulates `trimStart`, `dispatch` to `SaveValidationContext`, and error state — all of which would need to be re-implemented inline.

**Chosen**: Add `alphanumericOnly?: boolean` to `DisplayNameControl`'s props. When `true`, the component calls `getErrorForAppRouteName` instead of `getErrorForName`. `RouteProperties` passes `alphanumericOnly={isAppRoute}`.

### Decision 3: `CreateRoute` calls `getErrorForAppRouteName` directly

`CreateRoute` already calls `getErrorForName` directly (it does not use `DisplayNameControl`). Switching that call to `getErrorForAppRouteName` is the minimal, consistent change.

### Decision 4: Reuse `ErrorType.FORBIDDEN_CHARS` for the new error

The new error is semantically the same category (characters that are not allowed). A new `ErrorType` variant is not warranted — the distinction lives in the error message, not the type.

## Risks / Trade-offs

- **Existing App Route names with now-invalid characters**: When a user opens an existing App Route whose `name` already contains invalid characters (e.g. hyphens from older data), the validation will fire on initial render and mark the form invalid. This is the correct behavior — it surfaces a pre-existing backend constraint — but it may surprise users. No special migration handling is required.

- **`getErrorForName` complexity is not reduced**: This change adds a new function rather than refactoring the existing one. That's intentional — scope is kept minimal. The existing function is left untouched.

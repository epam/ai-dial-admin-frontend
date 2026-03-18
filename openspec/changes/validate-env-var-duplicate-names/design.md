## Context

Environment variables in containers are managed via `ContainerVariables.tsx`, which renders a list of `Variable` components. Each variable's name is validated individually by `getVariableNameError()` (format, length, required). The validation system uses `SaveValidationContext` to track field errors across the form, keyed by field names like `variable_{index}`.

Currently there is no cross-field validation — duplicate names are only caught by the backend on save.

## Goals / Non-Goals

**Goals:**
- Detect duplicate env variable names within a container and show inline errors immediately
- Mark all variables sharing a duplicate name, not just the "later" ones

**Non-Goals:**
- Cross-container uniqueness validation
- Changing backend behavior

## Decisions

### 1. Duplicate detection inside `getVariableNameError()`

**Decision:** Add an optional `existingNames: string[]` parameter to `getVariableNameError()`. The caller builds the list of sibling names (excluding the current variable) and passes it in. The function checks for membership and returns a `DUPLICATE` error if found.

**Why:** Keeps all name validation in one place. The function already handles format, length, and required checks — adding duplicate detection is a natural extension. The caller (parent component) is responsible for building the sibling names list, which is straightforward since it already has the full variables array.

**Alternative considered:** Handling duplicate detection entirely at the `ContainerVariables` parent level with a separate mechanism. Rejected — adds unnecessary complexity when the existing validator can handle it with one extra parameter.

### 2. Case-sensitive name comparison

**Decision:** Compare names exactly as entered (case-sensitive).

**Why:** Environment variable names are case-sensitive in Linux containers. `PATH` and `path` are different variables. Matching backend behavior.

### 3. Error priority within `getVariableNameError()`

**Decision:** The function checks in order: empty → length → format → duplicate. First error wins. This means format errors take priority over duplicate errors, which is correct — a malformed name that happens to collide is best fixed by correcting the format first.

### 4. Validation timing

**Decision:** Recompute duplicates on every name change (controlled component `onChange`). Since variable counts are small (typically < 50), a simple O(n) frequency count on each change is negligible.

## Risks / Trade-offs

- **[Risk] Error flicker during rename** → When renaming a variable from a duplicate name, both variables will briefly show/clear errors. This is expected and correct behavior.
- **[Trade-off] Empty names** → Two empty-name variables are technically duplicates, but they already show a "required" error. Duplicate check should skip empty names to avoid stacking errors unhelpfully.

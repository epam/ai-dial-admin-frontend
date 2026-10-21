## Context

The Platform > Routes create flow uses the shared `CreateEntity` modal, which delegates its body to the platform-specific `RouteCreateProperties` component. That component intentionally bypasses the generic entity form because Core route resources do not support `displayName` or `description`. It currently exposes only the name, even though the existing payload type and route create action already carry `paths`.

The separate Entities > Routes create form already validates one required path with `getErrorForPath`, stores it as `paths: [path]`, and participates in `SaveValidationContext` to govern modal submission.

## Goals / Non-Goals

**Goals:**

- Collect one required, valid initial path with a Platform Route's name.
- Reuse the established route-path validation and UI conventions.
- Ensure the shared modal cannot submit until the initial path and name are valid.
- Preserve the Route-specific omission of Display Name and Description.

**Non-Goals:**

- Replacing the Platform Route Properties tab's multi-path `Paths` editor.
- Changing Entities > Routes or any non-route create flow.
- Changing Core's route API, payload model, or server-side validation.

## Decisions

### Extend the platform-specific create form

`RouteCreateProperties` will add a controlled Path input rather than switching to the generic `EntityProperties` form.

**Rationale:** The generic form supplies unsupported Display Name and Description values that Core's `Route` deserializer rejects. Keeping the specialized form preserves the existing safe payload shape while adding only the missing field.

**Alternative considered:** Reuse `EntityProperties` and hide unsupported controls. This would add route-specific exceptions to a broadly shared component and risk reintroducing fields that Platform Routes must not send.

### Reuse the existing single-path validation contract

The Path input will call `getErrorForPath`, display the returned inline error, and update the entity as `paths: path ? [path] : []`.

**Rationale:** The route validation utility already defines accepted plain and regex path formats and has unit coverage. Reusing it gives Platform Routes the same behavior as the existing route creation flow.

**Alternative considered:** Validate only that the input is non-empty. This would permit malformed paths and create inconsistent route behavior.

### Register initial Platform Route path validity in the shared create modal

`CreateEntity` will initialize the `path` validation entry as invalid for Platform Route creation. The Path control will update that entry as the user edits it.

**Rationale:** The modal's submit state is governed by `SaveValidationContext`. Initial registration prevents a name-only route from being submitted before the user interacts with Path.

**Alternative considered:** Depend solely on a local `disableSubmitButton` condition. That would create a second submit-validity mechanism and diverge from the shared modal pattern.

## Risks / Trade-offs

- [Shared validation key collides with a stale modal field] → The create modal's validation initialization follows the existing Route pattern and the Path control owns the same `path` key for its lifetime.
- [Platform-only validation diverges from entity routes] → Use the established `getErrorForPath` helper rather than duplicate its logic.
- [A future create flow needs multiple paths] → The initial creation contract deliberately persists a one-element array; the Properties tab remains responsible for subsequent multi-path editing.

## Migration Plan

No data migration is required. New route resources will include one initial `paths` item; existing routes remain unchanged. Rollback consists of reverting the client-side form and validation changes.

## Open Questions

None.

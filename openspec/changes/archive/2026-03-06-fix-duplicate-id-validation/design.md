## Context

The entity creation flow uses two layers of ID uniqueness validation:

1. **Client-side** (immediate): `IdControl` receives a `names` array and `getErrorForName` checks `names.includes(name)` on every keystroke
2. **Server-side** (on submit): `CreateEntity.onCreate` calls `checkIsUniqueDeploymentName` for routes in `RoutesForCheckingUniqueName`

The bug: `DeploymentProperties` has `names` in its props but doesn't pass it to `IdControl`. The working reference is `EntityProperties` (line 61) which correctly passes `names`.

```
CreateEntity
  └─ Properties (receives names)
       ├─ EntityProperties → IdControl(names=names)     ✓ works
       ├─ AssetProperties → ...                          (no IdControl)
       └─ DeploymentProperties → IdControl(names=???)   ✗ missing
```

## Goals / Non-Goals

**Goals:**
- Enable immediate client-side duplicate ID validation in `DeploymentProperties`

**Non-Goals:**
- Changing validation logic in `getErrorForName` or `IdControl`
- Removing the server-side `checkIsUniqueDeploymentName` check

## Decisions

### Pass `names` to `IdControl` in `DeploymentProperties`

**Rationale**: The `names` prop already flows through `Properties` → `DeploymentProperties` and is used for `displayName` validation via `getNamesConfigurations`. It just needs to also be forwarded to `IdControl`. This matches the existing pattern in `EntityProperties`.

**Note**: `DeploymentProperties` uses `namesConfiguration.names` (processed display names) for the display name field, but `IdControl` needs the raw `names` array (entity IDs). The raw `names` prop is the correct one to pass — same as `EntityProperties` does.

## Risks / Trade-offs

- **[Low] Dual validation**: Both client-side (`names.includes`) and server-side (`checkIsUniqueDeploymentName`) will now run. This is correct — client-side provides instant feedback, server-side catches race conditions.

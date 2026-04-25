## Overview

Add server-side transformation for App Runner MCP config delivery values to convert lowercase UI enum values to uppercase backend format without changing the UI enum or requiring duplicate enums.

## Component Changes

### Modified: `src/app/[lang]/application-runners/actions.ts`

Add transformation utility and apply it in all save actions:

**New utility function**:
```typescript
function transformApplicationSchemeForServer(scheme: DialApplicationScheme): DialApplicationScheme {
  const mcp = scheme['dial:applicationTypeMcp'];
  if (!mcp) return scheme;

  const configDelivery = mcp['dial:mcpConfigDelivery'];
  if (!configDelivery) return scheme;

  return {
    ...scheme,
    'dial:applicationTypeMcp': {
      ...mcp,
      'dial:mcpConfigDelivery': configDelivery.toUpperCase() as ApplicationMCPConfigDelivery,
    },
  };
}
```

**Modified actions**:
- `createApplicationScheme` — wrap scheme with `transformApplicationSchemeForServer(scheme)` before passing to API
- `updateApplicationScheme` — apply transformation before spreading runner into update payload
- `updateCoreRunner` — apply transformation to runner before API call

## Data Flow

1. User selects lowercase value ('meta' | 'header') in `EndpointAndMCPContainer.tsx`
2. Value stored in component state and passed to parent as lowercase
3. When save triggered, action layer receives `DialApplicationScheme` with lowercase `dial:mcpConfigDelivery`
4. `transformApplicationSchemeForServer` converts to uppercase ('META' | 'HEADER')
5. Backend receives uppercase value matching schema requirements

## Type Safety

- Transformation uses `toUpperCase()` with type assertion back to `ApplicationMCPConfigDelivery`
- Safe because enum structure guarantees lowercase ↔ uppercase correspondence
- No runtime enum validation needed — TypeScript ensures only valid lowercase values reach transformation

## Testing Strategy

- Unit tests for `transformApplicationSchemeForServer`:
  - Returns unchanged scheme when `dial:applicationTypeMcp` absent
  - Returns unchanged scheme when `dial:mcpConfigDelivery` absent
  - Converts 'meta' → 'META' and 'header' → 'HEADER'
  - Preserves all other MCP properties
  - Preserves all other scheme properties
- Integration: verify App Runner save/update with MCP endpoint includes uppercase config delivery in network payload

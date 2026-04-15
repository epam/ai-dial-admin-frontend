# Design: Add Auth Fields to Asset Toolset Duplicate

## Overview

Extend `DuplicateAsset.tsx` to detect asset toolsets with authentication and show appropriate auth field inputs, mirroring the implementation from `DuplicateToolset.tsx` (PR #2895).

## Architecture

### Current Flow

```
User clicks Duplicate
    ↓
DuplicateAsset modal opens
    ↓
Shows: name, version, displayName, folder
    ↓
User submits → onDuplicate(clonedAsset)
```

### New Flow

```
User clicks Duplicate
    ↓
DuplicateAsset modal opens
    ↓
Is it an AssetToolset with authSettings?
    ├─ Yes → Show: name, version, displayName, folder + auth fields
    └─ No  → Show: name, version, displayName, folder (existing behavior)
    ↓
Validate all required fields (including auth)
    ↓
User submits → onDuplicate(clonedAsset with auth)
```

## Implementation Details

### 1. Type Detection

Add helper to determine if entity is an `AssetToolset`:

```typescript
// At top of component
const isToolsetWithAuth = useMemo(() => {
  const assetToolset = entity as AssetToolset;
  return (
    'authSettings' in entity &&
    assetToolset.authSettings?.authenticationType &&
    assetToolset.authSettings.authenticationType !== ToolsetAuthType.NONE
  );
}, [entity]);

const authType = useMemo(() => {
  if (!isToolsetWithAuth) return null;
  return (entity as AssetToolset).authSettings?.authenticationType || null;
}, [isToolsetWithAuth, entity]);
```

### 2. State Management

Extend existing `clonedAsset` state to handle auth fields. No separate state needed - update the nested `authSettings` object:

```typescript
const onChangeClientId = useCallback(
  (clientId?: string) => {
    const toolset = clonedAsset as AssetToolset;
    setClonedAsset({
      ...toolset,
      authSettings: { ...toolset.authSettings!, clientId },
    });
    dispatch({ type: ValidationActionType.SetField, field: 'clientId', isValid: !!clientId });
  },
  [clonedAsset, dispatch]
);
```

### 3. Validation

Add validation for auth fields in `useEffect` initial validation (similar to DuplicateToolset):

```typescript
useEffect(() => {
  // Existing validation...

  // Auth-specific validation
  if (authType === ToolsetAuthType.OAUTH) {
    const toolset = entity as AssetToolset;
    dispatch({ type: ValidationActionType.SetField, field: 'clientId', isValid: !!toolset.authSettings?.clientId });
    dispatch({ type: ValidationActionType.SetField, field: 'clientSecret', isValid: !!toolset.authSettings?.clientSecret });
    dispatch({ type: ValidationActionType.SetField, field: 'authorizationEndpoint', isValid: !!toolset.authSettings?.authorizationEndpoint });
  } else if (authType === ToolsetAuthType.API_KEY) {
    const toolset = entity as AssetToolset;
    dispatch({ type: ValidationActionType.SetField, field: 'apiKeyHeader', isValid: !!toolset.authSettings?.apiKeyHeader });
  }
}, [/* deps */]);
```

### 4. UI Rendering

Add conditional rendering after existing fields (after version, before folder path):

```tsx
{isToolsetWithAuth && (
  <h3>
    {authType === ToolsetAuthType.OAUTH && t(ToolsetI18nKey.OAuth)}
    {authType === ToolsetAuthType.API_KEY && t(ToolsetI18nKey.ApiKey)}
  </h3>
)}

{authType === ToolsetAuthType.OAUTH && (
  <>
    <DialInput
      id="clientId"
      labelProps={{ label: t(EntityFieldsI18nKey.clientId), required: true }}
      value={(clonedAsset as AssetToolset).authSettings?.clientId || ''}
      placeholder={t(EntityPlaceholdersI18nKey.ClientId)}
      onChange={onChangeClientId}
    />
    {/* clientSecret, authorizationEndpoint similarly */}
  </>
)}

{authType === ToolsetAuthType.API_KEY && (
  <DialInput
    id="apiKeyHeader"
    labelProps={{ label: t(EntityFieldsI18nKey.apiKeyHeader), required: true }}
    placeholder={t(EntityPlaceholdersI18nKey.Header)}
    value={(clonedAsset as AssetToolset).authSettings?.apiKeyHeader || ''}
    onChange={onChangeApiKeyHeader}
  />
)}
```

## Imports to Add

```typescript
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { ToolsetAuthType } from '@/src/models/dial/toolset';
import { DialPasswordInput } from '@epam/ai-dial-ui-kit';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { ValidationActionType } from '@/src/context/SaveValidationContext';
```

## Edge Cases

1. **Non-toolset assets (apps, prompts)** - No auth fields, existing behavior unchanged
2. **Toolsets with authSettings.authenticationType = NONE** - No auth fields shown
3. **Switching duplication type** (version vs entity) - Auth fields remain visible, same as name/displayName fields
4. **Empty auth fields in original** - Still require user to fill them in (validation prevents submit)

## Testing Strategy

Manual testing checklist:
- Duplicate asset toolset with OAuth → shows OAuth fields, validates required
- Duplicate asset toolset with API Key → shows API Key fields, validates required
- Duplicate asset toolset without auth → no auth fields
- Duplicate asset app/prompt → no auth fields
- Submit disabled when auth fields empty
- Submit enabled when all required auth fields filled

Unit tests (if time permits):
- Component tests verifying auth field rendering based on authType
- Validation context tests for auth field validation

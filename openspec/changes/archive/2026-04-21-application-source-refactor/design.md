## Model

### `src/models/dial/application.ts`

Add a discriminated union and replace the flat field:

```ts
export type ApplicationSource = ApplicationEndpointsSource | ApplicationSchemaSource;

export interface ApplicationEndpointsSource {
  $type: 'endpoints';
}

export interface ApplicationSchemaSource {
  $type: 'schema';
  applicationTypeSchemaId: string;
}
```

In `DialApplication`:
- Remove `customAppSchemaId?: string`
- Add `source?: ApplicationSource`

### Helper utility — `src/utils/entities/application-source.ts`

```ts
export const getSchemaSourceId = (source?: ApplicationSource): string | undefined => {
  return source?.$type === 'schema' ? source.applicationTypeSchemaId : undefined;
};
```

Used everywhere a schema ID needs to be read from a `DialApplication.source`. Keeps callsites from repeating the `$type` guard and cast.

---

## Source type → API mapping

```
SourceType.ENDPOINTS  →  source: { $type: 'endpoints' }   (or source omitted)
SourceType.APP_RUNNER →  source: { $type: 'schema', applicationTypeSchemaId: '...' }
```

The `SourceType` enum and radio-button labels are unchanged.

---

## Component changes

### `SourceField/Application/ApplicationSource.tsx`

**Initial state / sync effect** — replace `entity.customAppSchemaId` check:
```ts
// before
entity.customAppSchemaId || (entity as AssetApp).applicationTypeSchemaId
  ? SourceType.APP_RUNNER : SourceType.ENDPOINTS

// after  (regular app path only; AssetApp path unchanged)
entity.source?.$type === 'schema' || (entity as AssetApp).applicationTypeSchemaId
  ? SourceType.APP_RUNNER : SourceType.ENDPOINTS
```

**`handleRadioChange`** — ENDPOINTS branch clears `source`; APP_RUNNER branch leaves it alone (runner selection sets it):
```ts
// ENDPOINTS branch
const newEntity = { ...entity, source: undefined, applicationTypeSchemaId: undefined, applicationProperties: undefined };

// APP_RUNNER branch — no change to source here; onChangeAppRunner handles it
```

**`onChangeAppRunner`** — regular app path sets `source`:
```ts
// before
{ ...entity, customAppSchemaId: value, endpoint: void 0, mcp: void 0 }

// after
{ ...entity, source: value ? { $type: 'schema', applicationTypeSchemaId: value } : undefined, endpoint: void 0, mcp: void 0 }
```

**`selectedValue` prop to `AppRunners`** — regular app path reads from source:
```ts
// before
entity.customAppSchemaId

// after
getSchemaSourceId(entity.source)
```

**`resetValidation`** — clears `source` instead of `customAppSchemaId`:
```ts
{ ...entity, ..., source: undefined, applicationTypeSchemaId: undefined, applicationProperties: undefined }
```

**`onChangeEndpoint`** — same as resetValidation, clears `source`.

---

### `ParametersTab/utils.ts` — `getAppRunner`

```ts
// before
const customAppSchemaId = entity?.customAppSchemaId;

// after
const schemaSourceId = getSchemaSourceId((entity as DialApplication).source);
```

The find condition replaces `customAppSchemaId` with `schemaSourceId`. Priority order unchanged:
1. `applicationTypeSchemaId` (AssetApp)
2. `schemaSourceId` (regular app, from `source`)
3. `editorUrl` fallback

---

### `EntityView/AppRoute/ApplicationAppRoutes.tsx`

```ts
// before
if (!selectedEntity.customAppSchemaId) { ... }
disabled={!!selectedEntity.customAppSchemaId || isReadOnlyAdmin}

// after
const hasSchemaSource = selectedEntity.source?.$type === 'schema';
if (!hasSchemaSource) { ... }
disabled={hasSchemaSource || isReadOnlyAdmin}
```

---

### `EntityView/Interceptors/Interceptors.tsx`

```ts
// before
const name = (entity as DialApplication).customAppSchemaId || (entity as AssetApp).applicationTypeSchemaId;

// after
const name =
  getSchemaSourceId((entity as DialApplication).source) ||
  (entity as unknown as AssetApp).applicationTypeSchemaId;
```

---

### `EntityView/Interceptors/CollapsableInterceptors.tsx`

```ts
// before
(entity as DialApplication).customAppSchemaId || (entity as AssetApp).applicationTypeSchemaId

// after
!!getSchemaSourceId((entity as DialApplication).source) || !!(entity as unknown as AssetApp).applicationTypeSchemaId
```

---

### `EntityMainProperties/Properties/AdditionalProperties.tsx`

```ts
// before
runners?.find((runner) => runner.$id === (entity as DialApplication).customAppSchemaId)

// after
runners?.find((runner) => runner.$id === getSchemaSourceId((entity as DialApplication).source))
```

---

### `ApplicationRunners/View/View.tsx`

```ts
// before
initialValues={{ customAppSchemaId: selectedRunner.$id, applicationProperties: ... }}

// after
initialValues={{
  source: { $type: 'schema', applicationTypeSchemaId: selectedRunner.$id },
  applicationProperties: ...
}}
```

---

## Test changes

### `ParametersTab/tests/utils.spec.ts`

All `getAppRunner` test cases that use `customAppSchemaId` on the entity migrate to `source: { $type: 'schema', applicationTypeSchemaId: '...' }`. The `applicationTypeSchemaId` cases (AssetApp) stay unchanged.

### `ParametersTab/tests/ParametersTab.spec.tsx`

Replace `customAppSchemaId: 'scheme1'` fixture with `source: { $type: 'schema', applicationTypeSchemaId: 'scheme1' }`.

### `src/utils/entities/tests/application-source.spec.ts` (new)

Unit tests for `getSchemaSourceId`:
- returns `undefined` for `undefined` input
- returns `undefined` for `{ $type: 'endpoints' }`
- returns `applicationTypeSchemaId` for `{ $type: 'schema', applicationTypeSchemaId: 'urn:...' }`

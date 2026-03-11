# Design: Command & Arguments for All Container Types

## Approach

Remove the source type conditional in `ContainerFields.tsx` so `<ContainerConfiguration>` renders alongside other property sections (endpoint, variables, resources, startup probe) for all containers in the detail view.

## Change

**File:** `apps/ai-dial-admin/src/components/Containers/Fields/ContainerFields.tsx`

Before:
```tsx
{container.source?.$type === CONTAINER_SOURCE_TYPE.HUGGINGFACE && (
  <ContainerConfiguration container={container} setContainer={setContainer} />
)}
```

After:
```tsx
<ContainerConfiguration container={container} setContainer={setContainer} />
```

The `CONTAINER_SOURCE_TYPE` import can also be removed if no longer used by other conditions in the file — but it is still used by the `ContainerSource` and `ContainerAutoscaling` guards, so it stays.

## No other changes needed

- `ContainerConfiguration` component: already generic, no source-type assumptions
- Data model: `command` and `args` already on `Container` interface
- API: `createContainer`/`updateContainer` already serialize these fields
- i18n: labels and placeholders already exist

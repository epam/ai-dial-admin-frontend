## Why

When editing a deployment entity (Image or Container) via the JSON editor, users can modify the identity field (`id` for images, `name` for containers). On save, the system uses the modified identity from the JSON payload to construct the API URL, causing an unintended update to a different resource. The originally opened entity remains unchanged.

Root cause: `EntityJsonEditor` parses the full JSON and sets it as the new entity state without preserving the original identity. The API methods (`updateImage`, `updateContainer`) then extract the identity from this modified state.

Issue: [#2716](https://github.com/epam/ai-dial-admin-frontend/issues/2716)

## What Changes

- Add an `ignoredFields` prop to `EntityJsonEditor` — an optional list of field names that should be preserved from the previous state on every JSON change
- Extract the merge logic into a tested utility function `mergeWithIgnoredFields`
- Wire `ignoredFields` in `ImageView` (`['id']`) and `ContainerView` (`['name', '$type']`)
- Backend will also validate identity mismatch (covered separately), so this is defense in depth on the UI side

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None — this is a bug fix preventing unintended resource modification via the JSON editor.

## Non-goals

- Fixing this for non-deployment entity types (models, applications, adapters, etc.) — out of scope for this change
- Making identity fields visually readonly in Monaco — not feasible without significant complexity
- Changing API method signatures — the fix is encapsulated in the JSON editor component

## Impact

- **Components**: `EntityJsonEditor`, `ImageView`, `ContainerView`
- **New util**: `mergeWithIgnoredFields` — pure function with unit tests
- **Scope**: Deployment entities only (images, containers)
- **Risk**: Low — `ignoredFields` is optional, so all other usages of `EntityJsonEditor` are unaffected

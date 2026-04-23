## Implementation Tasks

### 1. Add transformation utility to application-runners actions

**File**: `apps/ai-dial-admin/src/app/[lang]/application-runners/actions.ts`

- Add `transformApplicationSchemeForServer` function that:
  - Takes `DialApplicationScheme` as input
  - Returns early if `dial:applicationTypeMcp` is absent
  - Returns early if `dial:mcpConfigDelivery` is absent
  - Converts `dial:mcpConfigDelivery` to uppercase using `toUpperCase()`
  - Preserves all other properties unchanged
- Import `ApplicationMCPConfigDelivery` type from models

### 2. Apply transformation in createApplicationScheme

**File**: `apps/ai-dial-admin/src/app/[lang]/application-runners/actions.ts`

- Modify `createApplicationScheme` function
- Wrap `scheme` parameter with `transformApplicationSchemeForServer(scheme)` before passing to `applicationRunnersApi.createApplicationScheme`

### 3. Apply transformation in updateApplicationScheme

**File**: `apps/ai-dial-admin/src/app/[lang]/application-runners/actions.ts`

- Modify `updateApplicationScheme` function
- Apply `transformApplicationSchemeForServer` to the runner object before spreading it into the update payload (before the existing `dial:applicationTypeRoutes` transformation)

### 4. Apply transformation in updateCoreRunner

**File**: `apps/ai-dial-admin/src/app/[lang]/application-runners/actions.ts`

- Modify `updateCoreRunner` function
- Wrap `runner` parameter with `transformApplicationSchemeForServer(runner)` before passing to `applicationRunnersApi.updateCoreRunner`

### 5. Add unit tests for transformation utility

**File**: `apps/ai-dial-admin/src/app/[lang]/application-runners/tests/actions.spec.ts` (create if absent)

- Test returns unchanged scheme when `dial:applicationTypeMcp` is undefined
- Test returns unchanged scheme when `dial:mcpConfigDelivery` is undefined
- Test converts 'meta' to 'META'
- Test converts 'header' to 'HEADER'
- Test preserves all other MCP properties (endpoint, transport, forwardPerRequestKey, allowedTools)
- Test preserves all other scheme root properties
- Mock any dependencies (getUserToken, applicationRunnersApi calls) if testing the full actions

### 6. Run all code quality checks

- Run `npm run lint` to verify no linting errors
- Run `npm run format` to check code formatting
- Run `npm run test` to verify all tests pass including new unit tests
- Fix any issues found before marking complete

# Fix: Port field accepts forbidden characters (`.` and `-`)

**Issue**: [#2678](https://github.com/epam/ai-dial-admin-frontend/issues/2678)

## Problem

The Port field for container deployments accepts `.` and `-` characters. `DialNumberInput` (which wraps `<input type="number">`) allows these characters natively. The `getPortError` validation function only checks the numeric range (1-65535) but does not reject non-integer values.

This means:
- Floats like `8080.5` pass the range check and get saved
- A bare `-` is passed as a string and bypasses the numeric check
- Values like `2-2` produce `NaN` which fails the range check but with a confusing error

## Solution

Widen `getPortError` to accept `number | string` (matching what `DialNumberInput.onChange` actually emits) and add a check that rejects strings, `NaN`, and non-integer numbers. Reuse the existing `PortError` message ("Port must be between 1 and 65535").

No component changes needed — all Port components already call `getPortError` and dispatch the result to `SaveValidationContext`, which disables the Save button when any field is invalid.

## Scope

- **Single function**: `getPortError` in `apps/ai-dial-admin/src/utils/deployments/validation.ts`
- **Tests**: `apps/ai-dial-admin/src/utils/deployments/tests/validation.spec.ts`

## Affected locations

All consumers of `getPortError` benefit without changes:
- `ContainerEndpoint/Port.tsx` (container port + GRPC port)
- `ContainerStartupProbe/Endpoint.tsx` (probe port)

## Non-goals

- Changing `DialNumberInput` in `@epam/ai-dial-ui-kit` (separate repo)
- Adding input masking or keystroke filtering
- Adding a new i18n error key

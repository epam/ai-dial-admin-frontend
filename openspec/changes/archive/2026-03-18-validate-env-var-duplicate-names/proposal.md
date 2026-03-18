## Why

Users can add multiple environment variables with the same name in the container form. The backend rejects duplicates and returns an error on save, but by then the user has already filled in values. The frontend should validate proactively so users get immediate feedback.

## What Changes

- Add duplicate name detection for environment variables within a container
- Show validation error on ALL variables that share a duplicate name
- Add localized error message for the duplicate name case

## Capabilities

### New Capabilities
- `env-var-duplicate-validation`: Cross-field validation that detects duplicate environment variable names in the container variables list and surfaces errors inline

### Modified Capabilities
<!-- None — existing single-field validation (name format, length, required) is unchanged -->

## Non-goals

- Changing `getVariableNameError()` — duplicate detection is a cross-field concern handled at the parent level
- Validating uniqueness across containers (only within a single container)
- Changing how the backend handles duplicates

## Impact

- `ContainerVariables.tsx` — duplicate detection logic added at the parent component level
- `i18n constants and locale files` — new error message key
- `validation tests` — new test cases for duplicate detection

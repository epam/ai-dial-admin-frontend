## Why

Config-origin App Runners currently always resolve their configuration schema through the admin backend. In Core-only deployments, `DIAL_ADMIN_API_URL` is absent, so that request has no configured host and schema-derived application properties cannot be resolved.

## What Changes

- Keep Platform-origin App Runner resolution unchanged: read asset content through Core by storage path, then resolve its schema through Core using the current content `$id`.
- Resolve Config-origin and originless runners through the admin backend only when `DIAL_ADMIN_API_URL` is configured.
- Fall back to Core's resolved-schema endpoint when that variable is absent or empty, respecting its direct-schema response shape.
- Preserve the current unresolved-runner fallback when either selected resolver fails.
- Cover the resolver choice, response handling, and fallback behavior with focused unit tests.

### Non-goals

- Changing the runner picker UI, origin classification, or how Platform runner content is loaded.
- Adding an Admin Backend endpoint or changing either backend API contract.
- Retrying a resolver through the other backend after a configured resolver returns a failure.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `application-source`: Runner selection must resolve Config-origin schemas through the available backend service.
- `platform-app-runners`: The Parameters view's shared runner-schema resolution must remain Core-direct for Platform runners and use Core as the Config-origin fallback when the Admin Backend is unavailable.

## Impact

- `apps/ai-dial-admin/src/components/SourceField/Application/resolve-app-runner.ts` and its unit spec.
- Existing server actions `getResolvedApplicationScheme` (Admin Backend) and `getResolvedRunnerSchema` (Core); no API changes.
- Active OpenSpec requirements for application source and platform App Runners.

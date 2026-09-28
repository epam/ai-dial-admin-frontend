## Why

When the Admin API is disabled, the footer renders a Core version slot but does not fetch a value. DIAL Core already exposes its current version directly, so the Admin console can show that version without relying on the Admin backend's version-detection and configuration state.

## What Changes

- Add a direct-Core utility API call for `GET /version`, authenticated with the caller token and accepting a plain-text version response.
- Make the existing Core-version server action use the direct-Core call when `DIAL_ADMIN_API_URL` is absent, while preserving the existing Admin-backend response when it is configured.
- Poll for and display the current Core version in the Core-only footer.
- Preserve the Admin-backed version selection and editing behavior when the Admin API is available.

## Capabilities

### New Capabilities
- `direct-core-version`: Retrieves and displays the current Core version when the console operates without the Admin API.

### Modified Capabilities
- None.

## Non-goals

- Recreating Admin-backend version auto-detection, default-version resolution, caching, or manual-version configuration in the frontend.
- Enabling version editing in Core-only mode.
- Changing the Admin-backed footer version behavior.

## Impact

- `apps/ai-dial-admin/src/server/core/core-utility-api.ts` and its API-client tests.
- `apps/ai-dial-admin/src/app/actions.ts` and server-action tests.
- `apps/ai-dial-admin/src/components/Content/Content.tsx` and associated component tests.
- The existing footer display in `apps/ai-dial-admin/src/components/Footer/Footer.tsx`.
- DIAL Core's existing authenticated `GET /version` endpoint; no backend contract changes.

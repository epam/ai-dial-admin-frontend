## 1. `DuplicateAsset.tsx` (public bucket)

- [x] 1.1 In `apps/ai-dial-admin/src/components/Assets/Deployments/DuplicateAsset.tsx`, extend the
      existing OAuth-reset `useEffect` with a walk over `(entity as DialApplicationResource).external_services`:
      for each entry whose `auth_settings?.authentication_type === ToolsetAuthType.OAUTH`, set that
      entry's `auth_settings` on `clonedAsset.external_services` to `{ authentication_type: ToolsetAuthType.NONE }`,
      preserving `display_name`/`description` and leaving non-OAUTH entries untouched.
- [x] 1.2 Guard the new walk so it only runs when `entity.external_services` is present (Toolsets have
      no such field) and does not affect the existing top-level `auth_settings` OAuth/API_KEY handling
      already in this component.

## 2. `DuplicatePlatformAsset.tsx` (platform bucket)

- [x] 2.1 In `apps/ai-dial-admin/src/components/Assets/Modals/DuplicatePlatformAsset.tsx`, port the
      existing toolset OAuth-reset check from `DuplicateAsset.tsx`: when the entity is a
      `DialPlatformToolsetResource` with `auth_settings?.authentication_type === ToolsetAuthType.OAUTH`,
      reset the clone's `auth_settings` to `{ authentication_type: ToolsetAuthType.NONE }`.
- [x] 2.2 In the same component, port the `external_services` walk from task 1.1: when the entity is a
      `DialPlatformApplicationResource`, reset every `OAUTH` entry's `auth_settings` to
      `{ authentication_type: ToolsetAuthType.NONE }`, leaving other entries untouched.

## 3. Tests

- [x] 3.1 Add/extend unit tests for `DuplicateAsset.tsx` covering: an OAuth external service is reset
      to NONE on duplicate; a non-OAuth external service (API_KEY/DIAL_NATIVE/NONE/unrecognised) is
      unchanged; a mix of OAuth and non-OAuth services in the same map only resets the OAuth one and
      preserves `display_name`/`description`; an application with no `external_services` is unaffected;
      the existing toolset `auth_settings` OAuth/API_KEY behavior in this file still passes unchanged.
- [x] 3.2 Extend `DuplicatePlatformAsset.spec.tsx` with the equivalent cases for the platform bucket:
      platform toolset OAuth `auth_settings` reset to NONE, platform toolset non-OAuth unaffected,
      platform application external-services OAuth reset (single, mixed, and none-present cases), and
      existing display-name/id behavior for runners/models/dual-bucket assets still passes unchanged.

## 4. Quality checks

- [x] 4.1 Run lint, format check, and the full test suite (`npm run lint`, `npm run format`,
      `npm run test` from `apps/ai-dial-admin/`) and fix any failures.

Note: no dedicated browser-verification task is included — the user explicitly declined one for this
change, opting to rely on the unit/component tests in section 3 despite some scenarios (success vs.
error notification on duplicate) being browser-observable.

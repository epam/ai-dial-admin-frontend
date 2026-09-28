# Tasks: fix-interface-base-url-fallback

## 1. InterfaceRow conditional requiredness and draft normalization

- [x] 1.1 Add an optional `entityBaseUrl?: string` prop to `InterfaceRow`
      (`apps/ai-dial-admin/src/components/BaseControls/InterfacesField/InterfaceRow.tsx`), compute
      `isRequired = !entityBaseUrl`, and use it for both the `getUrlError` `required` argument and
      the `DialInput` label's `required` prop (design D1).
- [x] 1.2 In the same component, make `onChangeBaseUrl` store `trimmed || undefined` instead of
      `trimmed || ''` so an emptied Base URL is absent in draft state and never reaches the wire as
      an empty string (design D2).
- [x] 1.3 Add a `useEffect` keyed on `entityBaseUrl` that re-runs `validate(baseUrl)` for
      passthrough rows, so clearing or refilling the entity-level `base_url` flips the row's
      required error and validity live (design D3).

## 2. InterfacesField threading

- [x] 2.1 Add `entityBaseUrl?: string` to `InterfacesField`
      (`apps/ai-dial-admin/src/components/BaseControls/InterfacesField/InterfacesField.tsx`) and
      pass it to each `InterfaceRow`; leave the `InterfaceEndpointRow` variant untouched.
- [x] 2.2 Change `createEmptyValue` for the BaseUrl variant to seed
      `{ [baseUrlKey]: undefined }` instead of `''`, so a newly added row saved untouched omits the
      field (design D2).

## 3. Consumer wiring

- [x] 3.1 Pass `entityBaseUrl={asset.baseUrl}` in
      `apps/ai-dial-admin/src/components/Assets/Platform/Models/Properties.tsx`.
- [x] 3.2 Pass `entityBaseUrl={asset.base_url}` in
      `apps/ai-dial-admin/src/components/Assets/Apps/Properties.tsx` (serves both Assets →
      Applications and Assets → Platform Applications).
- [x] 3.3 Leave the entity-backed consumers (Entities → Models / Applications / Interceptors,
      Assets → Platform Interceptors) without the prop so requiredness stays unconditional there.

## 4. Tests

- [x] 4.1 Update `apps/ai-dial-admin/src/components/BaseControls/InterfacesField/tests/InterfacesField.spec.tsx`:
      cover optional-with-entity-base-url (no required marker, valid when empty), required-without
      it, the live flip both directions on entity base_url change, entity-backed rows staying
      required, empty base_url stored as undefined in the change callback, and a new row's initial
      value being undefined.
- [x] 4.2 Add consumer coverage asserting the prop is passed on platform models
      (`Assets/Platform/Models/tests/Properties.spec.tsx`) and asset applications
      (`Assets/Apps/tests/Properties.spec.tsx`), including a save-payload assertion that an empty
      interface `base_url` is omitted while the entry (and any defaults/features/headers on it) is
      retained.

## 5. Quality gates

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, and the full
      `npm run test` from repo root; fix anything this change broke.

No browser-verification task: the user opted out during planning; component tests cover the
browser-observable scenarios (required marker presence, error shown/cleared, save gating).

## 1. Auth type selector (#3970)

- [x] 1.1 Add `excludeAuthTypes?: ToolsetAuthType[]` to `ResourceAuthentication`'s `Props`
      (`src/components/Assets/Resources/Auth/ResourceAuthentication.tsx`) and filter `authOptions`
      by it before both the disabled-view and interactive-view render paths (keeping the
      currently-selected type visible even if excluded, so pre-existing NONE-saved services don't
      crash the read-only view)
- [x] 1.2 Pass `excludeAuthTypes={[ToolsetAuthType.NONE]}` from `ResourceMultiAuth`
      (`src/components/Assets/Resources/Auth/ResourceMultiAuth.tsx`) when rendering
      `ResourceAuthentication`
- [x] 1.3 Confirm the Toolset auth caller (`src/components/Assets/Toolsets/View/Properties.tsx`,
      which renders `ResourceAuthentication` with `redirectUrl={TOOLSET_AUTH_REDIRECT_URL}`) is
      unchanged and still offers all three auth types

## 2. Duplicate Service ID validation (#3971)

- [x] 2.1 In `ResourceMultiAuth.tsx`, compute a derived `isDuplicateId` value from `editState`
      (`editState.currentId !== editState.originalId && !!services[editState.currentId]`)
- [x] 2.2 Render an inline validation error under the Service ID `DialInput` when
      `isDuplicateId` is true, reusing the existing generic `ErrorI18nKey.NameExists`
      ("This ID already exists.") instead of adding a new key
- [x] 2.3 Extend the Apply button's `disabled` condition to include `isDuplicateId` so the save is
      blocked for both Add and rename-during-Edit
- [x] 2.4 Correct the stale "Service ID is read-only when editing" claim by verifying the field
      remains a normal editable `DialInput` in edit mode (no code change expected here — this is
      confirming current behavior matches the corrected spec)

## 3. Scope URL encoding for external service login (#3976)

- [x] 3.1 Import `encodeCorePath` from `@/src/server/publications/path` into
      `src/app/[lang]/assets-applications/actions.ts`
- [x] 3.2 Wrap `appPath` with `encodeCorePath(...)` in the `url:` template literal in both
      `signInExternalService` and `signOutExternalService`

## 4. Tests

- [x] 4.1 Add/extend component tests for `ResourceAuthentication`
      (`src/components/Assets/Resources/Auth/tests/ResourceAuthentication.spec.tsx`) covering:
      `excludeAuthTypes` hides the given option; omitting the prop preserves all three options; a
      persisted (not just defaulted) excluded auth type stays visible
- [x] 4.2 Add/extend component tests for `ResourceMultiAuth`
      (`src/components/Assets/Resources/Auth/tests/ResourceMultiAuth.spec.tsx`) covering: adding a
      service with an ID that already exists shows the error and disables Apply; renaming a
      service to an ID owned by a different entry shows the error and disables Apply; renaming a
      service to its own original ID (no-op) does not show the error; Add form excludes
      "Without authentication". Added `aria-label`s to the row Edit/Delete icon buttons
      (previously unqueryable by role/name) to support this.
- [x] 4.3 Extend `src/app/[lang]/assets-applications/actions.spec.ts` covering:
      `signInExternalService`/`signOutExternalService` build a `url` with each path segment of a
      spaced app path URL-encoded

## 5. Quality checks

- [x] 5.1 Run lint, format check, and full test suite; fix any failures

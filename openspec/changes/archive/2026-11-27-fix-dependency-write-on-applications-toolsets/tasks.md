## 1. Validation

- [x] 1.1 Add `WriteNotAllowed` to `ResourceDependenciesI18nKey` in `apps/ai-dial-admin/src/constants/i18n.ts`
      and its entry in `apps/ai-dial-admin/src/locales/en.ts`, taking a `{type}` param (e.g. "Write is not
      allowed on {type} targets").
- [x] 1.2 Add `WRITE_FORBIDDEN_TYPE_ROOTS` (`applications`, `toolsets`) to
      `ResourceDependencies/constants.ts`.
- [x] 1.3 In `ResourceDependencies/utils/validate-dependency.ts`, extend `validateAccess` to take the path and
      return the new issue when `access` includes Write and the decoded first segment (via `getSegments`) is
      in `WRITE_FORBIDDEN_TYPE_ROOTS`. Keep `AccessRequired` first, and update the `validateDependency` call.
      `DependencyModal.tsx` already renders `errors.access` and gates `Add` on `hasDependencyErrors`, so it
      needs no change.

## 2. Tests

- [x] 2.1 Extend `ResourceDependencies/utils/tests/validate-dependency.spec.ts`: Write rejected on
      `applications/…` and `toolsets/…`; Read accepted on both; Write accepted on `files`, `prompts`,
      `conversations`, `skills`; encoded `%61pplications/…` rejected; `applications/{current-user}/x`
      rejected; `AccessRequired` still wins when access is empty; error clears once the path changes to a
      writable root.
- [x] 2.2 Extend `ResourceDependencies/tests/DependencyModal.spec.tsx`: with path `applications/public/x/`,
      selecting Write shows the `WriteNotAllowed` error, keeps Write selected and `Add` disabled; changing the
      path to `files/public/x/` clears it and enables `Add`.

## 3. Quality checks

- [ ] 3.1 Run lint, format, `npm run typecheck`, `npm run typecheck:specs` and the tests for the touched
      files, then the full `npm run test`.

No browser verification task: you chose unit and component tests only for this change.

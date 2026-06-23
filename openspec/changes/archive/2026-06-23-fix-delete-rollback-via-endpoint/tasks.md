## 1. Dispatch: Delete → rollback endpoint

- [x] 1.1 In `src/utils/audit/get-deployment-rollback-request.ts`, change the `Delete` branch to `return getDeploymentRollbackAction(resourceType)?.(id, targetRevision);` (same as `Update`). Remove the `getDeploymentRevisionDetails` fetch and `buildCreateBodyFromSnapshot` call from the Delete path.
- [x] 1.2 Drop the now-unused imports (`createContainer`, `createImage`, `buildCreateBodyFromSnapshot`, `Container`, `Image`) and the `getDeploymentCreateAction` helper. `getDeploymentRevisionDetails` is kept — still used by the `Create` branch.
- [x] 1.3 Update the function doc comment: `Delete` → rollback endpoint (backend resurrect), not recreate-from-snapshot.

## 2. Remove the dead mapper

- [x] 2.1 Delete `src/utils/audit/build-create-body-from-snapshot.ts`.
- [x] 2.2 Delete `src/utils/audit/tests/build-create-body-from-snapshot.spec.ts`.
- [x] 2.3 Grep for any other reference to `buildCreateBodyFromSnapshot` and remove it. (none found)

## 3. Navigation uses the resurrected entity id

- [x] 3.1 In `src/utils/audit/get-rollback-navigation.ts`, confirm the `Delete` branch builds the detail href from the rollback **response** entity's id (new id for image definitions), not the activity's `resourceId`. Callers already pass `res?.response`; no change needed.
- [x] 3.2 Confirm name-keyed entities (containers, model-servings) resolve to the same path either way. (covered by existing nav spec)

## 4. Lifecycle gate

- [x] 4.1 Confirm `src/utils/audit/deployment-lifecycle-check.ts` gates only the `Update` path; the `Delete` (resurrect) path stays ungated. (no change needed — `needsDeploymentLifecycleCheck` already returns true only for `Update`)

## 5. Tests

- [x] 5.1 Update `src/utils/audit/tests/get-deployment-rollback-request.spec.ts`: Delete case asserts the rollback action is called with `(id, targetRevision)`, with no snapshot fetch and no create call.
- [x] 5.2 Add/keep a test asserting the Delete path is not lifecycle-gated. (new `deployment-lifecycle-check.spec.ts`)
- [x] 5.3 Add/keep a navigation test: image-definition Delete rollback builds the href from the response's new id. (already in `get-rollback-navigation.spec.ts`)
- [x] 5.4 Run `npx vitest run` for the affected specs from `apps/ai-dial-admin/`; fix fallout. (23 passed)

## 6. Verify

- [x] 6.1 Reproduce Issue #3700: create a container with secure env values → rollback the creation (delete) → rollback the deletion. Confirm it issues `POST /{id}/revision/{R}/rollback` (not `/create`) and no server error. (Browser-verified: rollback of a Delete activity for a secure-env container succeeded with 200s, 0 console errors — no 500.)
- [x] 6.2 Confirm the resurrected entity opens on its detail page and the success notification hints secure values need re-supply. (Browser-verified: landed on the resurrected entity detail page; secure env var present with value reset server-side.)
- [x] 6.3 Run `npm run lint`. (0 errors)

## 7. Full validation gate

- [x] 7.1 `openspec validate deployment-entity-rollback --type spec --strict` — valid (main spec synced from the delta).
- [x] 7.2 Prettier format check on changed files — all files use Prettier code style.
- [x] 7.3 Full test suite `npx vitest run` — 5302 passed, 5 skipped, 0 failures (528 files).
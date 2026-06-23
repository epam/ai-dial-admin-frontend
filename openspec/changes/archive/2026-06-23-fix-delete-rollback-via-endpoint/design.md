## Context

`get-deployment-rollback-request.ts` dispatches deployment-manager rollback by activity type. The `Update` case calls the backend rollback endpoint; the `Create` case deletes; the `Delete` case fetches the `R` snapshot, maps it to a create DTO (`build-create-body-from-snapshot.ts`), and POSTs a create.

The Delete path breaks for entities with secure env values. Audit snapshots return secure values masked as `null`. The deployment-manager create path (`DeploymentService` → `transformEnvs`) turns the null into an empty string and provisions an invalid k8s secret → 500 (Issue #3700).

Backend investigation (`ai-dial-admin-mcp-manager-backend`) confirmed the rollback endpoint already handles the deleted case: `DeploymentService.rollback` / `ImageDefinitionService.rollback` detect the entity is gone and call `resurrect()`, which rebuilds it from audit history and resets sensitive values server-side (`partitionFromSnapshot` nulls them deliberately). Functional tests `shouldResurrectDeletedDeployment_onRollbackToPreDeleteRevision` and `shouldResurrectDeletedImageDefinition_onRollbackToPreDeleteRevision` cover this. Image definitions resurrect with a **new** id; deployments keep their id.

So the fix is purely frontend: stop recreating client-side, call the rollback endpoint for Delete too.

## Goals / Non-Goals

**Goals:**
- Make Delete rollback use the backend rollback endpoint, so secure-value entities resurrect without a 500.
- Navigate to the resurrected entity using the id from the rollback response.
- Remove the now-dead create-from-snapshot mapper.

**Non-Goals:**
- Restoring real secret values (server-nulled by design; operator re-supplies).
- Backend changes (resurrect already exists).
- Touching the `Create`→delete or `Update`→rollback behavior.

## Decisions

### D1: Delete dispatches to the rollback action, same as Update

In `get-deployment-rollback-request.ts`, replace the Delete block:

```ts
if (activityType === ActivityAuditType.Delete) {
  return getDeploymentRollbackAction(resourceType)?.(id, targetRevision);
}
```

This collapses the Delete and Update cases — both now `return getDeploymentRollbackAction(resourceType)?.(id, targetRevision)` after the `Create` and whitelist branches. The `getDeploymentRevisionDetails` fetch and `buildCreateBodyFromSnapshot` call disappear from the Delete path. `createContainer`/`createImage`/`buildCreateBodyFromSnapshot` imports drop out.

### D2: Remove `build-create-body-from-snapshot`

The mapper has no remaining caller. Delete `build-create-body-from-snapshot.ts` and `tests/build-create-body-from-snapshot.spec.ts`. Update `tests/get-deployment-rollback-request.spec.ts` Delete-case assertions: expect the rollback action called with `(id, targetRevision)`, and assert no snapshot fetch / no create call.

### D3: Navigation reads the resurrected entity id from the rollback response

The spec already requires the recreated-entity href to use the response entity's new id (image definitions get a new id on resurrect; containers are name-keyed and unchanged). The rollback `ServerActionResponse` returns the resurrected entity, so `get-rollback-navigation.ts` reads the response data exactly as it did the create response — no shape change, since both return the entity. Verify the Delete navigation branch reads `response.data` id rather than the activity's stale `resourceId`.

### D4: Delete is not lifecycle-gated

`deployment-lifecycle-check.ts` gates only the `Update` path. The Delete path was already ungated (it went straight to create). Resurrect stays ungated — a deleted entity has no live status. Confirm the check still only runs for `Update` after the dispatch change; no code change expected, but add/keep a test asserting Delete is not gated.

## Risks / Trade-offs

- **Backend version skew** — older deployment-manager builds without `resurrect()` would 404 on Delete rollback. Acceptable: the fix targets current backend (resurrect is merged and tested); a 404 surfaces as the standard error notification rather than a 500.
- **Secure values still lost** — unchanged from before; the success notification continues to hint that secure values need re-supply before deploy.
- **Image id changes on resurrect** — navigation must use the response id, covered by D3 and the existing spec scenario.

## Open Questions

None.
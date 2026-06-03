import {
  ActivityAuditEntity,
  isContainerDeploymentResource,
  isImageDefinitionResource,
} from '@/src/types/activity-audit';

// Server-managed identifiers present in every deployment-manager snapshot.
const COMMON_DROP_KEYS = ['id', 'createdAt', 'updatedAt'];

// Runtime/managed fields that must not be replayed when recreating an entity.
// `$type` and the raw `source` are intentionally KEPT — the create contract
// requires `$type` even though the diff layer hides it for display.
const CONTAINER_DROP_KEYS = [...COMMON_DROP_KEYS, 'status', 'url', 'author'];
const IMAGE_DROP_KEYS = [...COMMON_DROP_KEYS, 'status', 'buildStatus'];

const getDropKeys = (resourceType?: string): string[] => {
  if (isContainerDeploymentResource(resourceType)) return CONTAINER_DROP_KEYS;
  if (isImageDefinitionResource(resourceType)) return IMAGE_DROP_KEYS;
  return COMMON_DROP_KEYS;
};

/**
 * Build a create DTO from a deployment-manager revision snapshot for the
 * recreate (undo-Delete) rollback scenario. Keeps configuration fields
 * (including `$type` and the raw `source`) and drops server-managed/runtime
 * fields. Pure — does not mutate the input snapshot, which is shared with the
 * diff engine.
 *
 * @param {ActivityAuditEntity | null} snapshot - entity state at the target revision
 * @param {string} [resourceType] - deployment-manager resource type, selects the drop-set
 * @returns {ActivityAuditEntity} - create-ready body
 */
export const buildCreateBodyFromSnapshot = (
  snapshot: ActivityAuditEntity | null,
  resourceType?: string,
): ActivityAuditEntity => {
  if (!snapshot) {
    return {};
  }

  const dropKeys = new Set(getDropKeys(resourceType));
  const body: ActivityAuditEntity = {};
  for (const key of Object.keys(snapshot)) {
    if (!dropKeys.has(key)) {
      body[key] = snapshot[key];
    }
  }

  return body;
};

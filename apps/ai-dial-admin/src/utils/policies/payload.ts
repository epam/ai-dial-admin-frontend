import { DialPolicy, DialPolicyAssignment, PolicyKind, PolicyQuantity } from '@/src/models/dial/policy';
import { DialPolicyAssignmentResource, DialPolicyResource } from '@/src/models/dial/resource';
import { getCostObjectFromFolder } from '@/src/utils/policies/path';

type PolicyEntity = DialPolicyResource & { folderId?: string; id?: string; description?: string };
type AssignmentEntity = DialPolicyAssignmentResource & { folderId?: string; id?: string };

/** The one `per` value Core accepts today. */
export const POLICY_PER_SUBJECT = ['subject'];

const isBlank = (value?: string): boolean => value == null || value.trim() === '';

/**
 * What Core is sent for a policy. Identity (`name`, `id`, `_metadata`, the folder) lives in the URL, and
 * the generic create form seeds `description`/timestamps that `Policy` does not declare — Core rejects
 * unknown fields, so everything outside `DialPolicy` is dropped. Empty optional fields are omitted
 * rather than sent as `''`/`[]`: an empty `subject` would match everybody, which Core refuses.
 */
export const toPolicyPayload = (policy: PolicyEntity): DialPolicy => {
  const {
    _metadata: __metadata,
    name: __name,
    folderId: __folderId,
    id: __id,
    description: __description,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    ...fields
  } = policy;

  return {
    ...fields,
    kind: fields.kind ?? PolicyKind.BUDGET,
    quantity: fields.quantity ?? PolicyQuantity.COST,
    per: POLICY_PER_SUBJECT,
    costObject: isBlank(fields.costObject) ? undefined : fields.costObject,
    subject: fields.subject?.length ? fields.subject : undefined,
  };
};

/**
 * What Core is sent for an assignment. `costObject` is the folder it is stored in, never a separately
 * typed value, so the two cannot disagree.
 */
export const toAssignmentPayload = (assignment: AssignmentEntity): DialPolicyAssignment => {
  const {
    _metadata,
    name: __name,
    folderId,
    id: __id,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    ...fields
  } = assignment;
  const costObject = getCostObjectFromFolder(folderId ?? _metadata?.folderId);

  return {
    ...fields,
    costObject: costObject || undefined,
    ticket: isBlank(fields.ticket) ? undefined : fields.ticket,
    source: isBlank(fields.source) ? undefined : fields.source,
    description: isBlank(fields.description) ? undefined : fields.description,
    expiresAt: isBlank(fields.expiresAt) ? undefined : fields.expiresAt,
    subject: fields.subject?.length ? fields.subject : undefined,
  };
};

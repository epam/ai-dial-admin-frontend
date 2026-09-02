/**
 * The resource types DIAL Core allows a role to override sharing limits for. Values match Core's own
 * `ResourceTypes.name()` exactly (uppercase, `SKILL` singular) — that name is the literal key Core
 * reads a role's `share` map with (`ShareService.getLimit`), so a mismatch here means the UI silently
 * reads and writes the wrong entries. Distinct from `Entities > Roles`' lowercase `SharingType`
 * (`components/Roles/types.ts`), which models the admin-backend's own convention for a different
 * backend and wire shape.
 */
export enum PlatformSharingType {
  APPLICATION = 'APPLICATION',
  TOOL_SET = 'TOOL_SET',
  PROMPT = 'PROMPT',
  FILE = 'FILE',
  CONVERSATION = 'CONVERSATION',
  CREDENTIALS = 'CREDENTIALS',
  SKILL = 'SKILL',
}

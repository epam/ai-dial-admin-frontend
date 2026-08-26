import { SharingGridData } from '@/src/components/Roles/models';
import { SharingType } from '@/src/components/Roles/types';
import { DialRoleResource } from '@/src/models/dial/resource';
import { DialCoreRoleShare } from '@/src/models/dial/role-limits';

/** Maps a sharing grid column's camelCase `token` to Core's own snake_case `ShareResourceLimit` field. */
const CAMEL_TO_CORE_SHARE_FIELD: Record<string, keyof DialCoreRoleShare> = {
  invitationTtl: 'invitation_ttl',
  maxAcceptedUsers: 'max_accepted_users',
};

export const toCoreShareField = (token: string): keyof DialCoreRoleShare =>
  CAMEL_TO_CORE_SHARE_FIELD[token] ?? (token as keyof DialCoreRoleShare);

/**
 * Builds sharing grid rows from a role asset's own `share` shape. Unlike `Entities > Roles`'
 * `getSharingData` (`components/Roles/utils.ts`), this applies no ms<->hours conversion: Core's
 * `ShareResourceLimit.invitationTtl` is documented, on the Core class itself, as already measured
 * in hours — so the raw value is exactly what the shared grid's "Expiration time (hours)" column
 * should show and edit, unlike the admin-backend's own `invitationTtl`, which is stored in ms.
 */
export const getAssetSharingData = (role?: DialRoleResource): SharingGridData[] => {
  const types = [
    SharingType.APPLICATION,
    SharingType.TOOL_SET,
    SharingType.PROMPT,
    SharingType.FILE,
    SharingType.CONVERSATION,
  ];

  return types.map((type) => {
    const shareData = role?.share?.[type];
    return {
      name: type,
      invitationTtl: shareData?.invitation_ttl != null ? String(shareData.invitation_ttl) : undefined,
      maxAcceptedUsers: shareData?.max_accepted_users != null ? String(shareData.max_accepted_users) : undefined,
    };
  });
};

/**
 * The sharing grid's edit handler as a pure transform: writes `value` to `sharingTypeName`'s Core
 * field (mapped from the grid column's camelCase `token` via `toCoreShareField`), dropping the
 * entry entirely once every one of its fields is empty — same "clear on all-blank" rule
 * `Entities > Roles`' `RoleSharing` applies. No ms<->hours conversion: `value` is already in the
 * unit Core's `ShareResourceLimit.invitationTtl` field expects.
 */
export const applySharingChange = (
  role: DialRoleResource,
  sharingTypeName: string,
  token: string,
  value: number,
): DialRoleResource => {
  const field = toCoreShareField(token);
  const newValue = {
    ...role.share?.[sharingTypeName],
    [field]: value,
  };
  const share = {
    ...role.share,
    [sharingTypeName]: newValue,
  };
  if (Object.values(newValue).every((val) => val === null || val === undefined || (val as unknown) === '')) {
    delete share[sharingTypeName];
  }
  return { ...role, share };
};

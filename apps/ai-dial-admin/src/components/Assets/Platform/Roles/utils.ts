import { ColDef, Column, GridApi, IRowNode } from 'ag-grid-community';

import { SharingGridData } from '@/src/components/Roles/models';
import { DialRoleResource } from '@/src/models/dial/resource';
import { DialCoreRoleShare, DialRoleShare } from '@/src/models/dial/role-limits';
import { platformSharingDefaults } from './constants';
import { PlatformSharingType } from './models';

/** Maps a sharing grid column's camelCase `token` to Core's own snake_case `ShareResourceLimit` field. */
const CAMEL_TO_CORE_SHARE_FIELD: Record<string, keyof DialCoreRoleShare> = {
  invitationTtl: 'invitation_ttl',
  maxAcceptedUsers: 'max_accepted_users',
};

export const toCoreShareField = (token: string): keyof DialCoreRoleShare =>
  CAMEL_TO_CORE_SHARE_FIELD[token] ?? (token as keyof DialCoreRoleShare);

/** Core's own sentinel for "not provided" on both `ShareResourceLimit` fields. */
const CORE_UNSET_SHARE_VALUE = -1;

const isUnsetShareValue = (value?: number | null): boolean => value == null || value === CORE_UNSET_SHARE_VALUE;

/**
 * Builds sharing grid rows from a role asset's own `share` shape, keyed by Core's own uppercase
 * `ResourceTypes.name()` (e.g. `TOOL_SET`, `SKILL`) — the exact key `ShareService.getLimit` reads —
 * rather than `Entities > Roles`' lowercase `SharingType` convention. A stored value of `-1` (Core's
 * "not provided" sentinel for both fields) is treated the same as absent, so the row falls through to
 * the grid's default placeholder instead of showing the literal `-1`. Unlike `Entities > Roles`'
 * `getSharingData` (`components/Roles/utils.ts`), this applies no ms<->hours conversion: Core's
 * `ShareResourceLimit.invitationTtl` is documented, on the Core class itself, as already measured
 * in hours — so the raw value is exactly what the shared grid's "Expiration time (hours)" column
 * should show and edit, unlike the admin-backend's own `invitationTtl`, which is stored in ms.
 */
export const getAssetSharingData = (role?: DialRoleResource): SharingGridData[] => {
  return Object.values(PlatformSharingType).map((type) => {
    const shareData = role?.share?.[type];
    return {
      name: type,
      invitationTtl: isUnsetShareValue(shareData?.invitation_ttl) ? undefined : String(shareData!.invitation_ttl),
      maxAcceptedUsers: isUnsetShareValue(shareData?.max_accepted_users)
        ? undefined
        : String(shareData!.max_accepted_users),
    };
  });
};

/**
 * The sharing grid's edit handler as a pure transform: writes `value` to `sharingTypeName`'s Core
 * field (mapped from the grid column's camelCase `token` via `toCoreShareField`). Clearing a field
 * removes that field from the entry entirely, the same "absent means unset" pattern the sibling
 * `RoleCostLimit`'s `onChangeToken` (`CostLimits.tsx`) uses — rather than writing an empty string,
 * which Core's Jackson deserializer would otherwise silently coerce to `0` on a primitive numeric
 * field. A value of `0` is only ever written when the user enters it. The entry is dropped from
 * `share` entirely once it has no fields left. No ms<->hours conversion: `value` is already in the
 * unit Core's `ShareResourceLimit.invitationTtl` field expects.
 */
export const applySharingChange = (
  role: DialRoleResource,
  sharingTypeName: string,
  token: string,
  value: number,
): DialRoleResource => {
  const field = toCoreShareField(token);
  const newValue = { ...role.share?.[sharingTypeName] };
  if (value === null || value === undefined || (value as unknown) === '') {
    delete newValue[field];
  } else {
    newValue[field] = value;
  }
  const share = {
    ...role.share,
    [sharingTypeName]: newValue,
  };
  if (Object.keys(newValue).length === 0) {
    delete share[sharingTypeName];
  }
  return { ...role, share };
};

/**
 * The sharing grid's default-placeholder lookup for this surface, against `platformSharingDefaults`
 * rather than `Entities > Roles`' own `sharingDefaults` (`components/Roles/utils.ts`) — the two
 * surfaces disagree on the default max users for `TOOL_SET`, and this one additionally covers
 * `CREDENTIALS`/`SKILL`, which the admin-backend surface doesn't have.
 */
export const getDefaultPlaceholder = (node: IRowNode, colDef: ColDef): string => {
  const field = colDef.field as keyof DialRoleShare;
  const name = node.data.name as PlatformSharingType;
  return platformSharingDefaults[name][field] as string;
};

/** Hides the reset-to-default row action once neither field on the row has an override. */
export const isResetToDefaultHidden = (api: GridApi, node: IRowNode): boolean => {
  const invitationTtl = api.getCellValue({
    colKey: api.getColumn('invitationTtl') as Column,
    rowNode: node,
  });
  const maxAcceptedUsers = api.getCellValue({
    colKey: api.getColumn('maxAcceptedUsers') as Column,
    rowNode: node,
  });
  return !(invitationTtl || maxAcceptedUsers);
};

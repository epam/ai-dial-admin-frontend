import { ColDef, Column, GridApi, IRowNode } from 'ag-grid-community';

import { NO_LIMITS_ACCEPTED_USERS, NO_LIMITS_VALUE } from '@/src/constants/role';
import { DialRole } from '@/src/models/dial/role';
import { DialRoleShare } from '@/src/models/dial/role-limits';
import { sharingDefaults } from './constants';
import { SharingGridData } from './models';
import { SharingType } from './types';

export const getSharingData = (role?: DialRole): SharingGridData[] => {
  const types = [
    SharingType.APPLICATION,
    SharingType.TOOL_SET,
    SharingType.PROMPT,
    SharingType.FILE,
    SharingType.CONVERSATION,
  ];

  return types.map((type) => {
    const shareData = role?.share?.[type];
    const initialInvitationTtl = shareData?.invitationTtl;
    const invitationTtl = (
      initialInvitationTtl === NO_LIMITS_VALUE || !initialInvitationTtl
        ? initialInvitationTtl
        : getHoursFromMs(initialInvitationTtl)
    )?.toString();

    return {
      name: type,
      invitationTtl: invitationTtl,
      maxAcceptedUsers: shareData?.maxAcceptedUsers,
    };
  });
};

export const getHoursFromMs = (ms: string): number => {
  return +ms / (60 * 60 * 1000);
};

export const getMsFromHours = (hours: number): number => {
  return hours * 60 * 60 * 1000;
};

export const getDefaultPlaceholder = (node: IRowNode, colDef: ColDef) => {
  const field = colDef.field as keyof DialRoleShare;
  const name = node.data.name;
  return sharingDefaults[name as SharingType][field] as string;
};

export const isResetToDefaultHidden = (api: GridApi, node: IRowNode) => {
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

export const isSetNoLimitsHidden = (api: GridApi, node: IRowNode) => {
  const invitationTtl = api.getCellValue({
    colKey: api.getColumn('invitationTtl') as Column,
    rowNode: node,
  });
  const maxAcceptedUsers = api.getCellValue({
    colKey: api.getColumn('maxAcceptedUsers') as Column,
    rowNode: node,
  });

  return invitationTtl === NO_LIMITS_VALUE && maxAcceptedUsers === NO_LIMITS_ACCEPTED_USERS;
};

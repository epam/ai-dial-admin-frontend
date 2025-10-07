import { ColDef, Column, GridApi, IRowNode } from 'ag-grid-community';

import { NO_LIMITS_ACCEPTED_USERS, NO_LIMITS_VALUE } from '@/src/components/EntityView/Roles/constants';
import { DialRole } from '@/src/models/dial/role';
import { DialRoleShare } from '@/src/models/dial/role-limits';
import { sharingDefaults } from './constants';
import { SharingGridData } from './models';
import { SharingType } from './types';

export const getSharingData = (role?: DialRole): SharingGridData[] => {
  return [
    {
      name: SharingType.APPLICATION,
      invitationTtl: role?.share?.[SharingType.APPLICATION]?.invitationTtl,
      maxAcceptedUsers: role?.share?.[SharingType.APPLICATION]?.maxAcceptedUsers,
    },
    {
      name: SharingType.TOOL_SET,
      invitationTtl: role?.share?.[SharingType.TOOL_SET]?.invitationTtl,
      maxAcceptedUsers: role?.share?.[SharingType.TOOL_SET]?.maxAcceptedUsers,
    },
    {
      name: SharingType.PROMPT,
      invitationTtl: role?.share?.[SharingType.PROMPT]?.invitationTtl,
      maxAcceptedUsers: role?.share?.[SharingType.PROMPT]?.maxAcceptedUsers,
    },
    {
      name: SharingType.FILE,
      invitationTtl: role?.share?.[SharingType.FILE]?.invitationTtl,
      maxAcceptedUsers: role?.share?.[SharingType.FILE]?.maxAcceptedUsers,
    },
    {
      name: SharingType.CONVERSATION,
      invitationTtl: role?.share?.[SharingType.CONVERSATION]?.invitationTtl,
      maxAcceptedUsers: role?.share?.[SharingType.CONVERSATION]?.maxAcceptedUsers,
    },
  ];
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

  return (
    (!invitationTtl && !maxAcceptedUsers) ||
    (invitationTtl === NO_LIMITS_VALUE && maxAcceptedUsers === NO_LIMITS_ACCEPTED_USERS)
  );
};

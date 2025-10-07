import { DialRoleShare } from '@/src/models/dial/role-limits';
import { MenuI18nKey } from '@/src/constants/i18n';

import { SharingType } from './types';

export const sharingDefaults: Record<SharingType, DialRoleShare> = {
  [SharingType.APPLICATION]: {
    invitationTtl: '72',
    maxAcceptedUsers: '10',
  },
  [SharingType.TOOL_SET]: {
    invitationTtl: '72',
    maxAcceptedUsers: '',
  },
  [SharingType.PROMPT]: {
    invitationTtl: '72',
    maxAcceptedUsers: '',
  },
  [SharingType.FILE]: {
    invitationTtl: '72',
    maxAcceptedUsers: '',
  },
  [SharingType.CONVERSATION]: {
    invitationTtl: '72',
    maxAcceptedUsers: '',
  },
};

export const sharingTypes: Record<SharingType, string> = {
  [SharingType.APPLICATION]: MenuI18nKey.Applications,
  [SharingType.TOOL_SET]: MenuI18nKey.Toolsets,
  [SharingType.PROMPT]: MenuI18nKey.Prompts,
  [SharingType.FILE]: MenuI18nKey.Files,
  [SharingType.CONVERSATION]: MenuI18nKey.Conversations,
};

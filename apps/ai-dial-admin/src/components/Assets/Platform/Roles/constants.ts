import { MenuI18nKey } from '@/src/constants/i18n';
import { DialRoleShare } from '@/src/models/dial/role-limits';
import { PlatformSharingType } from './models';

/**
 * Placeholder defaults for the sharing grid, matching Core's own `ShareService.DEFAULT_LIMITS` (see
 * `utils.ts`'s `getAssetSharingData` doc-comment for how `-1` — Core's "not provided" sentinel — maps
 * to these placeholders). Max users defaults to `10` for the four types Core caps by default;
 * `PROMPT`/`FILE`/`CONVERSATION` default to `Integer.MAX_VALUE` on Core's side, which this grid shows
 * as no specific placeholder rather than a literal huge number.
 */
export const platformSharingDefaults: Record<PlatformSharingType, DialRoleShare> = {
  [PlatformSharingType.APPLICATION]: { invitationTtl: '72', maxAcceptedUsers: '10' },
  [PlatformSharingType.TOOL_SET]: { invitationTtl: '72', maxAcceptedUsers: '10' },
  [PlatformSharingType.CREDENTIALS]: { invitationTtl: '72', maxAcceptedUsers: '10' },
  [PlatformSharingType.SKILL]: { invitationTtl: '72', maxAcceptedUsers: '10' },
  [PlatformSharingType.PROMPT]: { invitationTtl: '72', maxAcceptedUsers: '' },
  [PlatformSharingType.FILE]: { invitationTtl: '72', maxAcceptedUsers: '' },
  [PlatformSharingType.CONVERSATION]: { invitationTtl: '72', maxAcceptedUsers: '' },
};

export const platformSharingTypeLabels: Record<PlatformSharingType, MenuI18nKey> = {
  [PlatformSharingType.APPLICATION]: MenuI18nKey.Applications,
  [PlatformSharingType.TOOL_SET]: MenuI18nKey.Toolsets,
  [PlatformSharingType.PROMPT]: MenuI18nKey.Prompts,
  [PlatformSharingType.FILE]: MenuI18nKey.Files,
  [PlatformSharingType.CONVERSATION]: MenuI18nKey.Conversations,
  [PlatformSharingType.CREDENTIALS]: MenuI18nKey.Credentials,
  [PlatformSharingType.SKILL]: MenuI18nKey.Skills,
};

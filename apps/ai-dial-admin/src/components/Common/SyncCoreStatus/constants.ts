import { StatusBadgeLeading, StatusBadgeTone } from '@/src/components/Common/StatusBadge/models';
import { CoreSyncI18nKey } from '@/src/constants/i18n';
import { EntitySyncStatus } from '@/src/types/entity-sync-status';
import { CoreSyncBadgeConfig, CoreSyncTrailing } from './models';

export const CORE_SYNC_BADGES: Record<EntitySyncStatus, CoreSyncBadgeConfig> = {
  [EntitySyncStatus.IN_PROGRESS]: {
    labelKey: CoreSyncI18nKey.InProgress,
    tone: StatusBadgeTone.Info,
    leading: StatusBadgeLeading.Spinner,
    trailing: CoreSyncTrailing.Diff,
  },
  [EntitySyncStatus.FULLY_SYNCED]: {
    labelKey: CoreSyncI18nKey.Synced,
    tone: StatusBadgeTone.Success,
    leading: StatusBadgeLeading.None,
  },
  [EntitySyncStatus.UNKNOWN]: {
    labelKey: CoreSyncI18nKey.Unknown,
    tone: StatusBadgeTone.Neutral,
    leading: StatusBadgeLeading.None,
    trailing: CoreSyncTrailing.InfoGlyph,
  },
  [EntitySyncStatus.IN_PROGRESS_TOO_LONG]: {
    labelKey: CoreSyncI18nKey.Partially,
    tone: StatusBadgeTone.Error,
    leading: StatusBadgeLeading.None,
    trailing: CoreSyncTrailing.Diff,
  },
};

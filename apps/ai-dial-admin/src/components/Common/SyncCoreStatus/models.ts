import { StatusBadgeLeading, StatusBadgeTone } from '@/src/components/Common/StatusBadge/models';
import { CoreSyncI18nKey } from '@/src/constants/i18n';

export enum CoreSyncTrailing {
  Diff = 'diff',
  InfoGlyph = 'info-glyph',
}

export interface CoreSyncBadgeConfig {
  labelKey: CoreSyncI18nKey;
  tone: StatusBadgeTone;
  leading: StatusBadgeLeading;
  trailing?: CoreSyncTrailing;
}

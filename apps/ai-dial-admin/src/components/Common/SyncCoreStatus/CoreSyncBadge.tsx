import { FC } from 'react';

import { DialIconButton } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import Difference from '@/public/images/icons/difference.svg';
import StatusBadge from '@/src/components/Common/StatusBadge/StatusBadge';
import { CoreSyncI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EntitySyncStatus } from '@/src/types/entity-sync-status';
import { CORE_SYNC_BADGES } from './constants';
import { CoreSyncTrailing } from './models';

interface Props {
  status?: EntitySyncStatus;
  /** Without it the diff button is not rendered (the diff modal already is the diff). */
  onDiffClick?: () => void;
}

const CoreSyncBadge: FC<Props> = ({ status, onDiffClick }) => {
  const t = useI18n();
  const config = status ? CORE_SYNC_BADGES[status] : undefined;

  if (!config) {
    return null;
  }

  let trailing = null;
  if (config.trailing === CoreSyncTrailing.Diff && onDiffClick) {
    trailing = (
      <DialIconButton
        icon={<Difference {...BASE_BUTTON_ICON_PROPS} className="cursor-pointer text-secondary" />}
        onClick={onDiffClick}
        aria-label={t(CoreSyncI18nKey.SyncWithCore)}
        className="size-6"
      />
    );
  } else if (config.trailing === CoreSyncTrailing.InfoGlyph) {
    trailing = <IconInfoCircle size={14} className="text-secondary" aria-hidden />;
  }

  return <StatusBadge tone={config.tone} leading={config.leading} label={t(config.labelKey)} trailing={trailing} />;
};

export default CoreSyncBadge;

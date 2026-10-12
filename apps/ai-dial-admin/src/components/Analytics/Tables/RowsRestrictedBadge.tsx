'use client';

import { Tag, Tooltip } from '@epam/ai-dial-ui-kit';
import { IconFilter } from '@tabler/icons-react';
import { FC } from 'react';

import { AnalyticsTableAccessI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  hasTooltip?: boolean;
}

// States the fact, never the limit.
const RowsRestrictedBadge: FC<Props> = ({ hasTooltip }) => {
  const t = useI18n();

  return (
    <Tooltip tooltip={t(AnalyticsTableAccessI18nKey.RowsRestrictedTooltip)} hideTooltip={!hasTooltip}>
      <Tag label={t(AnalyticsTableAccessI18nKey.RowsRestricted)} icon={<IconFilter size={14} aria-hidden />} />
    </Tooltip>
  );
};

export default RowsRestrictedBadge;

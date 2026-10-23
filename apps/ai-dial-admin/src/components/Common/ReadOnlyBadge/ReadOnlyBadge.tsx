'use client';

import { Badge, Tooltip, TooltipPlacement } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { ReadOnlyI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const ReadOnlyBadge: FC = () => {
  const t = useI18n();

  return (
    <Tooltip
      tooltip={t(ReadOnlyI18nKey.Description)}
      triggerClassName="flex items-center"
      placement={TooltipPlacement.Left}
    >
      <Badge label={t(ReadOnlyI18nKey.BadgeLabel)} />
    </Tooltip>
  );
};

export default ReadOnlyBadge;

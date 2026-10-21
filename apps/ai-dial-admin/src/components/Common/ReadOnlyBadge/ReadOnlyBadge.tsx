'use client';

import { DialTag, Tooltip, TooltipPlacement } from '@epam/ai-dial-ui-kit';
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
      <DialTag
        label={t(ReadOnlyI18nKey.BadgeLabel)}
        className="text-inverted rounded-full bg-inverted border border-transparent h-4 dial-caption-text font-bold shrink-0"
      />
    </Tooltip>
  );
};

export default ReadOnlyBadge;

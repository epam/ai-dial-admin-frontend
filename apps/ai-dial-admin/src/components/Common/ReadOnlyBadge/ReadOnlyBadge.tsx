'use client';

import { Tooltip } from '@epam/ai-dial-ui-kit';
import { IconEye } from '@tabler/icons-react';
import { FC } from 'react';

import { ReadOnlyI18nKey } from '@/src/constants/i18n';
import { TOOLTIP_PLACEMENT_BOTTOM_END } from '@/src/constants/tooltip';
import { useI18n } from '@/src/locales/client';

const ReadOnlyBadge: FC = () => {
  const t = useI18n();

  return (
    <Tooltip
      tooltip={t(ReadOnlyI18nKey.Description)}
      triggerClassName="flex items-center py-1"
      contentClassName="max-w-[min(376px,calc(100vw-32px))]"
      placement={TOOLTIP_PLACEMENT_BOTTOM_END}
    >
      <span className="flex h-4 items-center rounded-full bg-control-inverted px-2 text-control-inverted dial-tiny-semi-text lg:h-5">
        <IconEye size={12} className="lg:hidden" aria-hidden />
        <span className="max-lg:sr-only">{t(ReadOnlyI18nKey.BadgeLabel)}</span>
        <span className="sr-only">{t(ReadOnlyI18nKey.Description)}</span>
      </span>
    </Tooltip>
  );
};

export default ReadOnlyBadge;

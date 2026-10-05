'use client';

import { FC } from 'react';

import { ElementSize, EllipsisTooltip } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  value: string;
}

/**
 * A group key on one line, clipped to the space it is given, with its copy control always at the end. A key can run
 * to hundreds of characters and is copied far more often than it is read, so the whole value lives in the tooltip
 * and the clipboard rather than on screen.
 */
const GroupKey: FC<Props> = ({ value }) => {
  const t = useI18n();

  return (
    <span className="flex w-full min-w-0 items-center gap-1">
      <EllipsisTooltip
        text={value}
        className="min-w-0 font-mono dial-small-text"
        contentClassName="max-w-[480px] break-all font-mono"
      />
      <CopyButton
        className="shrink-0"
        value={value}
        valueLabel={t(AnalyticsPipelinesI18nKey.GroupsColumnKey)}
        size={ElementSize.Small}
      />
    </span>
  );
};

export default GroupKey;

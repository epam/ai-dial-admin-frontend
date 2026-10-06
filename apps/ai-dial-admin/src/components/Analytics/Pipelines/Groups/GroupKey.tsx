'use client';

import { FC } from 'react';

import CopyableText from '@/src/components/Common/CopyableText/CopyableText';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  value: string;
}

/**
 * A group key on one line. A key can run to hundreds of characters and is copied far more often than it is read,
 * so the whole value lives in the tooltip and the clipboard rather than on screen.
 */
const GroupKey: FC<Props> = ({ value }) => {
  const t = useI18n();

  return (
    <CopyableText
      value={value}
      copyLabel={t(AnalyticsPipelinesI18nKey.GroupsColumnKey)}
      textClassName="font-mono dial-small-text"
    />
  );
};

export default GroupKey;

'use client';

import { FC } from 'react';

import { Badge } from '@epam/ai-dial-ui-kit';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  runCount?: number | null;
}

const TrendsPreviewRunsBadge: FC<Props> = ({ runCount }) => {
  const t = useI18n();

  if (runCount == null) {
    return null;
  }

  const previewLabel = t(TestSuitesI18nKey.TrendsPreviewRunsLastN, { count: runCount });

  return (
    <div className="flex items-center gap-1">
      <span className="tiny text-secondary">{t(TestSuitesI18nKey.TrendsPreviewRuns)}:</span>
      <Badge label={previewLabel} />
    </div>
  );
};

export default TrendsPreviewRunsBadge;

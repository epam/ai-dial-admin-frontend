import { FC } from 'react';

import StatusPill from '@/src/components/Analytics/Common/StatusPill';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  enabled?: boolean;
  className?: string;
}

const PipelineEnabledBadge: FC<Props> = ({ enabled, className }) => {
  const t = useI18n();

  if (enabled == null) {
    return null;
  }

  return (
    <StatusPill
      label={t(enabled ? AnalyticsPipelinesI18nKey.StatusEnabled : AnalyticsPipelinesI18nKey.StatusDisabled)}
      toneClassName={enabled ? 'text-success bg-success' : 'text-secondary bg-layer-4'}
      className={className}
    />
  );
};

export default PipelineEnabledBadge;

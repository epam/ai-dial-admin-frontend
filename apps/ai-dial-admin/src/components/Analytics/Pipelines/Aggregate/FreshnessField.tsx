'use client';
import { FC } from 'react';
import { DialSelectField } from '@epam/ai-dial-ui-kit';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Freshness, FreshnessMode } from '@/src/models/analytics/pipeline';
interface Props {
  freshness?: Freshness;
  onChange: (freshness?: Freshness) => void;
}
const FreshnessField: FC<Props> = ({ freshness, onChange }) => {
  const t = useI18n();
  const options = [
    {
      value: FreshnessMode.Periodic,
      label: t(AnalyticsPipelinesI18nKey.FreshnessPeriodic),
      description: t(AnalyticsPipelinesI18nKey.FreshnessPeriodicCaption),
    },
    {
      value: FreshnessMode.Incremental,
      label: t(AnalyticsPipelinesI18nKey.FreshnessIncremental),
      description: t(AnalyticsPipelinesI18nKey.FreshnessIncrementalCaption),
    },
  ];
  return (
    <DialSelectField
      id="pipeline-freshness"
      label={t(AnalyticsPipelinesI18nKey.Freshness)}
      options={options}
      value={freshness?.mode ?? ''}
      onChange={(v) => onChange(v ? { mode: v as FreshnessMode } : undefined)}
    />
  );
};
export default FreshnessField;

'use client';
import { FC } from 'react';
import FreshnessField from '@/src/components/Analytics/Pipelines/Aggregate/FreshnessField';
import GroupKeysEditor from '@/src/components/Analytics/Pipelines/Aggregate/GroupKeysEditor';
import MeasuresEditor from '@/src/components/Analytics/Pipelines/Aggregate/MeasuresEditor';
import { AggregateFormState } from '@/src/components/Analytics/Pipelines/Aggregate/use-aggregate-form';
import CronField from '@/src/components/Analytics/Pipelines/Common/CronField';
import PipelineSection from '@/src/components/Analytics/Pipelines/Common/PipelineSection';
import PipelineSharedFields from '@/src/components/Analytics/Pipelines/Common/PipelineSharedFields';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QueryFunction } from '@/src/models/analytics/query-function';
interface Props {
  form: AggregateFormState;
  functions: QueryFunction[];
  isModal?: boolean;
}
const AggregateSection: FC<Props> = ({ form, functions, isModal }) => {
  const t = useI18n();
  const { draft, onChange, onTriggerChange, sourceColumns, sourceName } = form;
  return (
    <>
      <CronField value={draft.trigger?.cron ?? ''} onChange={(cron) => onTriggerChange({ cron })} />
      <PipelineSharedFields form={form} isModal={isModal} />
      <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionGroupKeys)} isModal={isModal} isExpanded>
        <GroupKeysEditor
          groupKeys={draft.group_by}
          columns={sourceColumns}
          onChange={(groupKeys) => onChange({ group_by: groupKeys })}
        />
      </PipelineSection>
      <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionMeasures)} isModal={isModal} isExpanded>
        <MeasuresEditor
          measures={draft.measures}
          columns={sourceColumns}
          functions={functions}
          sourceName={sourceName}
          onChange={(measures) => onChange({ measures })}
        />
      </PipelineSection>
      {!isModal && (
        <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionFreshness)}>
          <FreshnessField freshness={draft.freshness} onChange={(freshness) => onChange({ freshness })} />
        </PipelineSection>
      )}
    </>
  );
};
export default AggregateSection;

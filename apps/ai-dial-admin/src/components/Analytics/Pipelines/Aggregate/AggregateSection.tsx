'use client';
import { FC } from 'react';
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
}
const AggregateSection: FC<Props> = ({ form, functions }) => {
  const t = useI18n();
  const { draft, onChange, onTriggerChange, sourceColumns, targetColumns } = form;
  return (
    <>
      {/* Scope first, schedule second: the pipeline is authored by saying what it reads and writes before
          saying when it runs, and an enrich pipeline already reads in that order. */}
      <PipelineSharedFields form={form} />
      <CronField value={draft.trigger?.cron ?? ''} onChange={(cron) => onTriggerChange({ cron })} />
      <PipelineSection
        title={t(AnalyticsPipelinesI18nKey.SectionGroupKeys)}
        description={t(AnalyticsPipelinesI18nKey.GroupKeysDerived)}
      >
        <GroupKeysEditor
          groupKeys={draft.group_by}
          columns={sourceColumns}
          onChange={(groupKeys) => onChange({ group_by: groupKeys })}
        />
      </PipelineSection>

      <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionMeasures)}>
        <MeasuresEditor
          measures={draft.measures}
          columns={sourceColumns}
          targetColumns={targetColumns}
          functions={functions}
          onChange={(measures) => onChange({ measures })}
        />
      </PipelineSection>
    </>
  );
};
export default AggregateSection;

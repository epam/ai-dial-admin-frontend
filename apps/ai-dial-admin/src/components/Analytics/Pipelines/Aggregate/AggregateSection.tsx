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
  const { draft, onChange, onTriggerChange, sourceFields, targetColumns, hasSourceEntityError } = form;
  return (
    <>
      {/* Scope first, schedule second: the pipeline is authored by saying what it reads and writes before
          saying when it runs, and an enrich pipeline already reads in that order. */}
      <PipelineSharedFields form={form} />
      <CronField value={draft.trigger?.cron ?? ''} onChange={(cron) => onTriggerChange({ cron })} />

      {/* Both editors below offer the source's entity. A failed read of it leaves them with nothing to
          offer, which is worth saying: a short list that looks complete is how a valid key reads as one
          nobody chose. */}
      {hasSourceEntityError && (
        <span className="text-error dial-small">{t(AnalyticsPipelinesI18nKey.SourceFieldsLoadFailed)}</span>
      )}

      <PipelineSection
        title={t(AnalyticsPipelinesI18nKey.SectionGroupKeys)}
        description={t(AnalyticsPipelinesI18nKey.GroupKeysDerived)}
      >
        <GroupKeysEditor
          groupKeys={draft.group_by}
          fields={sourceFields}
          onChange={(groupKeys) => onChange({ group_by: groupKeys })}
        />
      </PipelineSection>

      <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionMeasures)}>
        <MeasuresEditor
          measures={draft.measures}
          fields={sourceFields}
          targetColumns={targetColumns}
          functions={functions}
          onChange={(measures) => onChange({ measures })}
        />
      </PipelineSection>
    </>
  );
};
export default AggregateSection;

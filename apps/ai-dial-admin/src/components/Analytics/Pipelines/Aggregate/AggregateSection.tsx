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
  isModal?: boolean;
}
const AggregateSection: FC<Props> = ({ form, functions, isModal }) => {
  const t = useI18n();
  const { draft, onChange, onTriggerChange, sourceColumns, targetColumns, sourceName } = form;
  return (
    <>
      <CronField value={draft.trigger?.cron ?? ''} onChange={(cron) => onTriggerChange({ cron })} />
      <PipelineSharedFields form={form} isModal={isModal} />
      {!isModal && (
        <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionGroupKeys)}>
          <GroupKeysEditor
            groupKeys={draft.group_by}
            columns={sourceColumns}
            onChange={(groupKeys) => onChange({ group_by: groupKeys })}
          />
          <span className="text-secondary dial-tiny-text">{t(AnalyticsPipelinesI18nKey.GroupKeysDerived)}</span>
        </PipelineSection>
      )}
      <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionMeasures)} isModal={isModal}>
        <MeasuresEditor
          measures={draft.measures}
          columns={sourceColumns}
          targetColumns={targetColumns}
          functions={functions}
          sourceName={sourceName}
          onChange={(measures) => onChange({ measures })}
        />
      </PipelineSection>
    </>
  );
};
export default AggregateSection;

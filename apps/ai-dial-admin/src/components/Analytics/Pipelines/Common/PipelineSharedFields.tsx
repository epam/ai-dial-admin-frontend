'use client';

import { FC } from 'react';

import { DialSelectField } from '@epam/ai-dial-ui-kit';

import SourceField from '@/src/components/Analytics/Pipelines/Common/SourceField';
import SqlPredicateField from '@/src/components/Analytics/Pipelines/Common/SqlPredicateField';
import PipelineSection from '@/src/components/Analytics/Pipelines/Common/PipelineSection';
import { PipelineFormState } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-form';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineKind } from '@/src/models/analytics/pipeline';
import { AnalyticsTableType } from '@/src/models/analytics/table';
import { getPipelineInput } from '@/src/utils/analytics/pipeline-dto';

interface Props {
  form: PipelineFormState;
  isModal?: boolean;
}

const PipelineSharedFields: FC<Props> = ({ form, isModal }) => {
  const t = useI18n();
  const { draft, onChange, availableTargets, sourceName, target } = form;

  const isAggregate = draft.kind === PipelineKind.Aggregate;

  const targetOptions = availableTargets.map((table) => ({ value: table.name, label: table.name }));
  const inputOptions = form.tables
    .filter((table) => table.type === AnalyticsTableType.Source)
    .map((table) => ({ value: table.name, label: table.name }));

  const onChangeInput = (input?: string) => onChange({ inputs: input ? [input] : undefined });

  return (
    <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionReadScope)} isModal={isModal} isExpanded>
      <DialSelectField
        id="pipeline-target"
        required
        label={t(AnalyticsPipelinesI18nKey.Target)}
        options={targetOptions}
        value={draft.target ?? ''}
        onChange={(v) => onChange({ target: v as string })}
      />

      {isAggregate && (
        <DialSelectField
          id="pipeline-inputs"
          required
          label={t(AnalyticsPipelinesI18nKey.Inputs)}
          options={inputOptions}
          value={getPipelineInput(draft.inputs) ?? ''}
          onChange={(v) => onChangeInput(v as string)}
        />
      )}

      {!isModal && !isAggregate && (
        <SourceField
          input={getPipelineInput(draft.inputs)}
          sourceTable={target?.source_table}
          tables={form.tables}
          onChange={onChangeInput}
        />
      )}

      {!isModal && (
        <SqlPredicateField
          id="pipeline-filter"
          label={t(AnalyticsPipelinesI18nKey.Filter)}
          description={t(AnalyticsPipelinesI18nKey.FilterCaption)}
          value={draft.filter}
          sourceName={sourceName}
          onChange={(value) => onChange({ filter: value })}
        />
      )}
    </PipelineSection>
  );
};

export default PipelineSharedFields;

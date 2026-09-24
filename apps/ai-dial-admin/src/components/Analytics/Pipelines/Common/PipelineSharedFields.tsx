'use client';

import { FC } from 'react';

import { DialSelectField } from '@epam/ai-dial-ui-kit';

import BoundTableField from '@/src/components/Analytics/Pipelines/Common/BoundTableField';
import SourceField from '@/src/components/Analytics/Pipelines/Common/SourceField';
import SqlPredicateField from '@/src/components/Analytics/Pipelines/Common/SqlPredicateField';
import { PipelineFormState } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-form';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineKind } from '@/src/models/analytics/pipeline';
import { AnalyticsTableType } from '@/src/models/analytics/table';
import { getPipelineInput } from '@/src/utils/analytics/pipeline-dto';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props {
  form: PipelineFormState;
}

const PipelineSharedFields: FC<Props> = ({ form }) => {
  const t = useI18n();
  const { draft, onChange, availableTargets, sourceName, target } = form;

  const isAggregate = draft.kind === PipelineKind.Aggregate;

  const targetOptions = availableTargets.map((table) => ({ value: table.name, label: table.name }));
  const inputOptions = form.tables
    .filter((table) => table.type === AnalyticsTableType.Source)
    .map((table) => ({ value: table.name, label: table.name }));

  const onChangeInput = (input?: string) => onChange({ inputs: input ? [input] : undefined });

  return (
    // Three fields at the top of the form, two of them already named in the facts above: neither a
    // collapsible section nor a heading earns its place here.
    <div className="flex flex-col gap-y-6">
      {!isAggregate && (
        // Open follows the table the selection resolves to, which for the following entry is the target's
        // own parent rather than anything the draft names.
        <BoundTableField table={form.sourceName} caption={t(AnalyticsPipelinesI18nKey.SourceFollowCaption)}>
          <SourceField
            input={getPipelineInput(draft.inputs)}
            sourceTable={target?.source_table}
            tables={form.tables}
            onChange={onChangeInput}
          />
        </BoundTableField>
      )}

      {isAggregate && (
        <BoundTableField table={getPipelineInput(draft.inputs)}>
          <DialSelectField
            id="pipeline-inputs"
            required
            label={t(AnalyticsPipelinesI18nKey.Inputs)}
            options={inputOptions}
            value={getPipelineInput(draft.inputs) ?? ''}
            containerClassName="flex-1"
            onChange={(v) => onChangeInput(v as string)}
          />
        </BoundTableField>
      )}

      <BoundTableField table={draft.target}>
        <DialSelectField
          id="pipeline-target"
          required
          label={t(AnalyticsPipelinesI18nKey.Target)}
          options={targetOptions}
          value={draft.target ?? ''}
          containerClassName="flex-1"
          onChange={(v) => onChange({ target: v as string })}
        />
      </BoundTableField>

      <SqlPredicateField
        id="pipeline-filter"
        className={getControlClassName()}
        label={t(AnalyticsPipelinesI18nKey.Filter)}
        description={t(AnalyticsPipelinesI18nKey.FilterCaption)}
        value={draft.filter}
        sourceName={sourceName}
        onChange={(value) => onChange({ filter: value })}
      />
    </div>
  );
};

export default PipelineSharedFields;

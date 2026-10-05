'use client';

import { FC } from 'react';

import { RadioGroup, RadioGroupItem, RadioGroupOrientation, Select } from '@epam/ai-dial-ui-kit';

import CreatePipelineShell from '@/src/components/Analytics/Pipelines/Common/CreatePipelineShell';
import { usePipelineForm } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-form';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineKind, TriggerKind } from '@/src/models/analytics/pipeline';
import { PIPELINE_SELECT_DEFAULTS } from '@/src/constants/analytics/pipelines';

interface Props {
  takenTargets: string[];
  onClose: () => void;
  onCreated: () => void;
}

/** Registration takes the identity and the target; the declaration is authored on the pipeline's page. */
const CreatePipelinePopup: FC<Props> = ({ takenTargets, onClose, onCreated }) => {
  const t = useI18n();

  // No trigger control here, but an enrichment registers as a cron-less schedule so the service stores its
  // every-minute default; an aggregate's trigger is rebuilt by kind whatever the draft holds.
  const form = usePipelineForm({
    takenTargets,
    initialDraft: { kind: PipelineKind.Enrich, trigger: { kind: TriggerKind.Schedule } },
  });
  const { draft, onChange, availableTargets, isRegistrationValid, buildDto } = form;

  const kindRadios: RadioGroupItem[] = [
    { value: PipelineKind.Enrich, label: t(AnalyticsPipelinesI18nKey.KindEnrich) },
    { value: PipelineKind.Aggregate, label: t(AnalyticsPipelinesI18nKey.KindAggregate) },
  ];

  // The target belongs to the kind, so switching kind leaves a selection the new list does not carry.
  const onChangeKind = (kind: PipelineKind) => onChange({ kind, target: undefined });

  return (
    <CreatePipelineShell
      name={draft.name}
      onChangeName={(name) => onChange({ name })}
      isValid={isRegistrationValid}
      buildDto={buildDto}
      onClose={onClose}
      onCreated={onCreated}
    >
      <RadioGroup
        id="pipeline-kind"
        labelProps={{ label: t(AnalyticsPipelinesI18nKey.Kind) }}
        orientation={RadioGroupOrientation.Column}
        items={kindRadios}
        value={draft.kind ?? ''}
        onChange={(id) => onChangeKind(id as PipelineKind)}
      />

      <Select
        {...PIPELINE_SELECT_DEFAULTS}
        id="pipeline-target"
        labelProps={{ label: t(AnalyticsPipelinesI18nKey.Target), required: true }}
        options={availableTargets.map((table) => ({ value: table.name, label: table.name }))}
        value={draft.target ?? ''}
        onChange={(value) => onChange({ target: value as string })}
      />
    </CreatePipelineShell>
  );
};

export default CreatePipelinePopup;

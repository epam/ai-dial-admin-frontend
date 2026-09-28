'use client';

import { FC } from 'react';

import { DialRadioGroup, DialSelectField, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import CreatePipelineShell from '@/src/components/Analytics/Pipelines/Common/CreatePipelineShell';
import { usePipelineForm } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-form';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineKind } from '@/src/models/analytics/pipeline';

interface Props {
  takenTargets: string[];
  onClose: () => void;
  onCreated: () => void;
}

/** Registration takes the identity and the target; the declaration is authored on the pipeline's page. */
const CreatePipelinePopup: FC<Props> = ({ takenTargets, onClose, onCreated }) => {
  const t = useI18n();

  const form = usePipelineForm({ takenTargets, initialDraft: { kind: PipelineKind.Enrich } });
  const { draft, onChange, availableTargets, isRegistrationValid, buildDto } = form;

  const kindRadios: RadioButtonWithContent[] = [
    { id: PipelineKind.Enrich, name: t(AnalyticsPipelinesI18nKey.KindEnrich) },
    { id: PipelineKind.Aggregate, name: t(AnalyticsPipelinesI18nKey.KindAggregate) },
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
      <DialRadioGroup
        elementId="pipeline-kind"
        fieldTitle={t(AnalyticsPipelinesI18nKey.Kind)}
        orientation={RadioGroupOrientation.Column}
        radioButtons={kindRadios}
        activeRadioButton={draft.kind ?? ''}
        onChange={(id) => onChangeKind(id as PipelineKind)}
      />

      <DialSelectField
        id="pipeline-target"
        required
        label={t(AnalyticsPipelinesI18nKey.Target)}
        options={availableTargets.map((table) => ({ value: table.name, label: table.name }))}
        value={draft.target ?? ''}
        onChange={(value) => onChange({ target: value as string })}
      />
    </CreatePipelineShell>
  );
};

export default CreatePipelinePopup;

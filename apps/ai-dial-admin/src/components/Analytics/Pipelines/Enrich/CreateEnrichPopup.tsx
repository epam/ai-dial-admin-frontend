'use client';

import { FC, ReactNode } from 'react';

import EnrichSection from '@/src/components/Analytics/Pipelines/Enrich/EnrichSection';
import { useEnrichForm } from '@/src/components/Analytics/Pipelines/Enrich/use-enrich-form';
import CreatePipelineShell from '@/src/components/Analytics/Pipelines/Common/CreatePipelineShell';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { PipelineKind } from '@/src/models/analytics/pipeline';

interface Props {
  kindControl: ReactNode;
  evaluators: EvaluatorSummary[];
  hasEvaluatorsError?: boolean;
  takenTargets: string[];
  onClose: () => void;
  onCreated: () => void;
}

const CreateEnrichPopup: FC<Props> = ({
  kindControl,
  evaluators,
  hasEvaluatorsError,
  takenTargets,
  onClose,
  onCreated,
}) => {
  const form = useEnrichForm({
    takenTargets, // A pipeline is registered not running and enabled from its own page. The service refuses an
    initialDraft: { kind: PipelineKind.Enrich, enabled: false },
  });

  return (
    <CreatePipelineShell
      kindControl={kindControl}
      name={form.draft.name}
      onChangeName={(name) => form.onChange({ name })}
      isValid={form.isValid}
      buildDto={form.buildDto}
      onClose={onClose}
      onCreated={onCreated}
    >
      <EnrichSection form={form} evaluators={evaluators} hasEvaluatorsError={hasEvaluatorsError} isModal />
    </CreatePipelineShell>
  );
};

export default CreateEnrichPopup;

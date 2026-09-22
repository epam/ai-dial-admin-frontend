'use client';

import { FC, ReactNode } from 'react';

import EnrichSection from '@/src/components/Analytics/Pipelines/Enrich/EnrichSection';
import { useEnrichForm } from '@/src/components/Analytics/Pipelines/Enrich/use-enrich-form';
import CreatePipelineShell from '@/src/components/Analytics/Pipelines/Common/CreatePipelineShell';
import { PipelineKind, TransformType } from '@/src/models/analytics/pipeline';

interface Props {
  kindControl: ReactNode;
  takenTargets: string[];
  onClose: () => void;
  onCreated: () => void;
}

const CreateEnrichPopup: FC<Props> = ({ kindControl, takenTargets, onClose, onCreated }) => {
  // A pipeline is registered not running and enabled from its own page. The service refuses an enrich
  // registration that omits `enabled` rather than defaulting it.
  const form = useEnrichForm({
    takenTargets,
    initialDraft: { kind: PipelineKind.Enrich, enabled: false, transform: { type: TransformType.Llm } },
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
      <EnrichSection form={form} isModal />
    </CreatePipelineShell>
  );
};

export default CreateEnrichPopup;

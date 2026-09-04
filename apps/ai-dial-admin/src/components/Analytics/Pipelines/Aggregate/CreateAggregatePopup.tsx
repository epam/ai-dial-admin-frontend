'use client';
import { FC, ReactNode } from 'react';
import AggregateSection from '@/src/components/Analytics/Pipelines/Aggregate/AggregateSection';
import { useAggregateForm } from '@/src/components/Analytics/Pipelines/Aggregate/use-aggregate-form';
import CreatePipelineShell from '@/src/components/Analytics/Pipelines/Common/CreatePipelineShell';
import { PipelineKind, TriggerKind } from '@/src/models/analytics/pipeline';
import { QueryFunction } from '@/src/models/analytics/query-function';
interface Props {
  kindControl: ReactNode;
  functions: QueryFunction[];
  takenTargets: string[];
  onClose: () => void;
  onCreated: () => void;
}
const CreateAggregatePopup: FC<Props> = ({ kindControl, functions, takenTargets, onClose, onCreated }) => {
  const form = useAggregateForm({
    takenTargets,
    initialDraft: { kind: PipelineKind.Aggregate, trigger: { kind: TriggerKind.Schedule } },
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
      <AggregateSection form={form} functions={functions} isModal />
    </CreatePipelineShell>
  );
};
export default CreateAggregatePopup;

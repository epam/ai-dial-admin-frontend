'use client';
import { usePipelineForm } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-form';
import { Pipeline } from '@/src/models/analytics/pipeline';
import { PipelineDraft } from '@/src/models/analytics/pipeline-ui';
interface Params {
  pipeline?: Pipeline;
  takenTargets?: string[];
  initialDraft?: PipelineDraft;
}
export const useAggregateForm = (params: Params = {}) => {
  const base = usePipelineForm(params);
  const { draft } = base;
  const hasInput = Boolean(draft.inputs?.length);
  const hasGroupKeys = Boolean(draft.group_by?.length);
  const hasMeasures = Boolean(draft.measures?.length);
  const hasDistinctWithoutColumn = Boolean(draft.measures?.some((measure) => measure.distinct && !measure.column));
  const isValid = base.isSharedValid && hasInput && hasGroupKeys && hasMeasures && !hasDistinctWithoutColumn;
  return { ...base, isValid, hasInput, hasGroupKeys, hasMeasures, hasDistinctWithoutColumn };
};
export type AggregateFormState = ReturnType<typeof useAggregateForm>;

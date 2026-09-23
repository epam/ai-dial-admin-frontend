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
  // A measure the service cannot compile, unlike one the author has simply not written yet.
  const hasDistinctWithoutColumn = Boolean(draft.measures?.some((measure) => measure.distinct && !measure.column));
  return { ...base, hasDistinctWithoutColumn, hasFieldErrors: base.hasSharedFieldErrors || hasDistinctWithoutColumn };
};
export type AggregateFormState = ReturnType<typeof useAggregateForm>;

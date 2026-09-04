'use client';

import {
  getBindingRowError,
  hasBlockingBindingError,
} from '@/src/components/Analytics/Pipelines/Enrich/output-bindings';
import { usePipelineForm } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-form';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { Pipeline } from '@/src/models/analytics/pipeline';
import { PipelineDraft } from '@/src/models/analytics/pipeline-ui';

interface Params {
  pipeline?: Pipeline;
  takenTargets?: string[];
  initialDraft?: PipelineDraft;
}

export const useEnrichForm = (params: Params = {}) => {
  const base = usePipelineForm(params);
  const { draft, evaluator, target, targetColumns, outputVars } = base;

  const boundOutputs = (Array.isArray(draft.output_bindings) ? draft.output_bindings : []).filter(
    (binding) => Boolean(binding) && typeof binding === 'object',
  );

  const isSamplingValid = draft.sampling == null || (draft.sampling >= 0 && draft.sampling <= 1);

  const hasStrandedBinding = boundOutputs.some((binding) =>
    hasBlockingBindingError(getBindingRowError({ id: binding.column, ...binding }, targetColumns, outputVars)),
  );

  const isSqlWithoutBindings = evaluator?.type === EvaluatorType.Sql && boundOutputs.length === 0;
  const isLlmWithoutBindings = evaluator?.type === EvaluatorType.Llm && boundOutputs.length === 0;

  const isEvaluatorResolved =
    Boolean(evaluator) && !base.isEvaluatorPending && !base.hasEvaluatorError && Boolean(target);

  const isValid =
    base.isSharedValid &&
    Boolean(draft.evaluator_name) &&
    draft.enabled != null &&
    isEvaluatorResolved &&
    !isSqlWithoutBindings &&
    !hasStrandedBinding &&
    isSamplingValid;

  return {
    ...base,
    isValid,
    isSamplingValid,
    isSqlWithoutBindings,
    isLlmWithoutBindings,
    hasStrandedBinding,
    isBindingsReady: Boolean(evaluator && target),
  };
};

export type EnrichFormState = ReturnType<typeof useEnrichForm>;
